from fastapi import APIRouter, Header

from controller.ratingscontroller import submit_rating
from models import RatingSubmit

# Define the RatingsRouter API router for this backend feature.

RatingsRouter = APIRouter(prefix="/api/ratings", tags=["ratings"])


# Forward the create or update rating request to the controller layer.

@RatingsRouter.post("")
async def create_or_update_rating(
    payload: RatingSubmit,
    authorization: str = Header(default=""),
):
    return await submit_rating(payload, authorization)
