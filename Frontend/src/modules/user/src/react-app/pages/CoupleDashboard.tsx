import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Check,
  MailOpen,
  MapPin,
  IndianRupee,
  Sparkles,
  Camera,
  Music,
  Utensils,
  PartyPopper,
  Palette,
  Car,
  ChevronRight,
  Gem,
  Crown,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Star,
  Heart,
  ClipboardList,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@user/react-app/components/ui/button";
import { Input } from "@user/react-app/components/ui/input";
import { Label } from "@user/react-app/components/ui/label";
import { Checkbox } from "@user/react-app/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@user/react-app/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@user/react-app/components/ui/card";
import { Badge } from "@user/react-app/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@user/react-app/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@user/react-app/components/ui/dialog";
import VendorDetailModal from "@user/react-app/components/VendorDetailModal";
import VendorRatingDialog from "@user/react-app/components/VendorRatingDialog";
import { fetchUserBookings, type UserBooking } from "@user/react-app/services/bookingsApi";
import {
  addFavoriteService,
  fetchFavoriteServices,
  removeFavoriteService,
  type FavoriteService,
} from "@user/react-app/services/favoritesApi";
import { submitVendorRating } from "@user/react-app/services/ratingsApi";
import {
  VendorRecommendation,
  VendorRecommendationGroup,
  getBusinessDisplayName,
  getRecommendedVendors,
  getServiceLabel,
  getVendorByline,
} from "@user/react-app/services/vendorsApi";
import bgImage1 from "../../img/bg_image_1.png";
import bgImage2 from "../../img/bg_image_2.png";

const SERVICES = [
  { id: "venue", label: "Venue", icon: MapPin, color: "text-rose" },
  { id: "catering", label: "Catering", icon: Utensils, color: "text-gold" },
  { id: "photography", label: "Photography", icon: Camera, color: "text-mauve" },
  { id: "decoration", label: "Decoration", icon: Palette, color: "text-magenta" },
  { id: "makeup", label: "Makeup & Styling", icon: Sparkles, color: "text-gold" },
  { id: "music", label: "Music & DJ", icon: Music, color: "text-mauve-dark" },
  { id: "Entry", label: "Entry Style", icon: PartyPopper, color: "text-rose" },
  { id: "transportation", label: "Transportation", icon: Car, color: "text-muted-foreground" },
  { id: "Invitation", label: "Invitation", icon: MailOpen, color: "text-magenta" },
];

const INDIA_STATES_AND_UTS = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

type AccountPopupView = "brideProfile" | "groomProfile" | null;

type AccountPopupConfig = {
  title: string;
  description: string;
  actionLabel: string;
  profileType: "bride" | "groom";
  viewType: "profile" | "settings";
  icon: typeof Crown;
  iconGradient: string;
  iconText: string;
  panelBorder: string;
  panelBackground: string;
  actionGradient: string;
};

const ACCOUNT_POPUP_CONFIG: Record<Exclude<AccountPopupView, null>, AccountPopupConfig> = {
  brideProfile: {
    title: "Bride Profile",
    description: "Manage the bride account details directly from the dashboard.",
    actionLabel: "Save Profile",
    profileType: "bride",
    viewType: "profile",
    icon: Crown,
    iconGradient: "from-rose to-gold",
    iconText: "text-white",
    panelBorder: "border-rose/20",
    panelBackground: "bg-gradient-to-r from-rose/5 to-gold/5",
    actionGradient: "from-rose to-gold",
  },
  groomProfile: {
    title: "Groom Profile",
    description: "Manage the groom account details directly from the dashboard.",
    actionLabel: "Save Profile",
    profileType: "groom",
    viewType: "profile",
    icon: Gem,
    iconGradient: "from-gold to-rose",
    iconText: "text-white",
    panelBorder: "border-gold/20",
    panelBackground: "bg-gradient-to-r from-gold/5 to-rose/5",
    actionGradient: "from-gold to-rose",
  },
};

type UserSession = {
  name?: string;
  email?: string;
  primaryProfileType?: string;
};

const normalizeProfileType = (value: string): "bride" | "groom" | "" => {
  const normalizedValue = String(value || "").trim().toLowerCase();
  return normalizedValue === "bride" || normalizedValue === "groom" ? normalizedValue : "";
};

type RecommendationRequestState = {
  selectedServices: string[];
  budget: number;
  location: string;
};

