import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, ArrowRight, Leaf, Phone } from "lucide-react";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type InputFieldProps = {
  label: string;
  icon: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>;

const InputField = ({ label, icon, ...props }: InputFieldProps) => (
  <div className="space-y-1.5">
    <label className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</label>
    <div className="group relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-green-500">
        {icon}
      </div>
      <input
        {...props}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition-all focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
      />
    </div>
  </div>
);

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [mode, setMode] = useState("login");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    window.setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />

      <motion.div
        layout
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative z-10 max-h-[99vh] w-full max-w-[440px] overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="h-2 w-full bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600" />

        <button
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <Leaf size={28} fill="currentColor" fillOpacity={0.2} />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {mode === "login" ? "Welcome back" : "Join the farm"}
            </h2>
            <p className="mt-2 text-slate-500">
              {mode === "login"
                ? "Enter your credentials to access your dashboard"
                : "Start managing your sustainable agriculture today"}
            </p>
          </div>

          <div className="relative mb-8 flex rounded-xl bg-slate-100 p-1">
            <motion.div
              className="absolute inset-y-1 rounded-lg bg-white shadow-sm"
              initial={false}
              animate={{
                x: mode === "login" ? 0 : "100%",
                width: "49%",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <button
              onClick={() => setMode("login")}
              className={`relative z-10 flex-1 py-2.5 text-sm font-semibold transition-colors ${
                mode === "login" ? "text-green-700" : "text-slate-500"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode("register")}
              className={`relative z-10 flex-1 py-2.5 text-sm font-semibold transition-colors ${
                mode === "register" ? "text-green-700" : "text-slate-500"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className={`${mode === "register" ? "max-h-[320px] overflow-y-auto pr-2" : ""} space-y-5`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {mode === "register" && (
                    <InputField icon={<User size={18} />} label="Full Name" type="text" placeholder="John Doe" />
                  )}

                  <InputField
                    icon={<Mail size={18} />}
                    label="Email Address"
                    type="email"
                    placeholder="name@farm.com"
                  />

                  {mode === "register" && (
                    <InputField icon={<Phone size={18} />} label="Phone" type="text" placeholder="9876543210" />
                  )}

                  <div className="space-y-1.5">
                    <InputField
                      icon={<Lock size={18} />}
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                    />
                    {mode === "login" && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="text-xs font-medium text-green-600 hover:text-green-700"
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}
                  </div>

                  {mode === "register" && (
                    <InputField
                      icon={<Lock size={18} />}
                      label="Confirm Password"
                      type="password"
                      placeholder="••••••••"
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <button
              disabled={isLoading}
              className="group relative mt-5 flex w-full items-center justify-center overflow-hidden rounded-xl bg-slate-900 py-3.5 font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <span className="flex items-center gap-2">
                  {mode === "login" ? "Sign In" : "Create Account"}
                  <ArrowRight size={18} className="group-hover:translate-x-1" />
                </span>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            {mode === "login" ? "New to SmartFarm?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="font-bold text-green-600 hover:text-green-700"
            >
              {mode === "login" ? "Join now" : "Log in"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthModal;
