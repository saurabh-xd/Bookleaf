"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import {
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  Lock,
  Mail,
  ArrowRight,
  X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shake, setShake] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      triggerError("Please enter both your email address and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await login(email.trim(), password);
      toast.success("Welcome back!", {
        duration: 3500,
        position: "bottom-right",
      });
      router.push("/");
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.response?.data?.message ||
        "Invalid email or password. Please check your credentials and try again.";
      triggerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setShake(true);

    // Trigger react-hot-toast explicitly in bottom-right
    toast.error(msg, {
      duration: 5000,
      position: "bottom-right",
      style: {
        background: "#b91c1c",
        color: "#ffffff",
        fontWeight: "600",
        fontSize: "14px",
        borderRadius: "12px",
        padding: "14px 18px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
      },
      iconTheme: {
        primary: "#ffffff",
        secondary: "#b91c1c",
      },
    });

    setTimeout(() => setShake(false), 500);
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Dedicated react-hot-toast Toaster ensuring direct render in bottom-right */}
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        containerStyle={{
          bottom: 24,
          right: 24,
          zIndex: 9999999,
        }}
      />

      {/* Expanded Container Width: max-w-xl (576px) for generous, modern SaaS proportions */}
      <div
        className={`w-full max-w-xl space-y-8 transition-transform ${
          shake ? "animate-shake" : ""
        }`}
      >
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-16 w-16 rounded-2xl bg-primary text-primary-foreground items-center justify-center font-bold text-3xl shadow-lg mx-auto">
            B
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Sign In to BookLeaf
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
              Author Publishing, Royalties & Operations Support Portal
            </p>
          </div>
        </div>

        {/* Spacious Login Card */}
        <div className="bg-card border border-border rounded-2xl p-8 sm:p-10 shadow-2xl space-y-6">
          {/* Prominent In-Card Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/40 text-destructive text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-destructive" />
              <div className="flex-1 min-w-0">
                <span className="font-bold block text-sm">
                  Authentication Failed
                </span>
                <span className="text-xs sm:text-sm leading-relaxed opacity-95">
                  {errorMessage}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-destructive/70 hover:text-destructive p-1 rounded-md cursor-pointer transition-colors"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="login-email"
                className="block text-xs sm:text-sm font-semibold uppercase tracking-wider text-foreground"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isSubmitting}
                  className={`w-full h-12 sm:h-14 pl-12 pr-4 text-base rounded-xl bg-card border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
                    errorMessage
                      ? "border-destructive ring-1 ring-destructive/40"
                      : "border-border"
                  }`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-xs sm:text-sm font-semibold uppercase tracking-wider text-foreground"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isSubmitting}
                  className={`w-full h-12 sm:h-14 pl-12 pr-12 text-base rounded-xl bg-card border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
                    errorMessage
                      ? "border-destructive ring-1 ring-destructive/40"
                      : "border-border"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1.5 rounded-lg cursor-pointer transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 sm:h-14 rounded-full font-bold text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2.5 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] mt-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
