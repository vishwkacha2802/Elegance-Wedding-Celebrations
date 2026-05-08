from collections import defaultdict
from datetime import datetime, timezone

from bson import ObjectId
from fastapi.responses import JSONResponse

from JWT import decode_token
from controller.account_utils import normalize_email, normalize_phone, utcnow_iso
from controller.account_utils import authenticate_request
from controller.ratings_utils import (
    fetch_service_rating_reviews,
    get_service_rating_fields,
    ratings_collection,
    recalculate_vendor_rating_summary,
    resolve_vendor_document,
)
from controller.vendorscontroller import clear_public_vendor_cache
from dbconnect import db

# Reuse shared MongoDB collection handles throughout this module.

vendors_collection = db["vendors"]
services_collection = db["services"]
bookings_collection = db["bookings"]
users_collection = db["users"]
couple_booking_requests_collection = db["couple_booking_requests"]
favorites_collection = db["favorites"]
# Keep module-level constants together so related rules stay easy to maintain.

ALLOWED_BOOKING_STATUSES = {"pending", "approved", "in_progress", "rejected", "completed"}
EARNINGS_STATUSES = {"selected", "booked", "confirmed", "approved", "completed"}
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
    # "cancelled": "cancelled",
    # "canceled": "cancelled",
}


# Normalize identifier set values before comparisons, storage, or responses.

def normalize_identifier_set(values):
    normalized_values = set()
    for value in values or []:
        normalized_value = str(value or "").strip()
        if normalized_value:
            normalized_values.add(normalized_value)
    return normalized_values


# Parse object ID values into the format expected by database queries.

def parse_object_id(value: str):
    try:
        return ObjectId(value)
    except Exception:
        return None


# Convert stored date values into timezone-aware datetime objects.

def to_datetime(value):
    if isinstance(value, datetime):
        return value.astimezone(timezone.utc)

    text = str(value or "").strip()
    if not text:
        return None

    normalized_text = text.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized_text)
    except ValueError:
        return None

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc)


# Resolve image URL from the available documents and fallback values.

def resolve_image_url(document):
    if not document:
        return None

    image_urls = resolve_image_urls(document)
    if image_urls:
        return image_urls[0]

    for key in ("imageUrl", "image_url", "image", "url"):
        candidate = str(document.get(key) or "").strip()
        if candidate:
            return candidate

    return None


# Resolve image URLs from the available documents and fallback values.

def resolve_image_urls(document):
    if not document:
        return []

    resolved_images = []
    seen = set()

    for key in ("imageUrls", "image_urls", "portfolio"):
        raw_value = document.get(key)
        if not isinstance(raw_value, list):
            continue

        for item in raw_value:
            if isinstance(item, str):
                candidate = item.strip()
            elif isinstance(item, dict):
                candidate = str(
                    item.get("imageUrl") or item.get("image_url") or item.get("image") or item.get("url") or ""
                ).strip()
            else:
                candidate = str(item or "").strip()

            if not candidate or candidate in seen:
                continue
            seen.add(candidate)
            resolved_images.append(candidate)

    for key in ("imageUrl", "image_url", "image", "url"):
        candidate = str(document.get(key) or "").strip()
        if not candidate or candidate in seen:
            continue
        seen.add(candidate)
        resolved_images.insert(0, candidate)
        break

    return resolved_images


# Convert non negative amount into the format expected by the backend.

def to_non_negative_amount(value):
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return 0.0

    return parsed if parsed > 0 else 0.0


# Convert stored guest counts into the format expected by the frontend.

def to_non_negative_int(value):
    try:
        parsed = int(float(value))
    except (TypeError, ValueError):
        return 0

    return parsed if parsed > 0 else 0


# Return numeric field value for the calling workflow.

def get_numeric_field_value(document, field_names):
    if not document:
        return 0.0

    for field_name in field_names:
        if field_name not in document:
            continue
        parsed = to_non_negative_amount(document.get(field_name))
        if parsed > 0:
            return parsed

    return 0.0


# Calculate net earning amount from the booking and pricing inputs.

def calculate_net_earning_amount(gross_amount, booking, service_doc=None):
    gross_value = to_non_negative_amount(gross_amount)
    if gross_value <= 0:
        return 0.0

    fixed_charge = get_numeric_field_value(
        booking,
        ["booking_charge", "bookingCharge", "platform_charge", "platformCharge"],
    )
    if fixed_charge <= 0:
        fixed_charge = get_numeric_field_value(
            service_doc,
            ["booking_charge", "bookingCharge", "platform_charge", "platformCharge"],
        )

    if fixed_charge > 0:
        return round(max(gross_value - fixed_charge, 0.0), 2)

    commission_percentage = get_numeric_field_value(
        booking,
        [
            "commission_percentage",
            "commissionPercentage",
            "platform_commission_percentage",
            "platformCommissionPercentage",
        ],
    )
    if commission_percentage <= 0:
        commission_percentage = get_numeric_field_value(
            service_doc,
            [
                "commission_percentage",
                "commissionPercentage",
                "platform_commission_percentage",
                "platformCommissionPercentage",
            ],
        )

    if commission_percentage > 0:
        commission_amount = gross_value * commission_percentage / 100
        return round(max(gross_value - commission_amount, 0.0), 2)

    return round(gross_value, 2)


