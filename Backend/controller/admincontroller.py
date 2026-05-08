from bson import ObjectId
from fastapi.responses import JSONResponse

from bcryptEx import hash_password
from controller.authcontroller import password_error
from controller.account_utils import (
    USER_STATUSES,
    get_user_status,
    normalize_email,
    normalize_phone,
    serialize_user,
    utcnow_iso,
    users_collection,
)
from controller.ratings_utils import (
    get_vendor_rating_fields,
    normalize_rating_review_status,
    recalculate_service_rating_summary,
    recalculate_vendor_rating_summary,
    resolve_service_document,
    resolve_service_vendor_document,
    serialize_service_rating_record,
)
from controller.vendorscontroller import clear_public_vendor_cache
from dbconnect import db

# Reuse shared MongoDB collection handles throughout this module.

vendors_collection = db["vendors"]
bookings_collection = db["bookings"]
services_collection = db["services"]
vendor_inquiries_collection = db["vendor_inquiries"]
favorites_collection = db["favorites"]
couple_booking_requests_collection = db["couple_booking_requests"]
user_profiles_collection = db["user_profiles"]
user_settings_collection = db["user_settings"]
password_reset_collection = db["password_reset_sessions"]
ratings_collection = db["ratings"]

# Keep module-level constants together so related rules stay easy to maintain.

VENDOR_STATUSES = {"pending", "approved", "rejected"}
BOOKING_STATUSES = {"pending", "approved", "in_progress", "rejected", "completed", "cancelled"}
RATING_REVIEW_STATUSES = {"pending", "approved", "rejected"}
BOOKING_STATUS_ALIASES = {
    "pending": "pending",
    "submitted": "pending",
    "vendor contacted": "pending",
    "reschedule requested": "pending",
    "approved": "approved",
    "confirmed": "approved",
    "in progress": "in_progress",
    "inprogress": "in_progress",
    "rejected": "rejected",
    "completed": "completed",
    "cancelled": "cancelled",
    "canceled": "cancelled",
}


# Parse object ID values into the format expected by database queries.

def parse_object_id(value: str):
    try:
        return ObjectId(value)
    except Exception:
        return None


# Normalize lookup identifier values before comparisons, storage, or responses.

def normalize_lookup_identifier(value: str):
    normalized_value = str(value or "").strip()
    if normalized_value.isdigit():
        return int(normalized_value)
    return normalized_value


# Build the document query used by downstream queries or response shaping.

def build_document_query(identifier: str):
    parsed = parse_object_id(identifier)
    if parsed:
        return {"_id": parsed}
    return {"id": normalize_lookup_identifier(identifier)}


# Build the service reference query used by downstream queries or response shaping.

def build_service_reference_query(service_doc):
    if not service_doc:
        return None

    service_id = str(service_doc.get("id") or service_doc.get("_id") or "").strip()
    service_names = []
    seen_names = set()
    for value in (service_doc.get("name"), service_doc.get("category")):
        normalized_value = str(value or "").strip()
        if not normalized_value or normalized_value.lower() in seen_names:
            continue
        seen_names.add(normalized_value.lower())
        service_names.append(normalized_value)

    vendor_identifiers = build_identifier_variants(service_doc.get("vendorId"))

    filters = []
    if service_id:
        filters.extend(
            [
                {"serviceId": service_id},
                {"service_id": service_id},
            ]
        )

    if vendor_identifiers and service_names:
        vendor_filters = [
            {"vendorId": {"$in": vendor_identifiers}},
            {"resolvedVendorId": {"$in": vendor_identifiers}},
            {"vendorReference": {"$in": vendor_identifiers}},
        ]
        service_name_filters = [
            {"service": {"$in": service_names}},
            {"serviceName": {"$in": service_names}},
            {"serviceType": {"$in": service_names}},
        ]
        filters.append({"$and": [{"$or": vendor_filters}, {"$or": service_name_filters}]})

    if not filters:
        return None

    return {"$or": filters}


# Build the identifier variants used by downstream queries or response shaping.

def build_identifier_variants(*candidates):
    variants = []
    seen = set()

    def add_variant(value):
        marker = (type(value), value)
        if marker in seen:
            return
        seen.add(marker)
        variants.append(value)

    for candidate in candidates:
        if candidate is None:
            continue

        if isinstance(candidate, str):
            normalized_candidate = candidate.strip()
            if not normalized_candidate:
                continue
            add_variant(normalized_candidate)
            if normalized_candidate.isdigit():
                add_variant(int(normalized_candidate))
            continue

        if isinstance(candidate, int):
            add_variant(candidate)
            add_variant(str(candidate))
            continue

        normalized_candidate = str(candidate).strip()
        if not normalized_candidate:
            continue
        add_variant(normalized_candidate)
        if normalized_candidate.isdigit():
            add_variant(int(normalized_candidate))

    return variants


# Return document identifiers for the calling workflow.

def get_document_identifiers(document):
    if not document:
        return []

    return build_identifier_variants(
        document.get("id"),
        str(document.get("_id")) if document.get("_id") is not None else "",
    )


# Delete user related documents and clean up any related records.

async def delete_user_related_documents(user):
    if not user:
        return

    user_email = normalize_email(user.get("email"))
    user_role = str(user.get("role") or "").strip().lower()
    user_identifiers = get_document_identifiers(user)

    if user_email:
        await user_profiles_collection.delete_many(
            {"$or": [{"email": user_email}, {"accountEmail": user_email}]}
        )
        await user_settings_collection.delete_many({"email": user_email})
        await favorites_collection.delete_many({"userEmail": user_email})
        await couple_booking_requests_collection.delete_many({"userEmail": user_email})

        password_query = {"email": user_email}
        if user_role:
            password_query["role"] = user_role
        await password_reset_collection.delete_many(password_query)

    booking_filters = []
    if user_email:
        booking_filters.extend([{"userEmail": user_email}, {"clientEmail": user_email}])
    if user_identifiers:
        booking_filters.append({"userId": {"$in": user_identifiers}})
    if booking_filters:
        await bookings_collection.delete_many({"$or": booking_filters})

    if user_identifiers:
        rating_user_ids = [str(identifier).strip() for identifier in user_identifiers if str(identifier).strip()]
        if rating_user_ids:
            await ratings_collection.delete_many({"user_id": {"$in": rating_user_ids}})


