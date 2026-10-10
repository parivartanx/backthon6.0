"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  UserCheck, 
  Building2, 
  Eye, 
  EyeOff,
  AlertCircle,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthStore, DEMO_CLINICIANS } from "@/store/useAuthStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function LoginPage() {
  const router = useRouter();
  const { login, switchClinician, isAuthenticated, user, isLoading } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage("Please enter your registered clinician email or Medical Council ID.");
      return;
    }

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch {
      setErrorMessage("Authentication failed. Please verify your credentials.");
    }
  };

  const handleQuickLogin = (clinicianId: string) => {
    switchClinician(clinicianId);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#F1F8FC] flex flex-col justify-between text-slate-800">
      {/* Top Clinical Header */}
      <header className="px-6 py-4 bg-white border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0D607B] to-[#169781] p-0.5 shadow-2xs overflow-hidden flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/vector2.jpeg" 
              alt="AMR Sentinel" 
              className="w-full h-full object-cover rounded-[10px]"
            />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-[#0D607B]">AMR Sentinel</h1>
            <p className="text-[10px] text-slate-500 font-medium">Clinical Stewardship Decision Support</p>
          </div>
        </div>

        <Badge variant="outline" className="hidden sm:inline-flex gap-1.5 px-2.5 py-1 bg-[#E2FAD9] border-[#169781]/20 text-[11px] font-semibold text-[#0d5c36]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#169781]" />
          <span>ICMR & WHO AWaRe Verified</span>
        </Badge>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md space-y-6">
          {/* Active Session Notice (if user is already authenticated) */}
          {isAuthenticated && (
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                  {user.avatarInitials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    Active: {user.name}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{user.hospital}</p>
                </div>
              </div>
              <Button asChild size="sm" className="h-7 text-xs bg-[#169781] hover:bg-[#117866] text-white shrink-0">
                <Link href="/dashboard">
                  <span>Enter</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </div>
          )}

          {/* Login Card */}
          <Card className="bg-white border-slate-200/90 shadow-xs">
            <CardHeader className="space-y-1.5 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-[#0D607B]">
                  Clinician Sign In
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] font-semibold text-[#0D607B] bg-[#F1F8FC]">
                  Hospital EMR
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Sign in to audit outpatient prescriptions and access antimicrobial guidelines
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {errorMessage && (
                <Alert variant="destructive" className="py-2.5 px-3 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-100/70 p-1 rounded-md transition-colors shrink-0"
                    aria-label="Dismiss error"
                    title="Dismiss error"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Work Email or Medical Council ID</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="dr.sharma@hospital.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 text-xs"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Password</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] text-[#0D607B] hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-9 text-xs pr-9"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-9 text-xs font-semibold text-white bg-[#0D607B] hover:bg-[#09475c] shadow-xs"
                  >
                    {isLoading ? "Authenticating Session..." : "Sign In to Clinical Workspace"}
                  </Button>
                </div>
              </form>

              {/* Demo Quick-Login Clinician Presets */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  One-Click Clinician Profiles (Demo Mode)
                </p>

                <div className="space-y-2">
                  {DEMO_CLINICIANS.map((clinician) => (
                    <button
                      key={clinician.id}
                      type="button"
                      onClick={() => handleQuickLogin(clinician.id)}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200/80 hover:border-[#169781] hover:bg-[#F1F8FC] transition-colors text-left group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-[#169781] group-hover:text-white text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 transition-colors">
                          {clinician.avatarInitials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 group-hover:text-[#0D607B] truncate">
                            {clinician.name}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {clinician.designation} • {clinician.hospital.split("/")[0]}
                          </p>
                        </div>
                      </div>

                      <UserCheck className="w-4 h-4 text-slate-300 group-hover:text-[#169781] shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security & Regulatory Footnote */}
          <div className="p-3 bg-white/70 rounded-xl border border-slate-200/60 text-center space-y-1">
            <div className="flex items-center justify-center gap-2 text-slate-600 text-[11px] font-medium">
              <Building2 className="w-3.5 h-3.5 text-[#169781]" />
              <span>National Antimicrobial Stewardship Framework</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Authorized clinical access only • All prescription audits logged under Medical Council regulations
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 px-6 text-center text-[11px] text-slate-400 border-t border-slate-200 bg-white">
        AMR Sentinel © 2026 • AI-Augmented Outpatient Prescription Stewardship Console
      </footer>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotModal} onOpenChange={setShowForgotModal}>
        <DialogContent className="sm:max-w-sm p-5 space-y-3">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-sm font-bold text-slate-800">Hospital Credential Support</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              AMR Sentinel authentication is managed via your hospital directory (LDAP / Active Directory) or Medical Council Registry.
            </DialogDescription>
          </DialogHeader>
          <div className="text-xs text-slate-600 space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p>
              Please contact your hospital IT department or clinical informatics officer to reset your hospital portal access.
            </p>
            <p className="text-[11px] text-slate-400">
              For demo testing, use any of the one-click demo clinician profiles available on the login screen.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              size="sm"
              onClick={() => setShowForgotModal(false)}
              className="text-xs font-semibold text-white bg-[#0D607B] hover:bg-[#09475c]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
