import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquare, RefreshCw, Star } from "lucide-react";
import { Button } from "@vendor/react-app/components/ui/button";
import { formatDateInIndia } from "@vendor/react-app/lib/dateTime";
import { getServices, type Service } from "@vendor/react-app/services/api";
import { useNavigate } from "react-router";

type ServiceReviewItem = {
  id: string | number;
  serviceId: string | number;
  serviceName: string;
  author: string;
  primaryUserName: string;
  partnerName: string;
  rating: number;
  review: string;
  createdAt: string;
};

export default function RecentReviews() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const loadServices = useCallback(async (showPageLoader = false) => {
    if (showPageLoader) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const data = await getServices();
      setServices(data);
    } catch (error) {
      console.error("Failed to load service reviews:", error);
    } finally {
      if (showPageLoader) {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadServices(true);
  }, [loadServices]);

  const reviews = useMemo(() => {
    const flattened: ServiceReviewItem[] = [];

    services.forEach((service) => {
      (service.reviews || []).forEach((review, index) => {
        flattened.push({
          id: review.id || `${service.id}-${index + 1}`,
          serviceId: service.id,
          serviceName: service.name || service.category || "Service",
          author: review.author || "Client",
          primaryUserName: review.primaryUserName || review.author || "Client",
          partnerName: review.partnerName || "",
          rating: Number(review.rating || 0),
          review: review.review || "",
          createdAt: review.createdAt || "",
        });
      });
    });

    return flattened.sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return rightTime - leftTime;
    });
  }, [services]);

  return (
    <div className="overflow-hidden rounded-xl border border-[hsl(var(--gold))]/10 bg-white shadow-sm">
      <div className="border-b border-[hsl(var(--gold))]/10 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Customer Reviews</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Read all reviews shared by couples across your services.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadServices(false)}
              disabled={isLoading || isRefreshing}
              className="rounded-full"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-[hsl(var(--gold))]"
              onClick={() => navigate("/dashboard/services")}
            >
              View Services
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--gold))]" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="px-6 py-10 text-center text-muted-foreground">
          No customer reviews yet.
        </div>
      ) : (
        <div className="max-h-[34rem] divide-y divide-[hsl(var(--gold))]/5 overflow-y-auto">
          {reviews.map((review, index) => (
            <div
              key={`${review.serviceId}-${review.id}`}
              className="animate-in fade-in slide-in-from-bottom-2 p-5"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">
                      {review.primaryUserName || review.author}
                      {review.partnerName ? ` & ${review.partnerName}` : ""}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--gold))]/10 px-2.5 py-1 text-xs font-medium text-mauve-dark">
                      <Star className="h-3 w-3 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
                      {review.rating}/5
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-mauve">{review.serviceName}</p>
                  <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--gold))]" />
                    <p className="leading-relaxed">
                      {review.review || "Rated this service without a written review."}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-xs text-muted-foreground">
                  {review.createdAt
                    ? formatDateInIndia(review.createdAt, { month: "short", day: "numeric", year: "numeric" })
                    : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
