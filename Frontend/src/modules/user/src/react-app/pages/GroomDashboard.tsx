import { useState } from "react";
import { Link } from "react-router";
import { 
 Check, MapPin, IndianRupee, 
  Sparkles, Camera, Music, Utensils, Flower, Palette, Car,
  CakeSlice, ChevronRight, Gem, Home, User, Settings, LogOut, ChevronDown
} from "lucide-react";
import { Button } from "@user/react-app/components/ui/button";
import { Input } from "@user/react-app/components/ui/input";
import { Label } from "@user/react-app/components/ui/label";
import { Checkbox } from "@user/react-app/components/ui/checkbox";
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
import VendorDetailModal from "@user/react-app/components/VendorDetailModal";
import { VENDORS, Vendor, getServiceLabel } from "@user/react-app/data/vendors";
import bgImage1 from "../../img/bg_image_1.png";
import bgImage2 from "../../img/bg_image_2.png";

const SERVICES = [
  { id: "venue", label: "Venue", icon: MapPin, color: "text-gold" },
  { id: "catering", label: "Catering", icon: Utensils, color: "text-gold" },
  { id: "photography", label: "Photography", icon: Camera, color: "text-mauve" },
  { id: "decoration", label: "Decoration", icon: Palette, color: "text-magenta" },
  { id: "makeup", label: "Makeup & Styling", icon: Sparkles, color: "text-gold" },
  { id: "music", label: "Music & DJ", icon: Music, color: "text-mauve-dark" },
  { id: "flowers", label: "Flowers", icon: Flower, color: "text-rose" },
  { id: "transportation", label: "Transportation", icon: Car, color: "text-muted-foreground" },
  { id: "cake", label: "Wedding Cake", icon: CakeSlice, color: "text-magenta" },
];

