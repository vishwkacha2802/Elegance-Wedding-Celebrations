import { FormEvent, useEffect, useState } from "react";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Send,
  Star,
  X,
} from "lucide-react";
import { Button } from "@user/react-app/components/ui/button";
import { Input } from "@user/react-app/components/ui/input";
import { Textarea } from "@user/react-app/components/ui/textarea";
import { Label } from "@user/react-app/components/ui/label";
import { Badge } from "@user/react-app/components/ui/badge";
import { formatDateInIndia } from "@user/react-app/lib/dateTime";
import {
  createVendorInquiry,
  getBusinessDisplayName,
  getVendorByline,
  getServiceLabel,
  VendorRecommendation,
} from "@user/react-app/services/vendorsApi";

interface VendorDetailModalProps {
  vendor: VendorRecommendation;
  onClose: () => void;
  accentColor?: "rose" | "gold";
  isFavorite?: boolean;
  isFavoriteBusy?: boolean;
  onToggleFavorite?: (vendor: VendorRecommendation) => void | Promise<void>;
  inquiryBudget?: number;
  inquiryLocation?: string;
}

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  weddingDate: "",
  budget: "",
  guestCount: "",
  message: "",
};

type UserSession = {
  email?: string;
};

export default function VendorDetailModal({
  vendor,
  onClose,
  accentColor = "rose",
  isFavorite = false,
  isFavoriteBusy = false,
  onToggleFavorite,
  inquiryBudget,
  inquiryLocation,
}: VendorDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [formData, setFormData] = useState(initialFormData);
  const [sessionUserEmail, setSessionUserEmail] = useState("");

  const isRose = accentColor === "rose";
  const accentClasses = isRose
    ? { bg: "bg-rose", bgLight: "bg-rose/10", text: "text-rose", border: "border-rose", ring: "ring-rose" }
    : { bg: "bg-gold", bgLight: "bg-gold/10", text: "text-gold", border: "border-gold", ring: "ring-gold" };

  const vendorImages =
    Array.isArray(vendor.portfolio) && vendor.portfolio.length > 0
      ? vendor.portfolio
      : [vendor.image || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800"];
  const businessName = getBusinessDisplayName(vendor);
  const vendorByline = getVendorByline(vendor, "Provided by");

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [vendor.id, vendor.serviceId, vendor.image]);

  useEffect(() => {
    const sessionRaw = sessionStorage.getItem("elegance_user_session");
    if (!sessionRaw) {
      return;
    }

    try {
      const session = JSON.parse(sessionRaw) as UserSession;
      const email = String(session.email || "").trim().toLowerCase();
      if (!email) {
        return;
      }
      setSessionUserEmail(email);
      setFormData((current) => (current.email ? current : { ...current, email }));
    } catch {
      setSessionUserEmail("");
    }
  }, []);

  useEffect(() => {
    if (!(Number(inquiryBudget || 0) > 0)) {
      return;
    }

    setFormData((current) => {
      if (String(current.budget || "").trim()) {
        return current;
      }

      return {
        ...current,
        budget: String(Math.round(Number(inquiryBudget || 0))),
      };
    });
  }, [inquiryBudget]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % vendorImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + vendorImages.length) % vendorImages.length);
  };

  const handleSubmitInquiry = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const budgetValue = Number(formData.budget || inquiryBudget || 0);
      const guestCountValue = Number(formData.guestCount || 0);
      const { name, email, phone, weddingDate, message } = formData;
      await createVendorInquiry(vendor.vendorId || vendor.id, {
        name,
        email,
        userEmail: sessionUserEmail || email,
        serviceId: vendor.serviceId || vendor.id,
        phone,
        weddingDate,
        budget: Number.isFinite(budgetValue) && budgetValue > 0 ? budgetValue : 0,
        allocatedBudget: Number.isFinite(budgetValue) && budgetValue > 0 ? budgetValue : 0,
        location: String(inquiryLocation || "").trim(),
        guestCount: Number.isFinite(guestCountValue) && guestCountValue > 0 ? guestCountValue : 0,
        serviceType: vendor.service,
        message,
      });
      setInquirySubmitted(true);
      setTimeout(() => {
        setShowInquiryForm(false);
        setInquirySubmitted(false);
        setFormData(initialFormData);
      }, 1500);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to send inquiry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg transition-colors hover:bg-white"
        >
          <X className="h-5 w-5 text-foreground" />
        </button>

        <div className="flex-1 overflow-y-auto">
          <div className="relative aspect-[16/9] bg-muted">
            <img
              src={vendorImages[currentImageIndex]}
              alt={businessName}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />

            {vendorImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg transition-colors hover:bg-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg transition-colors hover:bg-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                  {vendorImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-2 w-2 rounded-full transition-all ${
                        index === currentImageIndex ? "w-6 bg-white" : "bg-white/50 hover:bg-white/75"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="absolute left-4 top-4">
              <Badge className={`${accentClasses.bg} text-white shadow-lg`}>{getServiceLabel(vendor.service)}</Badge>
            </div>
          </div>

          {vendorImages.length > 1 && (
            <div className="border-b border-border/60 bg-white px-4 py-4 md:px-6">
              <div className="flex gap-3 overflow-x-auto pb-1">
                {vendorImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                      index === currentImageIndex
                        ? `${accentClasses.border} ring-2 ${accentClasses.ring}/20`
                        : "border-border/60 hover:border-foreground/20"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${businessName} preview ${index + 1}`}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-6 md:p-8">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="mb-1 font-display text-2xl font-bold text-foreground md:text-3xl">{businessName}</h2>
                {vendorByline ? <p className="mb-3 text-sm font-medium text-mauve">{vendorByline}</p> : null}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {vendor.location || "Location not specified"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-medium text-foreground">{vendor.averageRating.toFixed(1)}</span>
                    <span>({vendor.totalReviews} reviews)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {vendor.availability}
                  </span>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-sm text-muted-foreground">Starting at</p>
                <p className={`text-3xl font-bold ${accentClasses.text}`}>₹{vendor.price.toLocaleString()}</p>
              </div>
            </div>

            <p className="mb-6 leading-relaxed text-muted-foreground">{vendor.description}</p>

            <div className="mb-8">
              <h3 className="mb-3 font-display font-semibold text-foreground">What's Included</h3>
              {vendor.features.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {vendor.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className={`h-4 w-4 ${accentClasses.text}`} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No feature details available.</p>
              )}
            </div>

            <div className={`${accentClasses.bgLight} mb-8 rounded-xl p-4`}>
              <h3 className="mb-3 font-display font-semibold text-foreground">Contact Information</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                {vendor.contact.phone && (
                  <a href={`tel:${vendor.contact.phone}`} className="flex items-center gap-2 hover:underline">
                    <Phone className="h-4 w-4" />
                    {vendor.contact.phone}
                  </a>
                )}
                {vendor.contact.email && (
                  <a href={`mailto:${vendor.contact.email}`} className="flex items-center gap-2 hover:underline">
                    <Mail className="h-4 w-4" />
                    {vendor.contact.email}
                  </a>
                )}
                {!vendor.contact.phone && !vendor.contact.email && (
                  <span className="text-muted-foreground">No contact details available.</span>
                )}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="mb-4 font-display font-semibold text-foreground">Customer Reviews</h3>
              {vendor.reviews.length > 0 ? (
                <div className="space-y-4">
                  {vendor.reviews.map((review) => (
                    <div key={review.id} className="rounded-xl border border-border p-4">
                      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${accentClasses.bgLight}`}
                          >
                            <Heart className={`h-4 w-4 ${accentClasses.text}`} />
                          </div>
                          <div>
                            <span className="block font-medium text-foreground">
                              {review.primaryUserName || review.author}
                              {review.partnerName ? ` & ${review.partnerName}` : ""}
                            </span>
                            {review.partnerName ? (
                              <span className="text-xs text-muted-foreground">Couple review</span>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, index) => (
                            <Star
                              key={index}
                              className={`h-4 w-4 ${
                                index < review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {review.review || review.comment || "Rated this service."}
                      </p>
                      {review.date ? (
                        <p className="mt-2 text-xs text-muted-foreground">{formatDateInIndia(review.date)}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No reviews yet.</p>
              )}
            </div>

            {!showInquiryForm ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => setShowInquiryForm(true)}
                  className={`flex-1 ${
                    isRose ? "bg-gradient-to-r from-rose to-gold" : "bg-gradient-to-r from-gold to-rose"
                  } text-white shadow-lg`}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Send Inquiry
                </Button>
                <Button
                  variant="outline"
                  className={`${accentClasses.border} ${isFavorite ? "bg-rose/10 text-rose" : accentClasses.text}`}
                  onClick={() => {
                    if (onToggleFavorite) {
                      void onToggleFavorite(vendor);
                    }
                  }}
                  disabled={!onToggleFavorite || isFavoriteBusy}
                >
                  {isFavoriteBusy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Heart className={`mr-2 h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                  )}
                  {isFavorite ? "Saved to Favorites" : "Save to Favorites"}
                </Button>
              </div>
            ) : (
              <div className={`rounded-xl border-2 p-6 ${accentClasses.border}`}>
                <h3 className="mb-4 flex items-center gap-2 font-display font-semibold text-foreground">
                  <Send className={`h-5 w-5 ${accentClasses.text}`} />
                  Send Inquiry to {businessName}
                </h3>

                {inquirySubmitted ? (
                  <div className="py-8 text-center">
                    <div
                      className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${accentClasses.bgLight}`}
                    >
                      <Check className={`h-8 w-8 ${accentClasses.text}`} />
                    </div>
                    <h4 className="mb-2 font-display font-semibold text-foreground">Inquiry Sent!</h4>
                    <p className="text-sm text-muted-foreground">{businessName} will respond to your inquiry soon.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitInquiry} className="space-y-4">
                    {submitError && (
                      <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {submitError}
                      </div>
                    )}
                    {(Number(inquiryBudget || 0) > 0 || String(inquiryLocation || "").trim()) && (
                      <div className={`rounded-xl border px-4 py-3 ${accentClasses.border} ${accentClasses.bgLight}`}>
                        <div className="grid gap-3 text-sm sm:grid-cols-2">
                          <div>
                            <p className="text-muted-foreground">Allocated service budget</p>
                            <p className="font-semibold text-foreground">
                              {Number(inquiryBudget || formData.budget || 0) > 0
                                ? `₹${Number(inquiryBudget || formData.budget || 0).toLocaleString("en-IN")}`
                                : "Not provided"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Event location</p>
                            <p className="font-semibold text-foreground">{inquiryLocation || "Not provided"}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Your Name *</Label>
                        <Input
                          id="name"
                          required
                          value={formData.name}
                          onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weddingDate">Wedding Date</Label>
                        <Input
                          id="weddingDate"
                          type="date"
                          value={formData.weddingDate}
                          onChange={(event) => setFormData({ ...formData, weddingDate: event.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* <div className="space-y-2">
                        <Label htmlFor="budget">Budget (INR)</Label>
                        <Input
                          id="budget"
                          type="number"
                          min="0"
                          value={formData.budget}
                          onChange={(event) => setFormData({ ...formData, budget: event.target.value })}
                          placeholder="e.g. 300000"
                        />
                      </div> */}
                      <div className="space-y-2">
                        <Label htmlFor="guestCount">Number of Guests</Label>
                        <Input
                          id="guestCount"
                          type="number"
                          min="1"
                          value={formData.guestCount}
                          onChange={(event) => setFormData({ ...formData, guestCount: event.target.value })}
                          placeholder="e.g. 200"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        required
                        value={formData.message}
                        onChange={(event) => setFormData({ ...formData, message: event.target.value })}
                        placeholder="Tell us about your wedding plans and any questions you have..."
                        rows={4}
                      />
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className={`flex-1 ${
                          isRose ? "bg-gradient-to-r from-rose to-gold" : "bg-gradient-to-r from-gold to-rose"
                        } text-white`}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {isSubmitting ? "Sending..." : "Book Service"}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowInquiryForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
