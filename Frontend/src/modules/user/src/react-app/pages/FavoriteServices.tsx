import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Heart, Loader2, MapPin, Star, Trash2 } from "lucide-react";

import VendorDetailModal from "@user/react-app/components/VendorDetailModal";
import { Button } from "@user/react-app/components/ui/button";
import { Badge } from "@user/react-app/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@user/react-app/components/ui/card";
import { formatDateInIndia } from "@user/react-app/lib/dateTime";
import {
  addFavoriteService,
  fetchFavoriteServices,
  removeFavoriteService,
  type FavoriteService,
} from "@user/react-app/services/favoritesApi";
import { getBusinessDisplayName, getServiceLabel, getVendorByline } from "@user/react-app/services/vendorsApi";
import bgImage from "../../img/bg_image_2.png";

type UserSession = {
  email?: string;
};

export default function FavoriteServicesPage() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [favorites, setFavorites] = useState<FavoriteService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<FavoriteService | null>(null);
  const [pendingServiceId, setPendingServiceId] = useState<string | null>(null);

  const favoriteServiceIds = useMemo(
    () => new Set(favorites.map((favorite) => String(favorite.serviceId || "").trim()).filter(Boolean)),
    [favorites],
  );

  const loadFavorites = async (email: string, showLoader = true) => {
    if (!email) {
      return;
    }

    if (showLoader) {
      setIsLoading(true);
    }

    try {
      setPageError("");
      const data = await fetchFavoriteServices(email);
      setFavorites(data);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to load favorite services.");
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const sessionRaw = sessionStorage.getItem("elegance_user_session");
    if (!sessionRaw) {
      window.location.assign("/auth");
      return;
    }

    try {
      const session = JSON.parse(sessionRaw) as UserSession;
      const email = String(session.email || "").trim().toLowerCase();
      if (!email) {
        window.location.assign("/auth");
        return;
      }

      setUserEmail(email);
      void loadFavorites(email);
    } catch {
      window.location.assign("/auth");
    }
  }, []);

  const setTransientMessage = (message: string) => {
    setPageMessage(message);
    window.setTimeout(() => setPageMessage(""), 1800);
  };

  const toggleFavorite = async (favorite: FavoriteService) => {
    const serviceId = String(favorite.serviceId || favorite.id || "").trim();
    if (!userEmail || !serviceId) {
      setPageError("Unable to resolve the service to save.");
      return;
    }

    setPageError("");
    setPendingServiceId(serviceId);
    try {
      if (favoriteServiceIds.has(serviceId)) {
        await removeFavoriteService({ userEmail, serviceId });
        setFavorites((current) => current.filter((item) => String(item.serviceId) !== serviceId));
        setTransientMessage("Service removed from favorites.");
        if (selectedVendor && String(selectedVendor.serviceId) === serviceId) {
          setSelectedVendor(null);
        }
      } else {
        const savedFavorite = await addFavoriteService({
          userEmail,
          serviceId,
          vendorId: favorite.vendorId,
        });
        if (savedFavorite) {
          setFavorites((current) => [savedFavorite, ...current.filter((item) => String(item.serviceId) !== serviceId)]);
        } else {
          await loadFavorites(userEmail, false);
        }
        setTransientMessage("Service added to favorites.");
      }
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to update favorite service.");
    } finally {
      setPendingServiceId(null);
    }
  };

  return (
    <>
      {selectedVendor && (
        <VendorDetailModal
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
          accentColor="rose"
          isFavorite={favoriteServiceIds.has(String(selectedVendor.serviceId || "").trim())}
          isFavoriteBusy={pendingServiceId === String(selectedVendor.serviceId || "").trim()}
          onToggleFavorite={() => void toggleFavorite(selectedVendor)}
        />
      )}

      <div
        className="min-h-screen bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <header className="sticky top-0 z-40 border-b border-rose/20 bg-white/85 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-sm font-medium text-rose">User Portal</p>
              <h1 className="font-display text-2xl font-semibold text-foreground">Favorite Services</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => userEmail && void loadFavorites(userEmail)} disabled={isLoading}>
                <Loader2 className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={() => navigate("/couple")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-rose/20">
              <CardHeader className="pb-2">
                <CardDescription>Saved Services</CardDescription>
                <CardTitle className="font-display text-3xl text-rose">{favorites.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-gold/20">
              <CardHeader className="pb-2">
                <CardDescription>Vendors Covered</CardDescription>
                <CardTitle className="font-display text-3xl text-gold">
                  {new Set(favorites.map((favorite) => String(favorite.vendorId || "").trim()).filter(Boolean)).size}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-mauve/20">
              <CardHeader className="pb-2">
                <CardDescription>Top Saved Rating</CardDescription>
                <CardTitle className="font-display text-3xl text-mauve">
                  {favorites.length > 0
                    ? Math.max(...favorites.map((favorite) => Number(favorite.averageRating || 0))).toFixed(1)
                    : "0.0"}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {pageError && (
            <div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {pageError}
            </div>
          )}

          {pageMessage && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {pageMessage}
            </div>
          )}

          {isLoading ? (
            <Card className="mt-6 border-rose/20">
              <CardContent className="flex items-center justify-center py-20">
                <Loader2 className="mr-2 h-5 w-5 animate-spin text-rose" />
                <span className="text-sm text-muted-foreground">Loading favorite services...</span>
              </CardContent>
            </Card>
          ) : favorites.length === 0 ? (
            <Card className="mt-6 border-dashed border-rose/30">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Heart className="h-12 w-12 text-rose/40" />
                <h2 className="mt-4 font-display text-2xl font-semibold text-foreground">No Favorite Services Yet</h2>
                <p className="mt-2 max-w-md text-muted-foreground">
                  Save services while browsing recommendations and they will appear here for quick comparison.
                </p>
                <Button className="mt-6 bg-gradient-to-r from-rose to-gold text-white" onClick={() => navigate("/couple")}>
                  Browse Services
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {favorites.map((favorite) => {
                const serviceId = String(favorite.serviceId || favorite.id || "").trim();
                const isPending = pendingServiceId === serviceId;

                return (
                  <Card key={favorite.favoriteId || serviceId} className="border-rose/20 shadow-sm">
                    <div className="relative aspect-[16/10] bg-muted">
                      <img
                        src={favorite.image}
                        alt={getBusinessDisplayName(favorite)}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute left-3 top-3 flex gap-2">
                        <Badge className="bg-white/90 text-foreground shadow-sm">
                          {getServiceLabel(favorite.service)}
                        </Badge>
                        <Badge className="bg-rose text-white shadow-sm">
                          <Heart className="mr-1 h-3 w-3 fill-current" />
                          Saved
                        </Badge>
                      </div>
                    </div>
                    <CardHeader className="space-y-3">
                      <div>
                        <CardTitle className="font-display text-xl">{getBusinessDisplayName(favorite)}</CardTitle>
                        <CardDescription className="mt-1">
                          {getVendorByline(favorite) || favorite.serviceName || favorite.service}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {favorite.location || "Location not specified"}
                        </span>
                        <span className="font-semibold text-rose">
                          ₹{favorite.price.toLocaleString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col gap-2 rounded-xl border border-rose/15 bg-white/80 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <span className="inline-flex items-center gap-1 text-foreground/90">
                          <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                          {favorite.averageRating.toFixed(1)} ({favorite.totalReviews} review{favorite.totalReviews === 1 ? "" : "s"})
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Saved {favorite.savedAt ? formatDateInIndia(favorite.savedAt) : "recently"}
                        </span>
                      </div>

                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {favorite.description || "Saved for later comparison."}
                      </p>

                      <div className="grid gap-2">
                        <Button
                          className="w-full bg-rose text-white hover:bg-rose/90"
                          onClick={() => setSelectedVendor(favorite)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                          onClick={() => void toggleFavorite(favorite)}
                          disabled={isPending}
                        >
                          {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          Remove Favorite
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