const formatSessionDisplayName = (name: string, email: string) => {
  const normalizedName = String(name || "").trim();
  if (normalizedName) {
    return normalizedName;
  }

  const localPart = String(email || "").trim().split("@", 1)[0].replace(/[._-]+/g, " ").trim();
  if (!localPart) {
    return "User";
  }

  return localPart
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getInitials = (value: string) => {
  const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "U";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const getRecommendationOptionKey = (vendor: VendorRecommendation) => {
  const serviceId = String(vendor.serviceId || "").trim();
  if (serviceId) {
    return serviceId;
  }

  const vendorId = String(vendor.vendorId || vendor.id || "").trim();
  const service = String(vendor.service || "").trim().toLowerCase();
  const location = String(vendor.location || "").trim().toLowerCase();
  return `${vendorId}|${service}|${vendor.price}|${location}`;
};

const toValidPrice = (value: number) => {
  const price = Number(value || 0);
  return Number.isFinite(price) && price > 0 ? price : 0;
};

const getCheapestRecommendation = (recommendations: VendorRecommendation[]) => {
  let cheapest: VendorRecommendation | null = null;
  let cheapestPrice = 0;

  recommendations.forEach((vendor) => {
    const price = toValidPrice(vendor.price);
    if (!cheapest) {
      cheapest = vendor;
      cheapestPrice = price;
      return;
    }

    if (price > 0 && (cheapestPrice === 0 || price < cheapestPrice)) {
      cheapest = vendor;
      cheapestPrice = price;
    }
  });

  return cheapest;
};

const buildSelectedRecommendationMap = (
  groups: VendorRecommendationGroup[],
  currentSelections: Record<string, string> = {},
) => {
  const nextSelections: Record<string, string> = {};

  groups.forEach((group) => {
    if (group.recommendations.length === 0) {
      return;
    }

    const currentSelection = currentSelections[group.service];
    const hasCurrentSelection = group.recommendations.some(
      (vendor) => getRecommendationOptionKey(vendor) === currentSelection,
    );

    if (hasCurrentSelection && currentSelection) {
      nextSelections[group.service] = currentSelection;
      return;
    }

    const cheapestVendor = getCheapestRecommendation(group.recommendations);
    if (cheapestVendor) {
      nextSelections[group.service] = getRecommendationOptionKey(cheapestVendor);
    }
  });

  return nextSelections;
};

export default function CoupleDashboard() {
  const navigate = useNavigate();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendedVendors, setRecommendedVendors] = useState<VendorRecommendation[]>([]);
  const [recommendationGroups, setRecommendationGroups] = useState<VendorRecommendationGroup[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");
  const [recommendationMessage, setRecommendationMessage] = useState("");
  const [recommendationMeta, setRecommendationMeta] = useState({
    totalBudget: 0,
    estimatedMinimumTotal: 0,
    matchedServiceCount: 0,
    location: "",
    allocationStrategy: "weighted",
  });
  const [lastRecommendationRequest, setLastRecommendationRequest] = useState<RecommendationRequestState | null>(null);
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [favoriteServices, setFavoriteServices] = useState<FavoriteService[]>([]);
  const [bookingsError, setBookingsError] = useState("");
  const [ratingMessage, setRatingMessage] = useState("");
  const [favoriteMessage, setFavoriteMessage] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [pendingFavoriteServiceId, setPendingFavoriteServiceId] = useState<string | null>(null);
  const [isRefreshingDashboard, setIsRefreshingDashboard] = useState(false);
  const [activeRatingServiceId, setActiveRatingServiceId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [displayName, setDisplayName] = useState("User");
  const [profileRoutePrefix, setProfileRoutePrefix] = useState<"/couple" | "/bride" | "/groom">("/couple");
  const [selectedVendor, setSelectedVendor] = useState<VendorRecommendation | null>(null);
  const [selectedRecommendations, setSelectedRecommendations] = useState<Record<string, string>>({});
  const [activeAccountPopup, setActiveAccountPopup] = useState<AccountPopupView>(null);
  const formatInr = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  const formatRating = (value: number) => (Number.isFinite(value) ? value.toFixed(1) : "0.0");

  const interactedServices = useMemo(() => {
    const serviceMap = new Map<string, UserBooking>();
    bookings.forEach((booking) => {
      const serviceId = String(booking.serviceId || "").trim();
      if (!serviceId || serviceMap.has(serviceId)) {
        return;
      }
      serviceMap.set(serviceId, booking);
    });
    return Array.from(serviceMap.values());
  }, [bookings]);

  const interactedServiceIds = useMemo(
    () => new Set(interactedServices.map((booking) => String(booking.serviceId || "").trim()).filter(Boolean)),
    [interactedServices],
  );

  const activeRatingBooking = useMemo(
    () => interactedServices.find((booking) => booking.serviceId === activeRatingServiceId) || null,
    [activeRatingServiceId, interactedServices],
  );
  const selectedVendorAllocatedBudget = useMemo(() => {
    if (!selectedVendor) {
      return 0;
    }

    const selectedOptionKey = getRecommendationOptionKey(selectedVendor);
    for (const group of recommendationGroups) {
      if (group.recommendations.some((vendor) => getRecommendationOptionKey(vendor) === selectedOptionKey)) {
        return Number(group.allocatedBudget || 0);
      }
    }

    return 0;
  }, [recommendationGroups, selectedVendor]);

  const favoriteServiceIds = useMemo(
    () => new Set(favoriteServices.map((favorite) => String(favorite.serviceId || "").trim()).filter(Boolean)),
    [favoriteServices],
  );
  const normalizedBudget = Number(budget || 0);
  const selectedRecommendationVendors = useMemo(
    () =>
      recommendationGroups.flatMap((group) => {
        const selectedOptionKey = selectedRecommendations[group.service];
        if (!selectedOptionKey) {
          return [];
        }

        const selectedOption = group.recommendations.find(
          (vendor) => getRecommendationOptionKey(vendor) === selectedOptionKey,
        );

        return selectedOption ? [selectedOption] : [];
      }),
    [recommendationGroups, selectedRecommendations],
  );
  const selectedRecommendationSpend = useMemo(
    () => selectedRecommendationVendors.reduce((total, vendor) => total + toValidPrice(vendor.price), 0),
    [selectedRecommendationVendors],
  );
  const effectiveBudgetTotal =
    recommendationMeta.totalBudget > 0 ? recommendationMeta.totalBudget : normalizedBudget;
  const remainingBudget = Math.max(effectiveBudgetTotal - selectedRecommendationSpend, 0);
  const overBudgetAmount = Math.max(selectedRecommendationSpend - effectiveBudgetTotal, 0);
  const matchedServiceCount = recommendationGroups.filter((group) => group.recommendations.length > 0).length;
  const selectedRecommendationCount = selectedRecommendationVendors.length;
  const hasBudgetSelection =
    showRecommendations &&
    effectiveBudgetTotal > 0 &&
    selectedRecommendationCount > 0;
  const unmatchedServiceCount = Math.max(selectedServices.length - matchedServiceCount, 0);
  const unselectedMatchedServiceCount = Math.max(matchedServiceCount - selectedRecommendationCount, 0);
  const budgetSelectionLabel = selectedRecommendationCount === matchedServiceCount && matchedServiceCount > 0
    ? "Based on the vendor option selected for each matched service."
    : `Based on ${selectedRecommendationCount} selected option${selectedRecommendationCount === 1 ? "" : "s"} so far.`;
  const hasRecommendationFilters =
    selectedServices.length > 0 && Number.isFinite(normalizedBudget) && normalizedBudget > 0 && Boolean(location.trim());

  const loadUserBookings = async (email: string) => {
    if (!email) {
      return;
    }

    try {
      setBookingsError("");
      const data = await fetchUserBookings(email);
      setBookings(data);
    } catch (error) {
      setBookingsError(error instanceof Error ? error.message : "Failed to load your booked services.");
    }
  };

  const loadFavoriteServices = async (email: string) => {
    if (!email) {
      return;
    }

    try {
      const data = await fetchFavoriteServices(email);
      setFavoriteServices(data);
    } catch (error) {
      setBookingsError(error instanceof Error ? error.message : "Failed to load favorite services.");
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((s) => s !== serviceId) : [...prev, serviceId],
    );
  };

  const handleRecommendationSelect = (service: string, vendor: VendorRecommendation) => {
    setSelectedRecommendations((prev) => ({
      ...prev,
      [service]: getRecommendationOptionKey(vendor),
    }));
  };

  const handleGetRecommendations = async () => {
    if (!hasRecommendationFilters) {
      return;
    }

    const request = {
      selectedServices: [...selectedServices],
      budget: normalizedBudget,
      location: location.trim(),
    };

    setIsLoadingRecommendations(true);
    setRecommendationError("");
    setRecommendationMessage("");
    setRecommendationMeta({
      totalBudget: request.budget,
      estimatedMinimumTotal: 0,
      matchedServiceCount: 0,
      location: request.location,
      allocationStrategy: "weighted",
    });
    setSelectedRecommendations({});
    setShowRecommendations(true);

    try {
      const result = await getRecommendedVendors(request);
      setRecommendedVendors(result.recommendations);
      setRecommendationGroups(result.groups);
      setSelectedRecommendations(buildSelectedRecommendationMap(result.groups));
      setRecommendationMessage(result.message);
      setRecommendationMeta({
        totalBudget: result.totalBudget,
        estimatedMinimumTotal: result.estimatedMinimumTotal,
        matchedServiceCount: result.matchedServiceCount,
        location: result.location,
        allocationStrategy: result.allocationStrategy,
      });
      setLastRecommendationRequest(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setRecommendedVendors([]);
      setRecommendationGroups([]);
      setSelectedRecommendations({});
      setRecommendationError(message || "Failed to fetch vendor recommendations.");
      setRecommendationMessage("");
      setRecommendationMeta({
        totalBudget: request.budget,
        estimatedMinimumTotal: 0,
        matchedServiceCount: 0,
        location: request.location,
        allocationStrategy: "weighted",
      });
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    const userSession = sessionStorage.getItem("elegance_user_session");
    if (!userSession) {
      window.location.assign("/auth");
      return;
    }

    try {
      const parsedSession = JSON.parse(userSession) as UserSession;
      const sessionEmail = String(parsedSession.email || "").trim().toLowerCase();
      const sessionProfileType = normalizeProfileType(parsedSession.primaryProfileType || "");
      if (!sessionEmail) {
        window.location.assign("/auth");
        return;
      }

      setDisplayName(formatSessionDisplayName(parsedSession.name || "", sessionEmail));
      setUserEmail(sessionEmail);
      setProfileRoutePrefix(
        sessionProfileType === "bride"
          ? "/bride"
          : sessionProfileType === "groom"
            ? "/groom"
            : "/couple",
      );
      void loadUserBookings(sessionEmail);
      void loadFavoriteServices(sessionEmail);
    } catch {
      window.location.assign("/auth");
    }
  }, []);

  const dashboardInitial = useMemo(() => getInitials(displayName), [displayName]);

  const openRatingDialog = (serviceId: string) => {
    if (!serviceId || !interactedServiceIds.has(serviceId)) {
      setBookingsError("You can rate a service only after booking or contacting it.");
      return;
    }

    setBookingsError("");
    setActiveRatingServiceId(serviceId);
  };

  const saveVendorRating = async (payload: { rating: number; review: string }) => {
    if (!activeRatingBooking) {
      return;
    }

    setBookingsError("");
    setIsSubmittingRating(true);
    try {
      const response = await submitVendorRating({
        serviceId: activeRatingBooking.serviceId,
        rating: payload.rating,
        review: payload.review,
      });

      await loadUserBookings(userEmail);
      if (showRecommendations && lastRecommendationRequest) {
        try {
          const refreshedRecommendations = await getRecommendedVendors(lastRecommendationRequest);
          setRecommendedVendors(refreshedRecommendations.recommendations);
          setRecommendationGroups(refreshedRecommendations.groups);
          setSelectedRecommendations((current) =>
            buildSelectedRecommendationMap(refreshedRecommendations.groups, current),
          );
          setRecommendationMessage(refreshedRecommendations.message);
          setRecommendationMeta({
            totalBudget: refreshedRecommendations.totalBudget,
            estimatedMinimumTotal: refreshedRecommendations.estimatedMinimumTotal,
            matchedServiceCount: refreshedRecommendations.matchedServiceCount,
            location: refreshedRecommendations.location,
            allocationStrategy: refreshedRecommendations.allocationStrategy,
          });
          setRecommendationError("");
        } catch (error) {
          setRecommendationError(
            error instanceof Error ? error.message : "Failed to refresh vendor recommendations.",
          );
          setRecommendationGroups([]);
          setSelectedRecommendations({});
        }
      }

      setActiveRatingServiceId(null);
      setRatingMessage(response.message || "Service rating submitted.");
      window.setTimeout(() => setRatingMessage(""), 1800);
    } catch (error) {
      setBookingsError(error instanceof Error ? error.message : "Failed to submit service rating.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const toggleFavoriteService = async (vendor: VendorRecommendation) => {
    const serviceId = String(vendor.serviceId || vendor.id || "").trim();
    if (!userEmail || !serviceId) {
      setBookingsError("Unable to save this service to favorites.");
      return;
    }

    setBookingsError("");
    setPendingFavoriteServiceId(serviceId);
    try {
      if (favoriteServiceIds.has(serviceId)) {
        await removeFavoriteService({ userEmail, serviceId });
        setFavoriteServices((current) => current.filter((favorite) => String(favorite.serviceId) !== serviceId));
        setFavoriteMessage("Service removed from favorites.");
      } else {
        const savedFavorite = await addFavoriteService({
          userEmail,
          serviceId,
          vendorId: vendor.vendorId,
        });
        if (savedFavorite) {
          setFavoriteServices((current) => [
            savedFavorite,
            ...current.filter((favorite) => String(favorite.serviceId) !== serviceId),
          ]);
        } else {
          await loadFavoriteServices(userEmail);
        }
        setFavoriteMessage("Service added to favorites.");
      }
      window.setTimeout(() => setFavoriteMessage(""), 1800);
    } catch (error) {
      setBookingsError(error instanceof Error ? error.message : "Failed to update favorite service.");
    } finally {
      setPendingFavoriteServiceId(null);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("elegance_user_session");
    sessionStorage.removeItem("vendor");
    sessionStorage.removeItem("elegance_admin_user");
    sessionStorage.removeItem("elegance_admin_token");
    window.location.assign("/auth");
  };

  const handleRefreshDashboard = async () => {
    if (!userEmail) {
      return;
    }

    setIsRefreshingDashboard(true);
    setBookingsError("");

    try {
      await Promise.all([loadUserBookings(userEmail), loadFavoriteServices(userEmail)]);

      if (showRecommendations && lastRecommendationRequest) {
        const refreshedRecommendations = await getRecommendedVendors(lastRecommendationRequest);
        setRecommendedVendors(refreshedRecommendations.recommendations);
        setRecommendationGroups(refreshedRecommendations.groups);
        setSelectedRecommendations((current) =>
          buildSelectedRecommendationMap(refreshedRecommendations.groups, current),
        );
        setRecommendationMessage(refreshedRecommendations.message);
        setRecommendationMeta({
          totalBudget: refreshedRecommendations.totalBudget,
          estimatedMinimumTotal: refreshedRecommendations.estimatedMinimumTotal,
          matchedServiceCount: refreshedRecommendations.matchedServiceCount,
          location: refreshedRecommendations.location,
          allocationStrategy: refreshedRecommendations.allocationStrategy,
        });
        setRecommendationError("");
      }
    } catch (error) {
      setBookingsError(error instanceof Error ? error.message : "Failed to refresh dashboard data.");
    } finally {
      setIsRefreshingDashboard(false);
    }
  };

  const accountPopupConfig = activeAccountPopup ? ACCOUNT_POPUP_CONFIG[activeAccountPopup] : null;

  return (
    <>
      {selectedVendor && (
        <VendorDetailModal
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
          accentColor="rose"
          inquiryBudget={selectedVendorAllocatedBudget}
          inquiryLocation={recommendationMeta.location || location.trim()}
          isFavorite={favoriteServiceIds.has(String(selectedVendor.serviceId || "").trim())}
          isFavoriteBusy={pendingFavoriteServiceId === String(selectedVendor.serviceId || "").trim()}
          onToggleFavorite={() => void toggleFavoriteService(selectedVendor)}
        />
      )}
      <VendorRatingDialog
        open={Boolean(activeRatingBooking)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveRatingServiceId(null);
          }
        }}
        vendorName={
          activeRatingBooking?.businessName || activeRatingBooking?.service || activeRatingBooking?.vendorName || "Service"
        }
        averageRating={activeRatingBooking?.serviceAverageRating || 0}
        totalReviews={activeRatingBooking?.serviceTotalReviews || 0}
        initialRating={activeRatingBooking?.userRating || 0}
        initialReview={activeRatingBooking?.userReview || ""}
        isSubmitting={isSubmittingRating}
        onSubmit={saveVendorRating}
      />
      <Dialog open={!!activeAccountPopup} onOpenChange={(isOpen) => !isOpen && setActiveAccountPopup(null)}>
        {accountPopupConfig && (
          <DialogContent className={`max-h-[88vh] overflow-y-auto p-0 sm:max-w-2xl ${accountPopupConfig.panelBorder}`}>
            <div className={`border-b px-4 py-4 sm:px-6 sm:py-5 ${accountPopupConfig.panelBackground}`}>
              <DialogHeader className="pr-8">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${accountPopupConfig.iconGradient}`}
                  >
                    <accountPopupConfig.icon className={`h-5 w-5 ${accountPopupConfig.iconText}`} />
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="font-display text-xl font-semibold text-foreground">
                      {accountPopupConfig.title}
                    </DialogTitle>
                    <DialogDescription>{accountPopupConfig.description}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="space-y-5 px-4 pb-4 sm:px-6 sm:pb-6">
              <Card className={accountPopupConfig.panelBorder}>
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    {accountPopupConfig.viewType === "profile" ? (
                      <User
                        className={`h-5 w-5 ${
                          accountPopupConfig.profileType === "bride" ? "text-rose" : "text-gold"
                        }`}
                      />
                    ) : (
                      <Settings
                        className={`h-5 w-5 ${
                          accountPopupConfig.profileType === "bride" ? "text-rose" : "text-gold"
                        }`}
                      />
                    )}
                    {accountPopupConfig.viewType === "profile" ? "Personal Information" : "Preferences"}
                  </CardTitle>
                  <CardDescription>
                    {accountPopupConfig.viewType === "profile"
                      ? `Update ${accountPopupConfig.profileType} details for your planning account.`
                      : `Choose how ${accountPopupConfig.profileType} updates should be managed.`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {accountPopupConfig.viewType === "profile" ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`${accountPopupConfig.profileType}-first-name`}>First Name</Label>
                          <Input
                            id={`${accountPopupConfig.profileType}-first-name`}
                            defaultValue={accountPopupConfig.profileType === "bride" ? "Emily" : "James"}
                            className={`${
                              accountPopupConfig.profileType === "bride"
                                ? "border-rose/20 focus-visible:ring-rose"
                                : "border-gold/20 focus-visible:ring-gold"
                            }`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${accountPopupConfig.profileType}-last-name`}>Last Name</Label>
                          <Input
                            id={`${accountPopupConfig.profileType}-last-name`}
                            defaultValue={accountPopupConfig.profileType === "bride" ? "Johnson" : "Carter"}
                            className={`${
                              accountPopupConfig.profileType === "bride"
                                ? "border-rose/20 focus-visible:ring-rose"
                                : "border-gold/20 focus-visible:ring-gold"
                            }`}
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`${accountPopupConfig.profileType}-email`}>Email</Label>
                          <Input
                            id={`${accountPopupConfig.profileType}-email`}
                            type="email"
                            defaultValue={
                              accountPopupConfig.profileType === "bride" ? "emily@example.com" : "james@example.com"
                            }
                            className={`${
                              accountPopupConfig.profileType === "bride"
                                ? "border-rose/20 focus-visible:ring-rose"
                                : "border-gold/20 focus-visible:ring-gold"
                            }`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${accountPopupConfig.profileType}-phone`}>Phone</Label>
                          <Input
                            id={`${accountPopupConfig.profileType}-phone`}
                            defaultValue={
                              accountPopupConfig.profileType === "bride" ? "+1 555 123 4567" : "+1 555 987 6543"
                            }
                            className={`${
                              accountPopupConfig.profileType === "bride"
                                ? "border-rose/20 focus-visible:ring-rose"
                                : "border-gold/20 focus-visible:ring-gold"
                            }`}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className={`flex items-start gap-3 rounded-lg border p-4 ${accountPopupConfig.panelBorder}`}>
                        <Checkbox id={`${accountPopupConfig.profileType}-email-updates`} defaultChecked />
                        <Label htmlFor={`${accountPopupConfig.profileType}-email-updates`}>
                          Email me vendor recommendations
                        </Label>
                      </div>
                      <div className={`flex items-start gap-3 rounded-lg border p-4 ${accountPopupConfig.panelBorder}`}>
                        <Checkbox id={`${accountPopupConfig.profileType}-budget-alerts`} defaultChecked />
                        <Label htmlFor={`${accountPopupConfig.profileType}-budget-alerts`}>
                          Send alerts when selections exceed budget
                        </Label>
                      </div>
                      <div className={`flex items-start gap-3 rounded-lg border p-4 ${accountPopupConfig.panelBorder}`}>
                        <Checkbox id={`${accountPopupConfig.profileType}-weekly-reminders`} />
                        <Label htmlFor={`${accountPopupConfig.profileType}-weekly-reminders`}>
                          Receive weekly planning reminders
                        </Label>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <DialogFooter>
                <Button variant="outline" onClick={() => setActiveAccountPopup(null)}>
                  Cancel
                </Button>
                <Button
                  className={`bg-gradient-to-r text-white hover:opacity-90 ${accountPopupConfig.actionGradient}`}
                  onClick={() => setActiveAccountPopup(null)}
                >
                  {accountPopupConfig.actionLabel}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <div className="relative min-h-screen">

        {/* ✅ Fixed Background (does NOT grow) */}
        <div
          className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{
          backgroundImage: `url(${showRecommendations ? bgImage2 : bgImage1})`,
        }}
      />
      
        <header className="sticky top-0 z-50 border-b border-rose/20 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose to-gold shadow-lg shadow-rose/20">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <span className="block truncate font-display text-base font-semibold text-foreground sm:text-xl">
                  Elegance Wedding & Celebration
                </span>
                <span className="ml-0 mt-1 inline-flex rounded-full bg-gradient-to-r from-rose/10 to-gold/15 px-2 py-0.5 text-xs font-medium text-foreground sm:ml-2 sm:mt-0">
                  Bride + Groom
                </span>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:gap-3 md:w-auto md:flex-nowrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleRefreshDashboard()}
                disabled={isRefreshingDashboard}
                className="border-white/40 bg-white/85 text-foreground hover:bg-white"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshingDashboard ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">{isRefreshingDashboard ? "Refreshing..." : "Refresh"}</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <span className="mr-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-rose to-gold text-[10px] font-semibold text-white">
                      {dashboardInitial}
                    </span>
                    <span className="hidden sm:inline">{displayName}</span>
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(`${profileRoutePrefix}/profile`)}>
                    <Heart className="w-4 h-4" />
                    Couple Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/couple/bookings")}>
                    <ClipboardList className="w-4 h-4" />
                    Booking Requests
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/couple/favorites")}>
                    <Heart className="w-4 h-4" />
                    Favorite Services
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose to-gold flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                  Bride & Groom Wedding Dashboard
                </h1>
                <p className="text-white font-bold text-lg drop-shadow-lg bg-black/40 px-3 py-1 rounded">
                  Plan your dream wedding together with personalized vendor recommendations
                </p>
              </div>
            </div>
          </div>

          {bookingsError && (
            <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {bookingsError}
            </div>
          )}

          {ratingMessage && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {ratingMessage}
            </div>
          )}

          {favoriteMessage && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {favoriteMessage}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-rose/20 shadow-lg shadow-rose/5">
                <CardHeader className="bg-gradient-to-r from-rose/5 to-gold/5">
                  <CardTitle className="font-display flex items-center gap-2">
                    <Check className="w-5 h-5 text-rose" />
                    Select Required Services
                  </CardTitle>
                  <CardDescription>Choose all the services you need for your wedding</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {SERVICES.map((service) => {
                      const Icon = service.icon;
                      const isSelected = selectedServices.includes(service.id);
                      return (
                        <label
                          key={service.id}
                          className={`
                            flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                            ${
                              isSelected
                                ? "border-rose bg-rose/5 shadow-sm shadow-rose/10"
                                : "border-border hover:border-rose/30 hover:bg-rose/5"
                            }
                          `}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleServiceToggle(service.id)}
                            className="data-[state=checked]:bg-rose data-[state=checked]:border-rose"
                          />
                          <Icon className={`w-5 h-5 ${service.color}`} />
                          <span className="text-sm font-medium text-foreground">{service.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-rose/20 shadow-lg shadow-rose/5">
                <CardHeader className="bg-gradient-to-r from-gold/5 to-rose/5">
                  <CardTitle className="font-display flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-gold" />
                    Wedding Details
                  </CardTitle>
                  <CardDescription>
                    Enter one shared total budget and location. We will split that budget across the selected services.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="recommendation-budget">Budget</Label>
                      <Input
                        id="recommendation-budget"
                        type="number"
                        min="1"
                        placeholder="e.g. 150000"
                        value={budget}
                        onChange={(event) => setBudget(event.target.value)}
                        className="border-rose/20 focus-visible:ring-rose"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recommendation-location">Event Location</Label>
                      <Select value={location} onValueChange={setLocation}>
                        <SelectTrigger id="recommendation-location" className="w-full border-rose/20 focus-visible:ring-rose">
                          <SelectValue placeholder="Select a state or union territory" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDIA_STATES_AND_UTS.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3">
                    <div className="rounded-xl border border-rose/15 bg-rose/5 px-4 py-3 text-sm text-foreground/80">
                      Your total budget is shared across {selectedServices.length || 0} selected service
                      {selectedServices.length === 1 ? "" : "s"}, not applied separately to each one.
                    </div>
                    <Button
                      onClick={handleGetRecommendations}
                      disabled={!hasRecommendationFilters || isLoadingRecommendations}
                      className="h-10 w-full bg-gradient-to-r from-rose to-gold px-8 text-base font-semibold text-white hover:opacity-90 shadow-lg shadow-rose/25"
                    >
                      {isLoadingRecommendations ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      {isLoadingRecommendations ? "Fetching Recommendations..." : "Get Vendor Recommendations"}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {showRecommendations && (
                <Card className="border-rose/20 shadow-lg shadow-rose/5">
                  <CardHeader className="bg-gradient-to-r from-rose/5 to-gold/5">
                    <CardTitle className="font-display flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-gold" />
                      Recommended Vendors for Bride & Groom
                    </CardTitle>
                    <CardDescription>
                      Shared-budget recommendations grouped by service for {location.trim() || "your selected location"}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingRecommendations ? (
                      <div className="flex items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin text-rose" />
                        <p>Loading vendor services...</p>
                      </div>
                    ) : recommendationError ? (
                      <div className="text-center py-8 text-destructive">
                        <p>{recommendationError}</p>
                      </div>
                    ) : recommendationGroups.length > 0 ? (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-rose/15 bg-white/90 px-4 py-3 text-sm text-foreground/80">
                          {recommendationMessage}
                        </div>
                        <div className="rounded-xl border border-rose/15 bg-gradient-to-r from-rose/5 to-gold/5 px-4 py-4 text-sm text-foreground/80">
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <span>Shared total budget: {formatInr(recommendationMeta.totalBudget)}</span>
                            <span>Service groups matched: {recommendationMeta.matchedServiceCount}</span>
                            <span>
                              Cheapest full-match path:{" "}
                              {recommendationMeta.estimatedMinimumTotal > 0
                                ? formatInr(recommendationMeta.estimatedMinimumTotal)
                                : "Unavailable"}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-6">
                          {recommendationGroups.map((group) => (
                            <div key={group.service} className="space-y-3">
                              <div className="flex flex-col gap-2 rounded-xl border border-rose/15 bg-white/90 px-4 py-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <h3 className="font-display text-xl font-semibold text-foreground">
                                    {getServiceLabel(group.service)}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    Allocated share: {formatInr(group.allocatedBudget)} from your shared total budget
                                  </p>
                                </div>
                                <div className="text-sm text-foreground/80">
                                  {group.recommendations.length > 0
                                    ? `${group.recommendations.length} option${group.recommendations.length === 1 ? "" : "s"}`
                                    : "No options in this budget share"}
                                </div>
                              </div>

                              {group.recommendations.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                  {group.recommendations.map((vendor) => {
                                    const serviceId = String(vendor.serviceId || vendor.id || "").trim();
                                    const recommendationOptionKey = getRecommendationOptionKey(vendor);
                                    const hasInteraction = interactedServiceIds.has(serviceId);
                                    const isFavorite = favoriteServiceIds.has(serviceId);
                                    const isFavoriteBusy = pendingFavoriteServiceId === serviceId;
                                    const isSelectedRecommendation =
                                      selectedRecommendations[group.service] === recommendationOptionKey;

                                    return (
                                      <div
                                        key={`${group.service}-${serviceId || String(vendor.id)}`}
                                        className={`group relative overflow-hidden rounded-xl border transition-all hover:shadow-lg ${
                                          isSelectedRecommendation
                                            ? "border-gold shadow-lg shadow-gold/20"
                                            : "border-rose/20 hover:border-rose/40 hover:shadow-rose/10"
                                        }`}
                                      >
                                        <div className="aspect-video relative overflow-hidden">
                                          <img
                                            src={vendor.image}
                                            alt={getBusinessDisplayName(vendor)}
                                            referrerPolicy="no-referrer"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                          />
                                          <div className="absolute top-3 left-3">
                                            <Badge className="bg-white/90 text-foreground shadow-sm">
                                              {getServiceLabel(vendor.service)}
                                            </Badge>
                                          </div>
                                          {isSelectedRecommendation && (
                                            <div className="absolute right-3 top-3">
                                              <Badge className="bg-gold text-white shadow-sm">Selected</Badge>
                                            </div>
                                          )}
                                        </div>
                                        <div className="p-4 bg-white">
                                          <h4 className="mb-1 font-semibold text-foreground">{getBusinessDisplayName(vendor)}</h4>
                                          {getVendorByline(vendor, "by") ? (
                                            <p className="mb-2 text-xs font-medium text-mauve">{getVendorByline(vendor, "by")}</p>
                                          ) : null}
                                          <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                              <MapPin className="w-3 h-3" />
                                              {vendor.location}
                                            </span>
                                            <span className="font-medium text-rose">{formatInr(vendor.price)}</span>
                                          </div>
                                          <div className="flex items-center gap-1 mt-2">
                                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                            <span className="text-sm font-medium">{formatRating(vendor.averageRating)}</span>
                                            <span className="text-xs text-muted-foreground">
                                              ({vendor.totalReviews} review{vendor.totalReviews === 1 ? "" : "s"})
                                            </span>
                                          </div>
                                          <div className="mt-3 grid gap-2">
                                            <Button
                                              size="sm"
                                              className={`w-full ${
                                                isSelectedRecommendation
                                                  ? "bg-gold text-white hover:bg-gold/90"
                                                  : "bg-gold/10 text-mauve-dark hover:bg-gold/20"
                                              }`}
                                              onClick={() => handleRecommendationSelect(group.service, vendor)}
                                            >
                                              {isSelectedRecommendation ? "Selected for Budget" : "Select This Option"}
                                            </Button>
                                            <Button
                                              size="sm"
                                              className="w-full bg-rose/10 text-rose hover:bg-rose hover:text-white"
                                              onClick={() => setSelectedVendor(vendor)}
                                            >
                                              View Details
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className={`w-full border-rose/30 ${
                                                isFavorite ? "bg-rose/10 text-rose" : "text-rose hover:bg-rose/10"
                                              }`}
                                              disabled={isFavoriteBusy}
                                              onClick={() => void toggleFavoriteService(vendor)}
                                            >
                                              {isFavorite ? (
                                                <Heart className="mr-2 h-4 w-4 fill-current" />
                                              ) : (
                                                <Heart className="mr-2 h-4 w-4" />
                                              )}
                                              {isFavorite ? "Saved" : "Save Service"}
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="w-full border-rose/30 text-rose hover:bg-rose/10"
                                              disabled={!hasInteraction}
                                              onClick={() => openRatingDialog(serviceId)}
                                            >
                                              <Star className="mr-2 h-4 w-4" />
                                              {hasInteraction ? "Rate Service" : "Interact to Rate"}
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="rounded-xl border border-dashed border-rose/20 px-4 py-6 text-sm text-muted-foreground">
                                  No {getServiceLabel(group.service).toLowerCase()} services are available{" "}
                                  in {recommendationMeta.location || location.trim() || "this location"}.
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Heart className="w-12 h-12 mx-auto mb-4 text-rose/30" />
                        <p>{recommendationMessage || "No vendors found matching your filters. Try adjusting your budget or location."}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="border-2 border-rose/30 shadow-lg shadow-rose/10">
                <CardHeader className="bg-gradient-to-br from-rose/10 to-gold/10">
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Gem className="w-5 h-5 text-gold" />
                    Couple Planning Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Selected Services</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedServices.length > 0 ? (
                          selectedServices.map((id) => {
                            const service = SERVICES.find((s) => s.id === id);
                            return service ? (
                              <Badge key={id} className="bg-rose/10 text-rose border-rose/20 text-xs">
                                {service.label}
                              </Badge>
                            ) : null;
                          })
                        ) : (
                          <span className="text-sm text-muted-foreground italic">No services selected yet</span>
                        )}
                      </div>
                    </div>
                    <div className="rounded-xl border border-rose/15 bg-white/90 p-4">
                      <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-muted-foreground">Budget</span>
                        <span className="font-medium">
                          {normalizedBudget > 0 ? formatInr(normalizedBudget) : "Not set"}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-muted-foreground">Location</span>
                        <span className="font-medium">{location.trim() || "Not set"}</span>
                      </div>
                      <div className="mt-3 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-muted-foreground">Matches</span>
                        <span className="font-medium">{recommendedVendors.length}</span>
                      </div>
                      <div className="mt-3 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-muted-foreground">Budget Mode</span>
                        <span className="font-medium capitalize">{recommendationMeta.allocationStrategy}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-rose/20 shadow-lg shadow-rose/5">
                <CardHeader className="bg-gradient-to-r from-gold/10 to-rose/5">
                  <CardTitle className="font-display flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-gold" />
                    Remaining Budget
                  </CardTitle>
                  <CardDescription>
                    Track what stays available after the current service recommendations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {effectiveBudgetTotal > 0 ? (
                    <>
                      <div
                        className={`rounded-xl border px-4 py-4 ${
                          hasBudgetSelection
                            ? overBudgetAmount > 0
                              ? "border-destructive/20 bg-destructive/10"
                              : "border-gold/30 bg-gradient-to-r from-gold/10 to-rose/5"
                            : "border-rose/15 bg-white/90"
                        }`}
                      >
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          Available Now
                        </p>
                        <p
                          className={`mt-2 font-display text-3xl font-semibold ${
                            hasBudgetSelection
                              ? overBudgetAmount > 0
                                ? "text-destructive"
                                : "text-mauve-dark"
                              : "text-foreground"
                          }`}
                        >
                          {formatInr(remainingBudget)}
                        </p>
                        <p className="mt-2 text-sm text-foreground/80">
                          {hasBudgetSelection
                            ? budgetSelectionLabel
                            : "Get vendor recommendations and choose one vendor per service to calculate the remaining amount."}
                        </p>
                      </div>

                      <div className="rounded-xl border border-rose/15 bg-white/90 p-4">
                        <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-muted-foreground">Total Budget</span>
                          <span className="font-medium">{formatInr(effectiveBudgetTotal)}</span>
                        </div>
                        <div className="mt-3 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-muted-foreground">Selected Service Spend</span>
                          <span className="font-medium">
                            {hasBudgetSelection ? formatInr(selectedRecommendationSpend) : "Unavailable"}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-muted-foreground">Selected Options</span>
                          <span className="font-medium">
                            {selectedRecommendationCount}/{matchedServiceCount || 0}
                          </span>
                        </div>
                      </div>

                      {overBudgetAmount > 0 && (
                        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                          Current service projection exceeds budget by {formatInr(overBudgetAmount)}.
                        </div>
                      )}

                      {hasBudgetSelection && unselectedMatchedServiceCount > 0 && (
                        <div className="rounded-xl border border-gold/20 bg-gold/10 px-4 py-3 text-sm text-foreground/80">
                          Choose one vendor for the remaining {unselectedMatchedServiceCount} matched service
                          {unselectedMatchedServiceCount === 1 ? "" : "s"} to finalize the budget.
                        </div>
                      )}

                      {matchedServiceCount > 0 && unmatchedServiceCount > 0 && (
                        <div className="rounded-xl border border-gold/20 bg-gold/10 px-4 py-3 text-sm text-foreground/80">
                          {unmatchedServiceCount} selected service{unmatchedServiceCount === 1 ? "" : "s"} still have no
                          vendor recommendation, so this budget is a partial projection.
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed border-rose/20 px-4 py-6 text-sm text-muted-foreground">
                      Add your total budget above, then fetch vendor recommendations to see the remaining budget here.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-rose/20 shadow-lg shadow-rose/5">
                <CardHeader className="bg-gradient-to-r from-rose/5 to-gold/5">
                  <CardTitle className="font-display flex items-center gap-2">
                    <Heart className="h-5 w-5 text-rose" />
                    Favorite Services
                  </CardTitle>
                  <CardDescription>Keep a shortlist of services you want to compare later.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-xl border border-rose/15 bg-white/90 p-4">
                    <p className="text-3xl font-display font-semibold text-rose">{favoriteServices.length}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Saved service{favoriteServices.length === 1 ? "" : "s"} ready for review.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-rose/30 text-rose hover:bg-rose/10"
                    onClick={() => navigate("/couple/favorites")}
                  >
                    View Favorite Services
                  </Button>
                </CardContent>
              </Card>

              {/* <Card className="border-rose/20 shadow-lg shadow-rose/5">
                <CardHeader className="bg-gradient-to-r from-rose/5 to-gold/5">
                  <CardTitle className="font-display flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-rose" />
                    Booked & Contacted Services
                  </CardTitle>
                  <CardDescription>Rate services you have already contacted or booked.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {interactedServices.length > 0 ? (
                    interactedServices.slice(0, 4).map((booking) => (
                      <div
                        key={`interacted-${booking.serviceId}`}
                        className="rounded-xl border border-rose/15 bg-white/90 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground">{booking.vendorName || "Vendor"}</p>
                            <p className="text-sm text-muted-foreground">{booking.service || "Service"}</p>
                            <p className="mt-2 inline-flex items-center gap-1 text-xs text-foreground/80">
                              <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                              {booking.serviceTotalReviews > 0
                                ? `${booking.serviceAverageRating.toFixed(1)} (${booking.serviceTotalReviews} review${
                                    booking.serviceTotalReviews === 1 ? "" : "s"
                                  })`
                                : "No reviews yet"}
                            </p>
                          </div>
                          <Badge className={statusClass(booking.status)}>{statusLabel(booking.status)}</Badge>
                        </div>
                        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs text-muted-foreground">
                            {booking.userRating > 0
                              ? `Your rating: ${booking.userRating}/5`
                              : "You have not rated this service yet."}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-rose/30 text-rose hover:bg-rose/10"
                            onClick={() => openRatingDialog(booking.serviceId)}
                          >
                            <Star className="mr-2 h-4 w-4" />
                            {booking.userRating > 0 ? "Update Rating" : "Rate Service"}
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-rose/20 px-4 py-6 text-sm text-muted-foreground">
                      Once you send an inquiry or book a service, it will appear here for rating.
                    </div>
                  )}
                  {interactedServices.length > 0 && (
                    <Button
                      variant="outline"
                      className="w-full border-rose/30 text-rose hover:bg-rose/10"
                      onClick={() => navigate("/couple/bookings")}
                    >
                      View All Booking Requests
                    </Button>
                  )}
                </CardContent>
              </Card> */}

              <Card className="bg-gradient-to-br from-white/90 via-champagne/70 to-blush/60 border-rose/30 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <h4 className="font-display font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold" />
                    Planning Tip
                  </h4>
                  <p className="text-sm text-foreground/90">
                    Keep a shared priority list so both bride and groom can decide vendors quickly and stay aligned.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
