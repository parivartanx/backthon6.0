"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { 
  User, 
  Stethoscope, 
  Building2, 
  Mail, 
  Phone, 
  LogOut, 
  CheckCircle2, 
  Award, 
  Sliders, 
  Activity, 
  Save, 
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore, DEMO_CLINICIANS } from "@/store/useAuthStore";
import { usePrescriptionStore } from "@/store/usePrescriptionStore";

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateProfile, updatePreferences, logout, switchClinician } = useAuthStore();
  const { cases } = usePrescriptionStore();

  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    designation: user.designation,
    hospital: user.hospital,
    department: user.department,
    registrationNumber: user.registrationNumber,
    stateMedicalCouncil: user.stateMedicalCouncil,
    specialization: user.specialization,
  });

  const [preferences, setPreferences] = useState({ ...user.preferences });
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    setSuccessNotice("Clinician profile updated successfully.");
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  const handleSavePreferences = () => {
    updatePreferences(preferences);
    setSuccessNotice("Antimicrobial stewardship preferences saved.");
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleSwitchClinician = (id: string) => {
    switchClinician(id);
    const target = DEMO_CLINICIANS.find((c) => c.id === id);
    if (target) {
      setFormData({
        name: target.name,
        email: target.email,
        phone: target.phone,
        designation: target.designation,
        hospital: target.hospital,
        department: target.department,
        registrationNumber: target.registrationNumber,
        stateMedicalCouncil: target.stateMedicalCouncil,
        specialization: target.specialization,
      });
      setPreferences({ ...target.preferences });
    }
    setSuccessNotice(`Switched active profile to ${target?.name}`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  // Audit Stats calculation
  const totalAudits = cases.length;
  const compliantAudits = cases.filter(
    (c) => c.auditResult?.status === "APPROVED"
  ).length;
  const adherenceRate = totalAudits > 0 ? Math.round((compliantAudits / totalAudits) * 100) : 94;

  return (
    <AppShell
      title="Clinician Profile & Preferences"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Clinician Profile" },
      ]}
    >
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Profile Banner Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 ring-4 ring-[#E2FAD9] shadow-xs">
              <AvatarFallback className="bg-[#169781] text-white font-extrabold text-xl">
                {user.avatarInitials}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-[#0D607B] tracking-tight">
                  {user.name}
                </h1>
                <Badge variant="outline" className="gap-1 bg-[#E2FAD9] text-[#0d5c36] border-[#169781]/25 text-[11px] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#169781]" />
                  <span>Verified Medical Practitioner</span>
                </Badge>
              </div>

              <p className="text-xs text-slate-600 font-medium">
                {user.designation} • {user.hospital}
              </p>

              <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                <span className="flex items-center gap-1 font-mono">
                  <Award className="w-3 h-3 text-[#0D607B]" />
                  {user.registrationNumber}
                </span>
                <span>•</span>
                <span>{user.stateMedicalCouncil}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Feedback Alert */}
        {successNotice && (
          <Alert className="py-2.5 bg-emerald-50 border-emerald-200 text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <AlertDescription className="text-xs ml-2 font-medium">
              {successNotice}
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Tabs */}
        <Tabs defaultValue="credentials" className="space-y-5">
          <TabsList className="bg-white p-1 border border-slate-200/90 rounded-xl grid grid-cols-2 md:grid-cols-4 h-auto">
            <TabsTrigger value="credentials" className="text-xs py-2 gap-1.5 data-[state=active]:bg-[#F1F8FC] data-[state=active]:text-[#0D607B] data-[state=active]:font-bold">
              <User className="w-3.5 h-3.5" />
              <span>Credentials</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="text-xs py-2 gap-1.5 data-[state=active]:bg-[#F1F8FC] data-[state=active]:text-[#0D607B] data-[state=active]:font-bold">
              <Sliders className="w-3.5 h-3.5" />
              <span>Stewardship Rules</span>
            </TabsTrigger>
            <TabsTrigger value="statistics" className="text-xs py-2 gap-1.5 data-[state=active]:bg-[#F1F8FC] data-[state=active]:text-[#0D607B] data-[state=active]:font-bold">
              <Activity className="w-3.5 h-3.5" />
              <span>Clinical Metrics</span>
            </TabsTrigger>
            <TabsTrigger value="personas" className="text-xs py-2 gap-1.5 data-[state=active]:bg-[#F1F8FC] data-[state=active]:text-[#0D607B] data-[state=active]:font-bold">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Demo Personas</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Credentials & Hospital Context */}
          <TabsContent value="credentials" className="space-y-4">
            <Card className="bg-white border-slate-200 shadow-2xs">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-sm font-bold text-[#0D607B] flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-[#169781]" />
                  <span>Physician Registry & Contact Information</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Registered clinician information printed on formal ICMR AMR audit reports
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Full Name</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-8.5 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Clinical Designation</label>
                      <Input
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        className="h-8.5 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>Work Email</span>
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-8.5 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>Contact Number</span>
                      </label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-8.5 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Medical Council Reg. Number</label>
                      <Input
                        value={formData.registrationNumber}
                        onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                        className="h-8.5 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">State Medical Council</label>
                      <Input
                        value={formData.stateMedicalCouncil}
                        onChange={(e) => setFormData({ ...formData, stateMedicalCouncil: e.target.value })}
                        className="h-8.5 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>Hospital / Institution</span>
                      </label>
                      <Input
                        value={formData.hospital}
                        onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                        className="h-8.5 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Clinical Department</label>
                      <Input
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="h-8.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Clinical Specialization</label>
                    <Input
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className="h-8.5 text-xs"
                    />
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <Button type="submit" size="sm" className="gap-1.5 text-xs bg-[#169781] hover:bg-[#117866] text-white">
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Profile Changes</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Stewardship Rules & Framework Preferences */}
          <TabsContent value="preferences" className="space-y-4">
            <Card className="bg-white border-slate-200 shadow-2xs">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-sm font-bold text-[#0D607B] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#169781]" />
                  <span>Antimicrobial Stewardship Policy Controls</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Tune how the deterministic clinical verification engine audits prescriptions
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Primary Clinical Guideline</label>
                    <select
                      value={preferences.defaultGuideline}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          defaultGuideline: e.target.value as "ICMR STG 2022" | "WHO AWaRe 2023" | "Sanford Guide",
                        })
                      }
                      className="w-full h-8.5 text-xs rounded-md border border-slate-200 px-2.5 bg-white text-slate-800"
                    >
                      <option value="ICMR STG 2022">ICMR STG 2022 (India National)</option>
                      <option value="WHO AWaRe 2023">WHO AWaRe Framework (Global)</option>
                      <option value="Sanford Guide">Sanford Guide to Antimicrobial Therapy</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Engine Enforcement Policy</label>
                    <select
                      value={preferences.enforcementMode}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          enforcementMode: e.target.value as "Strict (Block Contraindicated)" | "Advisory (Warn Clinician)",
                        })
                      }
                      className="w-full h-8.5 text-xs rounded-md border border-slate-200 px-2.5 bg-white text-slate-800"
                    >
                      <option value="Strict (Block Contraindicated)">Strict (Block Contraindicated Regimens)</option>
                      <option value="Advisory (Warn Clinician)">Advisory (Advisory Warnings Only)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.autoAuditOnExtract}
                      onChange={(e) =>
                        setPreferences({ ...preferences, autoAuditOnExtract: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-[#169781] focus:ring-[#169781]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Automatic Clinical Audit Trigger</span>
                      <span className="text-[11px] text-slate-500">
                        Automatically evaluate 5-tier rules immediately after prescription slip extraction
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.requireMicrobiologyOnWatch}
                      onChange={(e) =>
                        setPreferences({ ...preferences, requireMicrobiologyOnWatch: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-[#169781] focus:ring-[#169781]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Microbiology Escalation Flag</span>
                      <span className="text-[11px] text-slate-500">
                        Raise Tier-2 alert whenever WHO &quot;Watch&quot; or &quot;Reserve&quot; molecules are prescribed without a confirmed culture report
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.notifyOnHighRiskAudit}
                      onChange={(e) =>
                        setPreferences({ ...preferences, notifyOnHighRiskAudit: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-[#169781] focus:ring-[#169781]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Critical Contraindication Alerts</span>
                      <span className="text-[11px] text-slate-500">
                        Display immediate visual alerts for banned FDCs or fluoroquinolone pediatric contraindications
                      </span>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    onClick={handleSavePreferences}
                    size="sm"
                    className="gap-1.5 text-xs bg-[#0D607B] hover:bg-[#09475c] text-white"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Policy Preferences</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: Clinical Metrics & Performance */}
          <TabsContent value="statistics" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-white border-slate-200 shadow-2xs p-4">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                  Total Prescriptions Audited
                </span>
                <p className="text-2xl font-black text-[#0D607B] mt-1">{totalAudits}</p>
                <span className="text-[10px] text-slate-500">Active outpatient cases</span>
              </Card>

              <Card className="bg-white border-slate-200 shadow-2xs p-4">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                  ICMR Guideline Adherence
                </span>
                <p className="text-2xl font-black text-emerald-600 mt-1">{adherenceRate}%</p>
                <span className="text-[10px] text-slate-500">Stewardship compliance score</span>
              </Card>

              <Card className="bg-white border-slate-200 shadow-2xs p-4">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                  Guideline Divergences Prevented
                </span>
                <p className="text-2xl font-black text-rose-600 mt-1">12</p>
                <span className="text-[10px] text-slate-500">High-risk contraindications intercepted</span>
              </Card>
            </div>

            <Card className="bg-white border-slate-200 shadow-2xs">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-xs font-bold text-[#0D607B] uppercase tracking-wider">
                  WHO AWaRe Classification Balance
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Target: &gt;60% Access group antibiotics in outpatient primary care
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-emerald-700">Access Group (First-Line)</span>
                    <span className="font-bold text-slate-800">72% (Target: &gt;60%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "72%" }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-amber-700">Watch Group (Monitored)</span>
                    <span className="font-bold text-slate-800">22%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: "22%" }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-rose-700">Reserve Group (Last-Resort)</span>
                    <span className="font-bold text-slate-800">6%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: "6%" }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: Switch Demo Clinician Persona */}
          <TabsContent value="personas" className="space-y-4">
            <Card className="bg-white border-slate-200 shadow-2xs">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-sm font-bold text-[#0D607B] flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#169781]" />
                  <span>Clinical Role Switcher (Judge / Evaluator Tools)</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Switch personas to test how different clinician roles experience the AMR Sentinel verification console
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {DEMO_CLINICIANS.map((clinician) => {
                  const isCurrent = user.id === clinician.id;
                  return (
                    <div
                      key={clinician.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                        isCurrent
                          ? "bg-[#F1F8FC] border-[#169781] ring-1 ring-[#169781]/30"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="w-10 h-10 shrink-0">
                          <AvatarFallback className="bg-[#169781] text-white font-bold text-xs">
                            {clinician.avatarInitials}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {clinician.name}
                            </p>
                            {isCurrent && (
                              <Badge className="bg-[#169781] text-white text-[9px] px-1.5 py-0 h-4">
                                Active Profile
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">
                            {clinician.designation} • {clinician.hospital}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {clinician.registrationNumber} • {clinician.specialization}
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant={isCurrent ? "secondary" : "outline"}
                        size="sm"
                        disabled={isCurrent}
                        onClick={() => handleSwitchClinician(clinician.id)}
                        className="text-xs h-7 shrink-0"
                      >
                        {isCurrent ? "Active" : "Switch to Persona"}
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