# Return vendor identifiers and users for the calling workflow.

async def get_vendor_identifiers_and_users(vendor):
    vendor_email = normalize_email((vendor or {}).get("email"))
    vendor_user_documents = []
    identifier_candidates = get_document_identifiers(vendor)

    if vendor_email:
        async for vendor_user in users_collection.find(
            {"email": vendor_email, "role": "vendor"}
        ):
            vendor_user_documents.append(vendor_user)
            identifier_candidates.extend(get_document_identifiers(vendor_user))

    return (
        build_identifier_variants(*identifier_candidates),
        vendor_email,
        vendor_user_documents,
    )


# Delete vendor related documents and clean up any related records.

async def delete_vendor_related_documents(vendor):
    if not vendor:
        return

    vendor_identifiers, vendor_email, vendor_users = await get_vendor_identifiers_and_users(
        vendor
    )

    if vendor_identifiers:
        vendor_identifier_query = {"$in": vendor_identifiers}
        rating_service_ids = []
        async for service_doc in services_collection.find({"vendorId": vendor_identifier_query}):
            service_id = str(service_doc.get("id") or service_doc.get("_id") or "").strip()
            if service_id:
                rating_service_ids.append(service_id)

        await services_collection.delete_many({"vendorId": vendor_identifier_query})
        favorite_delete_filters = [{"vendorId": vendor_identifier_query}]
        if rating_service_ids:
            favorite_delete_filters.extend(
                [
                    {"serviceId": {"$in": rating_service_ids}},
                    {"service_id": {"$in": rating_service_ids}},
                ]
            )
        await favorites_collection.delete_many({"$or": favorite_delete_filters})
        await couple_booking_requests_collection.delete_many(
            {"vendorId": vendor_identifier_query}
        )

        vendor_reference_query = {
            "$or": [
                {"vendorId": vendor_identifier_query},
                {"vendorReference": vendor_identifier_query},
                {"resolvedVendorId": vendor_identifier_query},
            ]
        }
        await bookings_collection.delete_many(vendor_reference_query)
        await vendor_inquiries_collection.delete_many(vendor_reference_query)

        if rating_service_ids:
            await ratings_collection.delete_many({"service_id": {"$in": rating_service_ids}})

    if vendor_users:
        vendor_user_object_ids = [
            vendor_user.get("_id")
            for vendor_user in vendor_users
            if vendor_user.get("_id") is not None
        ]
        if vendor_user_object_ids:
            await users_collection.delete_many({"_id": {"$in": vendor_user_object_ids}})
    elif vendor_email:
        await users_collection.delete_many({"email": vendor_email, "role": "vendor"})

    if vendor_email:
        await password_reset_collection.delete_many(
            {"email": vendor_email, "role": "vendor"}
        )


# Serialize vendor into the shape returned by the API.

def serialize_vendor(vendor):
    if not vendor:
        return None

    rating_fields = get_vendor_rating_fields(vendor)

    return {
        "id": str(vendor.get("id") or vendor.get("_id") or ""),
        "name": str(vendor.get("name") or vendor.get("businessName") or ""),
        "email": normalize_email(vendor.get("email")),
        "phone": normalize_phone(vendor.get("phone")),
        "category": str(vendor.get("category") or ""),
        "location": str(vendor.get("location") or ""),
        "rating": rating_fields["rating"],
        "average_rating": rating_fields["average_rating"],
        "averageRating": rating_fields["averageRating"],
        "total_reviews": rating_fields["total_reviews"],
        "totalReviews": rating_fields["totalReviews"],
        "status": str(vendor.get("status") or "pending"),
        "createdAt": str(vendor.get("createdAt") or ""),
    }


# Serialize booking into the shape returned by the API.

def serialize_booking(booking):
    if not booking:
        return None

    service_name = str(
        booking.get("service")
        or booking.get("serviceName")
        or booking.get("serviceType")
        or ""
    ).strip()
    booked_by_name = str(
        booking.get("clientName")
        or booking.get("client_name")
        or booking.get("bookedByName")
        or booking.get("booked_by_name")
        or booking.get("bookedBy")
        or booking.get("booked_by")
        or booking.get("userName")
        or ""
    ).strip()

    return {
        "id": str(booking.get("id") or booking.get("_id") or ""),
        "userId": str(booking.get("userId") or ""),
        "userEmail": normalize_email(
            booking.get("userEmail") or booking.get("clientEmail")
        ),
        "userName": booked_by_name,
        "bookedByName": booked_by_name,
        "vendorId": str(booking.get("vendorId") or ""),
        "vendorEmail": normalize_email(booking.get("vendorEmail")),
        "vendorName": str(booking.get("vendorName") or ""),
        "serviceId": str(booking.get("serviceId") or booking.get("service_id") or ""),
        "service": service_name,
        "eventDate": str(booking.get("eventDate") or ""),
        "amount": float(booking.get("amount") or booking.get("totalAmount") or 0),
        "status": normalize_booking_status(booking.get("status")),
        "createdAt": str(booking.get("createdAt") or ""),
    }


# Normalize booking status values before comparisons, storage, or responses.

def normalize_booking_status(value):
    normalized_status = (
        str(value or "")
        .strip()
        .lower()
        .replace("-", " ")
        .replace("_", " ")
    )
    normalized_status = " ".join(normalized_status.split())
    return BOOKING_STATUS_ALIASES.get(normalized_status, "pending")


# Build the booking reference keys used by downstream queries or response shaping.

def build_booking_reference_keys(document):
    if not document:
        return []

    keys = []
    seen = set()
    for value in (
        document.get("id"),
        document.get("requestId"),
        document.get("bookingRequestId"),
        document.get("vendorInquiryId"),
        document.get("_id"),
    ):
        if value is None:
            continue
        normalized_value = str(value).strip()
        if not normalized_value or normalized_value in seen:
            continue
        seen.add(normalized_value)
        keys.append(normalized_value)

    return keys


