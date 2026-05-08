import { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  MapPin, 
  Save,
  Camera,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Button } from "@vendor/react-app/components/ui/button";
import { Input } from "@vendor/react-app/components/ui/input";
import { Label } from "@vendor/react-app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@vendor/react-app/components/ui/select";
import { Avatar, AvatarFallback } from "@vendor/react-app/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@vendor/react-app/components/ui/card";
import { getProfile, updateProfile, type VendorProfile } from "@vendor/react-app/services/api";
import { INDIA_STATE_DISTRICT_MAP, INDIA_STATES } from "@vendor/react-app/data/indiaStateDistricts";

const findCaseInsensitiveMatch = (value: string, options: string[]) => {
  const normalizedValue = value.trim().toLowerCase();
  if (!normalizedValue) {
    return "";
  }
  return options.find((option) => option.toLowerCase() === normalizedValue) || "";
};

const emptyProfile: VendorProfile = {
  businessName: "",
  ownerName: "",
  category: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  zipCode: "",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<VendorProfile>(emptyProfile);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof VendorProfile, string>>>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setSubmitError("");
      const data = await getProfile();
      const normalizedState = findCaseInsensitiveMatch(data.state || "", INDIA_STATES);
      const normalizedDistrict = findCaseInsensitiveMatch(
        data.city || "",
        normalizedState ? INDIA_STATE_DISTRICT_MAP[normalizedState] || [] : [],
      );
      setProfile({
        businessName: data.businessName || "",
        ownerName: data.ownerName || "",
        category: data.category || "",
        email: data.email || "",
        phone: data.phone || "",
        state: normalizedState,
        city: normalizedDistrict,
        zipCode: data.zipCode || "",
      });
    } catch (err) {
      console.error("Failed to load profile:", err);
      setSubmitError(err instanceof Error ? err.message : "Failed to load profile.");
    } finally {
      setIsPageLoading(false);
    }
  };
  
  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--gold))]" />
      </div>
    );
  }

  const validateForm = () => {
    const newErrors: Partial<Record<keyof VendorProfile, string>> = {};
    
    if (!profile.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }
    if (!profile.ownerName.trim()) {
      newErrors.ownerName = "Owner name is required";
    }
    if (!profile.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!profile.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof VendorProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleStateChange = (stateValue: string) => {
    setProfile((prev) => ({
      ...prev,
      state: stateValue,
      city: prev.state === stateValue ? prev.city : "",
    }));
    setIsSaved(false);
  };

  const availableDistricts = profile.state ? INDIA_STATE_DISTRICT_MAP[profile.state] || [] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSaving(true);
    setSubmitError("");
    
    try {
      const savedProfile = await updateProfile(profile);
      setProfile(savedProfile);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save profile:", err);
      setSubmitError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="water-gradient animate-in fade-in slide-in-from-top-4 duration-500 space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-foreground">My Profile</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your business information and public profile.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        <Card className="glass-card overflow-hidden border-white/40 shadow-xl">
          <div className="h-24 bg-gradient-to-r from-blush/70 via-cream/80 to-blush/70" />
          <CardContent className="-mt-12 pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarFallback className="bg-gradient-to-br from-mauve to-magenta text-2xl font-semibold text-white">
                    {getInitials(profile.businessName || "Vendor")}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border border-rose/30 bg-white shadow-md transition-colors hover:bg-rose/10"
                >
                  <Camera className="h-4 w-4 text-mauve" />
                </button>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground">{profile.businessName || "Your business name"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {profile.category || "Add your primary service category"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {profile.state && profile.city ? `${profile.city}, ${profile.state}` : profile.state || profile.city || "Location not set"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-6">
            <Card className="glass-card border-white/40 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <User className="h-5 w-5 text-mauve" />
                  Business Information
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Add the details customers will recognize first.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={profile.businessName}
                      onChange={(e) => handleChange("businessName", e.target.value)}
                      className={errors.businessName ? "border-destructive" : "border-[hsl(var(--gold))]/20 focus:border-[hsl(var(--gold))]"}
                      placeholder="Your brand or studio name"
                    />
                    {errors.businessName ? <p className="text-xs text-destructive">{errors.businessName}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Owner Name *</Label>
                    <Input
                      id="ownerName"
                      value={profile.ownerName}
                      onChange={(e) => handleChange("ownerName", e.target.value)}
                      className={errors.ownerName ? "border-destructive" : "border-[hsl(var(--gold))]/20 focus:border-[hsl(var(--gold))]"}
                      placeholder="Primary contact person"
                    />
                    {errors.ownerName ? <p className="text-xs text-destructive">{errors.ownerName}</p> : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={profile.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className="border-[hsl(var(--gold))]/20 focus:border-[hsl(var(--gold))]"
                    placeholder="e.g. Photography, Catering, Decoration"
                  />
                </div>

              </CardContent>
            </Card>

            <Card className="glass-card border-white/40 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <MapPin className="h-5 w-5 text-mauve" />
                  Location Details
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Share where your business operates so clients can find the right service region.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select value={profile.state} onValueChange={handleStateChange}>
                      <SelectTrigger
                        id="state"
                        className="w-full border-[hsl(var(--gold))]/20 focus:border-[hsl(var(--gold))]"
                      >
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIA_STATES.map((stateName) => (
                          <SelectItem key={stateName} value={stateName}>
                            {stateName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="district">District</Label>
                    <Select
                      value={profile.city}
                      onValueChange={(districtValue) => handleChange("city", districtValue)}
                      disabled={!profile.state}
                    >
                      <SelectTrigger
                        id="district"
                        className="w-full border-[hsl(var(--gold))]/20 focus:border-[hsl(var(--gold))]"
                      >
                        <SelectValue placeholder={profile.state ? "Select district" : "Select state first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDistricts.map((districtName) => (
                          <SelectItem key={districtName} value={districtName}>
                            {districtName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      placeholder="e.g. 380001"
                      value={profile.zipCode}
                      onChange={(e) => handleChange("zipCode", e.target.value)}
                      className="border-[hsl(var(--gold))]/20 focus:border-[hsl(var(--gold))]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="glass-card border-white/40 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Mail className="h-5 w-5 text-mauve" />
                  Contact Information
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  These details help couples contact you quickly.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    placeholder="vendor@example.com"
                    value={profile.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className={errors.email ? "border-destructive" : "border-[hsl(var(--gold))]/20 focus:border-[hsl(var(--gold))]"}
                  />
                  {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    placeholder="+91 98765 43210"
                    value={profile.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className={errors.phone ? "border-destructive" : "border-[hsl(var(--gold))]/20 focus:border-[hsl(var(--gold))]"}
                  />
                  {errors.phone ? <p className="text-xs text-destructive">{errors.phone}</p> : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
          {isSaved ? (
            <span className="flex items-center gap-2 text-sm text-mauve-dark">
              <CheckCircle2 className="h-4 w-4 text-gold" />
              Profile saved
            </span>
          ) : null}

          <Button
            type="submit"
            disabled={isSaving}
            className="bg-gradient-to-r from-rose to-gold px-8 text-white shadow-lg hover:from-rose/90 hover:to-gold/90"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
