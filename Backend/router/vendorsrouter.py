from fastapi import APIRouter

from controller.vendorscontroller import (
    list_vendors,
    get_vendor,
    create_vendor_inquiry,
    recommend_vendors,
)
from models import VendorInquiryCreate

# Define the VendorsRouter API router for this backend feature.

VendorsRouter = APIRouter(prefix="/api/vendors", tags=["vendors"])


# Forward the vendors request to the controller layer.

@VendorsRouter.get("")
async def vendors(service: str = "", maxPrice: float = 0, location: str = ""):
    return await list_vendors(service, maxPrice, location)


# Forward the recommend vendor services request to the controller layer.

@VendorsRouter.get("/recommend")
async def recommend_vendor_services(
    service: str = "",
    budget: float = 0,
    location: str = "",
    sortBy: str = "price",
):
    return await recommend_vendors(service, budget, location, sortBy)


# Forward the vendor detail request to the controller layer.

@VendorsRouter.get("/{vendor_id}")
async def vendor_detail(vendor_id: str):
    return await get_vendor(vendor_id)


# Forward the create inquiry request to the controller layer.

@VendorsRouter.post("/{vendor_id}/inquiries")
async def create_inquiry(vendor_id: str, payload: VendorInquiryCreate):
    return await create_vendor_inquiry(vendor_id, payload)