# Serialize couple booking request into the shape returned by the API.

def serialize_couple_booking_request(booking):
    if not booking:
        return None

    service_name = str(
        booking.get("service")
        or booking.get("serviceName")
        or booking.get("serviceType")
        or ""
    ).strip()
    booked_by_name = str(
        booking.get("coupleName")
        or booking.get("clientName")
        or booking.get("client_name")
        or booking.get("bookedByName")
        or booking.get("booked_by_name")
        or booking.get("bookedBy")
        or booking.get("booked_by")
        or booking.get("userName")
        or ""
    ).strip()

    return {
        "id": str(booking.get("id") or booking.get("requestId") or booking.get("_id") or ""),
        "userId": str(booking.get("userId") or ""),
        "userEmail": normalize_email(booking.get("userEmail")),
        "userName": booked_by_name,
        "bookedByName": booked_by_name,
        "vendorId": str(booking.get("vendorId") or ""),
        "vendorEmail": normalize_email(booking.get("vendorEmail")),
        "vendorName": str(booking.get("vendorName") or ""),
        "serviceId": str(booking.get("serviceId") or booking.get("service_id") or ""),
        "service": service_name,
        "eventDate": str(booking.get("eventDate") or ""),
        "amount": float(booking.get("estimatedBudget") or booking.get("amount") or booking.get("totalAmount") or 0),
        "status": normalize_booking_status(booking.get("status")),
        "createdAt": str(booking.get("createdAt") or ""),
    }


# Build the booking request match query used by downstream queries or response shaping.

def build_booking_request_match_query(booking):
    if not booking:
        return None

    request_identifiers = []
    seen = set()
    for value in (
        booking.get("bookingRequestId"),
        booking.get("requestId"),
        booking.get("id"),
    ):
        normalized_value = str(value or "").strip()
        if not normalized_value or normalized_value in seen:
            continue
        seen.add(normalized_value)
        request_identifiers.append(normalized_value)

    match_filters = []
    if request_identifiers:
        match_filters.extend(
            [
                {"id": {"$in": request_identifiers}},
                {"requestId": {"$in": request_identifiers}},
                {"bookingRequestId": {"$in": request_identifiers}},
            ]
        )

    user_email = normalize_email(booking.get("userEmail") or booking.get("clientEmail"))
    vendor_id = str(booking.get("vendorId") or "").strip()
    event_date = str(booking.get("eventDate") or "").strip()
    if user_email and vendor_id and event_date:
        match_filters.append(
            {"userEmail": user_email, "vendorId": vendor_id, "eventDate": event_date}
        )

    if not match_filters:
        return None

    return {"$or": match_filters}


# Resolve booking user email from the available documents and fallback values.

async def resolve_booking_user_email(booking):
    direct_email = normalize_email(booking.get("userEmail") or booking.get("clientEmail"))
    if direct_email:
        return direct_email

    user_id = str(booking.get("userId") or "").strip()
    if not user_id:
        return ""

    user_query = {"id": int(user_id)} if user_id.isdigit() else {"id": user_id}
    user = await users_collection.find_one(user_query)
    if not user:
        parsed_user_object_id = parse_object_id(user_id)
        if parsed_user_object_id:
            user = await users_collection.find_one({"_id": parsed_user_object_id})

    return normalize_email((user or {}).get("email"))


# Resolve booking user ID from the available documents and fallback values.

async def resolve_booking_user_id(booking):
    direct_user_id = str(booking.get("userId") or "").strip()
    if direct_user_id:
        return direct_user_id

    user_email = await resolve_booking_user_email(booking)
    if not user_email:
        return ""

    user = await users_collection.find_one(
        {
            "$and": [
                {"role": "user"},
                {"$or": [{"email": user_email}, {"partner_email": user_email}]},
            ]
        }
    )
    if not user:
        return ""

    return str(user.get("id") or user.get("_id") or "").strip()


# Resolve vendor from reference from the available documents and fallback values.

async def resolve_vendor_from_reference(reference: str):
    normalized_reference = str(reference or "").strip()
    if not normalized_reference:
        return None

    vendor_query = (
        {"id": int(normalized_reference)}
        if normalized_reference.isdigit()
        else {"id": normalized_reference}
    )
    vendor = await vendors_collection.find_one(vendor_query)
    if not vendor:
        parsed_vendor_object_id = parse_object_id(normalized_reference)
        if parsed_vendor_object_id:
            vendor = await vendors_collection.find_one({"_id": parsed_vendor_object_id})
    if vendor:
        return vendor

    user_query = (
        {"id": int(normalized_reference)}
        if normalized_reference.isdigit()
        else {"id": normalized_reference}
    )
    user = await users_collection.find_one(user_query)
    if not user:
        parsed_user_object_id = parse_object_id(normalized_reference)
        if parsed_user_object_id:
            user = await users_collection.find_one({"_id": parsed_user_object_id})
    if not user:
        return None

    user_email = normalize_email(user.get("email"))
    if not user_email:
        return None

    vendor_from_user = await vendors_collection.find_one({"email": user_email})
    if vendor_from_user:
        return vendor_from_user

    return {"email": user_email}


# Resolve booking service document from the available documents and fallback values.

async def resolve_booking_service_document(booking, vendor_doc=None):
    if not booking:
        return None

    service_reference = str(booking.get("serviceId") or booking.get("service_id") or "").strip()
    if service_reference:
        service_doc = await resolve_service_document(service_reference)
        if service_doc:
            return service_doc

    resolved_vendor = vendor_doc
    if not resolved_vendor:
        for reference in (
            booking.get("vendorId"),
            booking.get("resolvedVendorId"),
            booking.get("vendorReference"),
        ):
            resolved_vendor = await resolve_vendor_from_reference(str(reference or ""))
            if resolved_vendor:
                break

    vendor_identifiers = build_identifier_variants(
        (resolved_vendor or {}).get("id"),
        str((resolved_vendor or {}).get("_id") or "").strip(),
        booking.get("vendorId"),
        booking.get("resolvedVendorId"),
        booking.get("vendorReference"),
    )
    if not vendor_identifiers:
        return None

    candidate_names = []
    seen_names = set()
    for value in (
        booking.get("service"),
        booking.get("serviceName"),
        booking.get("serviceType"),
    ):
        normalized_value = str(value or "").strip().lower()
        if not normalized_value or normalized_value in seen_names:
            continue
        seen_names.add(normalized_value)
        candidate_names.append(normalized_value)

    matched_services = []
    all_services = []
    async for service_doc in services_collection.find(
        {"vendorId": {"$in": vendor_identifiers}},
        sort=[("createdAt", -1)],
    ):
        all_services.append(service_doc)
        if not candidate_names:
            continue

        service_name = str(service_doc.get("name") or "").strip().lower()
        service_category = str(service_doc.get("category") or "").strip().lower()
        if service_name in candidate_names or service_category in candidate_names:
            matched_services.append(service_doc)

    if matched_services:
        return matched_services[0]
    if len(all_services) == 1:
        return all_services[0]
    return None


