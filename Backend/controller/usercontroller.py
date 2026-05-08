from bson import ObjectId
from fastapi.responses import JSONResponse
from pymongo import ASCENDING, DESCENDING

from controller.account_utils import (
    authenticate_request,
    build_service_duplicate_lookup_query,
    get_primary_profile_type,
    get_partner_profile_type,
    get_user_names_by_emails,
    normalize_email,
    normalize_phone,
    resolve_couple_profile_emails,
    resolve_user_name_by_email,
    resolve_couple_account_context,
    utcnow_iso,
)
from controller.ratings_utils import (
    fetch_service_rating_reviews,
    get_service_rating_fields,
    get_vendor_rating_fields,
    ratings_collection,
    resolve_service_document,
    resolve_vendor_document,
    serialize_service_rating_record,
)
from dbconnect import db

# Reuse shared MongoDB collection handles throughout this module.

user_profiles_collection = db["user_profiles"]
user_settings_collection = db["user_settings"]
favorites_collection = db["favorites"]
couple_booking_requests_collection = db["couple_booking_requests"]
vendors_collection = db["vendors"]
bookings_collection = db["bookings"]
users_collection = db["users"]
services_collection = db["services"]

# Keep module-level constants together so related rules stay easy to maintain.

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


# Resolve authorized user scope from the available documents and fallback values.

async def resolve_authorized_user_scope(authorization: str, requested_email: str = ""):
    user, payload, error_response = await authenticate_request(authorization, "user")
    if error_response:
        return None, None, "", error_response

    authenticated_email = normalize_email(payload.get("email") or user.get("email"))
    couple_context = await resolve_couple_account_context(authenticated_email)
    lookup_emails = {
        value for value in (couple_context.get("lookupEmails") or []) if value
    }
    if authenticated_email:
        lookup_emails.add(authenticated_email)

    normalized_requested_email = normalize_email(requested_email)
    if normalized_requested_email and normalized_requested_email not in lookup_emails:
        return (
            None,
            None,
            "",
            JSONResponse({"message": "Forbidden."}, status_code=403),
        )

    effective_email = normalized_requested_email or authenticated_email
    return user, couple_context, effective_email, None


# Parse object ID values into the format expected by database queries.

def parse_object_id(value: str):
    try:
        return ObjectId(value)
    except Exception:
        return None


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
        if not normalized_value:
            continue
        if normalized_value in seen:
            continue
        seen.add(normalized_value)
        keys.append(normalized_value)

    return keys


# Resolve booking service name from the available documents and fallback values.

def resolve_booking_service_name(document):
    if not document:
        return ""

    return str(
        document.get("service")
        or document.get("serviceName")
        or document.get("serviceType")
        or ""
    ).strip()


# Convert non negative int into the format expected by the backend.

def to_non_negative_int(value):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return 0
    return parsed if parsed > 0 else 0


# Convert non negative float into the format expected by the backend.

def to_non_negative_float(value):
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return 0.0
    return parsed if parsed > 0 else 0.0


# Resolve public vendor name from the available documents and fallback values.

def resolve_public_vendor_name(vendor, fallback: str = "Vendor"):
    return str(
        (vendor or {}).get("ownerName")
        or (vendor or {}).get("owner_name")
        or (vendor or {}).get("name")
        or (vendor or {}).get("businessName")
        or fallback
    ).strip() or fallback


# Resolve public business name from the available documents and fallback values.

def resolve_public_business_name(service_doc=None, vendor=None, fallback: str = "Service"):
    return str(
        (service_doc or {}).get("name")
        or (vendor or {}).get("businessName")
        or (vendor or {}).get("name")
        or (service_doc or {}).get("category")
        or (vendor or {}).get("service")
        or (vendor or {}).get("category")
        or fallback
    ).strip() or fallback


# Resolve booking business name from the available documents and fallback values.

def resolve_booking_business_name(request_doc, booking_doc):
    request_doc = request_doc or {}
    booking_doc = booking_doc or {}
    return str(
        request_doc.get("businessName")
        or request_doc.get("business_name")
        or booking_doc.get("businessName")
        or booking_doc.get("business_name")
        or request_doc.get("serviceName")
        or booking_doc.get("serviceName")
        or resolve_booking_service_name(request_doc)
        or resolve_booking_service_name(booking_doc)
        or ""
    ).strip()


# Build a readable fallback name from the local part of an email address.

def _local_part_name(email: str):
    local_part = str(email or "").split("@", 1)[0].replace(".", " ").replace("_", " ").strip()
    return " ".join(part.capitalize() for part in local_part.split()) if local_part else ""


# Combine profile name fields into a single display name.

def _profile_full_name(profile):
    if not profile:
        return ""

    first_name = str(profile.get("firstName") or "").strip()
    last_name = str(profile.get("lastName") or "").strip()
    full_name = " ".join(part for part in (first_name, last_name) if part).strip()
    if full_name:
        return full_name

    return _local_part_name(profile.get("email"))


# Build the couple booking name context used by downstream queries or response shaping.

async def build_couple_booking_name_context(user_doc, bookings=None, fallback_email: str = ""):
    user_doc = user_doc or {}
    registered_email = normalize_email(user_doc.get("email")) or normalize_email(fallback_email)
    partner_email = normalize_email(user_doc.get("partner_email"))
    stored_registered_name = str(user_doc.get("name") or "").strip()

    lookup_emails = {value for value in (registered_email, partner_email) if value}
    for booking in bookings or []:
        booked_by_email = infer_booked_by_email(booking)
        if booked_by_email:
            lookup_emails.add(booked_by_email)

    name_by_email = await get_user_names_by_emails(*list(lookup_emails))

    registered_name = (
        name_by_email.get(registered_email)
        or stored_registered_name
        or _local_part_name(registered_email)
    )
    partner_name = (
        name_by_email.get(partner_email)
        or _local_part_name(partner_email)
    )

    return {
        "registeredEmail": registered_email,
        "partnerEmail": partner_email,
        "registeredName": registered_name,
        "partnerName": partner_name,
        "nameByEmail": name_by_email,
    }


# Build the couple member context used by downstream queries or response shaping.

async def build_couple_member_context(user_doc, fallback_email: str = ""):
    user_doc = user_doc or {}
    registered_email = normalize_email(user_doc.get("email")) or normalize_email(fallback_email)
    partner_email = normalize_email(user_doc.get("partner_email"))
    primary_profile_type = get_primary_profile_type(user_doc, "bride")
    default_profile_emails = resolve_couple_profile_emails(
        registered_email,
        partner_email,
        primary_profile_type,
    )

    bride_doc = (
        await user_profiles_collection.find_one(
            {"accountEmail": registered_email, "profileType": "bride"}
        )
        if registered_email
        else None
    )
    groom_doc = (
        await user_profiles_collection.find_one(
            {"accountEmail": registered_email, "profileType": "groom"}
        )
        if registered_email
        else None
    )

    bride_email = (
        normalize_email((bride_doc or {}).get("email"))
        or default_profile_emails["brideEmail"]
    )
    groom_email = (
        normalize_email((groom_doc or {}).get("email"))
        or default_profile_emails["groomEmail"]
    )
    primary_name = str(user_doc.get("name") or "").strip()
    bride_name = _profile_full_name(bride_doc) or (
        primary_name if primary_profile_type == "bride" else _local_part_name(bride_email)
    )
    groom_name = _profile_full_name(groom_doc) or (
        primary_name if primary_profile_type == "groom" else _local_part_name(groom_email)
    )

    return {
        "registeredEmail": registered_email,
        "partnerEmail": partner_email,
        "primaryProfileType": primary_profile_type,
        "brideEmail": bride_email,
        "groomEmail": groom_email,
        "brideName": bride_name,
        "groomName": groom_name,
    }


# Resolve partner role from the available documents and fallback values.

