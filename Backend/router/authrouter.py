from fastapi import APIRouter, Header

from controller.authcontroller import (
    login_user,
    logout_user,
    register_user,
    reset_password,
    send_reset_otp,
    get_current_user,
    verify_reset_otp,
)
from models import (
    ForgotPasswordReset,
    ForgotPasswordSendOtp,
    ForgotPasswordVerifyOtp,
    UserLogin,
    UserRegister,
)

# Define the AuthRouter API router for this backend feature.

AuthRouter = APIRouter(prefix="/api/auth", tags=["auth"])


# Forward the register request to the controller layer.

@AuthRouter.post("/register")
async def register(user: UserRegister):
    return await register_user(user)


# Forward the login request to the controller layer.

@AuthRouter.post("/login")
async def login(user: UserLogin):
    return await login_user(user)


# Forward the logout request to the controller layer.

@AuthRouter.post("/logout")
async def logout():
    return await logout_user()


# Forward the me request to the controller layer.

@AuthRouter.get("/me")
async def me(authorization: str = Header(default="")):
    return await get_current_user(authorization)


# Forward the send OTP request to the controller layer.

@AuthRouter.post("/send-reset-otp")
async def send_otp(payload: ForgotPasswordSendOtp):
    return await send_reset_otp(payload)


# Forward the verify OTP request to the controller layer.

@AuthRouter.post("/verify-reset-otp")
async def verify_otp(payload: ForgotPasswordVerifyOtp):
    return await verify_reset_otp(payload)


# Forward the reset request to the controller layer.

@AuthRouter.post("/reset-password")
async def reset(payload: ForgotPasswordReset):
    return await reset_password(payload)
