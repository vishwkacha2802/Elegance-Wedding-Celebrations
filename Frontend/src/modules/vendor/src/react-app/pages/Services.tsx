import { type FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, MapPin, Plus, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@vendor/react-app/components/ui/button";
import { Card, CardContent } from "@vendor/react-app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@vendor/react-app/components/ui/dialog";
import { Input } from "@vendor/react-app/components/ui/input";
import { Label } from "@vendor/react-app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@vendor/react-app/components/ui/select";
import { Textarea } from "@vendor/react-app/components/ui/textarea";
import ServiceCard from "@vendor/react-app/components/services/ServiceCard";
import {
  createService,
  deleteService,
  getServices,
  type Service,
  updateService,
} from "@vendor/react-app/services/api";

type ServiceTypeOption = {
  value: string;
  label: string;
  matchers: string[];
};

type ServiceFormData = {
  category: string;
  location: string;
  price: string;
  description: string;
  imageUrls: [string, string, string];
  isActive: boolean;
};

const SERVICE_TYPES: ServiceTypeOption[] = [
  { value: "photography", label: "Photography", matchers: ["photography", "photo", "videography"] },
  { value: "catering", label: "Catering", matchers: ["catering", "cater"] },
  { value: "decoration", label: "Decoration", matchers: ["decoration", "decor", "florist", "flowers"] },
  { value: "makeup", label: "Makeup", matchers: ["makeup", "hair", "styling", "beauty"] },
  { value: "venue", label: "Venue", matchers: ["venue", "hall", "banquet"] },
  { value: "music", label: "Music & DJ", matchers: ["music", "dj", "entertainment"] },
  { value: "transportation", label: "Transportation", matchers: ["transportation", "transport", "travel", "car"] },
  { value: "entry", label: "Entry Style", matchers: ["entry", "entry style", "piro", "walking on clouds"] },
  { value: "invitation", label: "Invitation", matchers: ["invitation", "invitations", "digital", "physical"] },
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

const FILTER_OPTIONS = [{ value: "all", label: "All services" }, ...SERVICE_TYPES.map(({ value, label }) => ({ value, label }))];

const createEmptyForm = (serviceType = ""): ServiceFormData => ({
  category: serviceType,
  location: "",
  price: "",
  description: "",
  imageUrls: ["", "", ""],
  isActive: true,
});

const normalizeServiceType = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return "other";
  }

  const matchedType = SERVICE_TYPES.find((serviceType) =>
    serviceType.matchers.some((matcher) => normalized.includes(matcher)),
  );

  return matchedType?.value || "other";
};

const getServiceTypeLabel = (value: string) => {
  const serviceTypeValue = normalizeServiceType(value);
  return SERVICE_TYPES.find((serviceType) => serviceType.value === serviceTypeValue)?.label || "Other";
};

const getFilterLabel = (value: string) => FILTER_OPTIONS.find((option) => option.value === value)?.label || "Service";

