from fastapi import APIRouter, Header

from controller.usercontroller import (
    get_user_profile,
    update_user_profile,
    get_couple_profile,
    update_couple_profile,
    create_couple_vendor_booking,
    get_user_bookings,
    update_user_booking,
    update_user_booking_notes,
    get_user_settings,
    update_user_settings,
    get_favorites,
    add_favorite,
    remove_favorite,
)
from models import (
    CoupleVendorBookingCreate,
    FavoriteAddRequest,
    UserBookingUpdate,
    UserBookingNotesUpdate,
    UserCoupleProfileUpdate,
    UserProfileUpdate,
    UserSettingsUpdate,
)

# Define the UserRouter API router for this backend feature.

UserRouter = APIRouter(prefix="/api/user", tags=["user"])


# Forward the profile request to the controller layer.

@UserRouter.get("/profile")
async def profile(email: str = "", profileType: str = "", authorization: str = Header(default="")):
    return await get_user_profile(email, profileType, authorization)


# Forward the update profile request to the controller layer.

@UserRouter.put("/profile")
async def update_profile(payload: UserProfileUpdate, authorization: str = Header(default="")):
    return await update_user_profile(payload, authorization)


# Forward the couple profile request to the controller layer.

@UserRouter.get("/couple-profile")
async def couple_profile(accountEmail: str = "", authorization: str = Header(default="")):
    return await get_couple_profile(accountEmail, authorization)


# Forward the update couple request to the controller layer.

@UserRouter.put("/couple-profile")
async def update_couple(payload: UserCoupleProfileUpdate, authorization: str = Header(default="")):
    return await update_couple_profile(payload, authorization)


# Forward the book vendor request to the controller layer.

@UserRouter.post("/book-vendor")
async def book_vendor(payload: CoupleVendorBookingCreate, authorization: str = Header(default="")):
    return await create_couple_vendor_booking(payload, authorization)


# Forward the user bookings request to the controller layer.

@UserRouter.get("/bookings")
async def user_bookings(userEmail: str = "", authorization: str = Header(default="")):
    return await get_user_bookings(userEmail, authorization)


# Forward the user booking update request to the controller layer.

@UserRouter.patch("/bookings/{booking_id}")
async def edit_user_booking(
    booking_id: str,
    payload: UserBookingUpdate,
    authorization: str = Header(default=""),
):
    return await update_user_booking(booking_id, payload, authorization)


# Forward the set user booking notes request to the controller layer.

@UserRouter.patch("/bookings/{booking_id}/notes")
async def set_user_booking_notes(
    booking_id: str,
    payload: UserBookingNotesUpdate,
    authorization: str = Header(default=""),
):
    return await update_user_booking_notes(booking_id, payload, authorization)


# Forward the settings request to the controller layer.

@UserRouter.get("/settings")
async def settings(email: str = "", profileType: str = "", authorization: str = Header(default="")):
    return await get_user_settings(email, profileType, authorization)


# Forward the update settings request to the controller layer.

@UserRouter.put("/settings")
async def update_settings(payload: UserSettingsUpdate, authorization: str = Header(default="")):
    return await update_user_settings(payload, authorization)


# Forward the list favorites request to the controller layer.

@UserRouter.get("/favorites")
async def list_favorites(userEmail: str = "", authorization: str = Header(default="")):
    return await get_favorites(userEmail, authorization)


# Forward the create favorite request to the controller layer.

@UserRouter.post("/favorites")
async def create_favorite(payload: FavoriteAddRequest, authorization: str = Header(default="")):
    return await add_favorite(payload, authorization)


# Forward the delete favorite request to the controller layer.

@UserRouter.delete("/favorites/{service_id}")
async def delete_favorite(service_id: str, userEmail: str = "", authorization: str = Header(default="")):
    return await remove_favorite(userEmail, service_id, authorization)