def resolve_partner_role(email: str, member_context):
    normalized_email = normalize_email(email)
    member_context = member_context or {}
    primary_profile_type = get_primary_profile_type(
        member_context.get("primaryProfileType"),
        "bride",
    )
    bride_email = normalize_email(member_context.get("brideEmail"))
    groom_email = normalize_email(member_context.get("groomEmail"))
    registered_email = normalize_email(member_context.get("registeredEmail"))
    partner_email = normalize_email(member_context.get("partnerEmail"))

    if normalized_email and bride_email and normalized_email == bride_email:
        return "Bride"
    if normalized_email and groom_email and normalized_email == groom_email:
        return "Groom"
    if normalized_email and partner_email and normalized_email == partner_email:
        return "Bride" if get_partner_profile_type(primary_profile_type) == "bride" else "Groom"
    if normalized_email and registered_email and normalized_email == registered_email:
        return "Bride" if primary_profile_type == "bride" else "Groom"
    return ""


# Resolve partner display name from the available documents and fallback values.

def resolve_partner_display_name(email: str, member_context, fallback_name: str = ""):
    normalized_email = normalize_email(email)
    role = resolve_partner_role(normalized_email, member_context)
    fallback_value = str(fallback_name or "").strip()
    if role == "Bride":
        return str(member_context.get("brideName") or fallback_value).strip()
    if role == "Groom":
        return str(member_context.get("groomName") or fallback_value).strip()
    return fallback_value


# Infer booked by email when older records do not store it explicitly.

def infer_booked_by_email(booking):
    booking = booking or {}
    return normalize_email(
        booking.get("bookedByEmail") or booking.get("booked_by_email")
    )


# Build ownership clauses for booking records that may use different email fields.

def build_authorized_booking_email_match(lookup_emails):
    normalized_lookup_emails = [
        normalize_email(value)
        for value in (lookup_emails or [])
        if normalize_email(value)
    ]
    if not normalized_lookup_emails:
        return []

    return [
        {"bookedByEmail": {"$in": normalized_lookup_emails}},
        {"booked_by_email": {"$in": normalized_lookup_emails}},
        {"registeredEmail": {"$in": normalized_lookup_emails}},
        {"registered_email": {"$in": normalized_lookup_emails}},
        {"partnerEmail": {"$in": normalized_lookup_emails}},
        {"partner_email": {"$in": normalized_lookup_emails}},
        {"userEmail": {"$in": normalized_lookup_emails}},
        {"clientEmail": {"$in": normalized_lookup_emails}},
        {"email": {"$in": normalized_lookup_emails}},
    ]


# Build id clauses for both request records and mirrored vendor booking records.

def build_booking_identifier_match(normalized_booking_id: str):
    identifier_match = [
        {"id": normalized_booking_id},
        {"requestId": normalized_booking_id},
        {"bookingRequestId": normalized_booking_id},
    ]
    parsed_booking_object_id = parse_object_id(normalized_booking_id)
    if parsed_booking_object_id:
        identifier_match.append({"_id": parsed_booking_object_id})
    return identifier_match


# Build a safe mirror query from request records that already passed ownership checks.

def build_mirrored_booking_reference_query(request_docs):
    reference_keys = set()
    vendor_values = set()

    for request_doc in request_docs or []:
        reference_keys.update(build_booking_reference_keys(request_doc))
        for vendor_value in (
            request_doc.get("vendorId"),
            request_doc.get("vendorReference"),
            request_doc.get("resolvedVendorId"),
        ):
            normalized_vendor_value = str(vendor_value or "").strip()
            if not normalized_vendor_value:
                continue
            vendor_values.add(normalized_vendor_value)
            if normalized_vendor_value.isdigit():
                vendor_values.add(int(normalized_vendor_value))

    if not reference_keys:
        return None

    reference_values = list(reference_keys)
    reference_query = {
        "$or": [
            {"id": {"$in": reference_values}},
            {"requestId": {"$in": reference_values}},
            {"bookingRequestId": {"$in": reference_values}},
        ]
    }
    if not vendor_values:
        return reference_query

    return {
        "$and": [
            {"vendorId": {"$in": list(vendor_values)}},
            reference_query,
        ]
    }


# Handle the enrich booking attribution workflow used by this module.

def enrich_booking_attribution(booking, name_context, member_context=None):
    booking = dict(booking or {})
    name_context = name_context or {}
    member_context = member_context or {}

    registered_email = normalize_email(
        booking.get("registeredEmail") or name_context.get("registeredEmail")
    )
    partner_email = normalize_email(
        booking.get("partnerEmail") or name_context.get("partnerEmail")
    )
    registered_name = str(name_context.get("registeredName") or "").strip()
    partner_name = str(name_context.get("partnerName") or "").strip()
    name_by_email = dict(name_context.get("nameByEmail") or {})
    booked_by_email = infer_booked_by_email(
        {
            **booking,
            "registeredEmail": registered_email,
            "partnerEmail": partner_email,
        }
    )
    client_name = str(
        booking.get("clientName")
        or booking.get("client_name")
        or ""
    ).strip()

    booked_by_name = (
        client_name
        or name_by_email.get(booked_by_email)
        or str(booking.get("bookedByName") or booking.get("booked_by_name") or "").strip()
        or str(
            booking.get("bookedBy")
            or booking.get("userName")
            or ""
        ).strip()
        or _local_part_name(booked_by_email)
    )
    booked_by_role = resolve_partner_role(booked_by_email, member_context)
    booked_by_display_name = resolve_partner_display_name(
        booked_by_email,
        member_context,
        fallback_name=booked_by_name,
    )
    if client_name:
        booked_by_display_name = client_name
    booked_by_label = (
        (
            f"Booked by ({booked_by_display_name})"
            if client_name and booked_by_display_name
            else f"Booked by ({booked_by_role}: {booked_by_display_name})"
            if booked_by_role and booked_by_display_name
            else f"Booked by ({booked_by_display_name})"
            if booked_by_display_name
            else "Booked by (User)"
        )
    )

    booking.update(
        {
            "registeredEmail": registered_email,
            "partnerEmail": partner_email,
            "registeredName": registered_name,
            "partnerName": partner_name,
            "bookedByEmail": booked_by_email,
            "bookedByName": booked_by_display_name or booked_by_name,
            "booked_by_name": booked_by_display_name or booked_by_name,
            "bookedBy": booked_by_display_name or booked_by_name,
            "bookedByRole": booked_by_role,
            "bookedByLabel": booked_by_label,
        }
    )
    return booking


# Serialize user booking into the shape returned by the API.

