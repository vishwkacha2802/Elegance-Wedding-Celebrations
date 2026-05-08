import asyncio
import smtplib
from bson import ObjectId
from email.message import EmailMessage
from fastapi.responses import JSONResponse

from controller.authcontroller import ensure_smtp_config, get_smtp_config
from controller.account_utils import normalize_email, normalize_phone, utcnow_iso, users_collection
from dbconnect import db

# Reuse shared MongoDB collection handles throughout this module.

contact_inquiries_collection = db["contact_inquiries"]

# Keep module-level constants together so related rules stay easy to maintain.

CONTACT_INQUIRY_STATUSES = {"new", "contacted", "archived"}


# Parse object ID values into the format expected by database queries.

def parse_object_id(value: str):
    try:
        return ObjectId(value)
    except Exception:
        return None


# Build the document query used by downstream queries or response shaping.

def build_document_query(identifier: str):
    normalized_identifier = str(identifier or "").strip()
    parsed_identifier = parse_object_id(normalized_identifier)
    if parsed_identifier:
        return {"_id": parsed_identifier}
    return {"id": normalized_identifier}


# Normalize contact inquiry status values before comparisons, storage, or responses.

def normalize_contact_inquiry_status(status: str):
    normalized_status = str(status or "").strip().lower()
    return normalized_status if normalized_status in CONTACT_INQUIRY_STATUSES else "new"


# Resolve inquiry account snapshot from the available documents and fallback values.

async def resolve_inquiry_account_snapshot(email: str):
    normalized_email = normalize_email(email)
    if not normalized_email:
        return {
            "isRegisteredUser": False,
            "accountType": "new_user",
            "userRole": "",
        }

    existing_user = await users_collection.find_one({"email": normalized_email})
    if not existing_user:
        return {
            "isRegisteredUser": False,
            "accountType": "new_user",
            "userRole": "",
        }

    return {
        "isRegisteredUser": True,
        "accountType": "registered_user",
        "userRole": str(existing_user.get("role") or "").strip().lower(),
    }


# Serialize contact inquiry into the shape returned by the API.

async def serialize_contact_inquiry(document):
    if not document:
        return None

    account_snapshot = {
        "isRegisteredUser": bool(document.get("isRegisteredUser")),
        "accountType": str(document.get("accountType") or "").strip(),
        "userRole": str(document.get("userRole") or "").strip().lower(),
    }
    if not account_snapshot["accountType"]:
        account_snapshot = await resolve_inquiry_account_snapshot(document.get("email"))

    return {
        "id": str(document.get("_id") or document.get("id") or ""),
        "name": str(document.get("name") or "").strip(),
        "email": normalize_email(document.get("email")),
        "phone": normalize_phone(document.get("phone")),
        "eventDate": str(document.get("eventDate") or "").strip(),
        "guestCount": str(document.get("guestCount") or "").strip(),
        "venue": str(document.get("venue") or "").strip(),
        "message": str(document.get("message") or "").strip(),
        "status": normalize_contact_inquiry_status(document.get("status")),
        "source": str(document.get("source") or "landing_contact_form").strip(),
        "isRegisteredUser": bool(account_snapshot["isRegisteredUser"]),
        "accountType": str(account_snapshot["accountType"] or "new_user"),
        "userRole": str(account_snapshot["userRole"] or "").strip().lower(),
        "createdAt": str(document.get("createdAt") or "").strip(),
        "updatedAt": str(document.get("updatedAt") or document.get("createdAt") or "").strip(),
    }


# Handle the service-layer logic for creating contact inquiry.

async def create_contact_inquiry_service(payload):
    normalized_name = str(payload.name or "").strip()
    normalized_email = normalize_email(payload.email)
    normalized_message = str(payload.message or "").strip()

    if not normalized_name:
        return JSONResponse({"message": "Name is required."}, status_code=400)
    if not normalized_email:
        return JSONResponse({"message": "Valid email is required."}, status_code=400)
    if not normalized_message:
        return JSONResponse({"message": "Message is required."}, status_code=400)

    account_snapshot = await resolve_inquiry_account_snapshot(normalized_email)
    now = utcnow_iso()
    inquiry_document = {
        "name": normalized_name,
        "email": normalized_email,
        "phone": normalize_phone(payload.phone),
        "eventDate": str(payload.eventDate or "").strip(),
        "guestCount": str(payload.guestCount or "").strip(),
        "venue": str(payload.venue or "").strip(),
        "message": normalized_message,
        "status": "new",
        "source": "landing_contact_form",
        "isRegisteredUser": account_snapshot["isRegisteredUser"],
        "accountType": account_snapshot["accountType"],
        "userRole": account_snapshot["userRole"],
        "createdAt": now,
        "updatedAt": now,
    }

    result = await contact_inquiries_collection.insert_one(inquiry_document)
    created_inquiry = await contact_inquiries_collection.find_one({"_id": result.inserted_id})

    return {
        "success": True,
        "message": "Your inquiry has been submitted successfully.",
        "inquiry": await serialize_contact_inquiry(created_inquiry),
    }


