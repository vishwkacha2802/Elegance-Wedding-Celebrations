from fastapi import APIRouter, Header

from controller.vendorcontroller import (
    get_vendor_profile,
    update_vendor_profile,
    get_vendor_stats,
    list_services,
    create_service,
    update_service,
    delete_service,
    list_recent_bookings,
    update_booking_status,
    get_earnings,
)
from models import BookingStatusUpdate, ServiceCreate, ServiceUpdate, VendorProfileUpdate

# Define the VendorRouter API router for this backend feature.

VendorRouter = APIRouter(prefix="/api", tags=["vendor"])


# Forward the vendor profile request to the controller layer.

@VendorRouter.get("/vendor/profile")
async def vendor_profile(vendorId: str = "", email: str = "", authorization: str = Header(default="")):
    return await get_vendor_profile(vendorId, email, authorization)


# Forward the save vendor profile request to the controller layer.

@VendorRouter.put("/vendor/profile")
async def save_vendor_profile(payload: VendorProfileUpdate, authorization: str = Header(default="")):
    return await update_vendor_profile(payload, authorization)


# Forward the vendor stats request to the controller layer.

@VendorRouter.get("/vendor/stats")
async def vendor_stats(vendorId: str = "", email: str = "", authorization: str = Header(default="")):
    return await get_vendor_stats(vendorId, email, authorization)


# Forward the services request to the controller layer.

@VendorRouter.get("/services")
async def services(vendorId: str = "", authorization: str = Header(default="")):
    return await list_services(vendorId, authorization)


# Forward the add service request to the controller layer.

@VendorRouter.post("/services")
async def add_service(payload: ServiceCreate, authorization: str = Header(default="")):
    return await create_service(payload, authorization)


# Forward the edit service request to the controller layer.

@VendorRouter.put("/services/{service_id}")
async def edit_service(service_id: str, payload: ServiceUpdate, authorization: str = Header(default="")):
    return await update_service(service_id, payload, authorization)


# Forward the remove service request to the controller layer.

@VendorRouter.delete("/services/{service_id}")
async def remove_service(service_id: str, authorization: str = Header(default="")):
    return await delete_service(service_id, authorization)


# Forward the recent bookings request to the controller layer.

@VendorRouter.get("/bookings/recent")
async def recent_bookings(vendorId: str = "", authorization: str = Header(default="")):
    return await list_recent_bookings(vendorId, authorization)


# Forward the set booking status request to the controller layer.

@VendorRouter.patch("/bookings/{booking_id}/status")
async def set_booking_status(
    booking_id: str,
    payload: BookingStatusUpdate,
    authorization: str = Header(default=""),
):
    return await update_booking_status(booking_id, payload, authorization)


# Forward the earnings request to the controller layer.

@VendorRouter.get("/earnings")
async def earnings(vendorId: str = "", authorization: str = Header(default="")):
    return await get_earnings(vendorId, authorization)
