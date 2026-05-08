import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ClipboardList, Loader2, MapPin, Save, Star, User, Users } from "lucide-react";
import { Badge } from "@user/react-app/components/ui/badge";
import { Button } from "@user/react-app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@user/react-app/components/ui/card";
import { Input } from "@user/react-app/components/ui/input";
import { Label } from "@user/react-app/components/ui/label";
import { Textarea } from "@user/react-app/components/ui/textarea";
import VendorRatingDialog from "@user/react-app/components/VendorRatingDialog";
import { formatDateInIndia } from "@user/react-app/lib/dateTime";
import {
  fetchUserBookings,
  type BookingStatus,
  type UserBooking,
  updateUserBooking,
} from "@user/react-app/services/bookingsApi";
import { submitVendorRating } from "@user/react-app/services/ratingsApi";
import { getVendorByline } from "@user/react-app/services/vendorsApi";
import bgImage from "@user/img/bg_image_2.png";

type UserSession = {
  email?: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const toDateInputValue = (value: string) => {
  const normalized = String(value || "").trim();
  const matchedIsoDate = normalized.match(/^(\d{4}-\d{2}-\d{2})/);
  if (matchedIsoDate) {
    return matchedIsoDate[1];
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const mergeBookingsPreservingDirty = (
  currentBookings: UserBooking[],
  incomingBookings: UserBooking[],
  dirtyIds: Set<string>,
) => {
  if (dirtyIds.size === 0) {
    return incomingBookings;
  }

  const currentBookingMap = new Map(currentBookings.map((booking) => [booking.id, booking]));
  const mergedBookings = incomingBookings.map((booking) => (
    dirtyIds.has(booking.id) ? currentBookingMap.get(booking.id) || booking : booking
  ));
  const mergedIds = new Set(mergedBookings.map((booking) => booking.id));

  currentBookings.forEach((booking) => {
    if (dirtyIds.has(booking.id) && !mergedIds.has(booking.id)) {
      mergedBookings.push(booking);
    }
  });

  return mergedBookings;
};

const statusLabel = (status: BookingStatus) => {
  if (status === "approved") {
    return "Confirmed";
  }
  if (status === "in_progress") {
    return "In Progress";
  }
  if (status === "rejected") {
    return "Declined";
  }
  if (status === "completed") {
    return "Completed";
  }
  if (status === "cancelled") {
    return "Cancelled";
  }
  return "Pending";
};

const statusClass = (status: BookingStatus) => {
  if (status === "approved" || status === "completed") {
    return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
  }
  if (status === "in_progress") {
    return "bg-sky-100 text-sky-800 hover:bg-sky-100";
  }
  if (status === "rejected" || status === "cancelled") {
    return "bg-destructive/10 text-destructive hover:bg-destructive/10";
  }
  return "bg-rose/10 text-rose hover:bg-rose/10";
};

const ratingApprovalLabel = (status: string) => {
  if (status === "pending") {
    return "Pending admin approval";
  }
  if (status === "rejected") {
    return "Review rejected by admin";
  }
  if (status === "approved") {
    return "Visible on user and vendor pages";
  }
  return "";
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [pageError, setPageError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [savingBookingId, setSavingBookingId] = useState<string | null>(null);
  const [savingRatingBookingId, setSavingRatingBookingId] = useState<string | null>(null);
  const [activeRatingBookingId, setActiveRatingBookingId] = useState<string | null>(null);
  const [dirtyBookingIds, setDirtyBookingIds] = useState<string[]>([]);
  const dirtyBookingIdsRef = useRef<Set<string>>(new Set());

  const getBookedByLabel = (booking: UserBooking) => {
    if (booking.bookedByLabel) {
      return booking.bookedByLabel;
    }

    return `Booked by (${booking.bookedByName || booking.bookedBy || "User"})`;
  };

  const loadBookings = async (email: string, showLoader = true) => {
    if (!email) {
      return;
    }

    if (showLoader) {
      setIsLoading(true);
    }
    setPageError("");
    try {
      const data = await fetchUserBookings(email);
      setBookings((currentBookings) => (
        mergeBookingsPreservingDirty(currentBookings, data, dirtyBookingIdsRef.current)
      ));
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to load booking requests.");
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    dirtyBookingIdsRef.current = new Set(dirtyBookingIds);
  }, [dirtyBookingIds]);

  useEffect(() => {
    const sessionRaw = sessionStorage.getItem("elegance_user_session");
    if (!sessionRaw) {
      window.location.assign("/auth");
      return;
    }

    let sessionEmail = "";
    try {
      const session = JSON.parse(sessionRaw) as UserSession;
      sessionEmail = String(session.email || "").trim().toLowerCase();
    } catch {
      sessionEmail = "";
    }

    if (!sessionEmail) {
      window.location.assign("/auth");
      return;
    }

    setUserEmail(sessionEmail);
    void loadBookings(sessionEmail);
  }, []);

  useEffect(() => {
    if (!userEmail) {
      return;
    }

    const refreshInterval = window.setInterval(() => {
      void loadBookings(userEmail, false);
    }, 12000);

    return () => window.clearInterval(refreshInterval);
  }, [userEmail]);

  const summary = useMemo(() => {
    const pending = bookings.filter((booking) => booking.status === "pending").length;
    const confirmed = bookings.filter(
      (booking) =>
        booking.status === "approved" || booking.status === "in_progress" || booking.status === "completed",
    ).length;
    const actionNeeded = bookings.filter(
      (booking) => booking.status === "rejected" || booking.status === "cancelled",
    ).length;

    return { pending, confirmed, actionNeeded };
  }, [bookings]);

  const activeRatingBooking = useMemo(
    () => bookings.find((booking) => booking.id === activeRatingBookingId) || null,
    [activeRatingBookingId, bookings],
  );

  const markBookingDirty = (id: string) => {
    setDirtyBookingIds((current) => (current.includes(id) ? current : [...current, id]));
  };

  const clearBookingDirty = (id: string) => {
    setDirtyBookingIds((current) => current.filter((bookingId) => bookingId !== id));
  };

  const updateBookingField = (
    id: string,
    field: "eventDate" | "location" | "guestCount" | "estimatedBudget" | "notes",
    value: string | number,
  ) => {
    setBookings((current) =>
      current.map((booking) => (booking.id === id ? { ...booking, [field]: value } : booking)),
    );
    markBookingDirty(id);
  };

  const saveBooking = async (id: string) => {
    if (!userEmail) {
      setPageError("Unable to find user session email.");
      return;
    }

    const booking = bookings.find((item) => item.id === id);
    if (!booking) {
      return;
    }

    try {
      setPageError("");
      setSavingBookingId(id);
      const response = await updateUserBooking(id, {
        userEmail,
        eventDate: booking.eventDate,
        location: booking.location,
        guestCount: booking.guestCount,
        estimatedBudget: booking.estimatedBudget,
        notes: booking.notes,
      });

      const updatedAt = response.updatedAt || new Date().toISOString();
      setBookings((current) =>
        current.map((item) => (item.id === id ? { ...item, updatedAt } : item)),
      );
      clearBookingDirty(id);
      setSaveMessage("Booking request updated.");
      window.setTimeout(() => setSaveMessage(""), 1800);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to save booking request.");
    } finally {
      setSavingBookingId(null);
    }
  };

  const openRatingDialog = (booking: UserBooking) => {
    if (!booking.canRate || !booking.serviceId) {
      setPageError("You can rate this service only after interacting with it.");
      return;
    }

    setPageError("");
    setActiveRatingBookingId(String(booking.id || "").trim());
  };

  const saveRating = async (payload: { rating: number; review: string }) => {
    if (!activeRatingBooking) {
      return;
    }

    if (!activeRatingBooking.serviceId) {
      setPageError("Unable to identify the service for this booking.");
      return;
    }

    setPageError("");
    setSavingRatingBookingId(activeRatingBooking.id);
    try {
      const response = await submitVendorRating({
        serviceId: activeRatingBooking.serviceId,
        rating: payload.rating,
        review: payload.review,
      });

      await loadBookings(userEmail, false);
      setActiveRatingBookingId(null);
      setSaveMessage(response.message || "Service rating submitted.");
      window.setTimeout(() => setSaveMessage(""), 1800);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to submit service rating.");
    } finally {
      setSavingRatingBookingId(null);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      <header className="sticky top-0 z-40 border-b border-rose/20 bg-white/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-sm font-medium text-rose">User Portal</p>
            <h1 className="font-display text-2xl font-semibold text-foreground">Booking Requests</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!isLoading && userEmail) {
                  void loadBookings(userEmail);
                }
              }}
              disabled={isLoading || !userEmail}
            >
              <Loader2 className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => window.location.assign("/user/couple/favorites")}>
              <Star className="mr-2 h-4 w-4" />
              Favorites
            </Button>
            <Button variant="outline" onClick={() => window.location.assign("/user/couple")}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <VendorRatingDialog
        open={Boolean(activeRatingBooking)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveRatingBookingId(null);
          }
        }}
        vendorName={
          activeRatingBooking?.businessName || activeRatingBooking?.service || activeRatingBooking?.vendorName || "Service"
        }
        averageRating={activeRatingBooking?.serviceAverageRating || 0}
        totalReviews={activeRatingBooking?.serviceTotalReviews || 0}
        initialRating={activeRatingBooking?.userRating || 0}
        initialReview={activeRatingBooking?.userReview || ""}
        isSubmitting={Boolean(
          activeRatingBooking && savingRatingBookingId === activeRatingBooking.id,
        )}
        onSubmit={saveRating}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-rose/20">
            <CardHeader className="pb-2">
              <CardDescription>Pending Requests</CardDescription>
              <CardTitle className="font-display text-3xl text-rose">{summary.pending}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-gold/20">
            <CardHeader className="pb-2">
              <CardDescription>Confirmed Bookings</CardDescription>
              <CardTitle className="font-display text-3xl text-gold">{summary.confirmed}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-mauve/20">
            <CardHeader className="pb-2">
              <CardDescription>Action Needed</CardDescription>
              <CardTitle className="font-display text-3xl text-mauve">{summary.actionNeeded}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {pageError && (
          <div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {pageError}
          </div>
        )}

        {saveMessage && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {saveMessage}
          </div>
        )}

        <div className="mt-6 space-y-5">
          {!isLoading && bookings.map((booking) => {
            const isDirty = dirtyBookingIds.includes(booking.id);

            return (
              <Card key={booking.id} className="border-rose/20 shadow-sm">
                <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="font-display text-xl">{booking.businessName || booking.service || "Service"}</CardTitle>
                      <Badge className={statusClass(booking.status)}>{statusLabel(booking.status)}</Badge>
                    </div>
                    <CardDescription className="mt-2 flex flex-wrap items-center gap-3">
                      <span>{booking.service || "Service"}</span>
                      {getVendorByline(booking) ? <span>{getVendorByline(booking)}</span> : null}
                      <span className="inline-flex items-center gap-1 text-foreground/80">
                        <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                        {booking.serviceTotalReviews > 0
                          ? `${booking.serviceAverageRating.toFixed(1)} (${booking.serviceTotalReviews} review${
                              booking.serviceTotalReviews === 1 ? "" : "s"
                            })`
                          : "No reviews yet"}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Updated {formatDateInIndia(booking.updatedAt || booking.createdAt)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3 md:grid-cols-5">
                    <div className="rounded-xl border border-rose/15 bg-white/80 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Request ID</p>
                      <p className="mt-1 font-medium text-foreground">{booking.id}</p>
                    </div>
                    <div className="rounded-xl border border-rose/15 bg-white/80 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Booked By</p>
                      <p className="mt-1 flex items-center gap-2 font-medium text-foreground">
                        <User className="h-4 w-4 text-rose" />
                        {getBookedByLabel(booking)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-rose/15 bg-white/80 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Event Date</p>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <CalendarDays className="h-4 w-4 text-rose" />
                          <span>{booking.eventDate ? formatDateInIndia(booking.eventDate) : "Select a date"}</span>
                        </div>
                        <Input
                          type="date"
                          value={toDateInputValue(booking.eventDate)}
                          onChange={(event) => updateBookingField(booking.id, "eventDate", event.target.value)}
                          className="border-rose/20 focus-visible:ring-rose"
                        />
                      </div>
                    </div>
                    <div className="rounded-xl border border-rose/15 bg-white/80 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</p>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <MapPin className="h-4 w-4 text-rose" />
                          <span>{booking.location || "Add event location"}</span>
                        </div>
                        <Input
                          value={booking.location}
                          onChange={(event) => updateBookingField(booking.id, "location", event.target.value)}
                          placeholder="Enter event location"
                          className="border-rose/20 focus-visible:ring-rose"
                        />
                      </div>
                    </div>
                    <div className="rounded-xl border border-rose/15 bg-white/80 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Guests</p>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Users className="h-4 w-4 text-rose" />
                          <span>{booking.guestCount || 0} guests</span>
                        </div>
                        <Input
                          type="number"
                          min={0}
                          value={String(booking.guestCount || 0)}
                          onChange={(event) => updateBookingField(booking.id, "guestCount", Number(event.target.value || 0))}
                          className="border-rose/20 focus-visible:ring-rose"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/20 bg-gold/5 px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estimated Budget</p>
                      <div className="mt-2 space-y-2">
                        <p className="font-display text-2xl font-semibold text-gold">
                          {formatCurrency(booking.estimatedBudget)}
                        </p>
                        <Input
                          type="number"
                          min={0}
                          step="1000"
                          value={String(booking.estimatedBudget || 0)}
                          onChange={(event) => updateBookingField(
                            booking.id,
                            "estimatedBudget",
                            Number(event.target.value || 0),
                          )}
                          className="max-w-xs border-gold/30 bg-white focus-visible:ring-gold"
                        />
                      </div>
                    </div>
                    <div className="w-full sm:w-auto sm:min-w-[220px]">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vendor Status</p>
                      <Badge className={`mt-2 ${statusClass(booking.status)}`}>{statusLabel(booking.status)}</Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-rose/20 bg-white/90 p-4">
                    <div className="space-y-1">
                      <Label className="text-sm font-semibold text-foreground">Service Rating</Label>
                      <p className="text-sm text-muted-foreground">
                        {booking.userRating > 0
                          ? `Your rating: ${booking.userRating}/5${booking.userReview ? " with a review" : ""}${
                              booking.userRatingStatus === "pending"
                                ? ". It is waiting for admin approval."
                                : booking.userRatingStatus === "rejected"
                                  ? ". It is not visible publicly right now."
                                  : ""
                            }`
                          : "You have not rated this service yet."}
                      </p>
                      {booking.userRating > 0 && booking.userRatingStatus ? (
                        <p className="text-xs font-medium text-rose">
                          {ratingApprovalLabel(booking.userRatingStatus)}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      onClick={() => openRatingDialog(booking)}
                      disabled={!booking.canRate}
                      className="bg-rose text-white hover:bg-rose/90"
                    >
                      <Star className="mr-2 h-4 w-4" />
                      {booking.userRating > 0 ? "Update Rating" : "Rate Service"}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`notes-${booking.id}`}>Booking Notes / Update Request</Label>
                    <Textarea
                      id={`notes-${booking.id}`}
                      value={booking.notes}
                      onChange={(event) => updateBookingField(booking.id, "notes", event.target.value)}
                      placeholder="Add any request updates for this booking..."
                      className="min-h-28 border-rose/20 focus-visible:ring-rose"
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                    {isDirty ? (
                      <p className="text-sm font-medium text-rose">You have unsaved booking changes.</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">All booking changes saved.</p>
                    )}
                    <Button
                      onClick={() => void saveBooking(booking.id)}
                      disabled={savingBookingId === booking.id || !isDirty}
                      className="w-full bg-gradient-to-r from-rose to-gold text-white hover:opacity-90 sm:w-auto"
                    >
                      {savingBookingId === booking.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {!isLoading && bookings.length === 0 && (
            <Card className="border-dashed border-rose/30">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <ClipboardList className="h-12 w-12 text-rose/40" />
                <h2 className="mt-4 font-display text-2xl font-semibold text-foreground">No Booking Requests Yet</h2>
                <p className="mt-2 max-w-md text-muted-foreground">
                  Once you start sending requests to vendors, they will appear here for tracking and updates.
                </p>
              </CardContent>
            </Card>
          )}

          {isLoading && (
            <Card className="border-rose/20">
              <CardContent className="flex items-center justify-center py-20">
                <Loader2 className="mr-2 h-5 w-5 animate-spin text-rose" />
                <span className="text-sm text-muted-foreground">Loading booking requests...</span>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
