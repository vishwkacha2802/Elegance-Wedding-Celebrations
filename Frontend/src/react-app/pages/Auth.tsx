import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { isAxiosError } from "axios";
import { ChevronLeft, ShieldCheck, Store, UserRound } from "lucide-react";
import api from "@/api/axios";
import { cn } from "@/react-app/lib/utils";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";

type Mode = "login" | "register";
type Role = "user" | "vendor" | "admin";
type RegisteringAs = "bride" | "groom";
type ForgotPasswordStep = "requestOtp" | "resetPassword";

type RoleConfig = {
  label: string;
  icon: typeof UserRound;
  description: string;
  loginPath: string;
  registerPath: string;
  allowRegister: boolean;
};

type AuthUser = {
  id?: string;
  name?: string;
  businessName?: string;
  email?: string;
  role?: string;
  primaryProfileType?: string;
};

type LoginResponse = {
  token?: string;
  accessToken?: string;
  jwt?: string;
  user?: AuthUser;
  message?: string;
  error?: string;
};

const ROLE_CONFIG: Record<Role, RoleConfig> = {
  user: {
    label: "User",
    icon: UserRound,
    description: "Plan your events and manage your wedding journey.",
    loginPath: "/user/couple",
    registerPath: "/user/couple",
    allowRegister: true,
  },
  vendor: {
    label: "Vendor",
    icon: Store,
    description: "Manage services, leads, bookings, and earnings.",
    loginPath: "/vendor/dashboard",
    registerPath: "/vendor/dashboard",
    allowRegister: true,
  },
  admin: {
    label: "Admin",
    icon: ShieldCheck,
    description: "Access platform operations and management controls.",
    loginPath: "/admin/dashboard",
    registerPath: "/admin/dashboard",
    allowRegister: true,
  },
};

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("user");
  const [name, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [registeringAs, setRegisteringAs] = useState<RegisteringAs>("bride");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminSecretKey, setAdminSecretKey] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPasswordFlow, setIsForgotPasswordFlow] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<ForgotPasswordStep>("requestOtp");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [isOtpInputVisible, setIsOtpInputVisible] = useState(false);
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotInfo, setForgotInfo] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  // const [showPasswordErrors, setShowPasswordErrors] = useState(false);
  const inputClassName =
    "border-white/45 bg-white/20 text-white placeholder:text-white/70 focus-visible:border-white focus-visible:ring-white/35";

  const activeRole = ROLE_CONFIG[role];
  const registerDisabled = mode === "register" && !activeRole.allowRegister;
  const passwordRules = [
    { isValid: password.length >= 8, text: "At least 8 characters." },
    { isValid: /[A-Z]/.test(password), text: "One uppercase letter (A-Z)." },
    { isValid: /[a-z]/.test(password), text: "One lowercase letter (a-z)." },
    { isValid: /\d/.test(password), text: "One number (0-9)." },
    { isValid: /[^A-Za-z0-9]/.test(password), text: "One special character (! @ # $ %)." },
  ];

  const isPasswordValid = passwordRules.every(rule => rule.isValid);

