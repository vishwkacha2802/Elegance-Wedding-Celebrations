from typing import Optional

from pydantic import BaseModel, Field


# Validate the payload used to register a new account.

class UserRegister(BaseModel):
    name: str
    email: str
    partner_email: str = ""
    primaryProfileType: str = ""
    password: str
    role: str
    phone: str = ""
    adminSecretKey: str = ""


# Validate the payload used during login.

class UserLogin(BaseModel):
    email: str
    password: str
    role: str


# Validate the payload used to request a password-reset OTP.

class ForgotPasswordSendOtp(BaseModel):
    email: str
    role: str = ""


# Validate the payload used to verify a password-reset OTP.

class ForgotPasswordVerifyOtp(BaseModel):
    email: str
    role: str = ""
    otp: str


# Validate the payload used to finish a password reset.

class ForgotPasswordReset(BaseModel):
    email: str
    role: str = ""
    otp: str
    newPassword: str


# Validate update payloads for admin profile.

class AdminProfileUpdate(BaseModel):
    name: str
    email: str


# Validate update payloads for admin user status.

class AdminUserStatusUpdate(BaseModel):
    status: str


# Validate update payloads for admin vendor status.

class AdminVendorStatusUpdate(BaseModel):
    status: str


# Validate update payloads for admin review status.

class AdminRatingStatusUpdate(BaseModel):
    status: str


# Validate create payloads for admin vendor.

class AdminVendorCreate(BaseModel):
    name: str
    email: str
    phone: str
    category: str
    location: str
    password: str


# Validate update payloads for admin vendor.

class AdminVendorUpdate(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    category: str = ""
    location: str = ""


# Validate update payloads for admin contact inquiry status.

class AdminContactInquiryStatusUpdate(BaseModel):
    status: str


# Validate reply payloads for admin contact inquiry.

class AdminContactInquiryReply(BaseModel):
    subject: str
    message: str


# Validate update payloads for user profile.

class UserProfileUpdate(BaseModel):
    profileType: str = ""
    accountEmail: str = ""
    firstName: str = ""
    lastName: str = ""
    email: str = ""
    phone: str = ""


# Validate update payloads for user couple partner.

class UserCouplePartnerUpdate(BaseModel):
    firstName: str = ""
    lastName: str = ""
    email: str = ""
    phone: str = ""


# Validate update payloads for user couple profile.

class UserCoupleProfileUpdate(BaseModel):
    accountEmail: str = ""
    editorEmail: str = ""
    bride: UserCouplePartnerUpdate = Field(default_factory=UserCouplePartnerUpdate)
    groom: UserCouplePartnerUpdate = Field(default_factory=UserCouplePartnerUpdate)


# Validate update payloads for user settings.

class UserSettingsUpdate(BaseModel):
    profileType: str = ""
    email: str = ""
    emailUpdates: bool = False
    budgetAlerts: bool = False
    weeklyReminders: bool = False


# Validate the favorite add request payload used by the API.

class FavoriteAddRequest(BaseModel):
    userEmail: str
    serviceId: str
    vendorId: str = ""


# Validate create payloads for couple vendor booking.

class CoupleVendorBookingCreate(BaseModel):
    id: str = ""
    requestId: str = ""
    userEmail: str = ""
    vendorId: str = ""
    serviceId: str = ""
    vendorName: str = ""
    businessName: str = ""
    service: str = ""
    location: str = ""
    eventDate: str = ""
    guestCount: int = 0
    estimatedBudget: float = 0
    notes: str = ""
    status: str = ""
    coupleName: str = ""
    phone: str = ""
    createdAt: str = ""
    updatedAt: str = ""


# Validate update payloads for user booking notes.

class UserBookingNotesUpdate(BaseModel):
    userEmail: str = ""
    notes: str = ""


# Validate update payloads for user booking request details.

class UserBookingUpdate(BaseModel):
    userEmail: str = ""
    eventDate: str = ""
    location: str = ""
    guestCount: int = 0
    estimatedBudget: float = 0
    notes: str = ""


# Validate create payloads for vendor inquiry.

class VendorInquiryCreate(BaseModel):
    name: str
    email: str
    userEmail: str = ""
    serviceId: str = ""
    phone: str = ""
    weddingDate: str = ""
    budget: float = 0
    allocatedBudget: float = 0
    location: str = ""
    guestCount: int = 0
    serviceType: str = ""
    message: str


# Validate create payloads for contact inquiry.

class ContactInquiryCreate(BaseModel):
    name: str
    email: str
    phone: str = ""
    eventDate: str = ""
    guestCount: str = ""
    venue: str = ""
    message: str


# Validate update payloads for vendor profile.

class VendorProfileUpdate(BaseModel):
    businessName: str = ""
    ownerName: str = ""
    category: str = ""
    email: str = ""
    phone: str = ""
    city: str = ""
    state: str = ""
    zipCode: str = ""


# Validate update payloads for booking status.

class BookingStatusUpdate(BaseModel):
    status: str


# Validate the rating and review payload submitted by a user.

class RatingSubmit(BaseModel):
    serviceId: str
    rating: int
    review: str = ""


# Validate create payloads for service.

class ServiceCreate(BaseModel):
    name: str = ""
    description: str = ""
    price: float
    category: str = ""
    serviceType: str = ""
    location: str = ""
    imageUrl: Optional[str] = None
    imageUrls: list[str] = Field(default_factory=list)
    isActive: bool = True
    vendorId: str = ""


# Validate update payloads for service.

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    serviceType: Optional[str] = None
    location: Optional[str] = None
    imageUrl: Optional[str] = None
    imageUrls: Optional[list[str]] = None
    isActive: Optional[bool] = None
    vendorId: Optional[str] = None
