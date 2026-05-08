from pymongo import ASCENDING, DESCENDING

from dbconnect import db


# Reuse one place for startup indexes that support the most common API filters.

async def ensure_performance_indexes():
    users_collection = db["users"]
    vendors_collection = db["vendors"]
    services_collection = db["services"]
    bookings_collection = db["bookings"]
    couple_booking_requests_collection = db["couple_booking_requests"]
    vendor_inquiries_collection = db["vendor_inquiries"]
    contact_inquiries_collection = db["contact_inquiries"]
    ratings_collection = db["ratings"]

    await users_collection.create_index(
        [("email", ASCENDING), ("role", ASCENDING)],
        name="users_email_role_lookup",
    )
    await users_collection.create_index(
        [("id", ASCENDING)],
        name="users_id_lookup",
    )
    await users_collection.create_index(
        [("partner_email", ASCENDING)],
        name="users_partner_email_lookup",
    )

    await vendors_collection.create_index(
        [("id", ASCENDING)],
        name="vendors_id_lookup",
    )
    await vendors_collection.create_index(
        [("email", ASCENDING)],
        name="vendors_email_lookup",
    )
    await vendors_collection.create_index(
        [("category", ASCENDING), ("city", ASCENDING), ("state", ASCENDING)],
        name="vendors_category_location_lookup",
    )

    await services_collection.create_index(
        [("vendorId", ASCENDING), ("createdAt", DESCENDING)],
        name="services_vendor_created_lookup",
    )
    await services_collection.create_index(
        [("id", ASCENDING)],
        name="services_id_lookup",
    )
    await services_collection.create_index(
        [("isActive", ASCENDING), ("category", ASCENDING), ("price", ASCENDING), ("createdAt", DESCENDING)],
        name="services_public_filter_lookup",
    )

    await bookings_collection.create_index(
        [("vendorId", ASCENDING), ("createdAt", DESCENDING)],
        name="bookings_vendor_created_lookup",
    )
    await bookings_collection.create_index(
        [("status", ASCENDING), ("vendorId", ASCENDING), ("eventDate", ASCENDING)],
        name="bookings_status_vendor_event_lookup",
    )
    await bookings_collection.create_index(
        [("serviceId", ASCENDING), ("createdAt", DESCENDING)],
        name="bookings_service_created_lookup",
    )
    for field_name in (
        "id",
        "requestId",
        "bookingRequestId",
        "userEmail",
        "clientEmail",
        "bookedByEmail",
        "booked_by_email",
        "registeredEmail",
        "registered_email",
        "partnerEmail",
        "partner_email",
    ):
        await bookings_collection.create_index(
            [(field_name, ASCENDING)],
            name=f"bookings_{field_name}_lookup",
        )

    await couple_booking_requests_collection.create_index(
        [("vendorId", ASCENDING), ("createdAt", DESCENDING)],
        name="couple_booking_vendor_created_lookup",
    )
    for field_name in (
        "id",
        "requestId",
        "bookingRequestId",
        "userEmail",
        "bookedByEmail",
        "booked_by_email",
        "registeredEmail",
        "registered_email",
        "partnerEmail",
        "partner_email",
    ):
        await couple_booking_requests_collection.create_index(
            [(field_name, ASCENDING)],
            name=f"couple_booking_{field_name}_lookup",
        )

    await vendor_inquiries_collection.create_index(
        [("serviceId", ASCENDING), ("userEmail", ASCENDING)],
        name="vendor_inquiries_service_user_lookup",
    )
    await vendor_inquiries_collection.create_index(
        [("vendorId", ASCENDING), ("createdAt", DESCENDING)],
        name="vendor_inquiries_vendor_created_lookup",
    )

    await contact_inquiries_collection.create_index(
        [("createdAt", DESCENDING)],
        name="contact_inquiries_created_lookup",
    )
    await contact_inquiries_collection.create_index(
        [("status", ASCENDING), ("createdAt", DESCENDING)],
        name="contact_inquiries_status_created_lookup",
    )

    await ratings_collection.create_index(
        [("status", ASCENDING), ("service_id", ASCENDING), ("created_at", DESCENDING)],
        name="ratings_public_service_created_lookup",
    )
