import { useEffect, useState } from "react";
import { Crown, Gem, Heart, ChevronLeft, Loader2, User } from "lucide-react";
import { useLocation } from "react-router";
import { Button } from "@user/react-app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@user/react-app/components/ui/card";
import { Input } from "@user/react-app/components/ui/input";
import { Label } from "@user/react-app/components/ui/label";
import { getCoupleProfile, updateCoupleProfile } from "@user/react-app/services/profileApi";
import bgImage from "@user/img/bg_image_1.png";

type PartnerProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type UserSession = {
  name?: string;
  email?: string;
};

const DEFAULT_PROFILE: PartnerProfile = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

export default function CoupleProfile() {
  const location = useLocation();
  const [bride, setBride] = useState<PartnerProfile>(DEFAULT_PROFILE);
  const [groom, setGroom] = useState<PartnerProfile>(DEFAULT_PROFILE);
  const [accountEmail, setAccountEmail] = useState("");
  const [viewerEmail, setViewerEmail] = useState("");
  const [canEditBothProfiles, setCanEditBothProfiles] = useState(false);
  const [editableProfileType, setEditableProfileType] = useState<"bride" | "groom" | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const routeContext = location.pathname.startsWith("/bride")
    ? "bride"
    : location.pathname.startsWith("/groom")
      ? "groom"
      : "couple";

  const pageTitle =
    routeContext === "bride"
      ? "Bride Route Profile"
      : routeContext === "groom"
        ? "Groom Route Profile"
        : "Couple Profile";
  const pageDescription =
    routeContext === "bride"
      ? "Opened from the bride route, with both partner details managed together."
      : routeContext === "groom"
        ? "Opened from the groom route, with both partner details managed together."
        : "Manage bride and groom details together from the couple route.";
  const prioritizedProfileType =
    routeContext === "groom"
      ? "groom"
      : routeContext === "bride"
        ? "bride"
        : editableProfileType === "groom"
          ? "groom"
          : "bride";

  const orderedSections =
    prioritizedProfileType === "groom"
      ? ([
          { key: "groom", title: "Groom Details", accent: "text-gold", icon: Gem },
          { key: "bride", title: "Bride Details", accent: "text-rose", icon: Crown },
        ] as const)
      : ([
          { key: "bride", title: "Bride Details", accent: "text-rose", icon: Crown },
          { key: "groom", title: "Groom Details", accent: "text-gold", icon: Gem },
        ] as const);

  const updateBride = (field: keyof PartnerProfile, value: string) => {
    setBride((current) => ({ ...current, [field]: value }));
  };

  const updateGroom = (field: keyof PartnerProfile, value: string) => {
    setGroom((current) => ({ ...current, [field]: value }));
  };

  useEffect(() => {
    const sessionRaw = sessionStorage.getItem("elegance_user_session");
    if (!sessionRaw) {
      window.location.assign("/auth");
      return;
    }

    let sessionEmail = "";
    try {
      const session = JSON.parse(sessionRaw) as UserSession;
      sessionEmail = String(session.email || "").trim().toLowerCase();
    } catch {
      sessionEmail = "";
    }

    if (!sessionEmail) {
      window.location.assign("/auth");
      return;
    }

    setAccountEmail(sessionEmail);
    setViewerEmail(sessionEmail);

    const loadProfiles = async () => {
      try {
        setSubmitError("");
        setStatusMessage("");
        const profile = await getCoupleProfile(sessionEmail);
        setAccountEmail(profile.accountEmail);
        setCanEditBothProfiles(Boolean(profile.canEditBothProfiles));
        setEditableProfileType(profile.editableProfileType || "");

        setBride({
          firstName: profile.bride.firstName,
          lastName: profile.bride.lastName,
          email: profile.bride.email,
          phone: profile.bride.phone,
        });
        setGroom({
          firstName: profile.groom.firstName,
          lastName: profile.groom.lastName,
          email: profile.groom.email,
          phone: profile.groom.phone,
        });
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Failed to load profile details.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfiles();
  }, []);

  const handleSaveProfile = async () => {
    if (!accountEmail) {
      setSubmitError("Unable to find user session email.");
      return;
    }

    try {
      setIsSaving(true);
      setSubmitError("");
      setStatusMessage("");

      await updateCoupleProfile({
        accountEmail,
        editorEmail: viewerEmail,
        bride: {
          firstName: bride.firstName,
          lastName: bride.lastName,
          email: bride.email || accountEmail,
          phone: bride.phone,
        },
        groom: {
          firstName: groom.firstName,
          lastName: groom.lastName,
          email: groom.email || accountEmail,
          phone: groom.phone,
        },
      });

      setStatusMessage("Profile saved successfully.");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to save profile details.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      <header className="sticky top-0 z-50 border-b border-rose/20 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose to-gold">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold">{pageTitle}</p>
              <p className="text-xs text-muted-foreground">{pageDescription}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* <Link to={backRoute}>
              <Button variant="outline" size="sm">{backLabel}</Button>
            </Link> */}

            <Button variant="outline" onClick={() => window.location.assign("/user/couple")}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>

            {/* <Link to="/">
              <Button variant="ghost" size="sm">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link> */}
          </div>
        </div>
      </header>


      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Card className="border-rose/20 shadow-lg shadow-rose/5">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <User className="h-5 w-5 text-rose" />
              Personal Information
            </CardTitle>
            <CardDescription>Update both bride and groom profile details in one place.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {isLoading && (
              <div className="rounded-lg border border-rose/20 bg-rose/5 px-4 py-3 text-sm text-muted-foreground">
                Loading profile details...
              </div>
            )}

            {submitError && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {submitError}
              </div>
            )}

            {statusMessage && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {statusMessage}
              </div>
            )}

            {orderedSections.map((section) => {
              const isBride = section.key === "bride";
              const values = isBride ? bride : groom;
              const updateProfile = isBride ? updateBride : updateGroom;
              const SectionIcon = section.icon;
              const isEditableSection = canEditBothProfiles || editableProfileType === section.key;
              const isReadOnly = !isEditableSection || isLoading || isSaving;

              return (
                <section key={section.key} className="space-y-4">
                  <h3 className={`font-display flex items-center gap-2 text-lg font-semibold ${section.accent}`}>
                    <SectionIcon className="h-5 w-5" />
                    {section.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {canEditBothProfiles
                      ? "This account can manage both profiles because no partner login is connected yet."
                      : isEditableSection
                      ? "You can edit this profile because it matches the current login."
                      : "This partner profile is view-only for the current login."}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`${section.key}-first-name`}>{section.title.split(" ")[0]} First Name</Label>
                      <Input
                        id={`${section.key}-first-name`}
                        value={values.firstName}
                        disabled={isReadOnly}
                        onChange={(event) => updateProfile("firstName", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${section.key}-last-name`}>{section.title.split(" ")[0]} Last Name</Label>
                      <Input
                        id={`${section.key}-last-name`}
                        value={values.lastName}
                        disabled={isReadOnly}
                        onChange={(event) => updateProfile("lastName", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${section.key}-email`}>{section.title.split(" ")[0]} Email</Label>
                      <Input
                        id={`${section.key}-email`}
                        type="email"
                        value={values.email}
                        disabled={isReadOnly}
                        onChange={(event) => updateProfile("email", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${section.key}-phone`}>{section.title.split(" ")[0]} Phone</Label>
                      <Input
                        id={`${section.key}-phone`}
                        value={values.phone}
                        disabled={isReadOnly}
                        onChange={(event) => updateProfile("phone", event.target.value)}
                      />
                    </div>
                  </div>
                </section>
              );
            })}

            <Button
              onClick={handleSaveProfile}
              disabled={isLoading || isSaving || (!editableProfileType && !canEditBothProfiles)}
              className="bg-gradient-to-r from-rose to-gold text-white hover:opacity-90 disabled:opacity-70"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
