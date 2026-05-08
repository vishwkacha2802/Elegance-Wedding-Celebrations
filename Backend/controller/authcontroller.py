import asyncio
import os
import random
import re
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

from fastapi.responses import JSONResponse

from bcryptEx import hash_password, verify_password
from controller.account_utils import (
    APPROVAL_REQUIRED_ROLES,
    VALID_ROLES,
    build_user_email_query,
    find_user_document,
    get_default_approval_status,
    get_primary_profile_type,
    normalize_email,
    normalize_phone,
    resolve_couple_profile_emails,
    normalize_role,
    serialize_user,
    utcnow_iso,
    users_collection,
)
from dbconnect import db
from JWT import create_token, decode_token

# Reuse shared MongoDB collection handles throughout this module.

password_reset_collection = db["password_reset_sessions"]
vendors_collection = db["vendors"]
user_profiles_collection = db["user_profiles"]

# Keep module-level constants together so related rules stay easy to maintain.

OTP_EXPIRY_MINUTES = 10
ADMIN_SECRET_KEY = str(os.getenv("ADMIN_SECRET_KEY", "")).strip()


# Expose the is valid email service through the controller layer.

def is_valid_email(email):
    return bool(re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", str(email or "").strip()))


# Return the validation message used when a password does not meet the minimum rules.

def password_error(password: str):
    value = str(password or "")
    if len(value) < 8:
        return "Password must be at least 8 characters."
    if not re.search(r"[A-Z]", value):
        return "Password must include at least one uppercase letter."
    if not re.search(r"[a-z]", value):
        return "Password must include at least one lowercase letter."
    if not re.search(r"\d", value):
        return "Password must include at least one number."
    if not re.search(r"[^A-Za-z0-9]", value):
        return "Password must include at least one special character."
    return ""


# Expose the generate OTP service through the controller layer.

def generate_otp():
    return str(random.randint(100000, 999999))


# Convert datetime values into the UTC ISO string format used by the API.

def to_iso(dt):
    if not dt:
        return ""
    return dt.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace(
        "+00:00", "Z"
    )


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


# Normalize stored password hashes into bytes before bcrypt checks.

def get_password_bytes(password_hash):
    if isinstance(password_hash, bytes):
        return password_hash
    if isinstance(password_hash, bytearray):
        return bytes(password_hash)
    if hasattr(password_hash, "__bytes__"):
        return bytes(password_hash)
    return password_hash


# Combine profile name fields into a single display name.

def profile_full_name(profile):
    if not profile:
        return ""

    first_name = str(profile.get("firstName") or "").strip()
    last_name = str(profile.get("lastName") or "").strip()
    return " ".join(part for part in (first_name, last_name) if part).strip()


# Build a readable fallback name from the local part of an email address.

def local_part_name(email: str):
    local_part = str(email or "").split("@", 1)[0].replace(".", " ").replace("_", " ").strip()
    return " ".join(part.capitalize() for part in local_part.split()) if local_part else ""


# Build the login response payload, including couple-profile display names when needed.

async def serialize_login_user(user_doc, login_email: str):
    serialized = serialize_user(user_doc) or {}
    normalized_login_email = normalize_email(login_email)

    if not serialized or str(serialized.get("role") or "").strip().lower() != "user":
        if normalized_login_email:
            serialized["email"] = normalized_login_email
        return serialized

    account_email = normalize_email(user_doc.get("email"))
    partner_email = normalize_email(
        user_doc.get("partner_email") or user_doc.get("partnerEmail")
    )
    primary_profile_type = get_primary_profile_type(user_doc, "bride")
    default_profile_emails = resolve_couple_profile_emails(
        account_email,
        partner_email,
        primary_profile_type,
    )

    bride_profile = await user_profiles_collection.find_one(
        {"accountEmail": account_email, "profileType": "bride"}
    ) if account_email else None
    groom_profile = await user_profiles_collection.find_one(
        {"accountEmail": account_email, "profileType": "groom"}
    ) if account_email else None

    bride_email = (
        normalize_email((bride_profile or {}).get("email"))
        or default_profile_emails["brideEmail"]
    )
    groom_email = (
        normalize_email((groom_profile or {}).get("email"))
        or default_profile_emails["groomEmail"]
    )
    primary_account_name = str(user_doc.get("name") or "").strip()
    bride_fallback_name = (
        primary_account_name if primary_profile_type == "bride" else local_part_name(bride_email)
    )
    groom_fallback_name = (
        primary_account_name if primary_profile_type == "groom" else local_part_name(groom_email)
    )

    display_name = str(serialized.get("name") or "User").strip() or "User"
    if normalized_login_email:
        serialized["email"] = normalized_login_email

    if normalized_login_email and bride_email and normalized_login_email == bride_email:
        display_name = (
            profile_full_name(bride_profile)
            or bride_fallback_name
            or display_name
        )
    elif normalized_login_email and groom_email and normalized_login_email == groom_email:
        display_name = (
            profile_full_name(groom_profile)
            or groom_fallback_name
            or display_name
        )

    serialized["name"] = display_name or "User"
    return serialized


# Expose the forgot password error service through the controller layer.

def forgot_password_error(message: str, status_code: int):
    return JSONResponse({"error": message}, status_code=status_code)


# Read a boolean flag from environment variables with a sensible default.

def env_bool(name: str, default: bool = False) -> bool:
    value = str(os.getenv(name, "")).strip().lower()
    if not value:
        return default
    return value in {"1", "true", "yes", "on"}


# Collect the SMTP settings used to send transactional emails.

def get_smtp_config():
    host = str(os.getenv("SMTP_HOST", "")).strip()
    port = int(str(os.getenv("SMTP_PORT", "587")).strip() or "587")
    username = str(os.getenv("SMTP_USERNAME", "")).strip()
    password = str(os.getenv("SMTP_PASSWORD", "")).strip()
    from_email = str(os.getenv("SMTP_FROM_EMAIL", username)).strip()
    from_name = str(os.getenv("SMTP_FROM_NAME", "Elegance Support")).strip() or "Elegance Support"
    use_tls = env_bool("SMTP_USE_TLS", True)
    use_ssl = env_bool("SMTP_USE_SSL", False)

    return {
        "host": host,
        "port": port,
        "username": username,
        "password": password,
        "from_email": from_email,
        "from_name": from_name,
        "use_tls": use_tls,
        "use_ssl": use_ssl,
    }


# Fail fast when the required SMTP settings are missing.

def ensure_smtp_config(config: dict):
    missing = [
        key
        for key in ["host", "port", "username", "password", "from_email"]
        if not str(config.get(key) or "").strip()
    ]
    if missing:
        raise RuntimeError(
            "OTP email service is not configured on server. Missing SMTP settings."
        )


# Send the password-reset OTP email through the configured SMTP server.

def send_reset_otp_email_sync(recipient_email: str, otp: str):
    config = get_smtp_config()
    ensure_smtp_config(config)

    message = EmailMessage()
    message["Subject"] = "Elegance Password Reset OTP"
    message["From"] = f'{config["from_name"]} <{config["from_email"]}>'
    message["To"] = recipient_email
    message.set_content(
        (
            "Your Elegance password reset OTP is: "
            f"{otp}\n\n"
            f"This OTP expires in {OTP_EXPIRY_MINUTES} minutes.\n"
            "If you did not request this, please ignore this email."
        )
    )

    if config["use_ssl"]:
        with smtplib.SMTP_SSL(config["host"], config["port"], timeout=20) as smtp:
            smtp.login(config["username"], config["password"])
            smtp.send_message(message)
        return

    with smtplib.SMTP(config["host"], config["port"], timeout=20) as smtp:
        smtp.ehlo()
        if config["use_tls"]:
            smtp.starttls()
            smtp.ehlo()
        smtp.login(config["username"], config["password"])
        smtp.send_message(message)


# Run the OTP email send in a background thread without blocking the request.

async def send_reset_otp_email(recipient_email: str, otp: str):
    await asyncio.to_thread(send_reset_otp_email_sync, recipient_email, otp)


# Create or sync the vendor profile document for vendor accounts.

async def ensure_vendor_profile_from_user(user_doc):
    if not user_doc:
        return

    vendor_email = normalize_email(user_doc.get("email"))
    if not vendor_email:
        return

    existing = await vendors_collection.find_one({"email": vendor_email})
    if existing:
        return

    now = utcnow_iso()
    vendor_profile = {
        "name": user_doc.get("name") or "Vendor",
        "email": vendor_email,
        "phone": normalize_phone(user_doc.get("phone")),
        "category": "",
        "location": "",
        "rating": 0,
        "average_rating": 0,
        "averageRating": 0,
        "total_reviews": 0,
        "totalReviews": 0,
        "status": "pending",
        "createdAt": now,
        "updatedAt": now,
    }
    await vendors_collection.insert_one(vendor_profile)


# Validate registration data, create the account, and seed related records.

async def register_user_service(user):
    normalized_email = normalize_email(user.email)
    normalized_partner_email = normalize_email(getattr(user, "partner_email", ""))
    normalized_role_value = normalize_role(user.role)
    primary_profile_type = (
        get_primary_profile_type(getattr(user, "primaryProfileType", ""), "bride")
        if normalized_role_value == "user"
        else ""
    )

    if not normalized_email or not is_valid_email(normalized_email):
        return JSONResponse({"message": "Please provide a valid email address."}, status_code=400)

    if normalized_partner_email and not is_valid_email(normalized_partner_email):
        return JSONResponse(
            {"message": "Please provide a valid partner email address."},
            status_code=400,
        )

    if normalized_partner_email and normalized_partner_email == normalized_email:
        return JSONResponse(
            {"message": "Partner email must be different from the primary email."},
            status_code=400,
        )

    if normalized_role_value not in VALID_ROLES:
        return JSONResponse({"message": "Please provide a valid role."}, status_code=400)

    if normalized_role_value == "admin":
        if not ADMIN_SECRET_KEY:
            return JSONResponse({"message": "Admin registration is not configured."}, status_code=500)
        admin_secret_key = str(getattr(user, "adminSecretKey", "") or "").strip()
        if admin_secret_key != ADMIN_SECRET_KEY:
            return JSONResponse({"message": "Invalid admin secret key."}, status_code=403)

    password_issue = password_error(user.password)
    if password_issue:
        return JSONResponse({"message": password_issue}, status_code=400)

    existing_user = await find_user_document(normalized_email, normalized_role_value)
    if existing_user:
        return JSONResponse({"message": "This email is already registered."}, status_code=400)

    if normalized_partner_email:
        existing_partner_user = await find_user_document(
            normalized_partner_email, normalized_role_value
        )
        if existing_partner_user:
            return JSONResponse(
                {"message": "This partner email is already registered."},
                status_code=400,
            )

    now = utcnow_iso()
    status = "pending" if normalized_role_value in APPROVAL_REQUIRED_ROLES else "active"
    approval_status = get_default_approval_status(normalized_role_value)

    user_document = {
        "name": str(user.name or "User").strip() or "User",
        "email": normalized_email,
        "partner_email": normalized_partner_email,
        "primaryProfileType": primary_profile_type,
        "password": hash_password(user.password),
        "role": normalized_role_value,
        "phone": normalize_phone(user.phone),
        "status": status,
        "approvalStatus": approval_status,
        "isActive": status != "inactive",
        "createdAt": now,
        "updatedAt": now,
    }

    result = await users_collection.insert_one(user_document)
    created_user = await users_collection.find_one({"_id": result.inserted_id})

    if normalized_role_value == "vendor":
        await ensure_vendor_profile_from_user(created_user)

    message = "Registration successful."
    if normalized_role_value in APPROVAL_REQUIRED_ROLES:
        message = "Registration submitted. Your account is pending admin approval."

    return {"message": message, "user": serialize_user(created_user)}


# Validate credentials and return the signed-in user payload.

async def login_user_service(user):
    normalized_email = normalize_email(user.email)
    normalized_role_value = normalize_role(user.role)

    if not normalized_email or not normalized_role_value:
        return JSONResponse({"message": "Email, password, and role are required."}, status_code=400)

    db_user = await users_collection.find_one(
        build_user_email_query(normalized_email, normalized_role_value)
    )
    if not db_user:
        return JSONResponse({"message": "Invalid email, password, or role."}, status_code=401)

    if db_user.get("status") == "inactive" or db_user.get("isActive") is False:
        return JSONResponse({"message": "Your account is inactive."}, status_code=403)

    if db_user.get("status") == "rejected":
        return JSONResponse({"message": "Your account has been rejected."}, status_code=403)

    if normalized_role_value in APPROVAL_REQUIRED_ROLES and db_user.get("approvalStatus") == "pending":
        return JSONResponse({"message": "Your account is pending approval."}, status_code=403)

    password_hash = get_password_bytes(db_user.get("password"))
    if not verify_password(user.password, password_hash):
        return JSONResponse({"message": "Invalid email or password."}, status_code=401)

    token = create_token(
        {
            "user_id": str(db_user.get("_id")),
            "email": normalized_email or db_user.get("email"),
            "role": db_user.get("role"),
        }
    )

    return {
        "message": "Login successful",
        "token": token,
        "user": await serialize_login_user(db_user, normalized_email),
    }


# Return the logout acknowledgement expected by the client.

async def logout_user_service():
    return {"success": True}


# Decode the auth token and return the current authenticated user.

async def get_current_user_service(authorization: str):
    token = str(authorization or "").replace("Bearer", "").strip()
    if not token:
        return JSONResponse({"message": "Missing token."}, status_code=401)

    payload = decode_token(token)
    if not payload:
        return JSONResponse({"message": "Invalid token."}, status_code=401)

    user = await find_user_document(payload.get("email"), payload.get("role"))
    if not user:
        return JSONResponse({"message": "User not found."}, status_code=404)

    return {"user": await serialize_login_user(user, payload.get("email"))}


# Locate the account that is requesting a password reset.

async def find_reset_target(email: str, role: str):
    normalized_email = normalize_email(email)
    if not normalized_email:
        return None

    lookup_role = normalize_role(role) if str(role or "").strip() else ""
    return await find_user_document(normalized_email, lookup_role)


# Fetch the active password-reset session for the selected account.

async def get_reset_session(email: str, role: str):
    normalized_email = normalize_email(email)
    normalized_role_value = normalize_role(role) if str(role or "").strip() else ""

    if not normalized_email:
        return None

    return await password_reset_collection.find_one(
        {"email": normalized_email, "role": normalized_role_value}
    )


# Check whether the submitted OTP is valid for the current reset session.

async def validate_reset_otp(email: str, role: str, otp: str):
    session = await get_reset_session(email, role)
    if not session:
        return None, forgot_password_error("OTP session not found.", 404)

    otp_expires_at = to_datetime(session.get("otpExpiresAt"))
    if not otp_expires_at or datetime.now(timezone.utc) > otp_expires_at:
        await password_reset_collection.delete_one({"_id": session.get("_id")})
        return None, forgot_password_error("OTP has expired.", 400)

    if str(session.get("otp") or "") != str(otp or "").strip():
        return None, forgot_password_error("Invalid OTP.", 400)

    return session, None


# Start the password-reset flow by creating and emailing an OTP.

async def send_reset_otp_service(payload):
    normalized_email = normalize_email(payload.email)
    normalized_role_value = normalize_role(payload.role) if str(payload.role or "").strip() else ""

    if not normalized_email or not is_valid_email(normalized_email):
        return forgot_password_error("Please provide a valid email address.", 400)

    if normalized_role_value and normalized_role_value not in VALID_ROLES:
        return forgot_password_error("Please provide a valid role.", 400)

    user = await find_reset_target(normalized_email, normalized_role_value)
    if not user:
        return forgot_password_error("Account not found.", 404)
    serialized_user = serialize_user(user)

    otp = generate_otp()
    now = datetime.now(timezone.utc)

    session_document = {
        "email": normalized_email,
        "role": normalized_role_value,
        "otp": otp,
        "otpExpiresAt": to_iso(now + timedelta(minutes=OTP_EXPIRY_MINUTES)),
        "isVerified": False,
        "verifiedAt": "",
        "updatedAt": to_iso(now),
    }

    await password_reset_collection.update_one(
        {"email": normalized_email, "role": normalized_role_value},
        {"$set": session_document, "$setOnInsert": {"createdAt": to_iso(now)}},
        upsert=True,
    )

    try:
        await send_reset_otp_email(normalized_email, otp)
    except RuntimeError as config_error:
        await password_reset_collection.delete_one(
            {"email": normalized_email, "role": normalized_role_value}
        )
        return forgot_password_error(str(config_error), 500)
    except Exception:
        await password_reset_collection.delete_one(
            {"email": normalized_email, "role": normalized_role_value}
        )
        return forgot_password_error(
            "Failed to send OTP email. Please try again in a moment.",
            500,
        )

    return {
        "success": True,
        "message": f"OTP sent to {normalized_email}.",
        "otpExpiresAt": session_document["otpExpiresAt"],
        "account": {
            "email": serialized_user.get("email"),
            "role": serialized_user.get("role"),
        },
    }


# Verify the submitted OTP before allowing a password change.

async def verify_reset_otp_service(payload):
    normalized_email = normalize_email(payload.email)
    normalized_role_value = normalize_role(payload.role) if str(payload.role or "").strip() else ""
    otp = str(payload.otp or "").strip()

    if not normalized_email or not otp:
        return forgot_password_error("Email and OTP are required.", 400)

    if normalized_role_value and normalized_role_value not in VALID_ROLES:
        return forgot_password_error("Please provide a valid role.", 400)

    user = await find_reset_target(normalized_email, normalized_role_value)
    if not user:
        return forgot_password_error("Account not found.", 404)
    serialized_user = serialize_user(user)

    session, error_response = await validate_reset_otp(normalized_email, normalized_role_value, otp)
    if error_response:
        return error_response

    verified_at = utcnow_iso()
    await password_reset_collection.update_one(
        {"_id": session.get("_id")},
        {"$set": {"isVerified": True, "verifiedAt": verified_at, "updatedAt": verified_at}},
    )

    return {
        "success": True,
        "message": "OTP verified successfully.",
        "account": {
            "email": serialized_user.get("email"),
            "role": serialized_user.get("role"),
        },
        "verifiedAt": verified_at,
    }


# Update the stored password after the OTP has been verified.

async def reset_password_service(payload):
    normalized_email = normalize_email(payload.email)
    normalized_role_value = normalize_role(payload.role) if str(payload.role or "").strip() else ""
    otp = str(payload.otp or "").strip()

    if not normalized_email or not otp or not payload.newPassword:
        return forgot_password_error("Email, OTP, and new password are required.", 400)

    if normalized_role_value and normalized_role_value not in VALID_ROLES:
        return forgot_password_error("Please provide a valid role.", 400)

    user = await find_reset_target(normalized_email, normalized_role_value)
    if not user:
        return forgot_password_error("Account not found.", 404)

    session, error_response = await validate_reset_otp(normalized_email, normalized_role_value, otp)
    if error_response:
        return error_response

    password_issue = password_error(payload.newPassword)
    if password_issue:
        return forgot_password_error(password_issue, 400)

    if session.get("isVerified") is not True:
        verified_at = utcnow_iso()
        await password_reset_collection.update_one(
            {"_id": session.get("_id")},
            {"$set": {"isVerified": True, "verifiedAt": verified_at, "updatedAt": verified_at}},
        )

    await users_collection.update_one(
        {"_id": user.get("_id")},
        {"$set": {"password": hash_password(payload.newPassword), "updatedAt": utcnow_iso()}},
    )

    await password_reset_collection.delete_one({"_id": session.get("_id")})

    return {"success": True, "message": "Password reset successful."}


# Expose the register user service through the controller layer.

async def register_user(user):
    return await register_user_service(user)


# Expose the login user service through the controller layer.

async def login_user(user):
    return await login_user_service(user)


# Expose the logout user service through the controller layer.

async def logout_user():
    return await logout_user_service()


# Expose the get current user service through the controller layer.

async def get_current_user(authorization: str):
    return await get_current_user_service(authorization)


# Expose the send reset OTP service through the controller layer.

async def send_reset_otp(payload):
    return await send_reset_otp_service(payload)


# Expose the verify reset OTP service through the controller layer.

async def verify_reset_otp(payload):
    return await verify_reset_otp_service(payload)


# Expose the reset password service through the controller layer.

async def reset_password(payload):
    return await reset_password_service(payload)
