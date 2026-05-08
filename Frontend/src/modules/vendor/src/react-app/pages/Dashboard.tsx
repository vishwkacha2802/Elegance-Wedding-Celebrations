import { useState, useEffect } from "react";
import { CalendarCheck, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, MapPin, CheckCircle2, IndianRupee, Loader2, User } from "lucide-react";
import StatCard from "@vendor/react-app/components/dashboard/StatCard";
import RecentBookings from "@vendor/react-app/components/dashboard/RecentBookings";
// import QuickActions from "@vendor/react-app/components/dashboard/QuickActions";
import EarningsChart from "@vendor/react-app/components/dashboard/EarningsChart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@vendor/react-app/components/ui/dialog";
import { formatDateInIndia } from "@vendor/react-app/lib/dateTime";
import { cn } from "@vendor/react-app/lib/utils";
import { getRecentBookings, getStats, type Booking } from "@vendor/react-app/services/api";

interface Stats {
  totalBookings: number;
  pendingBookings: number;
  approvedBookings: number;
  currentMonthBookings: number;
  lastMonthBookings: number;
  currentMonthApprovedBookings: number;
  lastMonthApprovedBookings: number;
  totalEarnings: number;
  monthlyEarnings: { month: string; total: number }[];
}

const getTrend = (current: number, previous: number) => {
  const delta = current - previous;
  const percent = previous > 0
    ? (delta / previous) * 100
    : current > 0
      ? 100
      : 0;
  const normalizedPercent = Number(
    (Number.isInteger(percent) ? percent.toFixed(0) : percent.toFixed(1))
  );

  return {
    value: Math.abs(normalizedPercent),
    isPositive: delta > 0,
    direction: delta > 0 ? "up" as const : delta < 0 ? "down" as const : "flat" as const,
  };
};

const CALENDAR_WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const BOOKED_STATUSES: Booking["status"][] = ["approved", "in_progress", "completed"];

const getDateKey = (value: Date | string): string => {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const normalized = String(value || "").trim();
  const matchedIsoDate = normalized.match(/^(\d{4}-\d{2}-\d{2})/);
  if (matchedIsoDate) {
    return matchedIsoDate[1];
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? "" : getDateKey(parsed);
};

const getBookedDateCounts = (bookings: Booking[]) => (
  bookings.reduce<Record<string, number>>((dateCounts, booking) => {
    if (!BOOKED_STATUSES.includes(booking.status)) {
      return dateCounts;
    }

    const dateKey = getDateKey(booking.eventDate);
    if (!dateKey) {
      return dateCounts;
    }

    return {
      ...dateCounts,
      [dateKey]: (dateCounts[dateKey] || 0) + 1,
    };
  }, {})
);

const getBookedBookingsByDate = (bookings: Booking[]) => (
  bookings.reduce<Record<string, Booking[]>>((bookingGroups, booking) => {
    if (!BOOKED_STATUSES.includes(booking.status)) {
      return bookingGroups;
    }

    const dateKey = getDateKey(booking.eventDate);
    if (!dateKey) {
      return bookingGroups;
    }

    return {
      ...bookingGroups,
      [dateKey]: [...(bookingGroups[dateKey] || []), booking],
    };
  }, {})
);

const getCompletedDateKeys = (bookings: Booking[]) => (
  bookings.reduce<Set<string>>((dateKeys, booking) => {
    if (booking.status !== "completed") {
      return dateKeys;
    }

    const dateKey = getDateKey(booking.eventDate);
    if (dateKey) {
      dateKeys.add(dateKey);
    }

    return dateKeys;
  }, new Set<string>())
);

const getCalendarDays = (
  baseDate: Date,
  bookedDateCounts: Record<string, number>,
  completedDateKeys: Set<string>,
) => {
  const currentYear = baseDate.getFullYear();
  const currentMonth = baseDate.getMonth();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPreviousMonth = new Date(currentYear, currentMonth, 0).getDate();
  const startDay = firstDayOfMonth.getDay();
  const today = new Date();
  const accessibleDateFormatter = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - startDay + 1;
    const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
    const displayDate = isCurrentMonth
      ? dayNumber
      : dayNumber <= 0
        ? daysInPreviousMonth + dayNumber
        : dayNumber - daysInMonth;
    const date = isCurrentMonth
      ? new Date(currentYear, currentMonth, dayNumber)
      : dayNumber <= 0
        ? new Date(currentYear, currentMonth - 1, daysInPreviousMonth + dayNumber)
        : new Date(currentYear, currentMonth + 1, dayNumber - daysInMonth);

    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
    const dateKey = getDateKey(date);
    const bookingCount = bookedDateCounts[dateKey] || 0;
    const hasCompletedBooking = completedDateKeys.has(dateKey);

    return {
      key: date.toISOString(),
      dateKey,
      label: displayDate,
      accessibleLabel: bookingCount > 0
        ? `${accessibleDateFormatter.format(date)}. ${bookingCount} confirmed booking${bookingCount === 1 ? "" : "s"}${hasCompletedBooking ? ", including a completed event" : ""}.`
        : accessibleDateFormatter.format(date),
      isCurrentMonth,
      isToday,
      hasBooking: bookingCount > 0,
      hasCompletedBooking,
      bookingCount,
    };
  });
};

