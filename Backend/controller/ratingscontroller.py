from fastapi.responses import JSONResponse

from JWT import decode_token
from controller.account_utils import find_user_document, normalize_email, utcnow_iso
from controller.ratings_utils import (
    build_identifier_variants,
    normalize_rating_value,
    ratings_collection,
    recalculate_service_rating_summary,
    recalculate_vendor_rating_summary,
    resolve_service_document,
    resolve_service_vendor_document,
    serialize_service_rating_record,
    fetch_service_rating_reviews,
)
from dbconnect import db

# Reuse shared MongoDB collection handles throughout this module.

bookings_collection = db["bookings"]
couple_booking_requests_collection = db["couple_booking_requests"]
vendor_inquiries_collection = db["vendor_inquiries"]


# Build the user-based filters used to verify whether a rating is allowed.

def build_user_interaction_filters(user, lookup_emails):
    filters = []

    user_identifier_variants = build_identifier_variants(
        user.get("id"),
        str(user.get("_id")) if user.get("_id") is not None else "",
    )
    if lookup_emails:
        filters.extend(
            [
                {"userEmail": {"$in": lookup_emails}},
                {"clientEmail": {"$in": lookup_emails}},
                {"email": {"$in": lookup_emails}},
            ]
        )
    if user_identifier_variants:
        filters.append({"userId": {"$in": user_identifier_variants}})

    return filters


# Build the service lookup filters used to find matching booking interactions.

def build_service_interaction_filters(service):
    service_id = str((service or {}).get("id") or (service or {}).get("_id") or "").strip()
    service_name = str((service or {}).get("name") or "").strip()
    service_category = str((service or {}).get("category") or "").strip()

    id_filters = []
    name_filters = []

    if service_id:
        id_filters.extend(
            [
                {"serviceId": service_id},
                {"service_id": service_id},
            ]
        )

    if service_name:
        name_filters.extend(
            [
                {"service": service_name},
                {"serviceName": service_name},
                {"serviceType": service_name},
            ]
        )

    if service_category and service_category.lower() != service_name.lower():
        name_filters.extend(
            [
                {"service": service_category},
                {"serviceName": service_category},
                {"serviceType": service_category},
            ]
        )

    return id_filters, name_filters


# Build the vendor lookup filters used to scope rating eligibility checks.

def build_vendor_interaction_filters(service, vendor):
    vendor_candidates = build_identifier_variants(
        (vendor or {}).get("id"),
        str((vendor or {}).get("_id")) if (vendor or {}).get("_id") is not None else "",
        (service or {}).get("vendorId"),
    )

    if not vendor_candidates:
        return []

    return [
        {"vendorId": {"$in": vendor_candidates}},
        {"vendorReference": {"$in": vendor_candidates}},
        {"resolvedVendorId": {"$in": vendor_candidates}},
    ]


# Decode the authorization header and return the matching user document.

async def get_authenticated_user_from_header(authorization: str):
    token = str(authorization or "").replace("Bearer", "").strip()
    if not token:
        return None, JSONResponse({"message": "Missing token."}, status_code=401)

    payload = decode_token(token)
    if not payload:
        return None, JSONResponse({"message": "Invalid token."}, status_code=401)

    user = await find_user_document(payload.get("email"), payload.get("role"))
    if not user:
        return None, JSONResponse({"message": "User not found."}, status_code=404)

    return user, None


# Combine the interaction filters into the final query used for eligibility checks.

def build_interaction_scope_query(user_filters, service_id_filters, service_name_filters, vendor_filters):
    scoped_matches = []

    if service_id_filters:
        scoped_matches.append({"$or": service_id_filters})

    if service_name_filters and vendor_filters:
        scoped_matches.append(
            {
                "$and": [
                    {"$or": vendor_filters},
                    {"$or": service_name_filters},
                ]
            }
        )

    if not user_filters or not scoped_matches:
        return None

    return {"$and": [{"$or": user_filters}, {"$or": scoped_matches}]}


# Check whether the user has a qualifying interaction with the selected service.

