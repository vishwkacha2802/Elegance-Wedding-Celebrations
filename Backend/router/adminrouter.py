from fastapi import APIRouter, Depends, Header, HTTPException

from controller.admincontroller import (
    get_admin_profile,
    get_dashboard_stats,
    get_users,
    update_user_status,
    delete_user,
    get_vendors,
    create_vendor,
    update_vendor,
    delete_vendor,
    delete_service,
    delete_booking,
    update_vendor_status,
    get_bookings,
    get_rating_reviews,
    update_booking_status,
    update_rating_review_status,
    delete_rating_review,
    update_admin_profile,
)
from controller.contactcontroller import (
    delete_contact_inquiry,
    get_contact_inquiries,
    send_contact_inquiry_reply,
    update_contact_inquiry_status,
)
from controller.account_utils import authenticate_request
from models import (
    AdminContactInquiryReply,
    AdminContactInquiryStatusUpdate,
    AdminProfileUpdate,
    AdminRatingStatusUpdate,
    AdminUserStatusUpdate,
    AdminVendorCreate,
    AdminVendorStatusUpdate,
    AdminVendorUpdate,
    BookingStatusUpdate,
)


# Forward the require admin access request to the controller layer.

async def require_admin_access(authorization: str = Header(default="")):
    _, _, error_response = await authenticate_request(authorization, "admin")
    if error_response:
        detail = (error_response.body or b"").decode("utf-8")
        raise HTTPException(status_code=error_response.status_code, detail=detail)


# Define the AdminRouter API router for this backend feature.

AdminRouter = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin_access)],
)


# Forward the dashboard stats request to the controller layer.

@AdminRouter.get("/dashboard-stats")
async def dashboard_stats():
    return await get_dashboard_stats()


# Forward the list users request to the controller layer.

@AdminRouter.get("/users")
async def list_users():
    return await get_users()


# Forward the set user status request to the controller layer.

@AdminRouter.patch("/users/{user_id}/status")
async def set_user_status(user_id: str, payload: AdminUserStatusUpdate):
    return await update_user_status(user_id, payload)


# Forward the remove user request to the controller layer.

@AdminRouter.delete("/users/{user_id}")
async def remove_user(user_id: str):
    return await delete_user(user_id)


# Forward the list vendors request to the controller layer.

@AdminRouter.get("/vendors")
async def list_vendors():
    return await get_vendors()


# Forward the add vendor request to the controller layer.

@AdminRouter.post("/vendors")
async def add_vendor(payload: AdminVendorCreate):
    return await create_vendor(payload)


# Forward the edit vendor request to the controller layer.

@AdminRouter.put("/vendors/{vendor_id}")
async def edit_vendor(vendor_id: str, payload: AdminVendorUpdate):
    return await update_vendor(vendor_id, payload)


# Forward the remove vendor request to the controller layer.

@AdminRouter.delete("/vendors/{vendor_id}")
async def remove_vendor(vendor_id: str):
    return await delete_vendor(vendor_id)


# Forward the set vendor status request to the controller layer.

@AdminRouter.patch("/vendors/{vendor_id}/status")
async def set_vendor_status(vendor_id: str, payload: AdminVendorStatusUpdate):
    return await update_vendor_status(vendor_id, payload)


# Forward the remove service request to the controller layer.

@AdminRouter.delete("/services/{service_id}")
async def remove_service(service_id: str):
    return await delete_service(service_id)


# Forward the list bookings request to the controller layer.

@AdminRouter.get("/bookings")
async def list_bookings():
    return await get_bookings()


# Forward the list reviews request to the controller layer.

@AdminRouter.get("/ratings")
async def list_ratings():
    return await get_rating_reviews()


# Forward the remove booking request to the controller layer.

@AdminRouter.delete("/bookings/{booking_id}")
async def remove_booking(booking_id: str):
    return await delete_booking(booking_id)


# Forward the set booking status request to the controller layer.

@AdminRouter.patch("/bookings/{booking_id}/status")
async def set_booking_status(booking_id: str, payload: BookingStatusUpdate):
    return await update_booking_status(booking_id, payload)


# Forward the set rating review status request to the controller layer.

@AdminRouter.patch("/ratings/{rating_id}/status")
async def set_rating_status(rating_id: str, payload: AdminRatingStatusUpdate):
    return await update_rating_review_status(rating_id, payload)


# Forward the remove review request to the controller layer.

@AdminRouter.delete("/ratings/{rating_id}")
async def remove_rating(rating_id: str):
    return await delete_rating_review(rating_id)


# Forward the list contact inquiries request to the controller layer.

@AdminRouter.get("/contact-inquiries")
async def list_contact_inquiries():
    return await get_contact_inquiries()


# Forward the set contact inquiry status request to the controller layer.

@AdminRouter.patch("/contact-inquiries/{inquiry_id}/status")
async def set_contact_inquiry_status(
    inquiry_id: str,
    payload: AdminContactInquiryStatusUpdate,
):
    return await update_contact_inquiry_status(inquiry_id, payload)


# Forward the remove contact inquiry request to the controller layer.

@AdminRouter.delete("/contact-inquiries/{inquiry_id}")
async def remove_contact_inquiry(inquiry_id: str):
    return await delete_contact_inquiry(inquiry_id)


# Forward the reply to contact inquiry request to the controller layer.

@AdminRouter.post("/contact-inquiries/{inquiry_id}/reply")
async def reply_to_contact_inquiry(inquiry_id: str, payload: AdminContactInquiryReply):
    return await send_contact_inquiry_reply(inquiry_id, payload)


# Forward the admin profile request to the controller layer.

@AdminRouter.get("/profile")
async def admin_profile():
    return await get_admin_profile()


# Forward the update profile request to the controller layer.

@AdminRouter.put("/profile")
async def update_profile(payload: AdminProfileUpdate):
    return await update_admin_profile(payload)
