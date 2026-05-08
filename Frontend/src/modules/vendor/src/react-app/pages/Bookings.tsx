import { useEffect, useState } from "react";
import { Calendar, Loader2, MapPin, RefreshCw, Star, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@vendor/react-app/components/ui/card";
import { Badge } from "@vendor/react-app/components/ui/badge";
import { formatDateInIndia, formatDateTimeInIndia } from "@vendor/react-app/lib/dateTime";
import { getRecentBookings, updateBookingStatus, type Booking, type BookingStatus } from "../services/api";

const statusClass = (status: BookingStatus) => {
  if (status === "approved") {
    return "bg-gold/10 text-mauve-dark border-gold/30";
  }
  if (status === "in_progress") {
    return "bg-sky-100 text-sky-800 border-sky-200";
  }
  if (status === "pending") {
    return "bg-rose/10 text-mauve border-rose/30";
  }
  if (status === "completed") {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }
  return "bg-destructive/10 text-destructive border-destructive/20";
};

const statusLabel = (status: BookingStatus) => {
  if (status === "approved") {
    return "Approved";
  }
  if (status === "in_progress") {
    return "In Progress";
  }
  if (status === "rejected") {
    return "Rejected";
  }
  if (status === "completed") {
    return "Completed";
  }
  // if (status === "cancelled") {
  //   return "Cancelled";
  // }
  return "Pending";
};

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingBookingId, setUpdatingBookingId] = useState<Booking["id"] | null>(null);
  const [pageError, setPageError] = useState("");

  const loadBookings = async (showPageLoader = false) => {
    if (showPageLoader) {
      setLoading(true);
    }

    try {
      setPageError("");
      const data = await getRecentBookings();
      setBookings((data || []) as Booking[]);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to load bookings.");
    } finally {
      if (showPageLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadBookings(true);
  }, []);

  const handleRefreshBookings = async () => {
    setIsRefreshing(true);
    try {
      await loadBookings();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = async (bookingId: Booking["id"], status: BookingStatus) => {
    setUpdatingBookingId(bookingId);

    try {
      setPageError("");
      const updatedBooking = await updateBookingStatus(bookingId, status);
      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === bookingId ? updatedBooking : booking
        )
      );
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to update booking status.");
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const getBookingBudget = (booking: Booking) =>
    booking.estimatedBudget ?? booking.budget ?? booking.totalAmount ?? booking.amount ?? booking.price;

  const getBookingEventDate = (booking: Booking) =>
    formatDateInIndia(booking.eventDate, { day: "numeric", month: "short", year: "numeric" }, "TBD");

  const getBookingLastUpdated = (booking: Booking) =>
    formatDateTimeInIndia(booking.updatedAt || booking.createdAt, undefined, "-");

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-mauve" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">Bookings</h1>
          <p className="mt-1 text-muted-foreground">Manage client bookings and monitor service ratings.</p>
        </div>
        <button
          type="button"
          onClick={() => void handleRefreshBookings()}
          disabled={isRefreshing}
          className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-white px-4 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <Card className="border-[hsl(var(--mauve))]/20 shadow-sm">
        <CardHeader className="border-b border-[hsl(var(--mauve))]/15 bg-gradient-to-r from-cream/60 to-blush/40">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-mauve" />
            Recent Bookings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pageError ? (
            <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {pageError}
            </div>
          ) : null}
          {bookings.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No bookings available.
            </div>
          ) : (
            <>
              <div className="space-y-4 p-4 sm:hidden">
                {bookings.map((booking) => (
                  <div
                    key={`mobile-${booking.id}`}
                    className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 font-medium text-foreground">
                          <User className="h-4 w-4 text-mauve" />
                          <span>{booking.clientName}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{booking.serviceName}</p>
                      </div>
                      <Badge variant="outline" className={statusClass(booking.status)}>
                        {statusLabel(booking.status)}
                      </Badge>
                    </div>

                    <div className="mt-4 grid gap-3">
                      <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-muted-foreground">Budget</span>
                        <span className="font-semibold text-mauve-dark">
                          Rs {getBookingBudget(booking)?.toLocaleString?.() || "50,000"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-muted-foreground">Location</span>
                        <span className="text-right text-foreground">{booking.location?.trim() || "-"}</span>
                      </div>
                      <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-muted-foreground">Date</span>
                        <span className="text-right text-foreground">
                          {getBookingEventDate(booking)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-muted-foreground">Guests</span>
                        <span className="text-right text-foreground">
                          {booking.guestCount ? `${booking.guestCount.toLocaleString()} guests` : "-"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-muted-foreground">Updated</span>
                        <span className="text-right text-foreground">{getBookingLastUpdated(booking)}</span>
                      </div>
                      {booking.notes?.trim() ? (
                        <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
                          <span className="text-muted-foreground">Notes</span>
                          <p className="mt-1 text-foreground">{booking.notes}</p>
                        </div>
                      ) : null}
                      <div className="flex items-start justify-between gap-3 text-sm">
                        <span className="pt-1 text-muted-foreground">Ratings</span>
                        {booking.serviceTotalReviews && booking.serviceTotalReviews > 0 ? (
                          <div className="space-y-1 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                              <span className="font-medium text-foreground">
                                {Number(booking.serviceAverageRating || 0).toFixed(1)}/5
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {booking.serviceTotalReviews} rating{booking.serviceTotalReviews === 1 ? "" : "s"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No ratings yet</span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Update Status
                        </label>
                        <select
                          className="h-10 w-full rounded-full border border-border bg-white px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-[hsl(var(--gold))] focus:ring-2 focus:ring-[hsl(var(--gold))]/20 disabled:cursor-not-allowed disabled:opacity-60"
                          value={booking.status}
                          onChange={(e) =>
                            handleStatusChange(booking.id, e.target.value as BookingStatus)
                          }
                          disabled={updatingBookingId === booking.id}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="rejected">Reject</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Budget</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Guests</th>
                    <th className="px-4 py-3">Notes</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Service Ratings</th>
                    <th className="px-4 py-3">Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="border-t border-border/70 transition-colors hover:bg-muted/25"
                    >
                      <td className="px-4 py-4 font-medium text-foreground">
                        <span className="inline-flex items-center gap-2">
                          <User className="h-4 w-4 text-mauve" />
                          {booking.clientName}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-foreground">{booking.serviceName}</td>
                      <td className="px-4 py-4 font-semibold text-mauve-dark">
                        Rs {getBookingBudget(booking)?.toLocaleString?.() || "50,000"}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-mauve" />
                          {booking.location?.trim() || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {getBookingEventDate(booking)}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {booking.guestCount ? booking.guestCount.toLocaleString() : "-"}
                      </td>
                      <td className="max-w-xs px-4 py-4 text-muted-foreground">
                        <span className="line-clamp-2">
                          {booking.notes?.trim() || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="outline" className={statusClass(booking.status)}>
                          {statusLabel(booking.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        {booking.serviceTotalReviews && booking.serviceTotalReviews > 0 ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                              <span className="text-xs font-medium text-foreground">
                                {Number(booking.serviceAverageRating || 0).toFixed(1)}/5
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({booking.serviceTotalReviews} rating{booking.serviceTotalReviews === 1 ? "" : "s"})
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No ratings yet</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          className="h-10 min-w-[140px] rounded-full border border-border bg-white px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-[hsl(var(--gold))] focus:ring-2 focus:ring-[hsl(var(--gold))]/20 disabled:cursor-not-allowed disabled:opacity-60"
                          value={booking.status}
                          onChange={(e) =>
                            handleStatusChange(booking.id, e.target.value as BookingStatus)
                          }
                          disabled={updatingBookingId === booking.id}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="rejected">Reject</option>
                          {/* <option value="cancelled">Cancelled</option> */}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
