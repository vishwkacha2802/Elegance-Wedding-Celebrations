import { Edit2, IndianRupee, MapPin, Package, Star, Trash2, X } from "lucide-react";
import { Badge } from "@vendor/react-app/components/ui/badge";
import { Button } from "@vendor/react-app/components/ui/button";
import { Card, CardContent } from "@vendor/react-app/components/ui/card";
import type { Service } from "@vendor/react-app/services/api";

type ServiceCardProps = {
  service: Service;
  serviceTypeLabel: string;
  isDeletePending: boolean;
  onEdit: (service: Service) => void;
  onRequestDelete: (serviceId: Service["id"]) => void;
  onConfirmDelete: (serviceId: Service["id"]) => void;
  onCancelDelete: () => void;
};

export default function ServiceCard({
  service,
  serviceTypeLabel,
  isDeletePending,
  onEdit,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: ServiceCardProps) {
  return (
    <Card className="group overflow-hidden border-[hsl(var(--gold))]/10 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-[hsl(var(--gold))]/10 via-white to-[hsl(var(--gold))]/5">
        {service.imageUrl ? (
          <img
            src={service.imageUrl}
            alt={service.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <Package className="h-12 w-12 text-[hsl(var(--gold))]/35" />
        )}

        <div className="absolute left-4 top-4 flex items-center gap-2">
          <Badge className="bg-white/95 text-foreground shadow-sm">{serviceTypeLabel}</Badge>
          {!service.isActive ? (
            <Badge variant="secondary" className="bg-black/70 text-white">
              Inactive
            </Badge>
          ) : null}
        </div>

        <div className="absolute right-4 top-4 flex items-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          <Button variant="secondary" size="icon-xs" onClick={() => onEdit(service)}>
            <Edit2 className="h-3.5 w-3.5" />
          </Button>

          {isDeletePending ? (
            <>
              <Button variant="destructive" size="icon-xs" onClick={() => onConfirmDelete(service.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="secondary" size="icon-xs" onClick={onCancelDelete}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="icon-xs" onClick={() => onRequestDelete(service.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{serviceTypeLabel}</h3>
              <p className="text-sm text-muted-foreground">
                {service.location?.trim() ? service.location : "Location coming soon"}
              </p>
            </div>
          </div>

          <p className="line-clamp-3 text-sm text-muted-foreground">
            {service.description?.trim() || "Add a short description so clients understand what this location package includes."}
          </p>
        </div>

        <div className="grid gap-3 rounded-2xl border border-[hsl(var(--gold))]/10 bg-[hsl(var(--gold))]/5 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Price</p>
            <div className="mt-2 flex items-center gap-1 text-lg font-semibold text-foreground">
              <IndianRupee className="h-4 w-4 text-[hsl(var(--gold))]" />
              {Number(service.price || 0).toLocaleString("en-IN")}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Reviews</p>
            <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
              <Star className="h-4 w-4 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
              {service.totalReviews && service.totalReviews > 0
                ? `${Number(service.averageRating || 0).toFixed(1)} from ${service.totalReviews} review${
                    service.totalReviews === 1 ? "" : "s"
                  }`
                : "No reviews yet"}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-[hsl(var(--gold))]" />
            {service.location?.trim() ? "Listed for this location" : "Location missing"}
          </span>
          <span className={service.isActive ? "text-emerald-600" : "text-muted-foreground"}>
            {service.isActive ? "Visible to clients" : "Hidden from clients"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