async def user_has_interacted_with_service(user, service, vendor):
    if not user or not service:
        return False

    lookup_emails = [
        email
        for email in {
            normalize_email(user.get("email")),
            normalize_email(user.get("partner_email")),
        }
        if email
    ]
    user_filters = build_user_interaction_filters(user, lookup_emails)
    service_id_filters, service_name_filters = build_service_interaction_filters(service)
    vendor_filters = build_vendor_interaction_filters(service, vendor)
    interaction_query = build_interaction_scope_query(
        user_filters,
        service_id_filters,
        service_name_filters,
        vendor_filters,
    )

    if not interaction_query:
        return False

    booking_match = await bookings_collection.find_one(interaction_query)
    if booking_match:
        return True

    request_match = await couple_booking_requests_collection.find_one(interaction_query)
    if request_match:
        return True

    inquiry_match = await vendor_inquiries_collection.find_one(interaction_query)
    return bool(inquiry_match)


# Store a rating review and refresh the related service and vendor summaries.

async def submit_rating_service(payload, authorization: str):
    user, auth_error = await get_authenticated_user_from_header(authorization)
    if auth_error:
        return auth_error

    if str(user.get("role") or "").strip().lower() != "user":
        return JSONResponse(
            {"message": "Only authenticated users can submit service ratings."},
            status_code=403,
        )

    service_reference = str(payload.serviceId or "").strip()
    if not service_reference:
        return JSONResponse({"message": "serviceId is required."}, status_code=400)

    rating_value = normalize_rating_value(payload.rating)
    if not rating_value:
        return JSONResponse({"message": "rating must be between 1 and 5."}, status_code=400)

    service = await resolve_service_document(service_reference)
    if not service:
        return JSONResponse({"message": "Service not found."}, status_code=404)

    vendor = await resolve_service_vendor_document(service)
    if not vendor:
        return JSONResponse({"message": "Vendor not found for this service."}, status_code=404)

    has_interaction = await user_has_interacted_with_service(user, service, vendor)
    if not has_interaction:
        return JSONResponse(
            {"message": "You can rate a service only after interacting with it."},
            status_code=403,
        )

    user_id = str(user.get("id") or user.get("_id") or "").strip()
    service_id = str(service.get("id") or service.get("_id") or "").strip()
    vendor_id = str(vendor.get("id") or vendor.get("_id") or "").strip()
    if not user_id or not service_id or not vendor_id:
        return JSONResponse(
            {"message": "Unable to resolve rating identifiers."},
            status_code=400,
        )

    now = utcnow_iso()
    review_text = str(payload.review or "").strip()
    await ratings_collection.update_one(
        {"user_id": user_id, "service_id": service_id},
        {
            "$set": {
                "user_id": user_id,
                "service_id": service_id,
                "vendor_id": vendor_id,
                "rating": rating_value,
                "review": review_text,
                "status": "pending",
                "approved_at": "",
                "reviewed_at": "",
                "updated_at": now,
            },
            "$setOnInsert": {
                "created_at": now,
            },
        },
        upsert=True,
    )

    saved_rating = await ratings_collection.find_one({"user_id": user_id, "service_id": service_id})
    service_summary = await recalculate_service_rating_summary(service)
    vendor_summary = await recalculate_vendor_rating_summary(vendor)
    reviews = await fetch_service_rating_reviews(service, limit=10, current_user_id=user_id)

    return {
        "success": True,
        "message": "Service rating submitted for admin approval.",
        "rating": await serialize_service_rating_record(saved_rating, current_user_id=user_id),
        "service": {
            "id": service_id,
            "name": str(service.get("name") or "Service").strip() or "Service",
            "vendorId": vendor_id,
            **service_summary,
            "reviews": reviews,
        },
        "vendor": {
            "id": vendor_id,
            "name": str(vendor.get("name") or vendor.get("businessName") or "Vendor").strip() or "Vendor",
            **vendor_summary,
        },
    }


# Expose the submit rating service through the controller layer.

async def submit_rating(payload, authorization: str):
    return await submit_rating_service(payload, authorization)