# Resolve booking vendor email from the available documents and fallback values.

async def resolve_booking_vendor_email(booking):
    direct_email = normalize_email(booking.get("vendorEmail"))
    if direct_email:
        return direct_email

    for reference in (
        booking.get("vendorId"),
        booking.get("resolvedVendorId"),
        booking.get("vendorReference"),
    ):
        vendor = await resolve_vendor_from_reference(str(reference or ""))
        resolved_email = normalize_email((vendor or {}).get("email"))
        if resolved_email:
            return resolved_email

    return ""


# Return numeric ID for the calling workflow.

def get_numeric_id(document):
    return document.get("id") if isinstance(document.get("id"), int) else None


# Return vendor user updates for the calling workflow.

def get_vendor_user_updates(status, updated_at):
    if status == "approved":
        return {
            "status": "active",
            "approvalStatus": "approved",
            "isActive": True,
            "updatedAt": updated_at,
        }
    if status == "rejected":
        return {
            "status": "rejected",
            "approvalStatus": "rejected",
            "isActive": False,
            "updatedAt": updated_at,
        }
    return {
        "status": "pending",
        "approvalStatus": "pending",
        "isActive": True,
        "updatedAt": updated_at,
    }


# Return next numeric ID for the calling workflow.

async def get_next_numeric_id(collection):
    doc = await collection.find_one({"id": {"$type": "int"}}, sort=[("id", -1)])
    if not doc or get_numeric_id(doc) is None:
        return 1
    return int(doc.get("id")) + 1


# Handle the service-layer logic for retrieving dashboard stats.

async def get_dashboard_stats_service():
    users = []
    async for user in users_collection.find({"role": "user"}):
        users.append(user)

    vendors = []
    async for vendor in vendors_collection.find({}):
        vendors.append(vendor)

    bookings = []
    async for booking in bookings_collection.find({}):
        bookings.append(booking)

    pending_users = sum(1 for u in users if get_user_status(u) == "pending")
    inactive_users = sum(1 for u in users if get_user_status(u) == "inactive")
    rejected_users = sum(1 for u in users if get_user_status(u) == "rejected")

    pending_bookings = sum(1 for b in bookings if str(b.get("status") or "").lower() == "pending")
    rejected_bookings = sum(1 for b in bookings if str(b.get("status") or "").lower() == "rejected")

    pending_vendors = sum(1 for v in vendors if str(v.get("status") or "").lower() == "pending")
    rejected_vendors = sum(1 for v in vendors if str(v.get("status") or "").lower() == "rejected")

    return {
        "totalUsers": len(users),
        "totalVendors": len(vendors),
        "totalBookings": len(bookings),
        "totalRevenue": sum(float(b.get("amount") or b.get("totalAmount") or 0) for b in bookings),
        "pendingUsers": pending_users,
        "inactiveUsers": inactive_users,
        "rejectedUsers": rejected_users,
        "pendingBookings": pending_bookings,
        "rejectedBookings": rejected_bookings,
        "pendingVendors": pending_vendors,
        "rejectedVendors": rejected_vendors,
    }


# Handle the service-layer logic for retrieving users.

async def get_users_service():
    users = []
    async for user in users_collection.find({"role": "user"}, sort=[("createdAt", -1)]):
        users.append(serialize_user(user))
    return users


# Handle the service-layer logic for updating user status.

async def update_user_status_service(user_id, payload):
    status = str(payload.status or "").strip().lower()
    if status not in USER_STATUSES:
        return JSONResponse({"message": "Invalid status."}, status_code=400)

    query = {"_id": parse_object_id(user_id)} if parse_object_id(user_id) else {"id": user_id}
    user = await users_collection.find_one(query)
    if not user:
        return JSONResponse({"message": "User not found."}, status_code=404)

    updates = {"status": status, "updatedAt": utcnow_iso()}
    if status == "inactive":
        updates["isActive"] = False
    if status == "active":
        updates["isActive"] = True
    if status in {"pending", "rejected"}:
        updates["approvalStatus"] = status

    await users_collection.update_one({"_id": user.get("_id")}, {"$set": updates})
    updated = await users_collection.find_one({"_id": user.get("_id")})
    return serialize_user(updated)


# Handle the service-layer logic for deleting user.

async def delete_user_service(user_id):
    query = build_document_query(user_id)
    user = await users_collection.find_one(query)
    if not user:
        return JSONResponse({"message": "User not found."}, status_code=404)

    await delete_user_related_documents(user)
    await users_collection.delete_one({"_id": user.get("_id")})
    return {"success": True}


# Handle the service-layer logic for retrieving vendors.

async def get_vendors_service():
    vendors = []
    async for vendor in vendors_collection.find({}, sort=[("createdAt", -1)]):
        vendors.append(serialize_vendor(vendor))
    return vendors


# Handle the service-layer logic for creating vendor.