# Calculate saved amount from the booking and pricing inputs.

def calculate_saved_amount(estimated_budget, gross_amount):
    budget_value = to_non_negative_amount(estimated_budget)
    gross_value = to_non_negative_amount(gross_amount)
    if budget_value <= 0 or gross_value <= 0:
        return 0.0

    return round(max(budget_value - gross_value, 0.0), 2)


# Resolve booking gross amount from the available documents and fallback values.

def resolve_booking_gross_amount(booking, service_doc=None):
    explicit_price = get_numeric_field_value(
        booking,
        ["servicePrice", "service_price", "price", "quotedPrice", "quoted_price"],
    )
    if explicit_price > 0:
        return explicit_price

    service_price = get_numeric_field_value(service_doc, ["price"])
    if service_price > 0:
        return service_price

    return get_numeric_field_value(booking, ["amount", "totalAmount", "total_amount"])


# Resolve booking budget amount from the available documents and fallback values.

def resolve_booking_budget_amount(booking, service_doc=None):
    estimated_budget = get_numeric_field_value(
        booking,
        ["estimatedBudget", "estimated_budget", "budget"],
    )
    if estimated_budget > 0:
        return round(estimated_budget, 2)

    return round(resolve_booking_gross_amount(booking, service_doc), 2)


# Build the location used by downstream queries or response shaping.

def build_location(city, state):
    city_value = str(city or "").strip()
    state_value = str(state or "").strip()
    return ", ".join(part for part in (city_value, state_value) if part)


# Expose the normalize text service through the controller layer.

def normalize_text(value):
    return str(value or "").strip()


# Normalize optional text values before comparisons, storage, or responses.

def normalize_optional_text(value):
    normalized_value = normalize_text(value)
    return normalized_value or None


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


# Normalize service image URLs values before comparisons, storage, or responses.

def normalize_service_image_urls(payload):
    normalized_images = []
    seen = set()

    raw_images = getattr(payload, "imageUrls", None)
    if isinstance(raw_images, list):
        for raw_value in raw_images:
            candidate = normalize_text(raw_value)
            if not candidate or candidate in seen:
                continue
            seen.add(candidate)
            normalized_images.append(candidate)

    primary_image = normalize_text(getattr(payload, "imageUrl", ""))
    if primary_image and primary_image not in seen:
        normalized_images.insert(0, primary_image)
        seen.add(primary_image)

    return normalized_images[:3]


# Expose the resolve service type value service through the controller layer.

def resolve_service_type_value(payload):
    return normalize_text(getattr(payload, "category", "") or getattr(payload, "serviceType", ""))


# Build the service name used by downstream queries or response shaping.

def build_service_name(name, service_type, location):
    normalized_name = normalize_text(name)
    if normalized_name:
        return normalized_name

    normalized_service_type = normalize_text(service_type)
    normalized_location = normalize_text(location)
    if normalized_service_type and normalized_location:
        return f"{normalized_service_type} - {normalized_location}"

    return normalized_service_type or normalized_location


# Serialize service into the shape returned by the API.

def serialize_service(service):
    if not service:
        return None

    rating_fields = get_service_rating_fields(service)
    image_urls = resolve_image_urls(service)

    return {
        "id": int(service.get("id")) if isinstance(service.get("id"), int) else str(service.get("id") or service.get("_id") or ""),
        "name": service.get("name") or "",
        "description": service.get("description") or "",
        "price": float(service.get("price") or 0),
        "category": service.get("category") or "",
        "location": str(service.get("location") or "").strip(),
        "imageUrl": image_urls[0] if image_urls else None,
        "imageUrls": image_urls,
        "isActive": bool(service.get("isActive", True)),
        "averageRating": rating_fields["averageRating"],
        "average_rating": rating_fields["average_rating"],
        "totalReviews": rating_fields["totalReviews"],
        "total_reviews": rating_fields["total_reviews"],
        "reviews": service.get("reviews") or [],
        "createdAt": str(service.get("createdAt") or ""),
    }


# Serialize vendor profile into the shape returned by the API.

def serialize_vendor_profile(vendor):
    if not vendor:
        return None

    return {
        "businessName": vendor.get("businessName") or vendor.get("name") or "",
        "ownerName": vendor.get("ownerName") or "",
        "category": vendor.get("category") or vendor.get("service") or "",
        "email": normalize_email(vendor.get("email")),
        "phone": normalize_phone(vendor.get("phone")),
        "city": vendor.get("city") or "",
        "state": vendor.get("state") or "",
        "zipCode": vendor.get("zipCode") or "",
    }


# Serialize booking into the shape returned by the API.