export default function GroomDashboard() {
  const groomName = "Groom";
  const groomInitial = groomName.charAt(0).toUpperCase();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const formatInr = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(s => s !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleGetRecommendations = () => {
    if (selectedServices.length > 0 && budget && location) {
      setShowRecommendations(true);
    }
  };

  const filteredVendors = VENDORS.filter(v => 
    selectedServices.includes(v.service) && 
    v.price <= parseInt(budget || "999999")
  );

  return (
    <>
    {selectedVendor && (
      <VendorDetailModal 
        vendor={{
          ...selectedVendor,
          serviceId: selectedVendor.id,
          serviceName: selectedVendor.service,
          vendorId: selectedVendor.id,
          vendorName: selectedVendor.name,
          businessName: selectedVendor.name,
          averageRating: selectedVendor.rating,
          totalReviews: selectedVendor.reviews.length,
          reviews: selectedVendor.reviews.map((review) => ({
            ...review,
            userName: review.author,
            primaryUserName: review.author,
            partnerName: "",
            createdAt: review.date,
            review: review.comment,
          })),
        }} 
        onClose={() => setSelectedVendor(null)} 
        accentColor="gold"
      />
    )}

    {/* Background image */}
    {/* <div className="min-h-screen bg-gradient-to-br from-champagne/30 via-background to-blush/20"></div> */}
    <div
      className="min-h-screen bg-gradient-to-br from-champagne/30 via-background to-blush/20"
      style={{
        backgroundImage: `url(${showRecommendations ? bgImage2 : bgImage1})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Header */}
      <header className="border-b border-gold/20 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold to-rose shadow-lg shadow-gold/20">
              <Gem className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <span className="block truncate font-display text-lg font-semibold text-foreground sm:text-xl">Elegance Wedding & Celebration</span>
              <span className="mt-1 inline-flex rounded-full bg-gold/15 px-2 py-0.5 text-xs font-medium text-mauve-dark sm:ml-2 sm:mt-0">Groom</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
            {/* <Link to="/bride">
              <Button variant="outline" size="sm" className="border-rose/30 hover:bg-rose/10">
                <Crown className="w-4 h-4 mr-2 text-rose" />
                Switch to Bride
              </Button>
            </Link> */}
            <Link to="/">
              <Button variant="ghost" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-semibold text-white">
                    {groomInitial}
                  </span>
                  {groomName}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/groom/profile">
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/groom/settings">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild variant="destructive">
                  <Link to="/">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-rose flex items-center justify-center">
              <Gem className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                Groom's Wedding Dashboard
              </h1>
              <p className="font-display font-bold text-muted-foreground flex items-center gap-2">
                Plan your perfect wedding with personalized vendor recommendations
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Service Selection & Inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Selection */}
            <Card className="border-gold/20 shadow-lg shadow-gold/5">
              <CardHeader className="bg-gradient-to-r from-gold/5 to-transparent">
                <CardTitle className="font-display flex items-center gap-2">
                  <Check className="w-5 h-5 text-gold" />
                  Select Required Services
                </CardTitle>
                <CardDescription>
                  Choose all the services you need for your wedding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {SERVICES.map((service) => {
                    const Icon = service.icon;
                    const isSelected = selectedServices.includes(service.id);
                    return (
                      <label
                        key={service.id}
                        className={`
                          flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                          ${isSelected 
                            ? "border-gold bg-gold/5 shadow-sm shadow-gold/10" 
                            : "border-border hover:border-gold/30 hover:bg-gold/5"
                          }
                        `}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleServiceToggle(service.id)}
                          className="data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                        />
                        <Icon className={`w-5 h-5 ${service.color}`} />
                        <span className="text-sm font-medium text-foreground">{service.label}</span>
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Budget & Details */}
            <Card className="border-gold/20 shadow-lg shadow-gold/5">
              <CardHeader className="bg-gradient-to-r from-gold/5 to-transparent">
                <CardTitle className="font-display flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-gold" />
                  Wedding Details
                </CardTitle>
                <CardDescription>
                  Enter your budget and event details for personalized recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Total Budget (INR)</Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="e.g., 50000"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="border-gold/20 focus-visible:ring-gold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Wedding Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., New York"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="border-gold/20 focus-visible:ring-gold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guests">Guest Count</Label>
                    <Input
                      id="guests"
                      type="number"
                      placeholder="e.g., 150"
                      value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                      className="border-gold/20 focus-visible:ring-gold"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleGetRecommendations}
                  disabled={selectedServices.length === 0 || !budget || !location}
                  className="mt-6 bg-gradient-to-r from-gold to-rose text-white hover:opacity-90 shadow-lg shadow-gold/25"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get Vendor Recommendations
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Vendor Recommendations */}
            {showRecommendations && (
              <Card className="border-gold/20 shadow-lg shadow-gold/5">
                <CardHeader className="bg-gradient-to-r from-gold/5 to-rose/5">
                  <CardTitle className="font-display flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-gold" />
                    Recommended Vendors for Groom
                  </CardTitle>
                  <CardDescription>
                    Personalized suggestions based on your budget and requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredVendors.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {filteredVendors.map((vendor) => (
                        <div
                          key={vendor.id}
                          className="group relative overflow-hidden rounded-xl border border-gold/20 hover:border-gold/40 transition-all hover:shadow-lg hover:shadow-gold/10"
                        >
                          <div className="aspect-video relative overflow-hidden">
                            <img
                              src={vendor.image}
                              alt={vendor.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-3 left-3">
                              <Badge className="bg-white/90 text-foreground shadow-sm">
                                {getServiceLabel(vendor.service)}
                              </Badge>
                            </div>
                          </div>
                          <div className="p-4 bg-white">
                            <h4 className="font-semibold text-foreground mb-1">{vendor.name}</h4>
                            <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                {vendor.location}
                              </span>
                              <span className="font-medium text-gold">{formatInr(vendor.price)}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-2">
                              <span className="text-yellow-500">★</span>
                              <span className="text-sm font-medium">{vendor.rating}</span>
                              <span className="text-xs text-muted-foreground">({vendor.reviews.length} reviews)</span>
                            </div>
                            <Button 
                              size="sm" 
                              className="w-full mt-3 bg-gold/10 text-mauve-dark hover:bg-gold hover:text-white"
                              onClick={() => setSelectedVendor(vendor)}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Gem className="w-12 h-12 mx-auto mb-4 text-gold/30" />
                      <p>No vendors found matching your criteria. Try adjusting your budget.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Summary & Partner Status */}
          <div className="space-y-6">
            {/* Planning Summary */}
            <Card className="border-2 border-gold/30 shadow-lg shadow-gold/10">
              <CardHeader className="bg-gradient-to-br from-gold/10 to-rose/10">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Gem className="w-5 h-5 text-gold" />
                  Groom's Planning Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Selected Services</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedServices.length > 0 ? (
                        selectedServices.map(id => {
                          const service = SERVICES.find(s => s.id === id);
                          return service ? (
                            <Badge key={id} className="bg-gold/10 text-mauve-dark border-gold/20 text-xs">
                              {service.label}
                            </Badge>
                          ) : null;
                        })
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No services selected yet</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gold/20">
                    <div className="mb-2 flex flex-col gap-1 text-sm sm:flex-row sm:justify-between">
                      <span className="text-muted-foreground">Budget</span>
                      <span className="font-medium">
                        {budget ? formatInr(Number.parseInt(budget, 10)) : "—"}
                      </span>
                    </div>
                    <div className="mb-2 flex flex-col gap-1 text-sm sm:flex-row sm:justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium">{location || "—"}</span>
                    </div>
                    <div className="flex flex-col gap-1 text-sm sm:flex-row sm:justify-between">
                      <span className="text-muted-foreground">Guests</span>
                      <span className="font-medium">{guestCount || "—"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Partner Status */}
            {/* <Card className="border-2 border-rose/30 shadow-lg shadow-rose/10">
              <CardHeader className="bg-gradient-to-br from-rose/10 to-pink-100/50">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Crown className="w-5 h-5 text-rose" />
                  Bride's Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-rose/10 flex items-center justify-center mx-auto mb-3">
                    <Crown className="w-7 h-7 text-rose/60" />
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">
                    View your partner's planning progress
                  </p>
                  <Link to="/bride">
                    <Button variant="outline" size="sm" className="border-rose/30 hover:bg-rose/10">
                      <Crown className="w-4 h-4 mr-2 text-rose" />
                      View Bride's Dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card> */}

            {/* Tips Card */}
            {/* Changed: strengthened tip card background contrast over page background image */}
            <Card className="bg-gradient-to-br from-white/90 via-champagne/70 to-blush/60 border-gold/30 backdrop-blur-sm">
              <CardContent className="pt-6">
                <h4 className="font-display font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold" />
                  Planning Tip
                </h4>
                {/* Changed: increased text contrast for readability */}
                <p className="text-sm text-foreground/90">
                  Coordinate with your partner on vendor selections to stay within your combined budget!
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