async def create_vendor_service(payload):
    normalized_email = normalize_email(payload.email)
    if not normalized_email:
        return JSONResponse({"message": "Email is required."}, status_code=400)

    existing = await vendors_collection.find_one({"email": normalized_email})
    if existing:
        return JSONResponse({"message": "Vendor already exists."}, status_code=400)
    existing_vendor_user = await users_collection.find_one(
        {"email": normalized_email, "role": "vendor"}
    )
    if existing_vendor_user:
        return JSONResponse({"message": "Vendor login already exists."}, status_code=400)

    password_issue = password_error(payload.password)
    if password_issue:
        return JSONResponse({"message": password_issue}, status_code=400)

    now = utcnow_iso()
    vendor_id = await get_next_numeric_id(vendors_collection)
    vendor_document = {
        "id": vendor_id,
        "name": payload.name,
        "email": normalized_email,
        "phone": normalize_phone(payload.phone),
        "category": payload.category,
        "location": payload.location,
        "rating": 0,
        "average_rating": 0,
        "averageRating": 0,
        "total_reviews": 0,
        "totalReviews": 0,
        "status": "pending",
        "createdAt": now,
        "updatedAt": now,
    }

    result = await vendors_collection.insert_one(vendor_document)
    await users_collection.insert_one(
        {
            "name": payload.name,
            "email": normalized_email,
            "password": hash_password(payload.password),
            "role": "vendor",
            "phone": normalize_phone(payload.phone),
            "status": "pending",
            "approvalStatus": "pending",
            "isActive": True,
            "createdAt": now,
            "updatedAt": now,
        }
    )
    created = await vendors_collection.find_one({"_id": result.inserted_id})
    return serialize_vendor(created)


# Handle the service-layer logic for updating vendor.

async def update_vendor_service(vendor_id, payload):
    query = {"_id": parse_object_id(vendor_id)} if parse_object_id(vendor_id) else {"id": int(vendor_id) if str(vendor_id).isdigit() else vendor_id}
    vendor = await vendors_collection.find_one(query)
    if not vendor:
        return JSONResponse({"message": "Vendor not found."}, status_code=404)

    updates = {"updatedAt": utcnow_iso()}
    if str(payload.name or "").strip():
        updates["name"] = payload.name
    if str(payload.email or "").strip():
        normalized_email = normalize_email(payload.email)
        existing_vendor = await vendors_collection.find_one({"email": normalized_email})
        existing_vendor_user = await users_collection.find_one(
            {"email": normalized_email, "role": "vendor"}
        )
        if existing_vendor and existing_vendor.get("_id") != vendor.get("_id"):
            return JSONResponse({"message": "Vendor email is already in use."}, status_code=400)
        if existing_vendor_user and normalize_email(existing_vendor_user.get("email")) != normalize_email(vendor.get("email")):
            return JSONResponse({"message": "Vendor login email is already in use."}, status_code=400)
        updates["email"] = normalized_email
    if str(payload.phone or "").strip():
        updates["phone"] = normalize_phone(payload.phone)
    if str(payload.category or "").strip():
        updates["category"] = payload.category
    if str(payload.location or "").strip():
        updates["location"] = payload.location

    await vendors_collection.update_one({"_id": vendor.get("_id")}, {"$set": updates})
    if "email" in updates or "phone" in updates or "name" in updates:
        user_updates = {"updatedAt": utcnow_iso()}
        if "email" in updates:
            user_updates["email"] = updates["email"]
        if "phone" in updates:
            user_updates["phone"] = updates["phone"]
        if "name" in updates:
            user_updates["name"] = updates["name"]

        await users_collection.update_one(
            {"email": normalize_email(vendor.get("email")), "role": "vendor"},
            {"$set": user_updates},
        )
    updated = await vendors_collection.find_one({"_id": vendor.get("_id")})
    return serialize_vendor(updated)


# Handle the service-layer logic for deleting vendor.

async def delete_vendor_service(vendor_id):
    query = build_document_query(vendor_id)
    vendor = await vendors_collection.find_one(query)
    if not vendor:
        return JSONResponse({"message": "Vendor not found."}, status_code=404)

    await delete_vendor_related_documents(vendor)
    await vendors_collection.delete_one({"_id": vendor.get("_id")})
    clear_public_vendor_cache()
    return {"success": True}


# Handle the service-layer logic for deleting service.

async def delete_service_service(service_id):
    query = build_document_query(service_id)
    service = await services_collection.find_one(query)
    if not service:
        return JSONResponse({"message": "Service not found."}, status_code=404)

    service_reference_query = build_service_reference_query(service)
    normalized_service_id = str(service.get("id") or service.get("_id") or "").strip()
    vendor_doc = await resolve_vendor_from_reference(str(service.get("vendorId") or "").strip())

    if normalized_service_id:
        await ratings_collection.delete_many({"service_id": normalized_service_id})
        await favorites_collection.delete_many(
            {
                "$or": [
                    {"serviceId": normalized_service_id},
                    {"service_id": normalized_service_id},
                ]
            }
        )

    if service_reference_query:
        await bookings_collection.delete_many(service_reference_query)
        await couple_booking_requests_collection.delete_many(service_reference_query)
        await vendor_inquiries_collection.delete_many(service_reference_query)

    result = await services_collection.delete_one({"_id": service.get("_id")})
    if result.deleted_count == 0:
        return JSONResponse({"message": "Service not found."}, status_code=404)

    if vendor_doc:
        await recalculate_vendor_rating_summary(vendor_doc)

    return {"success": True}


# Build the booking delete match query used by downstream queries or response shaping.

def build_booking_delete_match_query(document):
    if not document:
        return None

    reference_keys = build_booking_reference_keys(document)
    filters = []
    if reference_keys:
        filters.extend(
            [
                {"id": {"$in": reference_keys}},
                {"requestId": {"$in": reference_keys}},
                {"bookingRequestId": {"$in": reference_keys}},
            ]
        )

    if not filters:
        return None

    return {"$or": filters}


# Handle the service-layer logic for deleting booking.