def serialize_user_booking(request_doc, booking_doc=None):
    request_doc = request_doc or {}
    booking_doc = booking_doc or {}

    booking_id = str(
        request_doc.get("id")
        or request_doc.get("requestId")
        or booking_doc.get("id")
        or booking_doc.get("requestId")
        or booking_doc.get("bookingRequestId")
        or booking_doc.get("_id")
        or ""
    ).strip()

    estimated_budget = to_non_negative_float(
        request_doc.get("estimatedBudget")
        or booking_doc.get("estimatedBudget")
        or booking_doc.get("amount")
        or booking_doc.get("totalAmount")
    )
    vendor_id = str(
        request_doc.get("vendorId")
        or booking_doc.get("resolvedVendorId")
        or booking_doc.get("vendorReference")
        or booking_doc.get("vendorId")
        or ""
    ).strip()
    service_id = str(
        request_doc.get("serviceId")
        or request_doc.get("service_id")
        or booking_doc.get("serviceId")
        or booking_doc.get("service_id")
        or ""
    ).strip()
    client_name = str(
        request_doc.get("clientName")
        or request_doc.get("client_name")
        or booking_doc.get("clientName")
        or booking_doc.get("client_name")
        or ""
    ).strip()
    booked_by_name = str(
        client_name
        or request_doc.get("booked_by_name")
        or request_doc.get("bookedByName")
        or booking_doc.get("booked_by_name")
        or booking_doc.get("bookedByName")
        or request_doc.get("bookedBy")
        or request_doc.get("booked_by")
        or booking_doc.get("bookedBy")
        or booking_doc.get("booked_by")
        or request_doc.get("coupleName")
        or request_doc.get("userName")
        or booking_doc.get("userName")
        or booking_doc.get("user_name")
        or ""
    ).strip()

    return {
        "id": booking_id,
        "requestId": str(request_doc.get("requestId") or booking_doc.get("requestId") or booking_id).strip(),
        "vendorId": vendor_id,
        "serviceId": service_id,
        "vendorName": str(request_doc.get("vendorName") or booking_doc.get("vendorName") or "").strip(),
        "businessName": resolve_booking_business_name(request_doc, booking_doc),
        "business_name": resolve_booking_business_name(request_doc, booking_doc),
        "service": str(resolve_booking_service_name(request_doc) or resolve_booking_service_name(booking_doc)),
        "userEmail": normalize_email(request_doc.get("userEmail") or booking_doc.get("userEmail")),
        "registeredEmail": normalize_email(
            request_doc.get("registered_email")
            or request_doc.get("registeredEmail")
            or booking_doc.get("registered_email")
            or booking_doc.get("registeredEmail")
            or request_doc.get("userEmail")
            or booking_doc.get("userEmail")
        ),
        "partnerEmail": normalize_email(
            request_doc.get("partner_email")
            or request_doc.get("partnerEmail")
            or booking_doc.get("partner_email")
            or booking_doc.get("partnerEmail")
        ),
        "bookedByEmail": normalize_email(
            request_doc.get("booked_by_email")
            or request_doc.get("bookedByEmail")
            or booking_doc.get("booked_by_email")
            or booking_doc.get("bookedByEmail")
        ),
        "bookedByName": booked_by_name,
        "booked_by_name": booked_by_name,
        "bookedBy": booked_by_name,
        "booked_by": booked_by_name,
        "location": str(request_doc.get("location") or booking_doc.get("location") or "").strip(),
        "eventDate": str(request_doc.get("eventDate") or booking_doc.get("eventDate") or "").strip(),
        "guestCount": to_non_negative_int(request_doc.get("guestCount") or booking_doc.get("guestCount")),
        "estimatedBudget": estimated_budget,
        "notes": str(request_doc.get("notes") or booking_doc.get("notes") or "").strip(),
        "status": normalize_booking_status(booking_doc.get("status") or request_doc.get("status")),
        "createdAt": str(request_doc.get("createdAt") or booking_doc.get("createdAt") or ""),
        "updatedAt": str(booking_doc.get("updatedAt") or request_doc.get("updatedAt") or request_doc.get("createdAt") or ""),
    }


# Resolve user email variants from the available documents and fallback values.

async def resolve_user_email_variants(email: str):
    normalized_email = normalize_email(email)
    variants = {normalized_email} if normalized_email else set()
    if not normalized_email:
        return variants

    user_doc = await users_collection.find_one(
        {
            "$and": [
                {"role": "user"},
                {"$or": [{"email": normalized_email}, {"partner_email": normalized_email}]},
            ]
        }
    )
    if not user_doc:
        return variants

    primary_email = normalize_email(user_doc.get("email"))
    partner_email = normalize_email(user_doc.get("partner_email"))
    if primary_email:
        variants.add(primary_email)
    if partner_email:
        variants.add(partner_email)

    return variants


# Build the profile default used by downstream queries or response shaping.

def build_profile_default(email: str, profile_type: str):
    return {
        "profileType": profile_type,
        "firstName": "",
        "lastName": "",
        "email": email,
        "phone": "",
        "accountEmail": email,
    }


# Build the profile response used by downstream queries or response shaping.

def build_profile_response(profile_doc, email: str, profile_type: str):
    if not profile_doc:
        return build_profile_default(email, profile_type)

    first_name = str(profile_doc.get("firstName") or "").strip()
    last_name = str(profile_doc.get("lastName") or "").strip()
    profile_email = normalize_email(profile_doc.get("email")) or email
    profile_phone = normalize_phone(profile_doc.get("phone"))

    return {
        "profileType": str(profile_doc.get("profileType") or "").strip().lower() or profile_type,
        "firstName": first_name,
        "lastName": last_name,
        "email": profile_email,
        "phone": profile_phone,
        "accountEmail": normalize_email(profile_doc.get("accountEmail")) or profile_email,
    }


# Build the settings default used by downstream queries or response shaping.

def build_settings_default(email: str, profile_type: str):
    return {
        "profileType": profile_type,
        "email": email,
        "emailUpdates": False,
        "budgetAlerts": False,
        "weeklyReminders": False,
    }


# Build the couple profile default used by downstream queries or response shaping.

def build_couple_profile_default(account_email: str):
    normalized_account_email = normalize_email(account_email)
    return {
        "accountEmail": normalized_account_email,
        "bride": build_profile_default(normalized_account_email, "bride"),
        "groom": build_profile_default(normalized_account_email, "groom"),
    }


# Build the partner profile doc used by downstream queries or response shaping.

def build_partner_profile_doc(account_email: str, profile_type: str, payload):
    normalized_account_email = normalize_email(account_email)
    normalized_profile_email = normalize_email(getattr(payload, "email", "")) or normalized_account_email

    return {
        "accountEmail": normalized_account_email,
        "email": normalized_profile_email,
        "profileType": profile_type,
        "firstName": str(getattr(payload, "firstName", "") or "").strip(),
        "lastName": str(getattr(payload, "lastName", "") or "").strip(),
        "phone": normalize_phone(getattr(payload, "phone", "")),
    }


# Check whether partner profile content.

def has_partner_profile_content(payload, account_email: str = ""):
    if not payload:
        return False

    normalized_account_email = normalize_email(account_email)
    normalized_profile_email = normalize_email(getattr(payload, "email", ""))
    if normalized_profile_email and normalized_profile_email != normalized_account_email:
        return True

    return any(
        str(getattr(payload, field_name, "") or "").strip()
        for field_name in ("firstName", "lastName", "phone")
    )


# Resolve couple profile context from the available documents and fallback values.

async def resolve_couple_profile_context(account_email: str = "", editor_email: str = ""):
    normalized_account_email = normalize_email(account_email)
    normalized_editor_email = normalize_email(editor_email)
    actor_email = normalized_editor_email or normalized_account_email
    lookup_email = actor_email
    couple_context = await resolve_couple_account_context(lookup_email) if lookup_email else {}
    canonical_account_email = (
        normalize_email(couple_context.get("registeredEmail"))
        or normalized_account_email
        or normalized_editor_email
    )
    partner_email = normalize_email(couple_context.get("partnerEmail"))
    primary_profile_type = get_primary_profile_type(
        couple_context.get("primaryProfileType"),
        "bride",
    )
    default_profile_emails = resolve_couple_profile_emails(
        canonical_account_email,
        partner_email,
        primary_profile_type,
    )
    single_account_mode = not partner_email

    bride_doc = await user_profiles_collection.find_one(
        {"accountEmail": canonical_account_email, "profileType": "bride"}
    ) if canonical_account_email else None
    groom_doc = await user_profiles_collection.find_one(
        {"accountEmail": canonical_account_email, "profileType": "groom"}
    ) if canonical_account_email else None

    bride_email = (
        normalize_email((bride_doc or {}).get("email"))
        or default_profile_emails["brideEmail"]
    )
    groom_email = (
        normalize_email((groom_doc or {}).get("email"))
        or default_profile_emails["groomEmail"]
    )

    editable_profile_type = ""
    if actor_email:
        if single_account_mode and canonical_account_email and actor_email == canonical_account_email:
            editable_profile_type = primary_profile_type
        elif groom_email and actor_email == groom_email:
            editable_profile_type = "groom"
        elif bride_email and actor_email == bride_email:
            editable_profile_type = "bride"
        elif partner_email and actor_email == partner_email:
            editable_profile_type = get_partner_profile_type(primary_profile_type)
        elif canonical_account_email and actor_email == canonical_account_email:
            editable_profile_type = primary_profile_type

    defaults = build_couple_profile_default(canonical_account_email)
    defaults["bride"]["email"] = default_profile_emails["brideEmail"]
    defaults["groom"]["email"] = default_profile_emails["groomEmail"]

    bride_response = (
        build_profile_response(bride_doc, canonical_account_email, "bride")
        if bride_doc
        else defaults["bride"]
    )
    groom_response = (
        build_profile_response(groom_doc, canonical_account_email, "groom")
        if groom_doc
        else defaults["groom"]
    )
    if not str(bride_response.get("email") or "").strip():
        bride_response["email"] = default_profile_emails["brideEmail"]
    if not str(groom_response.get("email") or "").strip():
        groom_response["email"] = default_profile_emails["groomEmail"]

    return {
        "accountEmail": canonical_account_email,
        "partnerEmail": partner_email,
        "primaryProfileType": primary_profile_type,
        "canEditBothProfiles": single_account_mode and bool(canonical_account_email),
        "editableProfileType": editable_profile_type,
        "brideDoc": bride_doc,
        "groomDoc": groom_doc,
        "bride": bride_response,
        "groom": groom_response,
    }