function DashboardCalendarCard({ bookings }: { bookings: Booking[] }) {
  const currentDate = new Date();
  const [displayedMonth, setDisplayedMonth] = useState(
    () => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  );
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const bookedDateCounts = getBookedDateCounts(bookings);
  const bookedBookingsByDate = getBookedBookingsByDate(bookings);
  const completedDateKeys = getCompletedDateKeys(bookings);
  const monthLabel = new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(displayedMonth);
  const calendarDays = getCalendarDays(displayedMonth, bookedDateCounts, completedDateKeys);
  const selectedBookings = selectedDateKey ? bookedBookingsByDate[selectedDateKey] || [] : [];
  const selectedDateLabel = selectedDateKey
    ? formatDateInIndia(selectedDateKey, { day: "numeric", month: "long", year: "numeric" })
    : "";

  const showPreviousMonth = () => {
    setDisplayedMonth((previousMonth) => (
      new Date(previousMonth.getFullYear(), previousMonth.getMonth() - 1, 1)
    ));
  };

  const showNextMonth = () => {
    setDisplayedMonth((previousMonth) => (
      new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 1)
    ));
  };

  const showCurrentMonth = () => {
    setDisplayedMonth(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  };

  return (
    <div className="h-full overflow-hidden rounded-[1.5rem] border border-[hsl(var(--gold))]/10 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[hsl(var(--gold))]/10 p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={showPreviousMonth}
            aria-label="Show previous month"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-black/5 text-foreground transition-colors hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold))] focus-visible:ring-offset-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={showNextMonth}
            aria-label="Show next month"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-black/5 text-foreground transition-colors hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold))] focus-visible:ring-offset-2"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--gold))]/15 bg-white px-3.5 py-1.5 text-sm font-medium text-foreground shadow-sm">
          <CalendarDays className="h-4 w-4 text-[hsl(var(--gold))]" />
          <span>{monthLabel}</span>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Calendar
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-black px-2.5 py-1 text-[11px] font-medium text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Booked
            </span>
            <button
              type="button"
              onClick={showCurrentMonth}
              className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold))] focus-visible:ring-offset-2"
            >
              Today
            </button>
          </div>
        </div>

        <div
          className="grid grid-cols-7 gap-y-3 text-center"
          role="grid"
          aria-label={`Calendar for ${monthLabel}`}
        >
          {CALENDAR_WEEKDAYS.map((weekday) => (
            <span key={weekday} className="text-[11px] font-medium text-muted-foreground">
              {weekday}
            </span>
          ))}

          {calendarDays.map((day) => (
            <div
              key={day.key}
              role="gridcell"
              aria-label={day.accessibleLabel}
              aria-current={day.isToday ? "date" : undefined}
              className="flex justify-center"
            >
              {day.hasBooking ? (
                <button
                  type="button"
                  onClick={() => setSelectedDateKey(day.dateKey)}
                  className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold))] focus-visible:ring-offset-2",
                    selectedDateKey === day.dateKey ? "ring-2 ring-[hsl(var(--gold))] ring-offset-2" : "",
                  )}
                >
                  {day.hasCompletedBooking ? (
                    <Check
                      className="pointer-events-none absolute inset-0 m-auto h-7 w-7 stroke-[3] text-emerald-200/40"
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="relative z-10">{day.label}</span>
                  {day.bookingCount > 1 ? (
                    <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--gold))] px-1 text-[10px] font-semibold leading-none text-black">
                      {day.bookingCount}
                    </span>
                  ) : null}
                </button>
              ) : (
                <div
                  className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors",
                    day.isCurrentMonth
                      ? "border border-black/5 bg-black/[0.02] text-foreground hover:bg-[hsl(var(--gold))]/10"
                      : "text-muted-foreground/40",
                    day.isToday ? "ring-2 ring-[hsl(var(--gold))]/50 ring-offset-2" : "",
                  )}
                >
                  {day.label}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Dialog open={selectedBookings.length > 0} onOpenChange={(open) => !open && setSelectedDateKey(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Events on {selectedDateLabel}</DialogTitle>
            <DialogDescription>
              Confirmed bookings scheduled for this date.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {selectedBookings.map((booking) => {
              const bookingBudget =
                booking.estimatedBudget ?? booking.budget ?? booking.totalAmount ?? booking.amount ?? booking.price;

              return (
                <div
                  key={booking.id}
                  className="rounded-2xl border border-[hsl(var(--gold))]/15 bg-[hsl(var(--gold))]/[0.04] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{booking.serviceName}</p>
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        {booking.status.replace(/_/g, " ")}
                      </p>
                    </div>
                    {bookingBudget ? (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
                        ₹{bookingBudget.toLocaleString()}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-[hsl(var(--gold))]" />
                      <span>{booking.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[hsl(var(--gold))]" />
                      <span>{booking.eventTime || "Flexible timing"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[hsl(var(--gold))]" />
                      <span>{booking.location?.trim() || "Location not provided"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [statsResult, bookingsResult] = await Promise.allSettled([
        getStats(),
        getRecentBookings(),
      ]);

      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value);
      } else {
        console.error("Failed to load stats:", statsResult.reason);
      }

      if (bookingsResult.status === "fulfilled") {
        setBookings(bookingsResult.value);
      } else {
        console.error("Failed to load bookings for calendar:", bookingsResult.reason);
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--gold))]" />
      </div>
    );
  }

  const monthlyEarnings = stats?.monthlyEarnings || [];
  const latestBudget = monthlyEarnings[monthlyEarnings.length - 1]?.total || 0;
  const previousBudget = monthlyEarnings[monthlyEarnings.length - 2]?.total || 0;
  const totalBookingsTrend = getTrend(stats?.currentMonthBookings || 0, stats?.lastMonthBookings || 0);
  const approvedBookingsTrend = getTrend(
    stats?.currentMonthApprovedBookings || 0,
    stats?.lastMonthApprovedBookings || 0,
  );
  const totalBudgetTrend = getTrend(latestBudget, previousBudget);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-2xl font-serif font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's an overview of your business.</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Bookings"
          value={stats?.totalBookings || 0}
          subtitle="All time bookings"
          icon={CalendarCheck}
          trend={totalBookingsTrend}
          variant="gold"
        />
        <StatCard
          title="Pending Requests"
          value={stats?.pendingBookings || 0}
          subtitle="Awaiting your response"
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Approved Bookings"
          value={stats?.approvedBookings || 0}
          subtitle="This month"
          icon={CheckCircle2}
          trend={approvedBookingsTrend}
          variant="success"
        />
        <StatCard
          title="Total Budget"
          value={`₹${(stats?.totalEarnings || 0).toLocaleString()}`}
          subtitle="Approved and completed bookings"
          icon={IndianRupee}
          trend={totalBudgetTrend}
          variant="gold"
        />
      </div>

      {/* Charts and Actions */}
      <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(280px,0.95fr)]">
        <div className="min-w-0 h-full">
          <EarningsChart monthlyData={stats?.monthlyEarnings || []} />
        </div>
        <DashboardCalendarCard bookings={bookings} />
        {/* <div>
          <QuickActions />
        </div> */}
      </div>

      <RecentBookings bookings={bookings} />
    </div>
  );
}
