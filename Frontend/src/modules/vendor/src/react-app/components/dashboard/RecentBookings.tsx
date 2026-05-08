import { useState, useEffect } from "react";
import { Calendar, Clock, User, MoreHorizontal, Loader2 } from "lucide-react";
import { Badge } from "@vendor/react-app/components/ui/badge";
import { Button } from "@vendor/react-app/components/ui/button";
import { formatDateInIndia } from "@vendor/react-app/lib/dateTime";
import { cn } from "@vendor/react-app/lib/utils";
import { getRecentBookings, type Booking } from "@vendor/react-app/services/api";
import { useNavigate } from "react-router";

const statusStyles = {
  pending: "bg-rose/10 text-mauve border-rose/25",
  approved: "bg-gold/10 text-mauve-dark border-gold/25",
  in_progress: "bg-sky-100 text-sky-800 border-sky-200",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  completed: "bg-mauve/10 text-magenta border-mauve/25",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabel = (status: Booking["status"]) => {
  if (status === "in_progress") {
    return "In Progress";
  }
  return status.replace(/_/g, " ");
};

type RecentBookingsProps = {
  bookings?: Booking[];
};

export default function RecentBookings({ bookings: providedBookings }: RecentBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>(providedBookings || []);
  const [isLoading, setIsLoading] = useState(!providedBookings);
  const navigate = useNavigate();

  const getBookingBudget = (booking: Booking) =>
    booking.estimatedBudget ?? booking.budget ?? booking.totalAmount ?? booking.amount ?? booking.price;

  useEffect(() => {
    if (providedBookings) {
      setBookings(providedBookings);
      setIsLoading(false);
      return;
    }

    loadBookings();
  }, [providedBookings]);

  const loadBookings = async () => {
    try {
      const data = await getRecentBookings();
      setBookings(data as Booking[]);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return formatDateInIndia(dateStr, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }, "TBD");
  };
  return (
    <div className="bg-white rounded-xl border border-[hsl(var(--gold))]/10 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-[hsl(var(--gold))]/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Recent Bookings</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Latest booking requests</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[hsl(var(--gold))]"
            onClick={() => navigate("/dashboard/bookings")}
          >
            View All
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--gold))]" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No recent bookings
        </div>
      ) : (
        <div className="divide-y divide-[hsl(var(--gold))]/5">
          {bookings.map((booking, index) => (
            <div
              key={booking.id}
              className="p-4 hover:bg-[hsl(var(--cream))]/50 transition-colors animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground truncate">
                      {booking.clientName}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn("text-xs capitalize", statusStyles[booking.status])}
                    >
                      {statusLabel(booking.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {booking.serviceName}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(booking.eventDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {booking.eventTime || "Flexible"}
                    </span>
                  </div>
                </div>
                
                <div className="text-left sm:text-right">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Budget
                  </p>
                  <p className="font-semibold text-foreground">
                    ₹{getBookingBudget(booking)?.toLocaleString?.() || "50000"}
                  </p>
                  <Button variant="ghost" size="icon-xs" className="mt-1">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
