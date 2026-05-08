from datetime import datetime, timezone

from fastapi.responses import JSONResponse

from dbconnect import db
from JWT import decode_token

# Reuse shared MongoDB collection handles throughout this module.

users_collection = db["users"]

# Keep module-level constants together so related rules stay easy to maintain.

VALID_ROLES = {"user", "vendor", "admin"}
VALID_PROFILE_TYPES = {"bride", "groom"}
USER_STATUSES = {"active", "inactive", "pending", "rejected"}
APPROVAL_REQUIRED_ROLES = {"vendor"}
APPROVAL_STATUSES = {"pending", "approved", "rejected"}


# Expose the utcnow ISO service through the controller layer.

def utcnow_iso():
    return (
        datetime.now(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


# Expose the normalize email service through the controller layer.

def normalize_email(email):
    return str(email or "").strip().lower()


# Normalize role values before comparisons, storage, or responses.

def normalize_role(role):
    normalized_role = str(role or "user").strip().lower() or "user"
    return normalized_role


# Normalize profile type values before comparisons, storage, or responses.

def normalize_profile_type(profile_type, default=""):
    normalized_profile_type = str(profile_type or "").strip().lower()
    if normalized_profile_type in VALID_PROFILE_TYPES:
        return normalized_profile_type

    normalized_default = str(default or "").strip().lower()
    if normalized_default in VALID_PROFILE_TYPES:
        return normalized_default

    return ""


# Return primary profile type for the calling workflow.

def get_primary_profile_type(user_or_profile_type, default="bride"):
    if isinstance(user_or_profile_type, dict):
        stored_value = user_or_profile_type.get("primaryProfileType") or user_or_profile_type.get("registeringAs")
    else:
        stored_value = user_or_profile_type

    return normalize_profile_type(stored_value, default)


# Return partner profile type for the calling workflow.

def get_partner_profile_type(primary_profile_type):
    normalized_primary_profile_type = get_primary_profile_type(primary_profile_type, "bride")
    return "groom" if normalized_primary_profile_type == "bride" else "bride"


# Resolve couple profile emails from the available documents and fallback values.

def resolve_couple_profile_emails(account_email, partner_email="", primary_profile_type="bride"):
    normalized_account_email = normalize_email(account_email)
    normalized_partner_email = normalize_email(partner_email)
    normalized_primary_profile_type = get_primary_profile_type(primary_profile_type, "bride")

    if normalized_primary_profile_type == "groom":
        return {
            "brideEmail": normalized_partner_email,
            "groomEmail": normalized_account_email,
        }

    return {
        "brideEmail": normalized_account_email,
        "groomEmail": normalized_partner_email,
    }


# Expose the normalize phone service through the controller layer.

def normalize_phone(phone):
    return "".join(ch for ch in str(phone or "") if ch.isdigit())


# Normalize status values before comparisons, storage, or responses.

def normalize_status(status):
    normalized = str(status or "").strip().lower()
    return normalized if normalized in USER_STATUSES else "active"


# Return default approval status for the calling workflow.

def get_default_approval_status(role):
    if normalize_role(role) in APPROVAL_REQUIRED_ROLES:
        return "pending"
    return "approved"


# Normalize approval status values before comparisons, storage, or responses.

def normalize_approval_status(status, role):
    normalized_role = normalize_role(role)
    if normalized_role not in APPROVAL_REQUIRED_ROLES:
        return "approved"

    normalized_status = str(status or "").strip().lower()
    return normalized_status if normalized_status in APPROVAL_STATUSES else "pending"


# Return user status for the calling workflow.

def get_user_status(user):
    status = str(user.get("status") or "").strip().lower()
    if status in USER_STATUSES:
        return status
    if user.get("isActive") is False:
        return "inactive"
    approval = normalize_approval_status(user.get("approvalStatus"), user.get("role"))
    if approval == "pending":
        return "pending"
    if approval == "rejected":
        return "rejected"
    return "active"


# Serialize user into the shape returned by the API.

def serialize_user(user, include_password=False):
    if not user:
        return None

    partner_email = normalize_email(
        user.get("partner_email") or user.get("partnerEmail")
    )

    serialized = {
        "id": str(user.get("id") or user.get("_id") or ""),
        "name": str(user.get("name") or "User"),
        "email": normalize_email(user.get("email")),
        "partner_email": partner_email,
        "role": normalize_role(user.get("role")),
        "primaryProfileType": (
            get_primary_profile_type(user, "bride")
            if normalize_role(user.get("role")) == "user"
            else ""
        ),
        "phone": normalize_phone(user.get("phone")),
        "status": get_user_status(user),
        "approvalStatus": normalize_approval_status(user.get("approvalStatus"), user.get("role")),
        "isActive": bool(user.get("isActive", True)),
        "createdAt": str(user.get("createdAt") or ""),
        "updatedAt": str(user.get("updatedAt") or ""),
    }

    if include_password:
        serialized["password"] = user.get("password")

    return serialized


# Build the user email query used by downstream queries or response shaping.

def build_user_email_query(email, role=""):
    normalized_email = normalize_email(email)
    normalized_role = normalize_role(role) if str(role or "").strip() else ""

    if not normalized_email:
        return None

    query = {"$or": [{"email": normalized_email}, {"partner_email": normalized_email}]}
    if normalized_role:
        query["role"] = normalized_role

    return query


# Find user document using the normalized lookup values.

async def find_user_document(email, role=""):
    query = build_user_email_query(email, role)
    if not query:
        return None

    return await users_collection.find_one(query)


# Expose the extract bearer token service through the controller layer.

def extract_bearer_token(authorization: str):
    return str(authorization or "").replace("Bearer", "").strip()


# Handle the authenticate request workflow used by this module.

async def authenticate_request(authorization: str, expected_role: str = ""):
    token = extract_bearer_token(authorization)
    if not token:
        return None, None, JSONResponse({"message": "Missing token."}, status_code=401)

    payload = decode_token(token)
    if not payload:
        return None, None, JSONResponse({"message": "Invalid token."}, status_code=401)

    token_role = normalize_role(payload.get("role"))
    normalized_expected_role = normalize_role(expected_role) if str(expected_role or "").strip() else ""
    if normalized_expected_role and token_role != normalized_expected_role:
        return None, None, JSONResponse({"message": "Forbidden."}, status_code=403)

    user = await find_user_document(payload.get("email"), token_role)
    if not user:
        return None, None, JSONResponse({"message": "User not found."}, status_code=404)

    user_status = get_user_status(user)
    if user_status != "active":
        return (
            None,
            None,
            JSONResponse({"message": "Your account is not active."}, status_code=403),
        )

    return user, payload, None


# Collect unique normalized emails values for downstream processing.

def unique_normalized_emails(*values):
    unique_values = []
    seen = set()

    for value in values:
        normalized_value = normalize_email(value)
        if not normalized_value or normalized_value in seen:
            continue
        seen.add(normalized_value)
        unique_values.append(normalized_value)

    return unique_values


# Return user names by emails for the calling workflow.

async def get_user_names_by_emails(*values):
    lookup_emails = unique_normalized_emails(*values)
    if not lookup_emails:
        return {}

    names_by_email = {}
    async for user_doc in users_collection.find(
        {
            "role": "user",
            "$or": [
                {"email": {"$in": lookup_emails}},
                {"partner_email": {"$in": lookup_emails}},
                {"partnerEmail": {"$in": lookup_emails}},
            ],
        }
    ):
        name = str(user_doc.get("name") or "").strip()
        if not name:
            continue

        for email in (
            normalize_email(user_doc.get("email")),
            normalize_email(user_doc.get("partner_email") or user_doc.get("partnerEmail")),
        ):
            if email and email in lookup_emails and email not in names_by_email:
                names_by_email[email] = name

    return names_by_email


# Resolve user name by email from the available documents and fallback values.

async def resolve_user_name_by_email(email, fallback_name=""):
    normalized_email = normalize_email(email)
    if not normalized_email:
        return str(fallback_name or "").strip()

    names_by_email = await get_user_names_by_emails(normalized_email)
    return str(
        names_by_email.get(normalized_email) or fallback_name or ""
    ).strip()


# Resolve couple account context from the available documents and fallback values.

async def resolve_couple_account_context(email, fallback_name=""):
    current_email = normalize_email(email)
    user_doc = await find_user_document(current_email, "user") if current_email else None

    registered_email = normalize_email((user_doc or {}).get("email")) or current_email
    stored_partner_email = normalize_email((user_doc or {}).get("partner_email"))
    primary_profile_type = get_primary_profile_type(user_doc, "bride")
    user_id = str((user_doc or {}).get("id") or (user_doc or {}).get("_id") or "").strip()
    user_name = str((user_doc or {}).get("name") or fallback_name or "").strip()

    partner_display_email = stored_partner_email or registered_email or current_email
    if current_email and stored_partner_email and current_email == stored_partner_email:
        partner_display_email = registered_email or stored_partner_email or current_email

    return {
        "userDoc": user_doc,
        "currentEmail": current_email,
        "registeredEmail": registered_email,
        "partnerEmail": stored_partner_email,
        "primaryProfileType": primary_profile_type,
        "displayPartnerEmail": partner_display_email,
        "lookupEmails": unique_normalized_emails(
            current_email,
            registered_email,
            stored_partner_email,
        ),
        "userId": user_id,
        "userName": user_name,
    }


# Build the service duplicate lookup query used by downstream queries or response shaping.

def build_service_duplicate_lookup_query(service_id, emails):
    normalized_service_id = str(service_id or "").strip()
    lookup_emails = unique_normalized_emails(*emails)
    if not normalized_service_id or not lookup_emails:
        return {}

    return {
        "$and": [
            {"$or": [{"serviceId": normalized_service_id}, {"service_id": normalized_service_id}]},
            {
                "$or": [
                    {"registered_email": {"$in": lookup_emails}},
                    {"registeredEmail": {"$in": lookup_emails}},
                    {"partner_email": {"$in": lookup_emails}},
                    {"partnerEmail": {"$in": lookup_emails}},
                    {"userEmail": {"$in": lookup_emails}},
                    {"clientEmail": {"$in": lookup_emails}},
                    {"email": {"$in": lookup_emails}},
                ]
            },
        ]
    }
