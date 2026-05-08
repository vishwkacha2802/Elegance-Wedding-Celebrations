from fastapi import APIRouter

from controller.contactcontroller import create_contact_inquiry
from models import ContactInquiryCreate

# Define the ContactRouter API router for this backend feature.

ContactRouter = APIRouter(prefix="/api/contact-inquiries", tags=["contact-inquiries"])


# Forward the submit contact inquiry request to the controller layer.

@ContactRouter.post("")
async def submit_contact_inquiry(payload: ContactInquiryCreate):
    return await create_contact_inquiry(payload)