# Handle the service-layer logic for retrieving contact inquiries.

async def get_contact_inquiries_service():
    inquiries = []
    async for inquiry in contact_inquiries_collection.find({}, sort=[("createdAt", -1)]):
        inquiries.append(await serialize_contact_inquiry(inquiry))
    return inquiries


# Handle the service-layer logic for updating contact inquiry status.

async def update_contact_inquiry_status_service(inquiry_id, payload):
    normalized_inquiry_id = str(inquiry_id or "").strip()
    if not normalized_inquiry_id:
        return JSONResponse({"message": "Inquiry id is required."}, status_code=400)

    normalized_status = str(payload.status or "").strip().lower()
    if normalized_status not in CONTACT_INQUIRY_STATUSES:
        return JSONResponse({"message": "Invalid inquiry status."}, status_code=400)

    inquiry = await contact_inquiries_collection.find_one(build_document_query(normalized_inquiry_id))
    if not inquiry:
        return JSONResponse({"message": "Inquiry not found."}, status_code=404)

    await contact_inquiries_collection.update_one(
        {"_id": inquiry.get("_id")},
        {"$set": {"status": normalized_status, "updatedAt": utcnow_iso()}},
    )
    updated_inquiry = await contact_inquiries_collection.find_one({"_id": inquiry.get("_id")})
    return await serialize_contact_inquiry(updated_inquiry)


# Send the admin reply email for a saved contact inquiry.

def send_contact_reply_email_sync(recipient_email: str, subject: str, message_body: str):
    config = get_smtp_config()
    ensure_smtp_config(config)

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = f'{config["from_name"]} <{config["from_email"]}>'
    message["To"] = recipient_email
    message.set_content(message_body)

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


# Run the contact reply email send in a background thread.

async def send_contact_reply_email(recipient_email: str, subject: str, message_body: str):
    await asyncio.to_thread(send_contact_reply_email_sync, recipient_email, subject, message_body)


# Handle the service-layer logic for sending contact inquiry reply.

async def send_contact_inquiry_reply_service(inquiry_id, payload):
    normalized_inquiry_id = str(inquiry_id or "").strip()
    if not normalized_inquiry_id:
        return JSONResponse({"message": "Inquiry id is required."}, status_code=400)

    inquiry = await contact_inquiries_collection.find_one(build_document_query(normalized_inquiry_id))
    if not inquiry:
        return JSONResponse({"message": "Inquiry not found."}, status_code=404)

    recipient_email = normalize_email(inquiry.get("email"))
    if not recipient_email:
        return JSONResponse({"message": "Inquiry email is missing."}, status_code=400)

    subject = str(payload.subject or "").strip()
    message_text = str(payload.message or "").strip()

    if not subject:
        return JSONResponse({"message": "Email subject is required."}, status_code=400)
    if not message_text:
        return JSONResponse({"message": "Email message is required."}, status_code=400)

    try:
        await send_contact_reply_email(recipient_email, subject, message_text)
    except Exception as error:
        return JSONResponse(
            {"message": str(error) or "Failed to send reply email."},
            status_code=500,
        )

    now = utcnow_iso()
    await contact_inquiries_collection.update_one(
        {"_id": inquiry.get("_id")},
        {
            "$set": {
                "status": "contacted",
                "updatedAt": now,
                "lastRepliedAt": now,
                "lastReplySubject": subject,
            }
        },
    )
    updated_inquiry = await contact_inquiries_collection.find_one({"_id": inquiry.get("_id")})

    return {
        "success": True,
        "message": "Reply sent successfully.",
        "inquiry": await serialize_contact_inquiry(updated_inquiry),
    }


# Handle the service-layer logic for deleting contact inquiry.

async def delete_contact_inquiry_service(inquiry_id):
    normalized_inquiry_id = str(inquiry_id or "").strip()
    if not normalized_inquiry_id:
        return JSONResponse({"message": "Inquiry id is required."}, status_code=400)

    inquiry = await contact_inquiries_collection.find_one(build_document_query(normalized_inquiry_id))
    if not inquiry:
        return JSONResponse({"message": "Inquiry not found."}, status_code=404)

    await contact_inquiries_collection.delete_one({"_id": inquiry.get("_id")})
    return {"success": True}


# Expose the create contact inquiry service through the controller layer.

async def create_contact_inquiry(payload):
    return await create_contact_inquiry_service(payload)


# Expose the get contact inquiries service through the controller layer.

async def get_contact_inquiries():
    return await get_contact_inquiries_service()


# Expose the update contact inquiry status service through the controller layer.

async def update_contact_inquiry_status(inquiry_id, payload):
    return await update_contact_inquiry_status_service(inquiry_id, payload)


# Expose the delete contact inquiry service through the controller layer.

async def delete_contact_inquiry(inquiry_id):
    return await delete_contact_inquiry_service(inquiry_id)


# Expose the send contact inquiry reply service through the controller layer.

async def send_contact_inquiry_reply(inquiry_id, payload):
    return await send_contact_inquiry_reply_service(inquiry_id, payload)