//   const handleRegister = async () => {
//   if (passwordRules.length > 0) {
//     setShowPasswordErrors(true);
//     return; 
//   }
//   setShowPasswordErrors(false);
// };

  useEffect(() => {
    if (!activeRole.allowRegister && mode === "register") {
      setMode("login");
    }
  }, [activeRole.allowRegister, mode]);

  useEffect(() => {
    setFormError("");
    setAdminSecretKey("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setPartnerEmail("");
    setRegisteringAs("bride");
  }, [mode, role]);

  useEffect(() => {
    if (mode === "register" && isForgotPasswordFlow) {
      setIsForgotPasswordFlow(false);
    }
  }, [isForgotPasswordFlow, mode]);

  const resetForgotPasswordState = () => {
    setForgotPasswordStep("requestOtp");
    setForgotEmail("");
    setForgotOtp("");
    setIsOtpInputVisible(false);
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotError("");
    setForgotInfo("");
    setIsSendingOtp(false);
    setIsVerifyingOtp(false);
    setIsResettingPassword(false);
  };

  const normalizeEmail = (value: string) => value.trim().toLowerCase();
  const normalizeProfileType = (value: string): RegisteringAs | "" => {
    const normalizedValue = value.trim().toLowerCase();
    return normalizedValue === "bride" || normalizedValue === "groom"
      ? normalizedValue
      : "";
  };
  const getUserLoginPath = (profileType: string) => {
    const normalizedProfileType = normalizeProfileType(profileType);
    return normalizedProfileType ? `/user/${normalizedProfileType}` : ROLE_CONFIG.user.loginPath;
  };

  const openForgotPasswordFlow = () => {
    setIsForgotPasswordFlow(true);
    setForgotPasswordStep("requestOtp");
    setForgotOtp("");
    setIsOtpInputVisible(false);
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotError("");
    setForgotInfo("");
    setForgotEmail(normalizeEmail(email));
  };

  const closeForgotPasswordFlow = () => {
    setIsForgotPasswordFlow(false);
    resetForgotPasswordState();
  };

  const clearStoredSessions = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("vendor");
    sessionStorage.removeItem("elegance_user_session");
    sessionStorage.removeItem("elegance_admin_user");
    sessionStorage.removeItem("elegance_admin_token");
  };

  const getErrorMessage = (error: unknown) => {
    if (isAxiosError(error)) {
      const responseData = error.response?.data as { message?: string; error?: string } | undefined;
      return responseData?.message || responseData?.error || error.message || "Request failed.";
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "Request failed.";
  };

  const storeLoginSession = (data: LoginResponse) => {
    const token = data.token || data.accessToken || data.jwt;
    if (!token) {
      throw new Error("JWT token was not returned by the login API.");
    }

    const resolvedRole = ((data.user?.role || role) as Role) || "user";
    const resolvedEmail = normalizeEmail(data.user?.email || email);
    const resolvedName = data.user?.businessName || data.user?.name || "User";
    const resolvedPrimaryProfileType = normalizeProfileType(data.user?.primaryProfileType || "");

    clearStoredSessions();
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("authToken", token);

    if (resolvedRole === "user") {
      sessionStorage.setItem(
        "elegance_user_session",
        JSON.stringify({
          id: data.user?.id || "",
          name: resolvedName,
          email: resolvedEmail,
          role: resolvedRole,
          primaryProfileType: resolvedPrimaryProfileType,
        }),
      );
    }

    if (resolvedRole === "vendor") {
      sessionStorage.setItem(
        "vendor",
        JSON.stringify({
          id: data.user?.id || "",
          name: resolvedName,
          businessName: data.user?.businessName || resolvedName,
          email: resolvedEmail,
          role: resolvedRole,
        }),
      );
    }

    if (resolvedRole === "admin") {
      sessionStorage.setItem(
        "elegance_admin_user",
        JSON.stringify({
          id: data.user?.id || "",
          name: resolvedName,
          email: resolvedEmail,
          role: resolvedRole,
        }),
      );
      sessionStorage.setItem("elegance_admin_token", token);
    }

    return resolvedRole;
  };

  const handleSendOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = normalizeEmail(forgotEmail);

    if (!normalizedEmail) {
      setForgotError("Email is required.");
      return;
    }

    setForgotError("");
    setForgotInfo("");
    setIsOtpInputVisible(true);
    setIsSendingOtp(true);

    try {
      const { data: payload } = await api.post<{ message?: string; error?: string }>("/auth/send-reset-otp", {
        role,
        email: normalizedEmail,
      });

      setIsOtpInputVisible(true);
      setForgotInfo(payload.message || `OTP sent to ${normalizedEmail}.`);
    } catch (error) {
      setForgotError(getErrorMessage(error));
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleContinueAfterOtp = async () => {
    const normalizedEmail = normalizeEmail(forgotEmail);
    if (!forgotOtp.trim()) {
      setForgotError("OTP is required.");
      return;
    }
    if (!normalizedEmail) {
      setForgotError("Email is required.");
      return;
    }

    setForgotError("");
    setForgotInfo("");
    setIsVerifyingOtp(true);
    try {
      const { data: payload } = await api.post<{ message?: string }>("/auth/verify-reset-otp", {
        role,
        email: normalizedEmail,
        otp: forgotOtp.trim(),
      });
      setForgotInfo(payload.message || "OTP verified.");
      setForgotPasswordStep("resetPassword");
    } catch (error) {
      setForgotError(getErrorMessage(error));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = normalizeEmail(forgotEmail);

    if (!normalizedEmail) {
      setForgotError("Email is required.");
      return;
    }

    if (!forgotOtp.trim()) {
      setForgotError("OTP is required.");
      return;
    }

    if (!forgotNewPassword) {
      setForgotError("New password is required.");
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("New password and confirm password do not match.");
      return;
    }

    setForgotError("");
    setForgotInfo("");
    setIsResettingPassword(true);

    try {
      const { data: payload } = await api.post<{ message?: string; error?: string }>("/auth/reset-password", {
        role,
        email: normalizedEmail,
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword,
      });

      setForgotInfo(payload.message || "Password reset successful. Please login with your new password.");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        setIsForgotPasswordFlow(false);
        setForgotPasswordStep("requestOtp");
        setIsOtpInputVisible(false);
        setForgotOtp("");
        setForgotNewPassword("");
        setForgotConfirmPassword("");
        setForgotError("");
      }, 1200);
    } catch (error) {
      setForgotError(getErrorMessage(error));
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    if (registerDisabled) return;

    if (mode === "register" && password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    if (
      mode === "register" &&
      role === "user" &&
      normalizeEmail(partnerEmail) &&
      normalizeEmail(partnerEmail) === normalizeEmail(email)
    ) {
      setFormError("partner_email must be different from email.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "login") {
        const { data } = await api.post<LoginResponse>("/auth/login", {
          email: normalizeEmail(email),
          password,
          role,
        });

        const resolvedRole = storeLoginSession(data);
        navigate(
          resolvedRole === "user"
            ? getUserLoginPath(data.user?.primaryProfileType || "")
            : ROLE_CONFIG[resolvedRole].loginPath,
        );
        return;
      }

      await api.post("/auth/register", {
        name: role === "user" ? `${firstName.trim()} ${lastName.trim()}`.trim() : name.trim(),
        email: normalizeEmail(email),
        partner_email: role === "user" ? normalizeEmail(partnerEmail) : "",
        primaryProfileType: role === "user" ? registeringAs : "",
        password,
        confirmPassword,
        role,
        phone: role === "admin" ? "" : phone.trim(),
        adminSecretKey: role === "admin" ? adminSecretKey.trim() : "",
      });

      setMode("login");
      setName("");
      setFirstName("");
      setLastName("");
      setPhone("");
      setPartnerEmail("");
      setPassword("");
      setConfirmPassword("");
      setAdminSecretKey("");
      navigate("/auth", { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1920&q=80)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/45 to-black/55" />

      <section className="relative z-10 min-h-[100dvh] w-full p-4 sm:p-6">
        <div className="mb-3 flex justify-start">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/")}
            className="border-white/45 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
        <div className="grid min-h-[calc(100dvh-2rem)] w-full grid-cols-1 gap-4 lg:min-h-[calc(100dvh-3rem)] lg:grid-cols-[1.05fr_1.25fr]">
          <div className="rounded-3xl border border-white/25 bg-black/35 p-6 text-white shadow-xl backdrop-blur-sm sm:p-8">
            <p className="text-sm tracking-[0.24em] uppercase text-white/90">Elegance Account</p>
            <h1 className="mt-3 text-4xl font-script text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] sm:text-5xl">
              Login & Register
            </h1>
            <p className="mt-4 max-w-xl text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
              One page access for User, Vendor, and Admin portals with the same Elegance
              experience.
            </p>

            <div className="mt-8 space-y-3">
              {(Object.entries(ROLE_CONFIG) as [Role, RoleConfig][]).map(([key, value]) => {
                const Icon = value.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setRole(key);
                      if (!value.allowRegister) setMode("login");
                      if (isForgotPasswordFlow) {
                        resetForgotPasswordState();
                      }
                    }}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-4 text-left transition-all",
                      role === key
                        ? "border-white/80 bg-white/30 shadow-sm"
                        : "border-white/35 bg-white/10 hover:border-white/80 hover:bg-white/20",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-mauve-dark">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-white">{value.label}</p>
                        <p className="mt-1 text-sm text-white/85">{value.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex min-h-0 flex-col rounded-3xl border border-white/45 bg-white/10 p-6 text-white shadow-2xl backdrop-blur-md sm:p-8">
            {!isForgotPasswordFlow && (
              <div className="mb-6 flex items-center gap-2 rounded-full bg-white/20 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setFormError("");
                  }}
                  className={cn(
                    "rounded-full py-2 text-sm font-semibold transition-colors",
                    activeRole.allowRegister ? "flex-1" : "w-full",
                    mode === "login"
                      ? "bg-white/90 text-mauve-dark shadow-sm"
                      : "text-white/80 hover:text-white",
                  )}
                >
                  Login
                </button>
                {activeRole.allowRegister && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setFormError("");
                    }}
                    className={cn(
                      "flex-1 rounded-full py-2 text-sm font-semibold transition-colors",
                      mode === "register"
                        ? "bg-white/90 text-mauve-dark shadow-sm"
                        : "text-white/80 hover:text-white",
                    )}
                  >
                    Register
                  </button>
                )}
              </div>
            )}

            {isForgotPasswordFlow ? (
              <>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-2xl font-script text-white sm:text-3xl">
                    Forgot Password - {activeRole.label}
                  </h2>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeForgotPasswordFlow}
                    className="border-white/45 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  >
                    Back
                  </Button>
                </div>

                <p className="mb-5 text-sm text-white/90">
                  Enter email of {activeRole.label} account.
                </p>

                {forgotPasswordStep === "requestOtp" ? (
                  <form onSubmit={handleSendOtp} className="flex min-h-0 flex-1 flex-col">
                    <div className="space-y-4 overflow-y-auto pr-1">
                      <div>
                        <Label htmlFor="forgotEmail" className="text-white">
                          Email ID
                        </Label>
                        <Input
                          id="forgotEmail"
                          type="email"
                          placeholder="name@example.com"
                          required
                          value={forgotEmail}
                          onChange={(event) => setForgotEmail(event.target.value)}
                          className={inputClassName}
                        />
                      </div>

                      {isOtpInputVisible && (
                        <div>
                          <Label htmlFor="forgotOtpRequest" className="text-white">
                            OTP
                          </Label>
                          <Input
                            id="forgotOtpRequest"
                            type="text"
                            inputMode="numeric"
                            placeholder="Enter OTP"
                            value={forgotOtp}
                            onChange={(event) => setForgotOtp(event.target.value)}
                            className={inputClassName}
                          />
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={isSendingOtp || !normalizeEmail(forgotEmail)}
                        className="w-full bg-magenta text-white hover:bg-magenta/90 disabled:opacity-75"
                      >
                        {isSendingOtp ? "Sending..." : isOtpInputVisible ? "Resend OTP" : "Send OTP"}
                      </Button>

                      {forgotError && <p className="text-sm text-rose-200">{forgotError}</p>}
                      {forgotInfo && <p className="text-sm text-emerald-100">{forgotInfo}</p>}
                    </div>

                    {isOtpInputVisible && (
                      <div className="mt-auto pt-6">
                        <Button
                          type="button"
                          onClick={() => void handleContinueAfterOtp()}
                          disabled={!forgotOtp.trim() || isVerifyingOtp}
                          className="w-full bg-magenta text-white hover:bg-magenta/90 disabled:opacity-75"
                        >
                          {isVerifyingOtp ? "Verifying OTP..." : "Continue"}
                        </Button>
                      </div>
                    )}
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="flex min-h-0 flex-1 flex-col">
                    <div className="space-y-4 overflow-y-auto pr-1">
                      <div>
                        <Label htmlFor="forgotEmailOtp" className="text-white">
                          Email ID
                        </Label>
                        <Input
                          id="forgotEmailOtp"
                          type="email"
                          placeholder="name@example.com"
                          required
                          value={forgotEmail}
                          onChange={(event) => setForgotEmail(event.target.value)}
                          className={inputClassName}
                        />
                      </div>

                      <div>
                        <Label htmlFor="forgotOtp" className="text-white">
                          OTP
                        </Label>
                        <Input
                          id="forgotOtp"
                          type="text"
                          inputMode="numeric"
                          placeholder="Enter OTP"
                          required
                          value={forgotOtp}
                          onChange={(event) => setForgotOtp(event.target.value)}
                          className={inputClassName}
                        />
                      </div>

                      <div>
                        <Label htmlFor="forgotNewPassword" className="text-white">
                          New Password
                        </Label>
                        <Input
                          id="forgotNewPassword"
                          type="password"
                          placeholder="Enter new password"
                          required
                          value={forgotNewPassword}
                          onChange={(event) => setForgotNewPassword(event.target.value)}
                          className={inputClassName}
                        />
                      </div>

                      <div>
                        <Label htmlFor="forgotConfirmPassword" className="text-white">
                          Confirm New Password
                        </Label>
                        <Input
                          id="forgotConfirmPassword"
                          type="password"
                          placeholder="Confirm new password"
                          required
                          value={forgotConfirmPassword}
                          onChange={(event) => setForgotConfirmPassword(event.target.value)}
                          className={inputClassName}
                        />
                      </div>

                      {forgotError && <p className="text-sm text-rose-200">{forgotError}</p>}
                      {forgotInfo && <p className="text-sm text-emerald-100">{forgotInfo}</p>}
                    </div>

                    <div className="mt-auto pt-6">
                      <Button
                        type="submit"
                        disabled={isResettingPassword}
                        className="w-full bg-magenta text-white hover:bg-magenta/90 disabled:opacity-75"
                      >
                        {isResettingPassword ? "Resetting Password..." : "Reset Password"}
                      </Button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <>
                <h2 className="mb-5 text-2xl font-script text-white sm:text-3xl">
                  {mode === "login" ? "Welcome Back" : "Create Account"} - {activeRole.label}
                </h2>

                <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                  <div className="space-y-4 overflow-y-auto pr-1">
                    {mode === "register" && role === "user" && (
                      <div>
                        <Label htmlFor="registeringAs" className="text-white">
                          Registering As
                        </Label>
                        <select
                          id="registeringAs"
                          value={registeringAs}
                          onChange={(event) => setRegisteringAs(event.target.value as RegisteringAs)}
                          className={cn(
                            "h-10 w-full rounded-full border px-3 text-sm focus-visible:outline-none focus-visible:ring-2",
                            inputClassName,
                          )}
                        >
                          <option value="bride" className="text-foreground rounded-md border px-3">
                            Bride
                          </option>
                          <option value="groom" className="text-foreground rounded-md border px-3">
                            Groom
                          </option>
                        </select>
                      </div>
                    )}

                    {mode === "register" && role === "user" && (
                      <>
                        <div>
                          <Label htmlFor="firstName" className="text-white">
                            First Name
                          </Label>
                          <Input
                            id="firstName"
                            type="text"
                            placeholder="Enter first name"
                            required
                            value={firstName}
                            onChange={(event) => setFirstName(event.target.value)}
                            className={inputClassName}
                          />
                        </div>

                        <div>
                          <Label htmlFor="lastName" className="text-white">
                            Last Name
                          </Label>
                          <Input
                            id="lastName"
                            type="text"
                            placeholder="Enter last name"
                            required
                            value={lastName}
                            onChange={(event) => setLastName(event.target.value)}
                            className={inputClassName}
                          />
                        </div>
                      </>
                    )}

                    {mode === "register" && role !== "user" && (
                      <div>
                        <Label htmlFor="name" className="text-white">
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter full name"
                          required
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          className={inputClassName}
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="email" className="text-white">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className={inputClassName}
                      />
                    </div>

                    {mode === "register" && role !== "admin" && (
                      <div>
                        <Label htmlFor="phone" className="text-white">
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          type="text"
                          placeholder="Enter phone number"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          className={inputClassName}
                        />
                      </div>
                    )}

                    {mode === "register" && role === "user" && (
                      <div>
                        <Label htmlFor="partner_email" className="text-white">
                          {registeringAs === "bride" ? "Groom Email" : "Bride Email"}
                        </Label>
                        <Input
                          id="partner_email"
                          type="email"
                          placeholder={registeringAs === "bride" ? "groom@example.com" : "bride@example.com"}
                          value={partnerEmail}
                          onChange={(event) => setPartnerEmail(event.target.value)}
                          className={inputClassName}
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="password" className="text-white">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter password"
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className={inputClassName}
                      />
                      {mode === "login" && (
                        <button
                          type="button"
                          onClick={openForgotPasswordFlow}
                          className="p-2 mt-2 text-xs font-semibold text-white/90 underline hover:text-white"
                        >
                          Forgot password?
                        </button>
                      )}

                      {mode === "register" && password.length >0 && !isPasswordValid && (
                        <div className="mt-2 rounded-lg border border-red-400/40 bg-red-500/10 p-3">
                          <p className="text-xs font-semibold text-red-300">
                            Password must include:
                          </p>
                          <ul className="mt-2 space-y-1 text-xs text-red-200">
                            {passwordRules
                              .filter(rule => !rule.isValid)
                              .map(rule => (
                                <li key={rule.text}>• {rule.text}</li>
                              ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {mode === "register" && (
                      <div>
                        <Label htmlFor="confirmPassword" className="text-white">
                          Confirm Password
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm password"
                          required
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          className={inputClassName}
                        />
                      </div>
                    )}

                    {mode === "register" && role === "admin" && (
                      <div>
                        <Label htmlFor="adminSecretKey" className="text-white">
                          Admin Secret Key
                        </Label>
                        <Input
                          id="adminSecretKey"
                          type="password"
                          placeholder="Enter admin secret key"
                          required
                          value={adminSecretKey}
                          onChange={(event) => setAdminSecretKey(event.target.value)}
                          className={inputClassName}
                        />
                      </div>
                    )}

                    {formError && <p className="text-sm text-rose-200">{formError}</p>}
                  </div>

                  <div className="mt-auto pt-6">
                    <Button
                      type="submit"
                      disabled={
                        registerDisabled ||
                        isSubmitting ||
                        (mode === "register" && !isPasswordValid)
                      }
                      className={`w-full py-2 rounded-lg ${
                        mode === "register" && !isPasswordValid
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-magenta text-white hover:bg-magenta/90"
                        }`}
                    >
                      {registerDisabled
                        ? "Admin Registration Disabled"
                        : mode === "login"
                          ? `Continue To ${activeRole.label}`
                          : `Create ${activeRole.label} Account`}
                    </Button>

                    {/* <p className="mt-4 text-xs text-white/85">
                      After submit, you will be redirected to the selected portal.
                    </p> */}
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