const buildServiceName = (serviceTypeLabel: string, location: string) => {
  const trimmedLocation = location.trim();
  return trimmedLocation ? `${serviceTypeLabel} - ${trimmedLocation}` : serviceTypeLabel;
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedServiceType, setSelectedServiceType] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>(createEmptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formError, setFormError] = useState("");
  const [pageError, setPageError] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<Service["id"] | null>(null);

  useEffect(() => {
    void loadServices(true);
  }, []);

  const loadServices = async (showPageLoader = false) => {
    if (showPageLoader) {
      setIsLoading(true);
    }
    try {
      setPageError("");
      const data = await getServices();
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to load services.");
    } finally {
      if (showPageLoader) {
        setIsLoading(false);
      }
    }
  };

  const handleRefreshServices = async () => {
    setIsRefreshing(true);
    await loadServices();
    setIsRefreshing(false);
  };

  const serviceTypeSummary = useMemo(
    () =>
      SERVICE_TYPES.map((serviceType) => ({
        ...serviceType,
        count: services.filter((service) => normalizeServiceType(service.category || service.name) === serviceType.value).length,
      })),
    [services],
  );

  const filteredServices = useMemo(
    () =>
      services.filter((service) => {
        if (selectedServiceType === "all") {
          return true;
        }

        return normalizeServiceType(service.category || service.name) === selectedServiceType;
      }),
    [selectedServiceType, services],
  );

  const selectedServiceLabel = getFilterLabel(selectedServiceType);
  const selectedLocationsCount = useMemo(
    () =>
      new Set(
        filteredServices
          .map((service) => String(service.location || "").trim().toLowerCase())
          .filter(Boolean),
      ).size,
    [filteredServices],
  );

  const handleOpenCreateDialog = () => {
    setEditingService(null);
    setFormData(createEmptyForm(selectedServiceType === "all" ? "" : selectedServiceType));
    setFormError("");
    setPageError("");
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (service: Service) => {
    const normalizedType = normalizeServiceType(service.category || service.name);

    setEditingService(service);
    setFormData({
      category: normalizedType,
      location: String(service.location || ""),
      price: String(service.price || ""),
      description: String(service.description || ""),
      imageUrls: [
        String(service.imageUrls?.[0] || service.imageUrl || ""),
        String(service.imageUrls?.[1] || ""),
        String(service.imageUrls?.[2] || ""),
      ],
      isActive: Boolean(service.isActive),
    });
    setFormError("");
    setPageError("");
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingService(null);
    setFormData(createEmptyForm(selectedServiceType === "all" ? "" : selectedServiceType));
    setFormError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setPageError("");

    if (!formData.category) {
      setFormError("Select a service type before adding a location.");
      return;
    }

    if (!formData.location.trim()) {
      setFormError("Location is required.");
      return;
    }

    const parsedPrice = Number(formData.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setFormError("Enter a valid price.");
      return;
    }

    const normalizedImageUrls = Array.from(
      new Set(formData.imageUrls.map((value) => value.trim()).filter(Boolean)),
    ).slice(0, 3);

    if (normalizedImageUrls.length === 0) {
      setFormError("At least one image URL is required.");
      return;
    }

    setIsSaving(true);

    try {
      const serviceTypeLabel = getFilterLabel(formData.category);
      const payload = {
        name: buildServiceName(serviceTypeLabel, formData.location),
        category: serviceTypeLabel,
        location: formData.location.trim(),
        price: parsedPrice,
        description: formData.description.trim(),
        imageUrl: normalizedImageUrls[0] || null,
        imageUrls: normalizedImageUrls,
        isActive: formData.isActive,
      };

      if (editingService) {
        await updateService(editingService.id, payload);
      } else {
        await createService(payload);
      }

      const refreshedServices = await getServices();
      setServices(Array.isArray(refreshedServices) ? refreshedServices : []);
      setSelectedServiceType(formData.category);
      handleCloseDialog();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to save service.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (serviceId: Service["id"]) => {
    try {
      setPageError("");
      await deleteService(serviceId);
      setServices((currentServices) => currentServices.filter((service) => service.id !== serviceId));
      setDeleteConfirmId(null);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to delete service.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gold))]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-foreground">Services</h1>
          <p className="mt-1 text-muted-foreground">
            Filter by service type, manage each location, and add more offerings under the same category in seconds.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleRefreshServices()}
            disabled={isRefreshing}
            className="border-[hsl(var(--gold))]/25 bg-white text-foreground hover:bg-[hsl(var(--gold))]/5"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            onClick={handleOpenCreateDialog}
            className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold))]/90 text-white shadow-lg shadow-[hsl(var(--gold))]/20 hover:from-[hsl(var(--gold))]/90 hover:to-[hsl(var(--gold))]/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="mr-2 h-4 w-4" />
            {selectedServiceType === "all"
              ? "Add service"
              : `Add ${selectedServiceLabel} for another location`}
          </Button>
        </div>
      </div>

      <Card className="border-[hsl(var(--gold))]/15 bg-gradient-to-br from-white via-white to-[hsl(var(--gold))]/5">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,280px)_1fr]">
          <div className="space-y-2">
            <Label htmlFor="serviceTypeFilter">Service type</Label>
            <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
              <SelectTrigger
                id="serviceTypeFilter"
                className="w-full justify-between rounded-xl border-[hsl(var(--gold))]/20 bg-white"
              >
                <SelectValue placeholder="Filter services by type" />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[hsl(var(--gold))]/15 bg-white/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Filtered entries
              </p>
              <p className="mt-3 text-3xl font-semibold text-foreground">{filteredServices.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedServiceType === "all" ? "Across every service type" : `Under ${selectedServiceLabel}`}
              </p>
            </div>

            <div className="rounded-2xl border border-[hsl(var(--gold))]/15 bg-white/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Covered locations
              </p>
              <p className="mt-3 text-3xl font-semibold text-foreground">{selectedLocationsCount}</p>
              <p className="mt-1 text-sm text-muted-foreground">Unique places in this filtered view</p>
            </div>

            <div className="rounded-2xl border border-[hsl(var(--gold))]/15 bg-white/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Quick add
              </p>
              <p className="mt-3 flex items-center gap-2 text-base font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-[hsl(var(--gold))]" />
                {selectedServiceType === "all" ? "Add any service type" : `${selectedServiceLabel} is ready`}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedServiceType === "all"
                  ? "Choose a type inside the form, then add a new location."
                  : "The form keeps the selected service type pre-filled."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {serviceTypeSummary.map((serviceType) => (
          <button
            key={serviceType.value}
            type="button"
            onClick={() => setSelectedServiceType(serviceType.value)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              selectedServiceType === serviceType.value
                ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]"
                : "border-[hsl(var(--gold))]/15 bg-white text-muted-foreground hover:border-[hsl(var(--gold))]/40 hover:text-foreground"
            }`}
          >
            {serviceType.label} ({serviceType.count})
          </button>
        ))}
      </div>

      {pageError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {pageError}
        </div>
      ) : null}

      {filteredServices.length === 0 ? (
        <Card className="border-[hsl(var(--gold))]/10">
          <CardContent className="py-16 text-center">
            <MapPin className="mx-auto h-12 w-12 text-[hsl(var(--gold))]/35" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              {selectedServiceType === "all" ? "No services added yet" : `No ${selectedServiceLabel} locations yet`}
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
              {selectedServiceType === "all"
                ? "Pick a service type from the dropdown to start adding offerings for specific locations."
                : `Add your first ${selectedServiceLabel.toLowerCase()} entry and keep building out more locations under the same category.`}
            </p>
            <Button
              onClick={handleOpenCreateDialog}
              className="mt-6 bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold))]/90 text-white hover:from-[hsl(var(--gold))]/90 hover:to-[hsl(var(--gold))]/80"
            >
              <Plus className="mr-2 h-4 w-4" />
              {selectedServiceType === "all"
                ? "Add service"
                : `Add ${selectedServiceLabel} for another location`}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              serviceTypeLabel={getServiceTypeLabel(service.category || service.name)}
              isDeletePending={deleteConfirmId === service.id}
              onEdit={handleOpenEditDialog}
              onRequestDelete={setDeleteConfirmId}
              onConfirmDelete={handleDelete}
              onCancelDelete={() => setDeleteConfirmId(null)}
            />
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => (!open ? handleCloseDialog() : setIsDialogOpen(true))}>
        <DialogContent className="max-w-3xl rounded-[2rem] border-[hsl(var(--gold))]/15 p-0 sm:max-w-3xl">
          <div className="border-b border-[hsl(var(--gold))]/10 px-4 py-4 sm:px-6 sm:py-5">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-foreground">
                {editingService ? `Edit ${getFilterLabel(formData.category)} service` : `Add ${getFilterLabel(formData.category)} service`}
              </DialogTitle>
              <DialogDescription>
                Fill the core service details first, then add your gallery and listing description.
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
            {formError ? (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {formError}
              </div>
            ) : null}

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
              <div className="space-y-5">
                <div className="h-full rounded-2xl border border-[hsl(var(--gold))]/10 bg-white/90 p-5">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Core Details
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Define the service type, location, and starting price.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="serviceType">Service type</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData((current) => ({ ...current, category: value }))}
                      >
                        <SelectTrigger
                          id="serviceType"
                          className="w-full justify-between rounded-xl border-[hsl(var(--gold))]/20 bg-white"
                        >
                          <SelectValue placeholder="Choose a service type" />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICE_TYPES.filter((serviceType) => serviceType.value !== "other").map((serviceType) => (
                            <SelectItem key={serviceType.value} value={serviceType.value}>
                              {serviceType.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="serviceLocation">Location</Label>
                      <Select
                        value={formData.location}
                        onValueChange={(value) => setFormData((current) => ({ ...current, location: value }))}
                      >
                        <SelectTrigger
                          id="serviceLocation"
                          className="w-full justify-between rounded-xl border-[hsl(var(--gold))]/20 bg-white focus:border-[hsl(var(--gold))]"
                        >
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

                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="servicePrice">Price</Label>
                      <Input
                        id="servicePrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(event) => setFormData((current) => ({ ...current, price: event.target.value }))}
                        placeholder="25000"
                        className="border-[hsl(var(--gold))]/20 focus:border-[hsl(var(--gold))]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="serviceDescription">Description</Label>
                      <Textarea
                        id="serviceDescription"
                        value={formData.description}
                        onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                        placeholder="What is included for this location?"
                        rows={5}
                        className="resize-none border-[hsl(var(--gold))]/20 focus:border-[hsl(var(--gold))]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="h-full rounded-2xl border border-[hsl(var(--gold))]/10 bg-[hsl(var(--gold))]/5 p-5">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Service Gallery
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add up to 3 direct image URLs. The first image is required and will be used as the cover image.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {formData.imageUrls.map((imageUrl, index) => (
                      <div
                        key={`service-image-${index + 1}`}
                        className="rounded-xl border border-[hsl(var(--gold))]/10 bg-white/90 p-3"
                      >
                        <Label htmlFor={`serviceImageUrl${index + 1}`} className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {index === 0 ? "Primary Image *" : `Optional Image ${index + 1}`}
                        </Label>
                        <Input
                          id={`serviceImageUrl${index + 1}`}
                          value={imageUrl}
                          onChange={(event) =>
                            setFormData((current) => {
                              const nextImageUrls = [...current.imageUrls] as [string, string, string];
                              nextImageUrls[index] = event.target.value;
                              return { ...current, imageUrls: nextImageUrls };
                            })
                          }
                          placeholder={`https://example.com/service-${index + 1}.jpg`}
                          className="mt-2 border-[hsl(var(--gold))]/20 focus:border-[hsl(var(--gold))]"
                        />
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-[hsl(var(--gold))]/10 bg-white/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Listing visibility</p>
                <p className="text-xs text-muted-foreground">
                  {formData.isActive ? "Clients can view this service." : "This service stays hidden until you activate it."}
                </p>
              </div>
              <Button
                type="button"
                variant={formData.isActive ? "default" : "outline"}
                className={
                  formData.isActive
                    ? "bg-[hsl(var(--gold))] text-white hover:bg-[hsl(var(--gold))]/90"
                    : "border-[hsl(var(--gold))]/20"
                }
                onClick={() => setFormData((current) => ({ ...current, isActive: !current.isActive }))}
              >
                {formData.isActive ? "Active" : "Inactive"}
              </Button>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-[hsl(var(--gold))]/10 bg-[hsl(var(--gold))]/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Ready to publish</p>
                <p className="text-xs text-muted-foreground">
                  Review the fields once, then save to update this listing for customers.
                </p>
              </div>
              <span className="rounded-full border border-[hsl(var(--gold))]/20 bg-white px-3 py-1 text-xs font-medium text-foreground">
                {formData.isActive ? "Visible to clients" : "Saved as hidden"}
              </span>
            </div>

            <DialogFooter className="border-t border-[hsl(var(--gold))]/10 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold))]/90 text-white hover:from-[hsl(var(--gold))]/90 hover:to-[hsl(var(--gold))]/80"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingService ? (
                  "Save changes"
                ) : (
                  `Add ${getFilterLabel(formData.category)} location`
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