# Serialize vendor into the shape returned by the API.

def serialize_vendor(vendor):
    if not vendor:
        return None

    rating_fields = get_vendor_rating_fields(vendor)
    image_urls = resolve_image_urls(vendor)
    image_url = image_urls[0] if image_urls else ""

    return {
        "id": str(vendor.get("id") or vendor.get("_id") or ""),
        "name": resolve_public_vendor_name(vendor),
        "vendorName": resolve_public_vendor_name(vendor),
        "vendor_name": resolve_public_vendor_name(vendor),
        "businessName": resolve_public_business_name(vendor=vendor, fallback="Vendor"),
        "business_name": resolve_public_business_name(vendor=vendor, fallback="Vendor"),
        "service": vendor.get("service") or vendor.get("category") or "",
        "price": float(vendor.get("price") or 0),
        "rating": rating_fields["rating"],
        "average_rating": rating_fields["average_rating"],
        "averageRating": rating_fields["averageRating"],
        "total_reviews": rating_fields["total_reviews"],
        "totalReviews": rating_fields["totalReviews"],
        "location": vendor.get("location") or "",
        "image": image_url,
        "description": vendor.get("description") or "",
        "portfolio": image_urls,
        "reviews": vendor.get("reviews") or [],
        "contact": vendor.get("contact") or {"phone": vendor.get("phone", ""), "email": vendor.get("email", "")},
        "features": vendor.get("features") or [],
        "availability": vendor.get("availability") or "",
    }


# Resolve image URL from the available documents and fallback values.

def resolve_image_url(document):
    if not document:
        return ""

    image_urls = resolve_image_urls(document)
    if image_urls:
        return image_urls[0]

    for key in ("imageUrl", "image_url", "image", "url"):
        candidate = str(document.get(key) or "").strip()
        if candidate:
            return candidate

    return ""


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


# Build the favorite vendor identifiers used by downstream queries or response shaping.

def build_favorite_vendor_identifiers(vendor_reference: str):
    normalized_reference = str(vendor_reference or "").strip()
    if not normalized_reference:
        return []

    identifiers = [normalized_reference]
    if normalized_reference.isdigit():
        identifiers.append(int(normalized_reference))
    return identifiers


# Build the identifier variants used by downstream queries or response shaping.