async def delete_booking_service(booking_id):
    normalized_booking_id = str(booking_id or "").strip()
    if not normalized_booking_id:
        return JSONResponse({"message": "Booking id is required."}, status_code=400)

    query = build_document_query(normalized_booking_id)
    booking = await bookings_collection.find_one(query)
    couple_booking = None

    if not booking:
        couple_query = {
            "$or": [
                {"id": normalized_booking_id},
                {"requestId": normalized_booking_id},
                {"bookingRequestId": normalized_booking_id},
            ]
        }
        couple_booking = await couple_booking_requests_collection.find_one(couple_query)
        if not couple_booking:
            return JSONResponse({"message": "Booking not found."}, status_code=404)

    target_document = booking or couple_booking
    match_query = build_booking_delete_match_query(target_document)

    if booking:
        await bookings_collection.delete_one({"_id": booking.get("_id")})
    elif match_query:
        await bookings_collection.delete_many(match_query)

    if couple_booking:
        await couple_booking_requests_collection.delete_one({"_id": couple_booking.get("_id")})
    elif match_query:
        await couple_booking_requests_collection.delete_many(match_query)

    vendor_inquiry_id = str((target_document or {}).get("vendorInquiryId") or "").strip()
    if vendor_inquiry_id:
        parsed_vendor_inquiry_id = parse_object_id(vendor_inquiry_id)
        if parsed_vendor_inquiry_id:
            await vendor_inquiries_collection.delete_one({"_id": parsed_vendor_inquiry_id})

    return {"success": True}


# Handle the service-layer logic for updating vendor status.

async def update_vendor_status_service(vendor_id, payload):
    status = str(payload.status or "").strip().lower()
    if status not in VENDOR_STATUSES:
        return JSONResponse({"message": "Invalid vendor status."}, status_code=400)

    query = {"_id": parse_object_id(vendor_id)} if parse_object_id(vendor_id) else {"id": int(vendor_id) if str(vendor_id).isdigit() else vendor_id}
    vendor = await vendors_collection.find_one(query)
    if not vendor:
        return JSONResponse({"message": "Vendor not found."}, status_code=404)

    now = utcnow_iso()
    await vendors_collection.update_one(
        {"_id": vendor.get("_id")},
        {"$set": {"status": status, "updatedAt": now}},
    )

    vendor_email = normalize_email(vendor.get("email"))
    if vendor_email:
        await users_collection.update_one(
            {"email": vendor_email, "role": "vendor"},
            {"$set": get_vendor_user_updates(status, now)},
        )

    updated = await vendors_collection.find_one({"_id": vendor.get("_id")})
    return serialize_vendor(updated)


# Handle the service-layer logic for retrieving bookings.

async def get_bookings_service():
    bookings = []
    booking_reference_keys = set()
    vendor_cache = {}
    service_cache = {}
    async for booking in bookings_collection.find({}, sort=[("createdAt", -1)]):
        resolved_user_email = await resolve_booking_user_email(booking)
        resolved_user_id = await resolve_booking_user_id(booking)
        resolved_vendor_email = await resolve_booking_vendor_email(booking)
        vendor_reference = str(
            booking.get("vendorId")
            or booking.get("resolvedVendorId")
            or booking.get("vendorReference")
            or ""
        ).strip()
        vendor_doc = None
        if vendor_reference:
            vendor_doc = vendor_cache.get(vendor_reference)
            if vendor_doc is None:
                vendor_doc = await resolve_vendor_from_reference(vendor_reference)
                vendor_cache[vendor_reference] = vendor_doc

        service_cache_key = "|".join(
            [
                vendor_reference,
                str(booking.get("service") or booking.get("serviceName") or booking.get("serviceType") or "").strip().lower(),
                str(booking.get("serviceId") or booking.get("service_id") or "").strip(),
            ]
        )
        service_doc = service_cache.get(service_cache_key)
        if service_doc is None:
            service_doc = await resolve_booking_service_document(booking, vendor_doc=vendor_doc)
            service_cache[service_cache_key] = service_doc

        serialized_booking = serialize_booking(booking)
        serialized_booking["userId"] = resolved_user_id or serialized_booking.get("userId", "")
        serialized_booking["userEmail"] = resolved_user_email or serialized_booking.get(
            "userEmail", ""
        )
        serialized_booking["vendorEmail"] = (
            resolved_vendor_email or serialized_booking.get("vendorEmail", "")
        )
        serialized_booking["serviceId"] = str(
            (service_doc or {}).get("id")
            or (service_doc or {}).get("_id")
            or serialized_booking.get("serviceId")
            or ""
        ).strip()
        bookings.append(serialized_booking)
        for key in build_booking_reference_keys(booking):
            booking_reference_keys.add(key)

    async for couple_booking in couple_booking_requests_collection.find(
        {},
        sort=[("createdAt", -1)],
    ):
        couple_reference_keys = build_booking_reference_keys(couple_booking)
        if any(key in booking_reference_keys for key in couple_reference_keys):
            continue
        resolved_user_id = await resolve_booking_user_id(couple_booking)
        vendor_reference = str(
            couple_booking.get("vendorId")
            or couple_booking.get("resolvedVendorId")
            or couple_booking.get("vendorReference")
            or ""
        ).strip()
        vendor_doc = None
        if vendor_reference:
            vendor_doc = vendor_cache.get(vendor_reference)
            if vendor_doc is None:
                vendor_doc = await resolve_vendor_from_reference(vendor_reference)
                vendor_cache[vendor_reference] = vendor_doc

        service_cache_key = "|".join(
            [
                vendor_reference,
                str(couple_booking.get("service") or couple_booking.get("serviceName") or couple_booking.get("serviceType") or "").strip().lower(),
                str(couple_booking.get("serviceId") or couple_booking.get("service_id") or "").strip(),
            ]
        )
        service_doc = service_cache.get(service_cache_key)
        if service_doc is None:
            service_doc = await resolve_booking_service_document(couple_booking, vendor_doc=vendor_doc)
            service_cache[service_cache_key] = service_doc

        serialized_booking = serialize_couple_booking_request(couple_booking)
        serialized_booking["userId"] = resolved_user_id or serialized_booking.get("userId", "")
        serialized_booking["serviceId"] = str(
            (service_doc or {}).get("id")
            or (service_doc or {}).get("_id")
            or serialized_booking.get("serviceId")
            or ""
        ).strip()
        bookings.append(serialized_booking)

    rating_lookup = {}
    user_ids = sorted(
        {
            str(booking.get("userId") or "").strip()
            for booking in bookings
            if str(booking.get("userId") or "").strip()
        }
    )
    service_ids = sorted(
        {
            str(booking.get("serviceId") or "").strip()
            for booking in bookings
            if str(booking.get("serviceId") or "").strip()
        }
    )
    if user_ids and service_ids:
        async for rating_doc in ratings_collection.find(
            {
                "user_id": {"$in": user_ids},
                "service_id": {"$in": service_ids},
            }
        ):
            lookup_key = (
                str(rating_doc.get("user_id") or "").strip(),
                str(rating_doc.get("service_id") or "").strip(),
            )
            if not lookup_key[0] or not lookup_key[1]:
                continue
            rating_lookup[lookup_key] = rating_doc

    for booking in bookings:
        rating_doc = rating_lookup.get(
            (
                str(booking.get("userId") or "").strip(),
                str(booking.get("serviceId") or "").strip(),
            )
        )
        review_status = (
            normalize_rating_review_status((rating_doc or {}).get("status"), default="approved")
            if rating_doc
            else ""
        )
        booking["userRatingId"] = str((rating_doc or {}).get("_id") or "")
        booking["user_rating_id"] = booking["userRatingId"]
        booking["userRating"] = int((rating_doc or {}).get("rating") or 0)
        booking["userReview"] = str(
            (rating_doc or {}).get("review") or (rating_doc or {}).get("comment") or ""
        ).strip()
        booking["userReviewStatus"] = review_status
        booking["user_review_status"] = review_status

    bookings.sort(
        key=lambda item: str(item.get("createdAt") or ""),
        reverse=True,
    )
    return bookings


