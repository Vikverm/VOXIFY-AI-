import React, { useState } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  registerClient,
  loginClient,
  loginWithGoogle,
  UserProfile,
} from "../lib/firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
  initialMode?: "login" | "register";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = "login",
}) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSwitchMode = (newMode: "login" | "register") => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg("Please provide your email and password.");
      return;
    }

    if (mode === "register") {
      if (password.length < 6) {
        setErrorMsg("Password should be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match.");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === "register") {
        const profile = await registerClient(email, password, fullName);
        setSuccessMsg("Account created! 10,000 free credits added.");
        setTimeout(() => {
          onAuthSuccess(profile);
          onClose();
        }, 1200);
      } else {
        const profile = await loginClient(email, password);
        setSuccessMsg(`Welcome back, ${profile.displayName}!`);
        setTimeout(() => {
          onAuthSuccess(profile);
          onClose();
        }, 800);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let message = "Authentication failed. Please check your credentials.";
      const code = err?.code || "";
      if (code === "auth/email-already-in-use") {
        message = "This email is already registered. Please sign in instead.";
      } else if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        message = "Invalid email or password. Please verify and try again.";
      } else if (code === "auth/user-not-found") {
        message = "No account found with this email. Please register first.";
      } else if (code === "auth/weak-password") {
        message = "Password is too weak. Please use at least 6 characters.";
      } else if (code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (err?.message) {
        message = err.message;
      }
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const profile = await loginWithGoogle();
      setSuccessMsg(`Welcome, ${profile.displayName}!`);
      setTimeout(() => {
        onAuthSuccess(profile);
        onClose();
      }, 800);
    } catch (err: any) {
      if (
        err?.code === "auth/popup-closed-by-user" ||
        err?.code === "auth/cancelled-popup-request" ||
        err?.message?.includes("popup-closed-by-user")
      ) {
        // User closed or cancelled the popup intentionally; no error to report
        console.info("Google Sign-In popup closed by user.");
      } else {
        console.error("Google Auth error:", err);
        setErrorMsg(err?.message || "Google Sign-In was cancelled or failed. Please try again or use email.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        id="auth-modal-card"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between bg-gradient-to-b from-blue-50/50 via-slate-50/30 to-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs font-bold text-lg">
              V
            </div>
            <div>
              <h2
                id="auth-modal-title"
                className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5"
              >
                {mode === "login" ? "Welcome Back to Voxify" : "Welcome to Voxify AI"}
                <Sparkles className="h-4 w-4 text-blue-600" />
              </h2>
              <p className="text-xs text-slate-500">
                {mode === "login"
                  ? "Sign in to access your saved audio takes, API keys & credits"
                  : "Claim 10,000 Free Credits to create hyper-realistic AI voices"}
              </p>
            </div>
          </div>
          <button
            id="btn-close-auth-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Notification Messages */}
          {errorMsg && (
            <div
              id="auth-error-banner"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2"
            >
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              id="auth-success-banner"
              className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* Primary Action: Google 1-Click Register / Sign In */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-100/90 text-center space-y-3">
            <div className="flex items-center justify-between text-xs text-blue-900 font-medium">
              <span className="flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-blue-600" /> Recommended
              </span>
              <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold tracking-wide">
                +10,000 Free Credits
              </span>
            </div>

            <button
              id="btn-google-auth-primary"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-800 font-bold text-sm flex items-center justify-center gap-3 shadow-xs hover:shadow-sm transition cursor-pointer disabled:opacity-60"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.27 21.43 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.1z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.57 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
            <p className="text-[11px] text-slate-500">
              Instant 1-click registration • Zero passwords required
            </p>
          </div>

          {/* Quick Perks List */}
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
            <div>
              <strong className="block text-slate-900 font-semibold">10,000 Credits</strong>
              Free on sign up
            </div>
            <div>
              <strong className="block text-slate-900 font-semibold">30 Voices</strong>
              48kHz studio audio
            </div>
            <div>
              <strong className="block text-slate-900 font-semibold">Cloud Library</strong>
              Save &amp; export takes
            </div>
          </div>

          {/* Or Divider */}
          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-3 text-slate-400 text-xs font-medium">or continue with email</span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-semibold">
            <button
              id="btn-switch-to-login"
              type="button"
              onClick={() => handleSwitchMode("login")}
              className={`py-1.5 rounded-lg transition cursor-pointer ${
                mode === "login"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sign In
            </button>
            <button
              id="btn-switch-to-register"
              type="button"
              onClick={() => handleSwitchMode("register")}
              className={`py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                mode === "register"
                  ? "bg-white text-blue-600 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Register</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded-full font-bold">
                +10k
              </span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Client / Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="input-auth-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Client Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="input-auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Password
                </label>
                {mode === "login" && (
                  <span className="text-[11px] text-slate-400">
                    Min. 6 characters
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="input-auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="input-auth-confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <button
              id="btn-auth-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{mode === "login" ? "Signing In..." : "Creating Account..."}</span>
                </>
              ) : (
                <>
                  <span>{mode === "login" ? "Sign In to Client Studio" : "Create Free Account"}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Modal Footer Assurance */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>256-bit Cloud Security &amp; Privacy</span>
          </div>
          <button
            id="btn-footer-toggle-mode"
            type="button"
            onClick={() => handleSwitchMode(mode === "login" ? "register" : "login")}
            className="text-blue-600 hover:text-blue-700 font-semibold transition cursor-pointer"
          >
            {mode === "login" ? "Need an account? Register" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};