def build_identifier_variants(*values):
    variants = []
    seen = set()

    for value in values:
        normalized_value = str(value or "").strip()
        if not normalized_value or normalized_value in seen:
            continue
        seen.add(normalized_value)
        variants.append(normalized_value)
        if normalized_value.isdigit():
            numeric_value = int(normalized_value)
            if numeric_value not in seen:
                seen.add(numeric_value)
                variants.append(numeric_value)

    return variants


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
        vendor_reference = str(booking.get("vendorId") or "").strip()
        if vendor_reference:
            resolved_vendor = await resolve_vendor_document(vendor_reference)

    vendor_identifiers = build_identifier_variants(
        (resolved_vendor or {}).get("id"),
        str((resolved_vendor or {}).get("_id") or "").strip(),
        booking.get("vendorId"),
    )
    if not vendor_identifiers:
        return None

    candidate_names = []
    seen_names = set()
    for value in (
        booking.get("service"),
        booking.get("serviceName"),
        booking.get("serviceType"),
        booking.get("businessName"),
        booking.get("business_name"),
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
        sort=[("createdAt", DESCENDING)],
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


# Resolve favorite service document from the available documents and fallback values.

async def resolve_favorite_service_document(favorite_doc):
    if not favorite_doc:
        return None

    service_id = str(favorite_doc.get("serviceId") or favorite_doc.get("service_id") or "").strip()
    if service_id:
        service_doc = await resolve_service_document(service_id)
        if service_doc:
            return service_doc

    vendor_id = str(favorite_doc.get("vendorId") or "").strip()
    vendor_identifiers = build_favorite_vendor_identifiers(vendor_id)
    if not vendor_identifiers:
        return None

    return await services_collection.find_one(
        {"vendorId": {"$in": vendor_identifiers}},
        sort=[("createdAt", -1)],
    )


# Serialize favorite service into the shape returned by the API.

async def serialize_favorite_service(favorite_doc, service_doc, vendor_doc):
    if not service_doc:
        return None

    service_rating_fields = get_service_rating_fields(service_doc)
    vendor_rating_fields = get_vendor_rating_fields(vendor_doc or {})
    service_images = resolve_image_urls(service_doc)
    vendor_images = resolve_image_urls(vendor_doc)
    image_url = (service_images[0] if service_images else "") or (vendor_images[0] if vendor_images else "")
    gallery_images = service_images or vendor_images or ([image_url] if image_url else [])
    location = str((vendor_doc or {}).get("location") or "").strip()
    if not location:
        location = ", ".join(
            [
                part
                for part in (
                    str((vendor_doc or {}).get("city") or "").strip(),
                    str((vendor_doc or {}).get("state") or "").strip(),
                    str((vendor_doc or {}).get("zipCode") or "").strip(),
                )
                if part
            ]
        )

    reviews = await fetch_service_rating_reviews(service_doc, limit=3)
    service_id = str(service_doc.get("id") or service_doc.get("_id") or "").strip()
    vendor_id = str(
        (vendor_doc or {}).get("id") or (vendor_doc or {}).get("_id") or service_doc.get("vendorId") or ""
    ).strip()

    return {
        "favoriteId": str(favorite_doc.get("_id") or ""),
        "savedAt": str(favorite_doc.get("createdAt") or favorite_doc.get("updatedAt") or ""),
        "isFavorite": True,
        "id": service_id,
        "serviceId": service_id,
        "vendorId": vendor_id,
        "name": resolve_public_vendor_name(vendor_doc),
        "vendorName": resolve_public_vendor_name(vendor_doc),
        "vendor_name": resolve_public_vendor_name(vendor_doc),
        "businessName": resolve_public_business_name(service_doc, vendor_doc),
        "business_name": resolve_public_business_name(service_doc, vendor_doc),
        "service": str(service_doc.get("category") or service_doc.get("name") or "").strip(),
        "serviceName": str(service_doc.get("name") or service_doc.get("category") or "").strip(),
        "price": float(service_doc.get("price") or 0),
        "rating": service_rating_fields["rating"],
        "average_rating": service_rating_fields["average_rating"],
        "averageRating": service_rating_fields["averageRating"],
        "total_reviews": service_rating_fields["total_reviews"],
        "totalReviews": service_rating_fields["totalReviews"],
        "vendorAverageRating": vendor_rating_fields["averageRating"],
        "vendor_average_rating": vendor_rating_fields["average_rating"],
        "vendorTotalReviews": vendor_rating_fields["totalReviews"],
        "vendor_total_reviews": vendor_rating_fields["total_reviews"],
        "location": location,
        "image": image_url,
        "description": str(
            service_doc.get("description")
            or (vendor_doc or {}).get("description")
            or ""
        ).strip(),
        "portfolio": gallery_images,
        "reviews": reviews,
        "contact": {
            "phone": ((vendor_doc or {}).get("contact") or {}).get("phone") or (vendor_doc or {}).get("phone") or "",
            "email": ((vendor_doc or {}).get("contact") or {}).get("email") or (vendor_doc or {}).get("email") or "",
        },
        "features": (vendor_doc or {}).get("features") or [],
        "availability": str((vendor_doc or {}).get("availability") or "Contact for availability"),
    }


# Handle the enrich user bookings with ratings workflow used by this module.

async def enrich_user_bookings_with_ratings(bookings, user_doc):
    if not bookings:
        return bookings

    user_id = str((user_doc or {}).get("id") or (user_doc or {}).get("_id") or "").strip()
    user_rating_by_service_id = {}
    if user_id:
        async for rating_doc in ratings_collection.find({"user_id": user_id}):
            service_id = str(rating_doc.get("service_id") or "").strip()
            if not service_id:
                continue
            user_rating_by_service_id[service_id] = await serialize_service_rating_record(
                rating_doc,
                current_user_id=user_id,
            )

    vendor_cache = {}
    service_cache = {}
    enriched_bookings = []
    for booking in bookings:
        vendor_reference = str(booking.get("vendorId") or "").strip()
        service_reference = str(booking.get("serviceId") or "").strip()
        vendor_doc = None
        if vendor_reference:
            vendor_doc = vendor_cache.get(vendor_reference)
            if vendor_doc is None:
                vendor_doc = await resolve_vendor_document(vendor_reference)
                vendor_cache[vendor_reference] = vendor_doc

        service_doc = None
        if service_reference:
            service_doc = service_cache.get(service_reference)
            if service_doc is None:
                service_doc = await resolve_service_document(service_reference)
                service_cache[service_reference] = service_doc
        if service_doc is None:
            fallback_service_cache_key = "|".join(
                [
                    vendor_reference,
                    str(booking.get("service") or "").strip().lower(),
                    str(booking.get("businessName") or booking.get("business_name") or "").strip().lower(),
                ]
            )
            service_doc = service_cache.get(fallback_service_cache_key)
            if service_doc is None:
                service_doc = await resolve_booking_service_document(booking, vendor_doc=vendor_doc)
                service_cache[fallback_service_cache_key] = service_doc

        resolved_vendor_id = str(
            (vendor_doc or {}).get("id") or (vendor_doc or {}).get("_id") or vendor_reference
        ).strip()
        resolved_service_id = str(
            (service_doc or {}).get("id") or (service_doc or {}).get("_id") or service_reference
        ).strip()
        service_rating_fields = get_service_rating_fields(service_doc or {})
        vendor_rating_fields = get_vendor_rating_fields(vendor_doc or {})
        user_rating = user_rating_by_service_id.get(resolved_service_id)
        vendor_name = resolve_public_vendor_name(
            vendor_doc,
            fallback=str(booking.get("vendorName") or "Vendor").strip() or "Vendor",
        )
        business_name = resolve_public_business_name(
            service_doc,
            vendor_doc,
            fallback=str(booking.get("businessName") or booking.get("service") or "Service").strip() or "Service",
        )

        enriched_bookings.append(
            {
                **booking,
                "vendorId": resolved_vendor_id or vendor_reference,
                "serviceId": resolved_service_id or service_reference,
                "vendorName": vendor_name,
                "businessName": business_name,
                "business_name": business_name,
                "serviceAverageRating": service_rating_fields["averageRating"],
                "service_average_rating": service_rating_fields["average_rating"],
                "serviceTotalReviews": service_rating_fields["totalReviews"],
                "service_total_reviews": service_rating_fields["total_reviews"],
                "vendorAverageRating": vendor_rating_fields["averageRating"],
                "vendor_average_rating": vendor_rating_fields["average_rating"],
                "vendorTotalReviews": vendor_rating_fields["totalReviews"],
                "vendor_total_reviews": vendor_rating_fields["total_reviews"],
                "canRate": bool(resolved_service_id or service_reference),
                "userRatingId": str((user_rating or {}).get("id") or ""),
                "user_rating_id": str((user_rating or {}).get("id") or ""),
                "userRating": int((user_rating or {}).get("rating") or 0),
                "userReview": str((user_rating or {}).get("review") or ""),
                "userRatingStatus": str((user_rating or {}).get("reviewStatus") or ""),
                "user_rating_status": str((user_rating or {}).get("review_status") or ""),
            }
        )

    return enriched_bookings


# Handle the service-layer logic for retrieving user profile.

async def get_user_profile_service(email: str, profile_type: str, authorization: str):
    _, _, normalized_email, error_response = await resolve_authorized_user_scope(
        authorization,
        email,
    )
    if error_response:
        return error_response

    profile_type = str(profile_type or "user").strip().lower() or "user"

    doc = await user_profiles_collection.find_one(
        {"email": normalized_email, "profileType": profile_type}
    )
    return build_profile_response(doc, normalized_email, profile_type)


# Handle the service-layer logic for updating user profile.

async def update_user_profile_service(payload, authorization: str):
    _, couple_context, _, error_response = await resolve_authorized_user_scope(
        authorization,
        getattr(payload, "email", ""),
    )
    if error_response:
        return error_response

    normalized_email = normalize_email(payload.email)
    if not normalized_email:
        return JSONResponse({"message": "Email is required."}, status_code=400)

    account_email = normalize_email(getattr(payload, "accountEmail", "")) or normalize_email(
        couple_context.get("registeredEmail")
    )
    if account_email and account_email not in {
        value for value in (couple_context.get("lookupEmails") or []) if value
    }:
        return JSONResponse({"message": "Forbidden."}, status_code=403)

    profile_type = str(payload.profileType or "user").strip().lower() or "user"
    now = utcnow_iso()

    profile_doc = {
        "accountEmail": account_email or normalized_email,
        "email": normalized_email,
        "profileType": profile_type,
        "firstName": str(payload.firstName or "").strip(),
        "lastName": str(payload.lastName or "").strip(),
        "phone": normalize_phone(payload.phone),
        "updatedAt": now,
    }

    await user_profiles_collection.update_one(
        {"email": normalized_email, "profileType": profile_type},
        {"$set": profile_doc, "$setOnInsert": {"createdAt": now}},
        upsert=True,
    )

    saved_doc = await user_profiles_collection.find_one(
        {"email": normalized_email, "profileType": profile_type}
    )

    return {
        "success": True,
        "profile": build_profile_response(saved_doc or profile_doc, normalized_email, profile_type),
    }


# Handle the service-layer logic for retrieving couple profile.

async def get_couple_profile_service(account_email: str, authorization: str):
    _, couple_context, _, error_response = await resolve_authorized_user_scope(
        authorization,
        account_email,
    )
    if error_response:
        return error_response

    normalized_account_email = normalize_email(couple_context.get("registeredEmail"))
    if not normalized_account_email:
        return JSONResponse({"message": "Unable to resolve the couple account."}, status_code=400)

    couple_profile_context = await resolve_couple_profile_context(
        normalized_account_email,
        normalize_email(couple_context.get("currentEmail")),
    )
    return {
        "accountEmail": couple_profile_context["accountEmail"],
        "canEditBothProfiles": couple_profile_context["canEditBothProfiles"],
        "editableProfileType": couple_profile_context["editableProfileType"],
        "bride": couple_profile_context["bride"],
        "groom": couple_profile_context["groom"],
    }


# Handle the service-layer logic for updating couple profile.

async def update_couple_profile_service(payload, authorization: str):
    _, couple_scope_context, _, error_response = await resolve_authorized_user_scope(
        authorization,
        getattr(payload, "editorEmail", "") or getattr(payload, "accountEmail", ""),
    )
    if error_response:
        return error_response

    normalized_account_email = normalize_email(couple_scope_context.get("registeredEmail"))
    normalized_editor_email = normalize_email(couple_scope_context.get("currentEmail"))
    if not normalized_account_email:
        return JSONResponse({"message": "Unable to resolve the couple account."}, status_code=400)

    now = utcnow_iso()
    couple_profile_context = await resolve_couple_profile_context(
        normalized_account_email,
        normalized_editor_email,
    )
    canonical_account_email = couple_profile_context["accountEmail"]
    partner_email = normalize_email(couple_profile_context.get("partnerEmail"))
    can_edit_both_profiles = bool(couple_profile_context.get("canEditBothProfiles"))
    editable_profile_type = couple_profile_context["editableProfileType"]

    if not canonical_account_email:
        return JSONResponse({"message": "Unable to resolve the couple account."}, status_code=400)
    if not can_edit_both_profiles and editable_profile_type not in {"bride", "groom"}:
        return JSONResponse({"message": "You can edit only your own profile."}, status_code=403)

    if can_edit_both_profiles and not partner_email:
        for profile_type in ("bride", "groom"):
            target_payload = getattr(payload, profile_type, None)
            existing_doc = couple_profile_context.get(f"{profile_type}Doc")
            if not existing_doc and not has_partner_profile_content(target_payload, canonical_account_email):
                continue

            updated_profile_doc = build_partner_profile_doc(
                canonical_account_email,
                profile_type,
                target_payload,
            )
            updated_profile_doc["updatedAt"] = now

            await user_profiles_collection.update_one(
                {"accountEmail": canonical_account_email, "profileType": profile_type},
                {"$set": updated_profile_doc, "$setOnInsert": {"createdAt": now}},
                upsert=True,
            )
    else:
        target_payload = getattr(payload, editable_profile_type, None)
        updated_profile_doc = build_partner_profile_doc(
            canonical_account_email,
            editable_profile_type,
            target_payload,
        )
        updated_profile_doc["updatedAt"] = now

        await user_profiles_collection.update_one(
            {"accountEmail": canonical_account_email, "profileType": editable_profile_type},
            {"$set": updated_profile_doc, "$setOnInsert": {"createdAt": now}},
            upsert=True,
        )

    saved_context = await resolve_couple_profile_context(
        canonical_account_email,
        normalized_editor_email,
    )

    return {
        "success": True,
        "profile": {
            "accountEmail": saved_context["accountEmail"],
            "canEditBothProfiles": saved_context["canEditBothProfiles"],
            "editableProfileType": saved_context["editableProfileType"],
            "bride": saved_context["bride"],
            "groom": saved_context["groom"],
        },
    }


# Handle the service-layer logic for retrieving user settings.

async def get_user_settings_service(email: str, profile_type: str, authorization: str):
    _, _, normalized_email, error_response = await resolve_authorized_user_scope(
        authorization,
        email,
    )
    if error_response:
        return error_response

    profile_type = str(profile_type or "user").strip().lower() or "user"

    doc = await user_settings_collection.find_one(
        {"email": normalized_email, "profileType": profile_type}
    )
    if not doc:
        return build_settings_default(normalized_email, profile_type)

    return {
        "profileType": doc.get("profileType") or profile_type,
        "email": doc.get("email") or normalized_email,
        "emailUpdates": bool(doc.get("emailUpdates")),
        "budgetAlerts": bool(doc.get("budgetAlerts")),
        "weeklyReminders": bool(doc.get("weeklyReminders")),
    }


# Handle the service-layer logic for updating user settings.

async def update_user_settings_service(payload, authorization: str):
    _, _, normalized_email, error_response = await resolve_authorized_user_scope(
        authorization,
        getattr(payload, "email", ""),
    )
    if error_response:
        return error_response

    if not normalized_email:
        return JSONResponse({"message": "Email is required."}, status_code=400)

    profile_type = str(payload.profileType or "user").strip().lower() or "user"
    now = utcnow_iso()

    settings_doc = {
        "email": normalized_email,
        "profileType": profile_type,
        "emailUpdates": bool(payload.emailUpdates),
        "budgetAlerts": bool(payload.budgetAlerts),
        "weeklyReminders": bool(payload.weeklyReminders),
        "updatedAt": now,
    }

    await user_settings_collection.update_one(
        {"email": normalized_email, "profileType": profile_type},
        {"$set": settings_doc, "$setOnInsert": {"createdAt": now}},
        upsert=True,
    )

    return {"success": True}


# Ensure the required favorite indexes exist before these queries run.

async def ensure_favorite_indexes():
    await favorites_collection.create_index(
        [("userEmail", ASCENDING), ("serviceId", ASCENDING)],
        unique=True,
        name="favorites_user_service_unique",
    )
    await favorites_collection.create_index(
        [("userEmail", ASCENDING), ("createdAt", DESCENDING)],
        name="favorites_user_created_at",
    )


# Handle the service-layer logic for retrieving favorites.

async def get_favorites_service(user_email: str, authorization: str):
    _, _, normalized_email, error_response = await resolve_authorized_user_scope(
        authorization,
        user_email,
    )
    if error_response:
        return error_response

    if not normalized_email:
        return JSONResponse({"message": "Email is required."}, status_code=400)

    favorites = []
    async for favorite_doc in favorites_collection.find(
        {"userEmail": normalized_email},
        sort=[("createdAt", -1), ("_id", -1)],
    ):
        service_doc = await resolve_favorite_service_document(favorite_doc)
        if not service_doc:
            continue

        vendor_reference = str(
            service_doc.get("vendorId") or favorite_doc.get("vendorId") or ""
        ).strip()
        vendor_doc = await resolve_vendor_document(vendor_reference) if vendor_reference else None
        serialized = await serialize_favorite_service(favorite_doc, service_doc, vendor_doc)
        if serialized:
            favorites.append(serialized)

    return {"favorites": favorites}


# Add favorite service to the stored records.

async def add_favorite_service(payload, authorization: str):
    _, _, normalized_email, error_response = await resolve_authorized_user_scope(
        authorization,
        getattr(payload, "userEmail", ""),
    )
    if error_response:
        return error_response

    service_id = str(payload.serviceId or "").strip()
    if not normalized_email or not service_id:
        return JSONResponse({"message": "Email and serviceId are required."}, status_code=400)

    service_doc = await resolve_service_document(service_id)
    if not service_doc:
        return JSONResponse({"message": "Service not found."}, status_code=404)

    vendor_id = str(
        payload.vendorId or service_doc.get("vendorId") or ""
    ).strip()
    vendor_doc = await resolve_vendor_document(vendor_id) if vendor_id else None
    if vendor_doc and not vendor_id:
        vendor_id = str(vendor_doc.get("id") or vendor_doc.get("_id") or "").strip()

    now = utcnow_iso()
    await favorites_collection.update_one(
        {"userEmail": normalized_email, "serviceId": service_id},
        {
            "$set": {
                "userEmail": normalized_email,
                "serviceId": service_id,
                "vendorId": vendor_id,
                "updatedAt": now,
            },
            "$setOnInsert": {
                "createdAt": now,
            },
        },
        upsert=True,
    )

    saved_favorite = await favorites_collection.find_one(
        {"userEmail": normalized_email, "serviceId": service_id}
    )
    serialized_favorite = await serialize_favorite_service(
        saved_favorite or {},
        service_doc,
        vendor_doc,
    )

    return {
        "success": True,
        "message": "Service added to favorites.",
        "favorite": serialized_favorite,
    }


# Handle the service-layer logic for retrieving user bookings.

async def get_user_bookings_service(user_email: str, authorization: str):
    _, couple_context, normalized_email, error_response = await resolve_authorized_user_scope(
        authorization,
        user_email,
    )
    if error_response:
        return error_response

    if not normalized_email:
        return JSONResponse({"message": "userEmail is required."}, status_code=400)

    current_email = normalize_email(couple_context.get("currentEmail")) or normalized_email
    lookup_emails = [
        value for value in (couple_context.get("lookupEmails") or []) if value
    ] or [current_email]
    user_doc = couple_context.get("userDoc") or {}

    response_bookings = []
    response_booking_ids = set()
    async for booking_doc in bookings_collection.find(
        {
            "$or": [
                {"bookedByEmail": {"$in": lookup_emails}},
                {"booked_by_email": {"$in": lookup_emails}},
                {"registeredEmail": {"$in": lookup_emails}},
                {"registered_email": {"$in": lookup_emails}},
                {"partnerEmail": {"$in": lookup_emails}},
                {"partner_email": {"$in": lookup_emails}},
                {"userEmail": {"$in": lookup_emails}},
                {"clientEmail": {"$in": lookup_emails}},
                {"email": {"$in": lookup_emails}},
                {
                    "$and": [
                        {
                            "$or": [
                                {"bookedByEmail": {"$exists": False}},
                                {"bookedByEmail": ""},
                                {"bookedByEmail": None},
                            ]
                        },
                        {
                            "$or": [
                                {"booked_by_email": {"$exists": False}},
                                {"booked_by_email": ""},
                                {"booked_by_email": None},
                            ]
                        },
                        {
                            "$or": [
                                {"clientEmail": {"$in": lookup_emails}},
                                {"email": {"$in": lookup_emails}},
                            ]
                        },
                    ]
                },
            ]
        },
        sort=[("updatedAt", -1), ("createdAt", -1)],
    ):
        serialized = serialize_user_booking({}, booking_doc)
        booking_id = str(serialized.get("id") or "").strip()
        if booking_id and booking_id in response_booking_ids:
            continue
        response_bookings.append(serialized)
        if booking_id:
            response_booking_ids.add(booking_id)

    enriched_bookings = await enrich_user_bookings_with_ratings(response_bookings, user_doc)
    name_context = await build_couple_booking_name_context(
        user_doc,
        bookings=enriched_bookings,
        fallback_email=current_email,
    )
    member_context = await build_couple_member_context(
        user_doc,
        fallback_email=couple_context.get("registeredEmail") or current_email,
    )
    return {
        "bookings": [
            enrich_booking_attribution(booking, name_context, member_context)
            for booking in enriched_bookings
        ]
    }


# Handle the service-layer logic for updating user booking notes.

async def update_user_booking_notes_service(booking_id: str, payload, authorization: str):
    _, couple_context, normalized_email, error_response = await resolve_authorized_user_scope(
        authorization,
        getattr(payload, "userEmail", ""),
    )
    if error_response:
        return error_response

    if not normalized_email:
        return JSONResponse({"message": "userEmail is required."}, status_code=400)

    lookup_emails = [
        value
        for value in (couple_context.get("lookupEmails") or [])
        if value
    ] or [normalized_email]

    normalized_booking_id = str(booking_id or "").strip()
    if not normalized_booking_id:
        return JSONResponse({"message": "bookingId is required."}, status_code=400)

    booking_identifier_match = build_booking_identifier_match(normalized_booking_id)
    email_match = build_authorized_booking_email_match(lookup_emails)
    scoped_booking_query = {
        "$and": [
            {"$or": email_match},
            {"$or": booking_identifier_match},
        ]
    }

    now = utcnow_iso()
    notes = str(payload.notes or "").strip()
    matching_request_docs = []
    async for request_doc in couple_booking_requests_collection.find(scoped_booking_query):
        matching_request_docs.append(request_doc)

    request_update_result = await couple_booking_requests_collection.update_many(
        scoped_booking_query,
        {"$set": {"notes": notes, "updatedAt": now}},
    )

    booking_update_result = await bookings_collection.update_many(
        scoped_booking_query,
        {"$set": {"notes": notes, "updatedAt": now}},
    )
    mirror_booking_query = build_mirrored_booking_reference_query(matching_request_docs)
    if mirror_booking_query:
        await bookings_collection.update_many(
            mirror_booking_query,
            {"$set": {"notes": notes, "updatedAt": now}},
        )

    if request_update_result.matched_count == 0 and booking_update_result.matched_count == 0:
        return JSONResponse({"message": "Booking request not found."}, status_code=404)

    return {"success": True, "updatedAt": now}


# Handle the service-layer logic for updating user booking request details.

async def update_user_booking_service(booking_id: str, payload, authorization: str):
    _, couple_context, normalized_email, error_response = await resolve_authorized_user_scope(
        authorization,
        getattr(payload, "userEmail", ""),
    )
    if error_response:
        return error_response

    if not normalized_email:
        return JSONResponse({"message": "userEmail is required."}, status_code=400)

    lookup_emails = [
        value
        for value in (couple_context.get("lookupEmails") or [])
        if value
    ] or [normalized_email]

    normalized_booking_id = str(booking_id or "").strip()
    if not normalized_booking_id:
        return JSONResponse({"message": "bookingId is required."}, status_code=400)

    booking_identifier_match = build_booking_identifier_match(normalized_booking_id)
    email_match = build_authorized_booking_email_match(lookup_emails)
    scoped_booking_query = {
        "$and": [
            {"$or": email_match},
            {"$or": booking_identifier_match},
        ]
    }

    event_date = str(payload.eventDate or "").strip()
    if not event_date:
        return JSONResponse({"message": "eventDate is required."}, status_code=400)

    now = utcnow_iso()
    updates = {
        "eventDate": event_date,
        "location": str(payload.location or "").strip(),
        "guestCount": to_non_negative_int(payload.guestCount),
        "estimatedBudget": to_non_negative_float(payload.estimatedBudget),
        "budget": to_non_negative_float(payload.estimatedBudget),
        "notes": str(payload.notes or "").strip(),
        "updatedAt": now,
    }

    matching_request_docs = []
    async for request_doc in couple_booking_requests_collection.find(scoped_booking_query):
        matching_request_docs.append(request_doc)

    request_update_result = await couple_booking_requests_collection.update_many(
        scoped_booking_query,
        {"$set": updates},
    )

    booking_update_result = await bookings_collection.update_many(
        scoped_booking_query,
        {"$set": updates},
    )
    mirror_booking_query = build_mirrored_booking_reference_query(matching_request_docs)
    if mirror_booking_query:
        await bookings_collection.update_many(
            mirror_booking_query,
            {"$set": updates},
        )

    if request_update_result.matched_count == 0 and booking_update_result.matched_count == 0:
        return JSONResponse({"message": "Booking request not found."}, status_code=404)

    return {
        "success": True,
        "updatedAt": now,
        "booking": updates,
    }


# Handle the service-layer logic for creating couple vendor booking.

async def create_couple_vendor_booking_service(payload, authorization: str):
    _, _, normalized_email, error_response = await resolve_authorized_user_scope(
        authorization,
        getattr(payload, "userEmail", ""),
    )
    if error_response:
        return error_response

    vendor_id = str(payload.vendorId or "").strip()
    service_id = str(getattr(payload, "serviceId", "") or "").strip()
    if not normalized_email or not vendor_id:
        return JSONResponse({"message": "userEmail and vendorId are required."}, status_code=400)

    event_date = str(payload.eventDate or "").strip()
    if not event_date:
        return JSONResponse({"message": "eventDate is required."}, status_code=400)

    guest_count = to_non_negative_int(payload.guestCount)
    estimated_budget = to_non_negative_float(payload.estimatedBudget)

    vendor_doc = None
    if vendor_id.isdigit():
        vendor_doc = await vendors_collection.find_one({"id": int(vendor_id)})
    if not vendor_doc:
        vendor_doc = await vendors_collection.find_one({"id": vendor_id})
    if not vendor_doc:
        try:
            vendor_doc = await vendors_collection.find_one({"_id": ObjectId(vendor_id)})
        except Exception:
            vendor_doc = None

    service_doc = None
    if service_id:
        if service_id.isdigit():
            service_doc = await db["services"].find_one({"id": int(service_id)})
        if not service_doc:
            service_doc = await db["services"].find_one({"id": service_id})
        if not service_doc:
            try:
                service_doc = await db["services"].find_one({"_id": ObjectId(service_id)})
            except Exception:
                service_doc = None

    vendor_name = str(
        payload.vendorName or resolve_public_vendor_name(vendor_doc, fallback="")
    ).strip()
    business_name = str(
        getattr(payload, "businessName", "")
        or resolve_public_business_name(service_doc, vendor_doc, fallback="")
        or payload.service
    ).strip()
    service = str(
        payload.service
        or ((service_doc.get("name") or service_doc.get("category")) if service_doc else "")
        or ((vendor_doc.get("service") or vendor_doc.get("category")) if vendor_doc else "")
    ).strip()
    service_price = to_non_negative_float((service_doc or {}).get("price"))
    location = str(
        payload.location or (vendor_doc.get("location") if vendor_doc else "")
    ).strip()
    notes = str(payload.notes or "").strip()
    couple_name = str(payload.coupleName or "").strip()
    phone = normalize_phone(payload.phone)
    vendor_email = normalize_email((vendor_doc or {}).get("email"))
    resolved_vendor_id = str(
        (vendor_doc or {}).get("id") or (vendor_doc or {}).get("_id") or vendor_id
    ).strip()
    couple_context = await resolve_couple_account_context(normalized_email, fallback_name=couple_name)
    account_email = normalize_email(couple_context.get("registeredEmail")) or normalized_email
    sender_email = normalize_email(couple_context.get("currentEmail")) or normalized_email
    stored_partner_email = normalize_email(couple_context.get("partnerEmail"))
    partner_display_email = str(
        couple_context.get("displayPartnerEmail")
        or stored_partner_email
        or account_email
    ).strip()
    user_id = str(couple_context.get("userId") or "").strip()
    user_name = (
        couple_name
        or str(couple_context.get("userName") or "").strip()
        or account_email.split("@")[0]
    )
    booked_by_name = couple_name or await resolve_user_name_by_email(
        sender_email,
        fallback_name=user_name,
    )

    duplicate_lookup_query = build_service_duplicate_lookup_query(
        service_id,
        couple_context.get("lookupEmails") or [normalized_email],
    )
    if duplicate_lookup_query:
        existing_inquiry = await db["vendor_inquiries"].find_one(duplicate_lookup_query)
        existing_booking = await bookings_collection.find_one(duplicate_lookup_query)
        if existing_inquiry or existing_booking:
            matched_record = existing_inquiry or existing_booking or {}
            matched_partner_email = normalize_email(
                matched_record.get("partner_email") or matched_record.get("partnerEmail")
            ) or partner_display_email
            return JSONResponse(
                {
                    "success": False,
                    "message": f"This service is already booked by your partner ({matched_partner_email})",
                    "partner_email": matched_partner_email,
                },
                status_code=409,
            )

    now = utcnow_iso()
    request_id = f"BR-{str(ObjectId())[-6:].upper()}"
    submitted_status = "pending"

    booking_doc = {
        "id": request_id,
        "requestId": request_id,
        "bookingRequestId": request_id,
        "userEmail": account_email,
        "registered_email": account_email,
        "registeredEmail": account_email,
        "partner_email": stored_partner_email,
        "partnerEmail": stored_partner_email,
        "booked_by_email": sender_email,
        "bookedByEmail": sender_email,
        "booked_by_name": booked_by_name,
        "bookedByName": booked_by_name,
        "userId": user_id,
        "vendorId": vendor_id,
        "serviceId": service_id,
        "vendorEmail": vendor_email,
        "vendorName": vendor_name,
        "businessName": business_name or service,
        "business_name": business_name or service,
        "service": service,
        "location": location,
        "eventDate": event_date,
        "guestCount": guest_count,
        "estimatedBudget": estimated_budget,
        "servicePrice": service_price,
        "service_price": service_price,
        "notes": notes,
        "status": submitted_status,
        "coupleName": couple_name,
        "phone": phone,
        "createdAt": now,
        "updatedAt": now,
    }

    await couple_booking_requests_collection.insert_one(booking_doc)

    synced_booking_doc = {
        "id": request_id,
        "requestId": request_id,
        "bookingRequestId": request_id,
        "userId": user_id,
        "userEmail": account_email,
        "registered_email": account_email,
        "registeredEmail": account_email,
        "partner_email": stored_partner_email,
        "partnerEmail": stored_partner_email,
        "booked_by_email": sender_email,
        "bookedByEmail": sender_email,
        "booked_by_name": booked_by_name,
        "bookedByName": booked_by_name,
        "userName": user_name,
        "clientName": user_name,
        "clientEmail": account_email,
        "vendorId": vendor_id,
        "serviceId": service_id,
        "service_id": service_id,
        "vendorReference": vendor_id,
        "resolvedVendorId": resolved_vendor_id,
        "vendorEmail": vendor_email,
        "vendorName": vendor_name,
        "businessName": business_name or service,
        "business_name": business_name or service,
        "service": service,
        "serviceName": service or "Booking Request",
        "serviceType": service,
        "location": location,
        "eventDate": event_date,
        "eventTime": "",
        "guestCount": guest_count,
        "estimatedBudget": estimated_budget,
        "servicePrice": service_price,
        "service_price": service_price,
        "price": service_price,
        "amount": service_price,
        "totalAmount": service_price,
        "notes": notes,
        "status": submitted_status,
        "source": "user_booking_request",
        "createdAt": now,
        "updatedAt": now,
    }
    await bookings_collection.insert_one(synced_booking_doc)

    return {
        "success": True,
        "message": "Booking request submitted.",
        "booking": {
            "id": request_id,
            "vendorName": vendor_name,
            "businessName": business_name or service,
            "business_name": business_name or service,
            "service": service,
            "location": location,
            "eventDate": event_date,
            "guestCount": guest_count,
            "estimatedBudget": estimated_budget,
            "servicePrice": service_price,
            "service_price": service_price,
            "notes": notes,
            "status": submitted_status,
            "booked_by_email": sender_email,
            "booked_by_name": booked_by_name,
            "bookedByEmail": sender_email,
            "bookedByName": booked_by_name,
            "updatedAt": now,
        },
    }


# Handle the service-layer logic for removing favorite.

async def remove_favorite_service(user_email: str, service_id: str, authorization: str):
    _, _, normalized_email, error_response = await resolve_authorized_user_scope(
        authorization,
        user_email,
    )
    if error_response:
        return error_response

    normalized_service_id = str(service_id or "").strip()
    if not normalized_email or not normalized_service_id:
        return JSONResponse({"message": "Email and serviceId are required."}, status_code=400)

    result = await favorites_collection.delete_one(
        {"userEmail": normalized_email, "serviceId": normalized_service_id}
    )
    if result.deleted_count == 0:
        return JSONResponse({"message": "Favorite not found."}, status_code=404)

    return {"success": True, "serviceId": normalized_service_id}


# Expose the get user profile service through the controller layer.

async def get_user_profile(email: str, profile_type: str, authorization: str):
    return await get_user_profile_service(email, profile_type, authorization)


# Expose the update user profile service through the controller layer.

async def update_user_profile(payload, authorization: str):
    return await update_user_profile_service(payload, authorization)


# Expose the get couple profile service through the controller layer.

async def get_couple_profile(account_email: str, authorization: str):
    return await get_couple_profile_service(account_email, authorization)


# Expose the update couple profile service through the controller layer.

async def update_couple_profile(payload, authorization: str):
    return await update_couple_profile_service(payload, authorization)


# Expose the get user settings service through the controller layer.

async def get_user_settings(email: str, profile_type: str, authorization: str):
    return await get_user_settings_service(email, profile_type, authorization)


# Expose the update user settings service through the controller layer.

async def update_user_settings(payload, authorization: str):
    return await update_user_settings_service(payload, authorization)


# Expose the get favorites service through the controller layer.

async def get_favorites(user_email: str, authorization: str):
    return await get_favorites_service(user_email, authorization)


# Expose the add favorite service through the controller layer.

async def add_favorite(payload, authorization: str):
    return await add_favorite_service(payload, authorization)


# Expose the get user bookings service through the controller layer.

async def get_user_bookings(user_email: str, authorization: str):
    return await get_user_bookings_service(user_email, authorization)


# Expose the update user booking service through the controller layer.

async def update_user_booking(booking_id: str, payload, authorization: str):
    return await update_user_booking_service(booking_id, payload, authorization)


# Expose the update user booking notes service through the controller layer.

async def update_user_booking_notes(booking_id: str, payload, authorization: str):
    return await update_user_booking_notes_service(booking_id, payload, authorization)


# Expose the create couple vendor booking service through the controller layer.

async def create_couple_vendor_booking(payload, authorization: str):
    return await create_couple_vendor_booking_service(payload, authorization)


# Expose the remove favorite service through the controller layer.

async def remove_favorite(user_email: str, service_id: str, authorization: str):
    return await remove_favorite_service(user_email, service_id, authorization)