# Handle the service-layer logic for retrieving rating reviews.

async def get_rating_reviews_service():
    reviews = []
    service_cache = {}
    vendor_cache = {}

    async for rating_doc in ratings_collection.find(
        {},
        sort=[("updated_at", -1), ("created_at", -1), ("_id", -1)],
    ):
        serialized_review = await serialize_service_rating_record(rating_doc)
        if not serialized_review:
            continue

        service_id = str(rating_doc.get("service_id") or "").strip()
        service_doc = service_cache.get(service_id)
        if service_doc is None and service_id:
            service_doc = await resolve_service_document(service_id)
            service_cache[service_id] = service_doc

        vendor_id = str(
            rating_doc.get("vendor_id")
            or (service_doc or {}).get("vendorId")
            or ""
        ).strip()
        vendor_doc = vendor_cache.get(vendor_id)
        if vendor_doc is None:
            vendor_doc = await resolve_service_vendor_document(service_doc) if service_doc else None
            vendor_cache[vendor_id] = vendor_doc

        service_name = str(
            (service_doc or {}).get("name")
            or (service_doc or {}).get("category")
            or "Service"
        ).strip() or "Service"
        vendor_name = str(
            (vendor_doc or {}).get("name")
            or (vendor_doc or {}).get("businessName")
            or "Vendor"
        ).strip() or "Vendor"

        reviews.append(
            {
                **serialized_review,
                "serviceName": service_name,
                "service_name": service_name,
                "vendorId": str((vendor_doc or {}).get("id") or (vendor_doc or {}).get("_id") or vendor_id or ""),
                "vendor_id": str((vendor_doc or {}).get("id") or (vendor_doc or {}).get("_id") or vendor_id or ""),
                "vendorName": vendor_name,
                "vendor_name": vendor_name,
            }
        )

    return reviews


# Handle the service-layer logic for updating review approval status.

async def update_rating_review_status_service(rating_id, payload):
    status = normalize_rating_review_status(getattr(payload, "status", ""), default="")
    if status not in RATING_REVIEW_STATUSES:
        return JSONResponse({"message": "Invalid rating review status."}, status_code=400)

    parsed_rating_object_id = parse_object_id(rating_id)
    if not parsed_rating_object_id:
        return JSONResponse({"message": "Invalid rating id."}, status_code=400)

    rating_doc = await ratings_collection.find_one({"_id": parsed_rating_object_id})
    if not rating_doc:
        return JSONResponse({"message": "Rating review not found."}, status_code=404)

    now = utcnow_iso()
    updates = {
        "status": status,
        "updated_at": now,
        "reviewed_at": now,
        "approved_at": now if status == "approved" else "",
    }

    await ratings_collection.update_one(
        {"_id": rating_doc.get("_id")},
        {"$set": updates},
    )

    updated_rating = await ratings_collection.find_one({"_id": rating_doc.get("_id")})
    service_doc = await resolve_service_document(str((updated_rating or {}).get("service_id") or "").strip())
    vendor_doc = await resolve_service_vendor_document(service_doc) if service_doc else None

    service_summary = await recalculate_service_rating_summary(service_doc) if service_doc else {
        "average_rating": 0.0,
        "averageRating": 0.0,
        "total_reviews": 0,
        "totalReviews": 0,
        "rating": 0.0,
    }
    vendor_summary = await recalculate_vendor_rating_summary(vendor_doc) if vendor_doc else {
        "average_rating": 0.0,
        "averageRating": 0.0,
        "total_reviews": 0,
        "totalReviews": 0,
        "rating": 0.0,
    }

    status_messages = {
        "approved": "Review approved successfully.",
        "rejected": "Review rejected successfully.",
        "pending": "Review moved back to pending.",
    }

    clear_public_vendor_cache()
    return {
        "success": True,
        "message": status_messages.get(status, "Review status updated."),
        "rating": await serialize_service_rating_record(updated_rating),
        "service": {
            "id": str((service_doc or {}).get("id") or (service_doc or {}).get("_id") or ""),
            "name": str((service_doc or {}).get("name") or "Service").strip() or "Service",
            **service_summary,
        },
        "vendor": {
            "id": str((vendor_doc or {}).get("id") or (vendor_doc or {}).get("_id") or ""),
            "name": str(
                (vendor_doc or {}).get("name") or (vendor_doc or {}).get("businessName") or "Vendor"
            ).strip() or "Vendor",
            **vendor_summary,
        },
    }


# Handle the service-layer logic for deleting review records.