def serialize_booking(booking):
    if not booking:
        return None

    budget_amount = get_numeric_field_value(
        booking,
        ["estimatedBudget", "estimated_budget", "budget"],
    )
    amount = booking.get("totalAmount")
    if amount is None:
        amount = booking.get("amount")
    if amount is None:
        amount = booking.get("price")

    return {
        "id": int(booking.get("id")) if isinstance(booking.get("id"), int) else str(booking.get("id") or booking.get("_id") or ""),
        "requestId": str(booking.get("requestId") or booking.get("bookingRequestId") or booking.get("id") or ""),
        "clientName": booking.get("clientName") or booking.get("bookedByName") or booking.get("booked_by_name") or booking.get("userName") or "",
        "serviceId": str(booking.get("serviceId") or booking.get("service_id") or ""),
        "serviceName": booking.get("serviceName") or booking.get("service") or booking.get("serviceType") or "",
        "location": str(booking.get("location") or "").strip(),
        "eventDate": booking.get("eventDate") or "",
        "eventTime": booking.get("eventTime") or "",
        "guestCount": to_non_negative_int(booking.get("guestCount") or booking.get("guest_count")),
        "notes": str(booking.get("notes") or "").strip(),
        "budget": round(budget_amount, 2),
        "estimatedBudget": round(budget_amount, 2),
        "allocatedBudget": round(budget_amount, 2),
        "amount": float(amount or 0),
        "totalAmount": float(amount or 0),
        "createdAt": booking.get("createdAt") or "",
        "updatedAt": booking.get("updatedAt") or booking.get("createdAt") or "",
        "status": normalize_booking_status(booking.get("status")),
    }


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

    amount = booking.get("estimatedBudget")
    if amount is None:
        amount = booking.get("amount")
    if amount is None:
        amount = booking.get("totalAmount")

    return {
        "id": str(booking.get("id") or booking.get("requestId") or booking.get("_id") or ""),
        "requestId": str(booking.get("requestId") or booking.get("bookingRequestId") or booking.get("id") or ""),
        "clientName": booking.get("coupleName") or booking.get("bookedByName") or booking.get("booked_by_name") or booking.get("userName") or booking.get("clientName") or "",
        "serviceId": str(booking.get("serviceId") or booking.get("service_id") or ""),
        "serviceName": booking.get("service") or booking.get("serviceName") or booking.get("serviceType") or "",
        "location": str(booking.get("location") or "").strip(),
        "eventDate": booking.get("eventDate") or "",
        "eventTime": booking.get("eventTime") or "",
        "guestCount": to_non_negative_int(booking.get("guestCount") or booking.get("guest_count")),
        "notes": str(booking.get("notes") or "").strip(),
        "budget": float(amount or 0),
        "estimatedBudget": float(amount or 0),
        "allocatedBudget": float(amount or 0),
        "amount": float(amount or 0),
        "totalAmount": float(amount or 0),
        "createdAt": booking.get("createdAt") or "",
        "updatedAt": booking.get("updatedAt") or booking.get("createdAt") or "",
        "status": normalize_booking_status(booking.get("status")),
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


# Overlay user-editable request details onto the mirrored vendor booking copy.

def merge_booking_with_request_updates(booking, request_doc):
    if not request_doc:
        return booking

    merged_booking = dict(booking or {})
    for field_name in ("eventDate", "eventTime", "location", "guestCount", "estimatedBudget", "budget", "notes"):
        if field_name in request_doc:
            merged_booking[field_name] = request_doc.get(field_name)

    if request_doc.get("updatedAt"):
        merged_booking["updatedAt"] = request_doc.get("updatedAt")

    return merged_booking


# Resolve vendor key strings from the available documents and fallback values.

async def resolve_vendor_key_strings(vendor_id: str):
    normalized_vendor_id = str(vendor_id or "").strip()
    if not normalized_vendor_id:
        return set()

    keys = {normalized_vendor_id}
    vendor = None

    vendor_query = {"id": int(normalized_vendor_id)} if normalized_vendor_id.isdigit() else {"id": normalized_vendor_id}
    vendor = await vendors_collection.find_one(vendor_query)
    if not vendor:
        parsed_vendor_object_id = parse_object_id(normalized_vendor_id)
        if parsed_vendor_object_id:
            vendor = await vendors_collection.find_one({"_id": parsed_vendor_object_id})

    # Vendor session id can be a user id; resolve to vendor via user email.
    if not vendor:
        user_query = {"id": int(normalized_vendor_id)} if normalized_vendor_id.isdigit() else {"id": normalized_vendor_id}
        user = await users_collection.find_one(user_query)
        if not user:
            parsed_user_object_id = parse_object_id(normalized_vendor_id)
            if parsed_user_object_id:
                user = await users_collection.find_one({"_id": parsed_user_object_id})
        if user:
            user_email = normalize_email(user.get("email"))
            if user_email:
                vendor = await vendors_collection.find_one({"email": user_email})

    if vendor:
        vendor_identifier = vendor.get("id")
        if vendor_identifier is None and vendor.get("_id") is not None:
            vendor_identifier = str(vendor.get("_id"))
        if vendor_identifier is not None:
            keys.add(str(vendor_identifier))

    return keys


# Resolve authenticated vendor scope keys from the available documents and fallback values.

async def resolve_authenticated_vendor_scope_keys(authorization: str, vendor_id: str = ""):
    scope_keys = set()
    normalized_vendor_id = str(vendor_id or "").strip()
    if normalized_vendor_id:
        scope_keys.update(await resolve_vendor_key_strings(normalized_vendor_id))

    token = str(authorization or "").replace("Bearer", "").strip()
    if not token:
        return scope_keys

    payload = decode_token(token)
    if not payload:
        return None

    if str(payload.get("role") or "").strip().lower() != "vendor":
        return None

    payload_user_id = str(payload.get("user_id") or "").strip()
    payload_email = normalize_email(payload.get("email"))

    if payload_user_id:
        scope_keys.add(payload_user_id)
        scope_keys.update(await resolve_vendor_key_strings(payload_user_id))

    if payload_email:
        vendor_doc = await vendors_collection.find_one({"email": payload_email})
        if vendor_doc:
            vendor_identifier = vendor_doc.get("id")
            if vendor_identifier is None and vendor_doc.get("_id") is not None:
                vendor_identifier = str(vendor_doc.get("_id"))
            if vendor_identifier is not None:
                scope_keys.update(await resolve_vendor_key_strings(str(vendor_identifier)))

    return scope_keys


# Resolve authorized vendor context from the available documents and fallback values.

async def resolve_authorized_vendor_context(authorization: str, vendor_id: str = ""):
    user, _, error_response = await authenticate_request(authorization, "vendor")
    if error_response:
        return None, set(), None, error_response

    vendor_keys = await resolve_authenticated_vendor_scope_keys(authorization, vendor_id)
    if vendor_keys is None:
        return None, set(), None, JSONResponse(
            {"message": "Invalid vendor authentication."},
            status_code=401,
        )

    vendor_doc = None
    for candidate_key in vendor_keys:
        vendor_doc = await resolve_vendor_document(str(candidate_key))
        if vendor_doc:
            break

    return user, vendor_keys, vendor_doc, None


# Resolve vendor service documents from the available documents and fallback values.

async def resolve_vendor_service_documents(vendor_keys):
    services = []
    service_ids = set()
    if not vendor_keys:
        return services, service_ids

    vendor_key_values = list(vendor_keys)
    async for service_doc in services_collection.find({"vendorId": {"$in": vendor_key_values}}):
        service_identifier = str(service_doc.get("id") or service_doc.get("_id") or "").strip()
        if service_identifier:
            service_ids.add(service_identifier)
        services.append(service_doc)

    return services, service_ids


# Build the vendor earnings records used by downstream queries or response shaping.

async def build_vendor_earnings_records(vendor_keys):
    _, vendor_service_ids = await resolve_vendor_service_documents(vendor_keys)
    if not vendor_keys:
        return []

    normalized_vendor_keys = {str(value).strip() for value in vendor_keys if str(value).strip()}
    earning_records = []
    service_cache = {}
    async for booking in bookings_collection.find({}):
        booking_vendor_id = str(booking.get("vendorId") or "").strip()
        booking_service_id = str(booking.get("serviceId") or booking.get("service_id") or "").strip()
        if normalized_vendor_keys and booking_vendor_id not in normalized_vendor_keys:
            continue

        if vendor_service_ids and booking_service_id and booking_service_id not in vendor_service_ids:
            continue

        status = str(booking.get("status") or "").strip().lower()
        if status not in EARNINGS_STATUSES:
            continue

        service_doc = None
        if booking_service_id:
            service_doc = service_cache.get(booking_service_id)
            if service_doc is None:
                service_doc = await db["services"].find_one(
                    {"id": int(booking_service_id)}
                ) if booking_service_id.isdigit() else await db["services"].find_one({"id": booking_service_id})
                if not service_doc:
                    parsed_service_object_id = parse_object_id(booking_service_id)
                    if parsed_service_object_id:
                        service_doc = await db["services"].find_one({"_id": parsed_service_object_id})
                service_cache[booking_service_id] = service_doc

        gross_amount = resolve_booking_gross_amount(booking, service_doc)
        estimated_budget = get_numeric_field_value(
            booking,
            ["estimatedBudget", "estimated_budget", "budget"],
        )
        budget_amount = resolve_booking_budget_amount(booking, service_doc)

        if budget_amount <= 0:
            continue

        earning_records.append(
            {
                "amount": budget_amount,
                "grossAmount": round(to_non_negative_amount(gross_amount), 2),
                "savedAmount": calculate_saved_amount(estimated_budget, gross_amount),
                "createdAt": booking.get("createdAt") or booking.get("updatedAt") or booking.get("eventDate") or "",
            }
        )

    return earning_records


# Handle the service-layer logic for retrieving vendor profile.

async def get_vendor_profile_service(vendor_id: str, email: str, authorization: str):
    user, _, vendor, error_response = await resolve_authorized_vendor_context(
        authorization,
        vendor_id,
    )
    if error_response:
        return error_response

    if not vendor:
        return serialize_vendor_profile({"email": normalize_email((user or {}).get("email") or email)})

    return serialize_vendor_profile(vendor)


# Handle the service-layer logic for updating vendor profile.

async def update_vendor_profile_service(payload, authorization: str):
    user, _, vendor, error_response = await resolve_authorized_vendor_context(authorization)
    if error_response:
        return error_response

    normalized_email = normalize_email(payload.email)
    if not normalized_email:
        return JSONResponse({"message": "Email is required."}, status_code=400)

    current_vendor_email = normalize_email((vendor or {}).get("email"))
    current_user_email = normalize_email((user or {}).get("email"))
    if normalized_email not in {current_vendor_email, current_user_email}:
        existing_vendor = await vendors_collection.find_one({"email": normalized_email})
        existing_user = await users_collection.find_one({"email": normalized_email, "role": "vendor"})
        if existing_vendor or existing_user:
            return JSONResponse({"message": "Email is already in use."}, status_code=400)

    now = utcnow_iso()
    business_name = str(payload.businessName or "").strip() or "Vendor"
    city_value = str(payload.city or "").strip()
    state_value = str(payload.state or "").strip()
    updates = {
        "businessName": business_name,
        "name": business_name,
        "ownerName": payload.ownerName or "Vendor",
        "category": str(payload.category or "").strip(),
        "email": normalized_email,
        "phone": normalize_phone(payload.phone),
        "city": city_value,
        "state": state_value,
        "location": build_location(city_value, state_value),
        "zipCode": payload.zipCode,
        "updatedAt": now,
    }

    if vendor:
        await vendors_collection.update_one(
            {"_id": vendor.get("_id")},
            {"$set": updates},
        )
    else:
        existing = await vendors_collection.find_one({}, sort=[("id", -1)])
        next_id = 1
        if existing and isinstance(existing.get("id"), int):
            next_id = int(existing.get("id")) + 1

        await vendors_collection.insert_one(
            {
                "id": next_id,
                **updates,
                "rating": 0,
                "average_rating": 0,
                "averageRating": 0,
                "total_reviews": 0,
                "totalReviews": 0,
                "status": "pending",
                "createdAt": now,
            }
        )

    if user:
        await users_collection.update_one(
            {"_id": user.get("_id")},
            {
                "$set": {
                    "name": business_name,
                    "email": normalized_email,
                    "phone": normalize_phone(payload.phone),
                    "updatedAt": now,
                }
            },
        )

    return {"success": True}


# Handle the service-layer logic for retrieving vendor stats.

async def get_vendor_stats_service(vendor_id: str, email: str, authorization: str):
    _, vendor_keys, vendor, error_response = await resolve_authorized_vendor_context(
        authorization,
        vendor_id,
    )
    if error_response:
        return error_response

    if not vendor:
        return JSONResponse({"message": "Vendor profile not found."}, status_code=404)

    vendor_key = str(vendor_id) if vendor_id else None
    raw_vendor_key_values = list(vendor_keys)
    if not vendor_key and vendor:
        vendor_key = vendor.get("id") if vendor.get("id") is not None else str(vendor.get("_id"))
    bookings = []
    key_set = normalize_identifier_set(vendor_keys)
    if vendor_key:
        key_set.add(vendor_key)
        key_set.add(str(vendor_key))
    async for booking in bookings_collection.find({"vendorId": {"$in": raw_vendor_key_values}}):
        if key_set and str(booking.get("vendorId") or "").strip() not in key_set:
            continue
        bookings.append(booking)

    total_bookings = len(bookings)
    pending = sum(1 for b in bookings if normalize_booking_status(b.get("status")) == "pending")
    approved = sum(
        1 for b in bookings if normalize_booking_status(b.get("status")) in {"approved", "in_progress", "completed"}
    )

    total_earnings = 0.0
    month_totals = defaultdict(float)
    for booking in bookings:
        status = normalize_booking_status(booking.get("status"))
        if status in {"approved", "completed"}:
            amount = resolve_booking_budget_amount(booking)
            total_earnings += amount

            dt = to_datetime(booking.get("createdAt") or booking.get("eventDate"))
            if dt:
                month_key = dt.strftime("%b")
                month_totals[month_key] += amount

    month_order = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly_earnings = [
        {"month": month, "total": month_totals.get(month, 0)} for month in month_order if month in month_totals
    ]

    return {
        "totalBookings": total_bookings,
        "pendingBookings": pending,
        "approvedBookings": approved,
        "totalEarnings": total_earnings,
        "monthlyEarnings": monthly_earnings,
    }


# Handle the service-layer logic for listing services.

async def list_services_service(vendor_id: str, authorization: str):
    _, vendor_keys, _, error_response = await resolve_authorized_vendor_context(
        authorization,
        vendor_id,
    )
    if error_response:
        return error_response

    services = []
    raw_vendor_key_values = list(vendor_keys)
    normalized_vendor_keys = normalize_identifier_set(vendor_keys)
    if not raw_vendor_key_values:
        return services

    async for service in services_collection.find(
        {"vendorId": {"$in": raw_vendor_key_values}},
        sort=[("createdAt", -1)],
    ):
        serialized_service = serialize_service(service)
        serialized_service["reviews"] = await fetch_service_rating_reviews(service, limit=0)
        services.append(serialized_service)

    return services


# Handle the service-layer logic for creating service.

async def create_service_service(payload, authorization: str):
    user, _, vendor, error_response = await resolve_authorized_vendor_context(
        authorization,
        str(getattr(payload, "vendorId", "") or ""),
    )
    if error_response:
        return error_response

    service_type_value = resolve_service_type_value(payload)
    location_value = normalize_text(payload.location)
    service_name = build_service_name(payload.name, service_type_value, location_value)

    if not service_type_value:
        return JSONResponse({"message": "Service type is required."}, status_code=400)
    if not location_value:
        return JSONResponse({"message": "Service location is required."}, status_code=400)
    if not service_name:
        return JSONResponse({"message": "Service name is required."}, status_code=400)
    if payload.price is None or float(payload.price) <= 0:
        return JSONResponse({"message": "Service price is required."}, status_code=400)

    image_urls = normalize_service_image_urls(payload)
    if not image_urls:
        return JSONResponse({"message": "At least one service image is required."}, status_code=400)
    if len(image_urls) > 3:
        return JSONResponse({"message": "You can add up to 3 service images."}, status_code=400)

    now = utcnow_iso()
    existing = await services_collection.find_one({}, sort=[("id", -1)])
    next_id = 1
    if existing and isinstance(existing.get("id"), int):
        next_id = int(existing.get("id")) + 1

    if not vendor:
        return JSONResponse({"message": "Vendor profile not found."}, status_code=404)

    resolved_vendor_id = str(vendor.get("id") or vendor.get("_id") or "").strip()
    if not resolved_vendor_id and user:
        resolved_vendor_id = str(user.get("id") or user.get("_id") or "").strip()

    service_document = {
        "id": next_id,
        "vendorId": resolved_vendor_id,
        "name": service_name,
        "description": normalize_text(payload.description),
        "price": float(payload.price),
        "category": service_type_value,
        "location": location_value,
        "imageUrl": image_urls[0],
        "imageUrls": image_urls,
        "isActive": bool(payload.isActive),
        "createdAt": now,
        "updatedAt": now,
    }

    await services_collection.insert_one(service_document)
    clear_public_vendor_cache()
    created_service = await services_collection.find_one({"id": next_id})
    return {"success": True, "id": next_id, "service": serialize_service(created_service)}


# Handle the service-layer logic for updating service.

async def update_service_service(service_id: str, payload, authorization: str):
    _, vendor_keys, _, error_response = await resolve_authorized_vendor_context(authorization)
    if error_response:
        return error_response

    query = {"_id": parse_object_id(service_id)} if parse_object_id(service_id) else {"id": int(service_id) if str(service_id).isdigit() else service_id}
    service = await services_collection.find_one(query)
    if not service:
        return JSONResponse({"message": "Service not found."}, status_code=404)

    normalized_vendor_keys = normalize_identifier_set(vendor_keys)
    if str(service.get("vendorId") or "").strip() not in normalized_vendor_keys:
        return JSONResponse({"message": "Forbidden."}, status_code=403)

    payload_fields = getattr(payload, "model_fields_set", getattr(payload, "__fields_set__", set()))
    updates = {"updatedAt": utcnow_iso()}

    current_service_type = normalize_text(service.get("category"))
    current_location = normalize_text(service.get("location"))
    category_was_sent = "category" in payload_fields or "serviceType" in payload_fields

    next_service_type = current_service_type
    if category_was_sent:
        next_service_type = resolve_service_type_value(payload)
        if not next_service_type:
            return JSONResponse({"message": "Service type is required."}, status_code=400)
        updates["category"] = next_service_type

    next_location = current_location
    if "location" in payload_fields:
        next_location = normalize_text(payload.location)
        if not next_location:
            return JSONResponse({"message": "Service location is required."}, status_code=400)
        updates["location"] = next_location

    if "name" in payload_fields:
        next_name = build_service_name(payload.name, next_service_type, next_location)
        if not next_name:
            return JSONResponse({"message": "Service name is required."}, status_code=400)
        updates["name"] = next_name
    elif category_was_sent or "location" in payload_fields:
        updates["name"] = build_service_name("", next_service_type, next_location)

    if "description" in payload_fields:
        updates["description"] = normalize_text(payload.description)

    if "price" in payload_fields:
        if payload.price is None or float(payload.price) <= 0:
            return JSONResponse({"message": "Service price is required."}, status_code=400)
        updates["price"] = float(payload.price)

    if "imageUrl" in payload_fields or "imageUrls" in payload_fields:
        image_urls = normalize_service_image_urls(payload)
        if not image_urls:
            return JSONResponse({"message": "At least one service image is required."}, status_code=400)
        if len(image_urls) > 3:
            return JSONResponse({"message": "You can add up to 3 service images."}, status_code=400)
        updates["imageUrl"] = image_urls[0]
        updates["imageUrls"] = image_urls

    if "isActive" in payload_fields:
        updates["isActive"] = bool(payload.isActive)

    await services_collection.update_one({"_id": service.get("_id")}, {"$set": updates})
    clear_public_vendor_cache()
    updated_service = await services_collection.find_one({"_id": service.get("_id")})
    return {"success": True, "service": serialize_service(updated_service)}


# Handle the service-layer logic for deleting service.

async def delete_service_service(service_id: str, authorization: str):
    _, vendor_keys, _, error_response = await resolve_authorized_vendor_context(authorization)
    if error_response:
        return error_response

    query = {"_id": parse_object_id(service_id)} if parse_object_id(service_id) else {"id": int(service_id) if str(service_id).isdigit() else service_id}
    service = await services_collection.find_one(query)
    if not service:
        return JSONResponse({"message": "Service not found."}, status_code=404)

    normalized_vendor_keys = normalize_identifier_set(vendor_keys)
    if str(service.get("vendorId") or "").strip() not in normalized_vendor_keys:
        return JSONResponse({"message": "Forbidden."}, status_code=403)

    normalized_service_id = str(service.get("id") or service.get("_id") or "").strip()
    vendor_doc = await resolve_vendor_document(str(service.get("vendorId") or "").strip())
    if normalized_service_id:
        await ratings_collection.delete_many({"service_id": normalized_service_id})
        await favorites_collection.delete_many(
            {"$or": [{"serviceId": normalized_service_id}, {"service_id": normalized_service_id}]}
        )

    result = await services_collection.delete_one({"_id": service.get("_id")})
    if result.deleted_count == 0:
        return JSONResponse({"message": "Service not found."}, status_code=404)
    if vendor_doc:
        await recalculate_vendor_rating_summary(vendor_doc)
    clear_public_vendor_cache()
    return {"success": True}


# Handle the service-layer logic for listing recent bookings.

async def list_recent_bookings_service(vendor_id: str, authorization: str):
    bookings = []
    booking_reference_keys = set()
    _, vendor_keys, _, error_response = await resolve_authorized_vendor_context(
        authorization,
        vendor_id,
    )
    if error_response:
        return error_response

    raw_vendor_key_values = list(vendor_keys)
    normalized_vendor_keys = normalize_identifier_set(vendor_keys)
    if not raw_vendor_key_values:
        return bookings

    async for booking in bookings_collection.find(
        {"vendorId": {"$in": raw_vendor_key_values}},
        sort=[("createdAt", -1)],
    ).limit(50):
        if str(booking.get("vendorId") or "").strip() not in normalized_vendor_keys:
            continue
        request_match_query = build_booking_request_match_query(booking)
        request_doc = (
            await couple_booking_requests_collection.find_one(
                request_match_query,
                sort=[("updatedAt", -1), ("createdAt", -1)],
            )
            if request_match_query
            else None
        )
        if request_doc and str(request_doc.get("vendorId") or "").strip() not in normalized_vendor_keys:
            request_doc = None

        merged_booking = merge_booking_with_request_updates(booking, request_doc)
        bookings.append(serialize_booking(merged_booking))
        for key in build_booking_reference_keys(merged_booking):
            booking_reference_keys.add(key)
        for key in build_booking_reference_keys(request_doc):
            booking_reference_keys.add(key)

    async for couple_booking in couple_booking_requests_collection.find(
        {"vendorId": {"$in": raw_vendor_key_values}},
        sort=[("createdAt", -1)],
    ).limit(50):
        couple_reference_keys = build_booking_reference_keys(couple_booking)
        if any(key in booking_reference_keys for key in couple_reference_keys):
            continue
        bookings.append(serialize_couple_booking_request(couple_booking))

    bookings.sort(
        key=lambda item: str(item.get("createdAt") or ""),
        reverse=True,
    )

    enriched_bookings = []
    for booking in bookings[:10]:
        service_id = str(booking.get("serviceId") or "").strip()
        service_doc = None
        if service_id:
            service_query = {"id": int(service_id)} if service_id.isdigit() else {"id": service_id}
            service_doc = await services_collection.find_one(service_query)
            if not service_doc:
                parsed_service_object_id = parse_object_id(service_id)
                if parsed_service_object_id:
                    service_doc = await services_collection.find_one({"_id": parsed_service_object_id})

        if not service_doc:
            service_name = str(booking.get("serviceName") or "").strip()
            if service_name and normalized_vendor_keys:
                service_doc = await services_collection.find_one(
                    {
                        "vendorId": {"$in": normalized_vendor_keys},
                        "$or": [
                            {"name": service_name},
                            {"category": service_name},
                        ],
                    }
                )

        service_rating_fields = get_service_rating_fields(service_doc or {})
        enriched_bookings.append(
            {
                **booking,
                "serviceId": str((service_doc or {}).get("id") or (service_doc or {}).get("_id") or booking.get("serviceId") or ""),
                "serviceAverageRating": service_rating_fields["averageRating"],
                "service_average_rating": service_rating_fields["average_rating"],
                "serviceTotalReviews": service_rating_fields["totalReviews"],
                "service_total_reviews": service_rating_fields["total_reviews"],
            }
        )

    return enriched_bookings


# Handle the service-layer logic for updating booking status.

async def update_booking_status_service(booking_id: str, payload, authorization: str):
    _, vendor_keys, _, error_response = await resolve_authorized_vendor_context(authorization)
    if error_response:
        return error_response

    status = normalize_booking_status(payload.status)
    if status not in ALLOWED_BOOKING_STATUSES:
        return JSONResponse({"message": "Invalid booking status."}, status_code=400)

    query = {"_id": parse_object_id(booking_id)} if parse_object_id(booking_id) else {"id": int(booking_id) if str(booking_id).isdigit() else booking_id}
    booking = await bookings_collection.find_one(query)
    normalized_vendor_keys = normalize_identifier_set(vendor_keys)
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
        if str(couple_booking.get("vendorId") or "").strip() not in normalized_vendor_keys:
            return JSONResponse({"message": "Forbidden."}, status_code=403)

        now = utcnow_iso()
        await couple_booking_requests_collection.update_one(
            {"_id": couple_booking.get("_id")},
            {"$set": {"status": status, "updatedAt": now}},
        )
        updated_couple_booking = await couple_booking_requests_collection.find_one(
            {"_id": couple_booking.get("_id")}
        )
        return serialize_couple_booking_request(updated_couple_booking)

    if str(booking.get("vendorId") or "").strip() not in normalized_vendor_keys:
        return JSONResponse({"message": "Forbidden."}, status_code=403)

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
    updated_request_doc = None
    request_match_query = build_booking_request_match_query(updated)
    if request_match_query:
        updated_request_doc = await couple_booking_requests_collection.find_one(
            request_match_query,
            sort=[("updatedAt", -1), ("createdAt", -1)],
        )

    return serialize_booking(merge_booking_with_request_updates(updated, updated_request_doc))


# Handle the service-layer logic for retrieving earnings.

async def get_earnings_service(vendor_id: str, authorization: str = ""):
    vendor_keys = await resolve_authenticated_vendor_scope_keys(authorization, vendor_id)
    if vendor_keys is None:
        return JSONResponse({"message": "Invalid vendor authentication."}, status_code=401)

    now = datetime.now(timezone.utc)
    this_month_total = 0.0
    last_month_total = 0.0
    total = 0.0
    total_saved = 0.0
    this_month_saved = 0.0
    last_month_saved = 0.0
    chart = defaultdict(float)
    savings_chart = defaultdict(float)
    earning_records = await build_vendor_earnings_records(vendor_keys)

    for record in earning_records:
        amount = float(record.get("amount") or 0)
        saved_amount = float(record.get("savedAmount") or 0)
        total += amount
        total_saved += saved_amount

        dt = to_datetime(record.get("createdAt"))
        if dt:
            chart[dt.strftime("%b")] += amount
            savings_chart[dt.strftime("%b")] += saved_amount
            if dt.year == now.year and dt.month == now.month:
                this_month_total += amount
                this_month_saved += saved_amount
            else:
                last_month = now.month - 1 or 12
                last_month_year = now.year if now.month > 1 else now.year - 1
                if dt.year == last_month_year and dt.month == last_month:
                    last_month_total += amount
                    last_month_saved += saved_amount

    month_order = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    chart_data = [{"month": m, "total": chart.get(m, 0)} for m in month_order if m in chart]
    savings_chart_data = [{"month": m, "total": savings_chart.get(m, 0)} for m in month_order if m in savings_chart]

    return {
        "totalEarnings": total,
        "total_earnings": total,
        "netTotalEarnings": total,
        "net_total_earnings": total,
        "thisMonth": this_month_total,
        "this_month": this_month_total,
        "netThisMonth": this_month_total,
        "net_this_month": this_month_total,
        "lastMonth": last_month_total,
        "last_month": last_month_total,
        "netLastMonth": last_month_total,
        "net_last_month": last_month_total,
        "chartData": chart_data,
        "monthlyBreakdown": chart_data,
        "monthly_breakdown": chart_data,
        "netMonthlyBreakdown": chart_data,
        "net_monthly_breakdown": chart_data,
        "totalSaved": total_saved,
        "total_saved": total_saved,
        "thisMonthSaved": this_month_saved,
        "this_month_saved": this_month_saved,
        "lastMonthSaved": last_month_saved,
        "last_month_saved": last_month_saved,
        "savedBreakdown": savings_chart_data,
        "saved_breakdown": savings_chart_data,
        "earningsBasis": "net",
    }


# Expose the get vendor profile service through the controller layer.

async def get_vendor_profile(vendor_id: str, email: str, authorization: str):
    return await get_vendor_profile_service(vendor_id, email, authorization)


# Expose the update vendor profile service through the controller layer.

async def update_vendor_profile(payload, authorization: str):
    return await update_vendor_profile_service(payload, authorization)


# Expose the get vendor stats service through the controller layer.

async def get_vendor_stats(vendor_id: str, email: str, authorization: str):
    return await get_vendor_stats_service(vendor_id, email, authorization)


# Expose the list services service through the controller layer.

async def list_services(vendor_id: str, authorization: str):
    return await list_services_service(vendor_id, authorization)


# Handle the service-layer logic for creating .

async def create_service(payload, authorization: str):
    return await create_service_service(payload, authorization)


# Handle the service-layer logic for updating .

async def update_service(service_id: str, payload, authorization: str):
    return await update_service_service(service_id, payload, authorization)


# Handle the service-layer logic for deleting .

async def delete_service(service_id: str, authorization: str):
    return await delete_service_service(service_id, authorization)


# Expose the list recent bookings service through the controller layer.

async def list_recent_bookings(vendor_id: str, authorization: str):
    return await list_recent_bookings_service(vendor_id, authorization)


# Expose the update booking status service through the controller layer.

async def update_booking_status(booking_id: str, payload, authorization: str):
    return await update_booking_status_service(booking_id, payload, authorization)


# Expose the get earnings service through the controller layer.

async def get_earnings(vendor_id: str, authorization: str = ""):
    return await get_earnings_service(vendor_id, authorization)