async def delete_rating_review_service(rating_id):
    parsed_rating_object_id = parse_object_id(rating_id)
    if not parsed_rating_object_id:
        return JSONResponse({"message": "Invalid rating id."}, status_code=400)

    rating_doc = await ratings_collection.find_one({"_id": parsed_rating_object_id})
    if not rating_doc:
        return JSONResponse({"message": "Rating review not found."}, status_code=404)

    service_doc = await resolve_service_document(str(rating_doc.get("service_id") or "").strip())
    vendor_doc = await resolve_service_vendor_document(service_doc) if service_doc else None

    await ratings_collection.delete_one({"_id": rating_doc.get("_id")})

    if service_doc:
        await recalculate_service_rating_summary(service_doc)
    if vendor_doc:
        await recalculate_vendor_rating_summary(vendor_doc)

    clear_public_vendor_cache()
    return {"success": True}


# Handle the service-layer logic for updating booking status.

async def update_booking_status_service(booking_id, payload):
    status = normalize_booking_status(payload.status)
    if status not in BOOKING_STATUSES:
        return JSONResponse({"message": "Invalid booking status."}, status_code=400)

    query = build_document_query(booking_id)
    booking = await bookings_collection.find_one(query)
    if not booking:
        normalized_booking_id = str(booking_id or "").strip()
        couple_query = {
            "$or": [
                {"id": normalized_booking_id},
                {"requestId": normalized_booking_id},
                {"bookingRequestId": normalized_booking_id},
            ]
        }
        couple_booking = await couple_booking_requests_collection.find_one(couple_query)
        if not couple_booking:
            return JSONResponse({"message": "Booking not found."}, status_code=404)

        now = utcnow_iso()
        await couple_booking_requests_collection.update_one(
            {"_id": couple_booking.get("_id")},
            {"$set": {"status": status, "updatedAt": now}},
        )
        updated_couple_booking = await couple_booking_requests_collection.find_one(
            {"_id": couple_booking.get("_id")}
        )
        return serialize_couple_booking_request(updated_couple_booking)

    now = utcnow_iso()
    await bookings_collection.update_one(
        {"_id": booking.get("_id")},
        {"$set": {"status": status, "updatedAt": now}},
    )

    request_match_query = build_booking_request_match_query(booking)
    if request_match_query:
        await couple_booking_requests_collection.update_many(
            request_match_query,
            {"$set": {"status": status, "updatedAt": now}},
        )

    updated = await bookings_collection.find_one({"_id": booking.get("_id")})
    serialized_booking = serialize_booking(updated)
    serialized_booking["userEmail"] = await resolve_booking_user_email(updated)
    serialized_booking["vendorEmail"] = await resolve_booking_vendor_email(updated)
    return serialized_booking


# Handle the service-layer logic for retrieving admin profile.

async def get_admin_profile_service():
    admin_user = await users_collection.find_one({"role": "admin"})
    if not admin_user:
        return {
            "name": "Admin User",
            "email": "admin@elegance.com",
            "role": "admin",
        }
    return {
        "name": admin_user.get("name") or "Admin User",
        "email": normalize_email(admin_user.get("email")) or "admin@elegance.com",
        "role": "admin",
    }


# Handle the service-layer logic for updating admin profile.

async def update_admin_profile_service(payload):
    normalized_email = normalize_email(payload.email)
    if not normalized_email:
        return JSONResponse({"message": "Valid email is required."}, status_code=400)

    admin_user = await users_collection.find_one({"role": "admin"})
    now = utcnow_iso()

    if not admin_user:
        new_admin = {
            "name": payload.name,
            "email": normalized_email,
            "password": b"",
            "role": "admin",
            "status": "active",
            "isActive": True,
            "createdAt": now,
            "updatedAt": now,
        }
        await users_collection.insert_one(new_admin)
    else:
        await users_collection.update_one(
            {"_id": admin_user.get("_id")},
            {"$set": {"name": payload.name, "email": normalized_email, "updatedAt": now}},
        )

    return {"success": True}


# Expose the get dashboard stats service through the controller layer.

async def get_dashboard_stats():
    return await get_dashboard_stats_service()


# Expose the get users service through the controller layer.

async def get_users():
    return await get_users_service()


# Expose the update user status service through the controller layer.

async def update_user_status(user_id, payload):
    return await update_user_status_service(user_id, payload)


# Expose the delete user service through the controller layer.

async def delete_user(user_id):
    return await delete_user_service(user_id)


# Expose the get vendors service through the controller layer.

async def get_vendors():
    return await get_vendors_service()


# Expose the create vendor service through the controller layer.

async def create_vendor(payload):
    return await create_vendor_service(payload)


# Expose the update vendor service through the controller layer.

async def update_vendor(vendor_id, payload):
    return await update_vendor_service(vendor_id, payload)


# Expose the delete vendor service through the controller layer.

async def delete_vendor(vendor_id):
    return await delete_vendor_service(vendor_id)


# Handle the service-layer logic for deleting .

async def delete_service(service_id):
    return await delete_service_service(service_id)


# Expose the delete booking service through the controller layer.

async def delete_booking(booking_id):
    return await delete_booking_service(booking_id)


# Expose the update vendor status service through the controller layer.

async def update_vendor_status(vendor_id, payload):
    return await update_vendor_status_service(vendor_id, payload)


# Expose the get bookings service through the controller layer.

async def get_bookings():
    return await get_bookings_service()


# Expose the get rating reviews service through the controller layer.

async def get_rating_reviews():
    return await get_rating_reviews_service()


# Expose the update booking status service through the controller layer.

async def update_booking_status(booking_id, payload):
    return await update_booking_status_service(booking_id, payload)


# Expose the update review status service through the controller layer.

async def update_rating_review_status(rating_id, payload):
    return await update_rating_review_status_service(rating_id, payload)


# Expose the delete review service through the controller layer.

async def delete_rating_review(rating_id):
    return await delete_rating_review_service(rating_id)


# Expose the get admin profile service through the controller layer.

async def get_admin_profile():
    return await get_admin_profile_service()


# Expose the update admin profile service through the controller layer.

async def update_admin_profile(payload):
    return await update_admin_profile_service(payload)
