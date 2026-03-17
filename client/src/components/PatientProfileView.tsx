import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  User, Activity, Heart, AlertTriangle, FileCheck, ClipboardList, Bed, HeartPulse,
  FlaskConical, DollarSign, Droplets, Wind, Syringe, Stethoscope, UserCheck,
  ClipboardCheck, FileText, Scissors, Shield, Eye
} from "lucide-react";
import { OverviewTab } from "@/components/monitoring/OverviewTab";

interface PatientProfileViewProps {
  servicePatientId: string | null;
  patientName: string;
  demographics?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    gender?: string;
    dateOfBirth?: string;
    phone?: string;
    email?: string;
    address?: string;
    insuranceProvider?: string;
  } | null;
  barcodeData?: {
    uhid?: string;
    admissionType?: string;
    wardBed?: string;
    treatingDoctor?: string;
  } | null;
  trackingData?: {
    status?: string;
    room?: string;
    attendingDoctor?: string;
    doctor?: string;
    diagnosis?: string;
    bloodGroup?: string;
  } | null;
  enabled?: boolean;
}

export function PatientProfileView({
  servicePatientId,
  patientName,
  demographics,
  barcodeData,
  trackingData,
  enabled = true,
}: PatientProfileViewProps) {
  const [profileActiveSection, setProfileActiveSection] = useState("opd");
  const [viewingDigitalConsent, setViewingDigitalConsent] = useState<any | null>(null);
  const [consentViewHtml, setConsentViewHtml] = useState<string>("");
  const [consentViewLoading, setConsentViewLoading] = useState(false);
  const consentIframeRef = useRef<HTMLIFrameElement>(null);

  const { data: allTrackingPatients = [] } = useQuery<any[]>({
    queryKey: ["/api/tracking/patients"],
    refetchInterval: 30000,
  });

  const profilePatientId = (() => {
    if (!patientName || !allTrackingPatients.length) return null;
    const lower = patientName.toLowerCase().trim();
    const match = (allTrackingPatients as any[]).find((t: any) => {
      const tn = (t.name || "").toLowerCase().trim();
      if (tn === lower) return true;
      const parts = lower.split(" ").filter(Boolean);
      return parts.length > 0 && parts.every((p: string) => tn.includes(p));
    });
    return match?.id || null;
  })();

  const { data: longitudinalProfile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ["/api/service-patients", servicePatientId, "longitudinal-profile"],
    queryFn: async () => {
      if (!servicePatientId) return null;
      const res = await fetch(`/api/service-patients/${servicePatientId}/longitudinal-profile`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!servicePatientId && enabled,
    refetchInterval: enabled ? 30000 : false,
    staleTime: 0,
  });

  const { data: profileDigitalConsents = [] } = useQuery<any[]>({
    queryKey: ["/api/digital-consents/patient", servicePatientId, patientName],
    queryFn: async () => {
      if (!servicePatientId) return [];
      const params = new URLSearchParams({ name: patientName });
      const res = await fetch(`/api/digital-consents/patient/${servicePatientId}?${params}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!servicePatientId && enabled,
    refetchInterval: enabled ? 15000 : false,
  });

  const { data: profileMonitoringSessions = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/sessions/patient", profilePatientId],
    queryFn: async () => {
      if (!profilePatientId) return [];
      const res = await fetch(`/api/patient-monitoring/sessions/patient/${profilePatientId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!profilePatientId && enabled,
    refetchInterval: enabled ? 10000 : false,
    staleTime: 0,
  });

  const profileLatestSession = profileMonitoringSessions[0];
  const profileSessionId = profileLatestSession?.id;

  const { data: profileVitals = [] } = useQuery<any[]>({
    queryKey: [`/api/patient-monitoring/vitals/${profileSessionId}`],
    queryFn: async () => {
      if (!profileSessionId) return [];
      const res = await fetch(`/api/patient-monitoring/vitals/${profileSessionId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!profileSessionId && enabled,
    refetchInterval: enabled ? 3000 : false,
    staleTime: 0,
  });

  const { data: profileIntake = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/intake", profileSessionId],
    queryFn: async () => {
      if (!profileSessionId) return [];
      const res = await fetch(`/api/patient-monitoring/intake/${profileSessionId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!profileSessionId && enabled,
    refetchInterval: enabled ? 10000 : false,
    staleTime: 0,
  });

  const { data: profileOutput = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/output", profileSessionId],
    queryFn: async () => {
      if (!profileSessionId) return [];
      const res = await fetch(`/api/patient-monitoring/output/${profileSessionId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!profileSessionId && enabled,
    refetchInterval: enabled ? 10000 : false,
    staleTime: 0,
  });

  const { data: profileDiabetic = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/diabetic", profileSessionId],
    queryFn: async () => {
      if (!profileSessionId) return [];
      const res = await fetch(`/api/patient-monitoring/diabetic/${profileSessionId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!profileSessionId && enabled,
    staleTime: 0,
  });

  const { data: profileAllergies = null } = useQuery<any>({
    queryKey: ["/api/patient-monitoring/allergies", profileSessionId],
    queryFn: async () => {
      if (!profileSessionId) return null;
      const res = await fetch(`/api/patient-monitoring/allergies/${profileSessionId}`, { credentials: "include" });
      if (!res.ok) return null;
      const data = await res.json();
      return Array.isArray(data) ? data[0] || null : data;
    },
    enabled: !!profileSessionId && enabled,
    staleTime: 0,
  });

  const { data: profileCarePlan = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/care-plan", profileSessionId],
    queryFn: async () => {
      if (!profileSessionId) return [];
      const res = await fetch(`/api/patient-monitoring/care-plan/${profileSessionId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!profileSessionId && enabled,
    staleTime: 0,
  });

  const { data: profileOxygen = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/oxygen", profileSessionId],
    queryFn: async () => {
      if (!profileSessionId) return [];
      const res = await fetch(`/api/patient-monitoring/oxygen/${profileSessionId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!profileSessionId && enabled,
    staleTime: 0,
  });

  const { data: profileInvestigation = null } = useQuery<any>({
    queryKey: ["/api/patient-monitoring/sessions", profileSessionId, "investigation-chart"],
    queryFn: async () => {
      if (!profileSessionId) return null;
      const res = await fetch(`/api/patient-monitoring/sessions/${profileSessionId}/investigation-chart`, { credentials: "include" });
      if (!res.ok) return null;
      const data = await res.json();
      return Array.isArray(data) ? data[0] || null : data;
    },
    enabled: !!profileSessionId && enabled,
    staleTime: 0,
  });

  const { data: profileInotropes = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/inotropes", profileSessionId],
    queryFn: async () => {
      if (!profileSessionId) return [];
      const res = await fetch(`/api/patient-monitoring/inotropes/${profileSessionId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!profileSessionId && enabled,
    staleTime: 0,
  });

  const { data: profileVentilator = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/ventilator", profileSessionId],
    queryFn: async () => {
      if (!profileSessionId) return [];
      const res = await fetch(`/api/patient-monitoring/ventilator/${profileSessionId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!profileSessionId && enabled,
    staleTime: 0,
  });

  const { data: profileDoctorsProgress = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/doctors-progress", profileSessionId],
    queryFn: async () => {
      if (!profileSessionId) return [];
      const res = await fetch(`/api/patient-monitoring/doctors-progress/${profileSessionId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!profileSessionId && enabled,
    staleTime: 0,
  });

  const { data: profileDoctorsVisit = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/doctors-visit", profileSessionId],
    queryFn: async () => {
      if (!profileSessionId) return [];
      const res = await fetch(`/api/patient-monitoring/doctors-visit/${profileSessionId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!profileSessionId && enabled,
    staleTime: 0,
  });

  const { data: profileNursingProgressData = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/nursing-progress", profileSessionId],
    queryFn: async () => {
      if (!profileSessionId) return [];
      const res = await fetch(`/api/patient-monitoring/nursing-progress/${profileSessionId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!profileSessionId && enabled,
    staleTime: 0,
  });

  const { data: profileNursingAssessmentArr = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/nursing-assessment", profileSessionId],
    queryFn: async () => {
      if (!profileSessionId) return [];
      const res = await fetch(`/api/patient-monitoring/nursing-assessment/${profileSessionId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!profileSessionId && enabled,
    staleTime: 0,
  });
  const profileNursingAssessment = (profileNursingAssessmentArr as any[])[0] || null;

  const { data: profileIndoorConsultation = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/indoor-consultation", profileSessionId],
    queryFn: async () => {
      if (!profileSessionId) return [];
      const res = await fetch(`/api/patient-monitoring/indoor-consultation/${profileSessionId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!profileSessionId && enabled,
    staleTime: 0,
  });

  const { data: profileInitialAssessmentArr = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/initial-assessment", profileSessionId],
    queryFn: async () => {
      if (!profileSessionId) return [];
      const res = await fetch(`/api/patient-monitoring/initial-assessment/${profileSessionId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!profileSessionId && enabled,
    staleTime: 0,
  });
  const profileInitialAssessment = (profileInitialAssessmentArr as any[])[0] || null;

  const { data: profileSurgeryNotes = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/surgery-notes", profileSessionId],
    queryFn: async () => {
      if (!profileSessionId) return [];
      const res = await fetch(`/api/patient-monitoring/surgery-notes/${profileSessionId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!profileSessionId && enabled,
    staleTime: 0,
  });

  const profileTotalIntake = (profileIntake as any[]).reduce((s: number, r: any) => s + (r.hourlyTotal || 0), 0);
  const profileTotalOutput = (profileOutput as any[]).reduce((s: number, r: any) => s + (r.hourlyTotal || 0), 0);
  const profileFluidBalance = profileTotalIntake - profileTotalOutput;

  useEffect(() => {
    if (!viewingDigitalConsent) {
      setConsentViewHtml("");
      return;
    }
    if (viewingDigitalConsent.consentContent) {
      setConsentViewHtml(viewingDigitalConsent.consentContent);
      return;
    }
    const consentTypeKey = viewingDigitalConsent.consentType;
    const patientId = viewingDigitalConsent.patientId || viewingDigitalConsent.patientUhid || "";
    if (!consentTypeKey) return;
    setConsentViewLoading(true);
    setConsentViewHtml("");
    fetch(`/api/consent-templates/${consentTypeKey}/render?patientId=${patientId}`, { credentials: "include" })
      .then((res) => res.text())
      .then((html) => { setConsentViewHtml(html); setConsentViewLoading(false); })
      .catch(() => { setConsentViewLoading(false); });
  }, [viewingDigitalConsent]);

  useEffect(() => {
    if (consentIframeRef.current && consentViewHtml) {
      const doc = consentIframeRef.current.contentDocument;
      if (doc) { doc.open(); doc.write(consentViewHtml); doc.close(); }
    }
  }, [consentViewHtml]);

  const displayName = demographics?.firstName
    ? `${demographics.firstName} ${demographics.lastName || ""}`.trim()
    : (demographics?.name || patientName);

  const MonitoringSubTabs = ({ prefix }: { prefix: string }) => (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="flex flex-wrap h-auto gap-0.5 p-1.5 bg-muted/50 rounded-lg w-full mb-3 border-b border-border pb-3">
        <TabsTrigger value="overview" className="text-xs gap-1 data-[state=active]:bg-background h-7 px-2"><Activity className="h-3.5 w-3.5 shrink-0" />Overview</TabsTrigger>
        <TabsTrigger value="vitals" className="text-xs gap-1 data-[state=active]:bg-background h-7 px-2"><Heart className="h-3.5 w-3.5 shrink-0" />Vitals</TabsTrigger>
        <TabsTrigger value="allergies" className="text-xs gap-1 data-[state=active]:bg-background h-7 px-2"><AlertTriangle className="h-3.5 w-3.5 shrink-0" />Allergies</TabsTrigger>
        <TabsTrigger value="careplan" className="text-xs gap-1 data-[state=active]:bg-background h-7 px-2"><FileCheck className="h-3.5 w-3.5 shrink-0" />Care Plan</TabsTrigger>
        <TabsTrigger value="diabetic" className="text-xs gap-1 data-[state=active]:bg-background h-7 px-2"><Activity className="h-3.5 w-3.5 shrink-0" />Diabetic</TabsTrigger>
        <TabsTrigger value="intake" className="text-xs gap-1 data-[state=active]:bg-background h-7 px-2"><Droplets className="h-3.5 w-3.5 shrink-0" />Intake</TabsTrigger>
        <TabsTrigger value="output" className="text-xs gap-1 data-[state=active]:bg-background h-7 px-2"><Droplets className="h-3.5 w-3.5 shrink-0" />Output</TabsTrigger>
        <TabsTrigger value="drugchart" className="text-xs gap-1 data-[state=active]:bg-background h-7 px-2"><Syringe className="h-3.5 w-3.5 shrink-0" />Drug Chart</TabsTrigger>
        <TabsTrigger value="investigation" className="text-xs gap-1 data-[state=active]:bg-background h-7 px-2"><ClipboardList className="h-3.5 w-3.5 shrink-0" />Investigation</TabsTrigger>
        <TabsTrigger value="oxygen" className="text-xs gap-1 data-[state=active]:bg-background h-7 px-2"><Wind className="h-3.5 w-3.5 shrink-0" />Oxygen</TabsTrigger>
        <TabsTrigger value="ventilator" className="text-xs gap-1 data-[state=active]:bg-background h-7 px-2"><Wind className="h-3.5 w-3.5 shrink-0" />Ventilator</TabsTrigger>
        <TabsTrigger value="doctorsprogress" className="text-xs gap-1 data-[state=active]:bg-background h-7 px-2"><Stethoscope className="h-3.5 w-3.5 shrink-0" />Doctor's Progress</TabsTrigger>
        <TabsTrigger value="doctorsvisit" className="text-xs gap-1 data-[state=active]:bg-background h-7 px-2"><UserCheck className="h-3.5 w-3.5 shrink-0" />Doctor's Visit</TabsTrigger>
        <TabsTrigger value="nursingassessment" className="text-xs gap-1 data-[state=active]:bg-background h-7 px-2"><ClipboardCheck className="h-3.5 w-3.5 shrink-0" />Nursing Assessment</TabsTrigger>
        <TabsTrigger value="nursingprogress" className="text-xs gap-1 data-[state=active]:bg-background h-7 px-2"><FileText className="h-3.5 w-3.5 shrink-0" />Nursing Progress</TabsTrigger>
        <TabsTrigger value="indoorconsultation" className="text-xs gap-1 data-[state=active]:bg-background h-7 px-2"><FileText className="h-3.5 w-3.5 shrink-0" />Indoor Continuation</TabsTrigger>
        <TabsTrigger value="initialassessment" className="text-xs gap-1 data-[state=active]:bg-background h-7 px-2"><ClipboardList className="h-3.5 w-3.5 shrink-0" />Initial Assessment</TabsTrigger>
        <TabsTrigger value="surgerynotes" className="text-xs gap-1 data-[state=active]:bg-background h-7 px-2"><Scissors className="h-3.5 w-3.5 shrink-0" />Surgery Notes</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-2 pb-2">
        {profileLatestSession
          ? <OverviewTab session={profileLatestSession} />
          : <p className="text-sm text-muted-foreground text-center py-8">No monitoring session found.</p>}
      </TabsContent>

      <TabsContent value="vitals" className="mt-2 pb-2 space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg">
            <p className="text-muted-foreground">Total Intake</p>
            <p className="font-bold text-blue-700 dark:text-blue-300">{profileTotalIntake} mL</p>
          </div>
          <div className="p-2 bg-orange-50 dark:bg-orange-950/40 rounded-lg">
            <p className="text-muted-foreground">Total Output</p>
            <p className="font-bold text-orange-700 dark:text-orange-300">{profileTotalOutput} mL</p>
          </div>
          <div className="p-2 bg-muted/60 rounded-lg">
            <p className="text-muted-foreground">Fluid Balance</p>
            <p className={`font-bold ${profileFluidBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {profileFluidBalance >= 0 ? "+" : ""}{profileFluidBalance} mL
            </p>
          </div>
        </div>
        {(profileVitals as any[]).length === 0
          ? <p className="text-sm text-muted-foreground text-center py-4">No vitals recorded</p>
          : <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="p-1.5 text-left">Time</th>
                    <th className="p-1.5 text-center">HR</th>
                    <th className="p-1.5 text-center">BP</th>
                    <th className="p-1.5 text-center">Temp(°F)</th>
                    <th className="p-1.5 text-center">RR</th>
                    <th className="p-1.5 text-center">SpO2%</th>
                    <th className="p-1.5 text-center">GCS</th>
                    <th className="p-1.5 text-center">Secretion</th>
                    <th className="p-1.5 text-center">Suction</th>
                    <th className="p-1.5 text-center">Urine Tube</th>
                    <th className="p-1.5 text-center">Nurse</th>
                  </tr>
                </thead>
                <tbody>
                  {(profileVitals as any[]).map((v: any) => (
                    <tr key={v.id} className="border-b border-muted/30">
                      <td className="p-1.5 font-medium">{v.hourSlot}</td>
                      <td className="p-1.5 text-center">{v.heartRate || "—"}</td>
                      <td className="p-1.5 text-center">{v.systolicBp ? `${v.systolicBp}/${v.diastolicBp || "—"}` : "—"}</td>
                      <td className="p-1.5 text-center">{v.temperature || "—"}</td>
                      <td className="p-1.5 text-center">{v.respiratoryRate || "—"}</td>
                      <td className="p-1.5 text-center">{v.spo2 ? `${v.spo2}%` : "—"}</td>
                      <td className="p-1.5 text-center">{v.gcsScore || "—"}</td>
                      <td className="p-1.5 text-center">{v.secretion || "—"}</td>
                      <td className="p-1.5 text-center">{v.suction || "—"}</td>
                      <td className="p-1.5 text-center">{v.urineTube || "—"}</td>
                      <td className="p-1.5 text-center text-muted-foreground">{v.nurseName || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
      </TabsContent>

      <TabsContent value="allergies" className="mt-2 pb-2">
        {!profileAllergies
          ? <p className="text-sm text-muted-foreground text-center py-4">No allergy record</p>
          : <div className="space-y-3 text-sm">
              {profileAllergies.drugAllergies && (
                <div>
                  <p className="font-medium mb-1 text-red-600 dark:text-red-400">Drug Allergies</p>
                  <div className="flex flex-wrap gap-1">
                    {(profileAllergies.drugAllergies.split ? profileAllergies.drugAllergies.split(",") : [profileAllergies.drugAllergies]).map((a: string, i: number) => (
                      <Badge key={i} variant="destructive">{a.trim()}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {profileAllergies.foodAllergies && (
                <div>
                  <p className="font-medium mb-1">Food Allergies</p>
                  <div className="flex flex-wrap gap-1">
                    {(profileAllergies.foodAllergies.split ? profileAllergies.foodAllergies.split(",") : [profileAllergies.foodAllergies]).map((a: string, i: number) => (
                      <Badge key={i} variant="outline">{a.trim()}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {profileAllergies.isolationPrecautions && (
                <div>
                  <p className="font-medium mb-1">Isolation Precautions</p>
                  <p className="text-muted-foreground">{profileAllergies.isolationPrecautions}</p>
                </div>
              )}
              <div className="flex gap-4 pt-1">
                {profileAllergies.fallRisk && <Badge variant="destructive">Fall Risk</Badge>}
                {profileAllergies.pressureUlcerRisk && <Badge variant="destructive">Pressure Ulcer Risk</Badge>}
              </div>
            </div>}
      </TabsContent>

      <TabsContent value="careplan" className="mt-2 pb-2">
        {(profileCarePlan as any[]).length === 0
          ? <p className="text-sm text-muted-foreground text-center py-4">No care plan recorded</p>
          : <div className="space-y-2">
              {(profileCarePlan as any[]).map((cp: any) => (
                <div key={cp.id} className="p-3 border rounded-lg text-sm space-y-1">
                  <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                    <Badge variant="outline">{cp.planDate ? new Date(cp.planDate).toLocaleDateString() : cp.createdAt ? new Date(cp.createdAt).toLocaleDateString() : "—"}</Badge>
                    <span className="text-xs text-muted-foreground">{cp.treatingConsultantName || cp.createdByName || "—"}</span>
                  </div>
                  {cp.provisionalDiagnosis && <p><span className="text-muted-foreground">Diagnosis:</span> {cp.provisionalDiagnosis}</p>}
                  {cp.carePlanDetails && <p><span className="text-muted-foreground">Care Plan:</span> {cp.carePlanDetails}</p>}
                  {cp.treatmentAdvised && <p><span className="text-muted-foreground">Treatment:</span> {cp.treatmentAdvised}</p>}
                  {cp.investigationsAdvised && <p><span className="text-muted-foreground">Investigations:</span> {cp.investigationsAdvised}</p>}
                  {cp.referralDepartments && <p><span className="text-muted-foreground">Referrals:</span> {cp.referralDepartments}</p>}
                  {cp.departmentSpecialty && <p><span className="text-muted-foreground">Dept:</span> {cp.departmentSpecialty}</p>}
                </div>
              ))}
            </div>}
      </TabsContent>

      <TabsContent value="diabetic" className="mt-2 pb-2">
        {(profileDiabetic as any[]).length === 0
          ? <p className="text-sm text-muted-foreground text-center py-4">No diabetic monitoring records</p>
          : <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="p-1.5 text-left">Time</th>
                    <th className="p-1.5 text-center">BSL (mg/dL)</th>
                    <th className="p-1.5 text-center">Insulin Type</th>
                    <th className="p-1.5 text-center">Dose (U)</th>
                    <th className="p-1.5 text-center">Route</th>
                    <th className="p-1.5 text-center">Nurse</th>
                  </tr>
                </thead>
                <tbody>
                  {(profileDiabetic as any[]).map((d: any) => (
                    <tr key={d.id} className="border-b border-muted/30">
                      <td className="p-1.5">{d.recordedTime ? new Date(d.recordedTime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : "—"}</td>
                      <td className="p-1.5 text-center font-medium">
                        <span className={d.alertType === "HYPOGLYCEMIA" ? "text-red-500" : d.alertType === "HYPERGLYCEMIA" ? "text-orange-500" : ""}>
                          {d.bloodSugarLevel ?? "—"}
                        </span>
                        {d.alertType && <span className="ml-1 text-[9px] text-muted-foreground">({d.alertType})</span>}
                      </td>
                      <td className="p-1.5 text-center">{d.insulinType || "—"}</td>
                      <td className="p-1.5 text-center">{d.insulinDose ?? "—"}</td>
                      <td className="p-1.5 text-center">{d.route || "—"}</td>
                      <td className="p-1.5 text-center text-muted-foreground">{d.nurseName || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
      </TabsContent>

      <TabsContent value="intake" className="mt-2 pb-2">
        {(profileIntake as any[]).length === 0
          ? <p className="text-sm text-muted-foreground text-center py-4">No intake records</p>
          : <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="p-1.5 text-left">Time</th>
                    <th className="p-1.5 text-center">IV1</th>
                    <th className="p-1.5 text-center">IV2</th>
                    <th className="p-1.5 text-center">IV3</th>
                    <th className="p-1.5 text-center">Oral</th>
                    <th className="p-1.5 text-center">NG Tube</th>
                    <th className="p-1.5 text-center">Blood</th>
                    <th className="p-1.5 text-center">Meds</th>
                    <th className="p-1.5 text-center font-semibold">Total(mL)</th>
                    <th className="p-1.5 text-center">Nurse</th>
                  </tr>
                </thead>
                <tbody>
                  {(profileIntake as any[]).map((r: any) => (
                    <tr key={r.id} className="border-b border-muted/30">
                      <td className="p-1.5">{r.hourSlot}</td>
                      <td className="p-1.5 text-center">{r.ivLine1 || "—"}</td>
                      <td className="p-1.5 text-center">{r.ivLine2 || "—"}</td>
                      <td className="p-1.5 text-center">{r.ivLine3 || "—"}</td>
                      <td className="p-1.5 text-center">{r.oral || "—"}</td>
                      <td className="p-1.5 text-center">{r.ngTube || "—"}</td>
                      <td className="p-1.5 text-center">{r.bloodProducts || "—"}</td>
                      <td className="p-1.5 text-center">{r.medications || "—"}</td>
                      <td className="p-1.5 text-center font-semibold">{r.hourlyTotal}</td>
                      <td className="p-1.5 text-center text-muted-foreground">{r.nurseName || "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/30">
                    <td className="p-1.5 font-bold" colSpan={8}>Total</td>
                    <td className="p-1.5 text-center font-bold text-blue-700 dark:text-blue-300">{profileTotalIntake} mL</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>}
      </TabsContent>

      <TabsContent value="output" className="mt-2 pb-2">
        {(profileOutput as any[]).length === 0
          ? <p className="text-sm text-muted-foreground text-center py-4">No output records</p>
          : <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="p-1.5 text-left">Time</th>
                    <th className="p-1.5 text-center">Urine(mL)</th>
                    <th className="p-1.5 text-center">Drain(mL)</th>
                    <th className="p-1.5 text-center">Drain Type</th>
                    <th className="p-1.5 text-center">Vomitus</th>
                    <th className="p-1.5 text-center">Stool</th>
                    <th className="p-1.5 text-center">Other(mL)</th>
                    <th className="p-1.5 text-center font-semibold">Total(mL)</th>
                    <th className="p-1.5 text-center">Nurse</th>
                  </tr>
                </thead>
                <tbody>
                  {(profileOutput as any[]).map((r: any) => (
                    <tr key={r.id} className="border-b border-muted/30">
                      <td className="p-1.5">{r.hourSlot}</td>
                      <td className="p-1.5 text-center">{r.urineOutput || "—"}</td>
                      <td className="p-1.5 text-center">{r.drainOutput || "—"}</td>
                      <td className="p-1.5 text-center">{r.drainType || "—"}</td>
                      <td className="p-1.5 text-center">{r.vomitus || "—"}</td>
                      <td className="p-1.5 text-center">{r.stool || "—"}</td>
                      <td className="p-1.5 text-center">{r.otherLosses || "—"}</td>
                      <td className="p-1.5 text-center font-semibold">{r.hourlyTotal}</td>
                      <td className="p-1.5 text-center text-muted-foreground">{r.nurseName || "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/30">
                    <td className="p-1.5 font-bold" colSpan={7}>Total</td>
                    <td className="p-1.5 text-center font-bold text-orange-700 dark:text-orange-300">{profileTotalOutput} mL</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>}
      </TabsContent>

      <TabsContent value="drugchart" className="mt-2 pb-2">
        {(profileInotropes as any[]).length === 0
          ? <p className="text-sm text-muted-foreground text-center py-4">No drug chart records</p>
          : <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="p-1.5 text-left">Diagnosis</th>
                    <th className="p-1.5 text-left">Injection Name</th>
                    <th className="p-1.5 text-center">Freq.</th>
                    <th className="p-1.5 text-left">Medicine Name</th>
                    <th className="p-1.5 text-center">Freq.</th>
                    <th className="p-1.5 text-center">Date</th>
                    <th className="p-1.5 text-center">Staff</th>
                  </tr>
                </thead>
                <tbody>
                  {(profileInotropes as any[]).map((m: any) => (
                    <tr key={m.id} className="border-b border-muted/30">
                      <td className="p-1.5">{m.diagnosis || "—"}</td>
                      <td className="p-1.5 font-medium">{m.drugName || "—"}</td>
                      <td className="p-1.5 text-center">{m.injectionFrequency || "—"}</td>
                      <td className="p-1.5">{m.medicineName || "—"}</td>
                      <td className="p-1.5 text-center">{m.medicineFrequency || "—"}</td>
                      <td className="p-1.5 text-center">{m.startTime ? new Date(m.startTime).toLocaleDateString() : m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "—"}</td>
                      <td className="p-1.5 text-center text-muted-foreground">{m.nurseName || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
      </TabsContent>

      <TabsContent value="investigation" className="mt-2 pb-2">
        {!profileInvestigation
          ? <p className="text-sm text-muted-foreground text-center py-4">No investigation chart recorded</p>
          : <div className="space-y-3 text-sm">
              {[
                { label: "Blood Screening", fields: [["bloodGroup","Blood Group"],["hbsAg","HbsAg"],["hiv","HIV"],["hcv","HCV"],["vdrl","VDRL"]] },
                { label: "Haematology", fields: [["hemoglobin","Hb (g/dL)"],["tlc","TLC"],["platelet","Platelet"],["rbc","RBC"],["hematocrit","Hematocrit"]] },
                { label: "Renal Function", fields: [["urea","Urea"],["creatinine","Creatinine"],["sodium","Na+"],["potassium","K+"],["chloride","Cl-"]] },
                { label: "Liver Function", fields: [["totalBilirubin","T.Bilirubin"],["directBilirubin","D.Bilirubin"],["sgot","SGOT"],["sgpt","SGPT"],["alkPhos","Alk Phos"],["albumin","Albumin"]] },
                { label: "Cardiac", fields: [["troponin","Troponin"],["ckMb","CK-MB"],["bnp","BNP"],["dDimer","D-Dimer"]] },
                { label: "Imaging", fields: [["ecg","ECG"],["echo","Echo"],["xrayChest","X-Ray Chest"],["ctScan","CT Scan"],["mri","MRI"],["usg","USG"]] },
              ].map(({ label, fields }) => {
                const hasData = fields.some(([key]) => profileInvestigation[key]);
                if (!hasData) return null;
                return (
                  <div key={label}>
                    <p className="font-medium text-xs text-muted-foreground mb-1 uppercase tracking-wide">{label}</p>
                    <div className="grid grid-cols-3 gap-1">
                      {fields.map(([key, display]) => profileInvestigation[key] ? (
                        <div key={key} className="p-1.5 border rounded text-xs">
                          <span className="text-muted-foreground">{display}: </span>
                          <span className="font-medium">{profileInvestigation[key]}</span>
                        </div>
                      ) : null)}
                    </div>
                  </div>
                );
              })}
            </div>}
      </TabsContent>

      <TabsContent value="oxygen" className="mt-2 pb-2">
        {(profileOxygen as any[]).length === 0
          ? <p className="text-sm text-muted-foreground text-center py-4">No oxygen therapy records</p>
          : <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="p-1.5 text-left">Time Slot</th>
                    <th className="p-1.5 text-center">Oxygen</th>
                    <th className="p-1.5 text-center">SpO2</th>
                    <th className="p-1.5 text-center">Ryle's Tube</th>
                    <th className="p-1.5 text-center">Central Line</th>
                  </tr>
                </thead>
                <tbody>
                  {(profileOxygen as any[]).map((o: any) => (
                    <tr key={o.id} className="border-b border-muted/30">
                      <td className="p-1.5 font-semibold">{o.hour_slot || o.hourSlot || "—"}</td>
                      <td className="p-1.5 text-center font-semibold text-sky-600 dark:text-sky-400">{o.oxygen_liter || o.oxygenLiter || "—"}</td>
                      <td className="p-1.5 text-center font-semibold">{o.spo2 != null ? `${o.spo2}%` : "—"}</td>
                      <td className="p-1.5 text-center">
                        {(() => {
                          const rt = o.ryles_tube || o.rylesTube;
                          const rtn = o.ryles_tube_note || o.rylesTubeNote;
                          if (!rt || rt === "No") return <span className="text-muted-foreground">No</span>;
                          return <span className="text-orange-500 font-medium">Yes{rtn ? ` (${rtn})` : ""}</span>;
                        })()}
                      </td>
                      <td className="p-1.5 text-center">
                        {(() => {
                          const cl = o.central_line || o.centralLine;
                          if (!cl || cl === "No") return <span className="text-muted-foreground">No</span>;
                          return <span className="text-blue-500 font-medium">Yes</span>;
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
      </TabsContent>

      <TabsContent value="ventilator" className="mt-2 pb-2">
        {(profileVentilator as any[]).length === 0
          ? <p className="text-sm text-muted-foreground text-center py-4">No ventilator records</p>
          : <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="p-1.5 text-left">Time</th>
                    <th className="p-1.5 text-center">Mode</th>
                    <th className="p-1.5 text-center">TV</th>
                    <th className="p-1.5 text-center">RR Set</th>
                    <th className="p-1.5 text-center">PEEP</th>
                    <th className="p-1.5 text-center">FiO2%</th>
                    <th className="p-1.5 text-center">PIP</th>
                    <th className="p-1.5 text-center">Nurse</th>
                  </tr>
                </thead>
                <tbody>
                  {(profileVentilator as any[]).map((v: any) => (
                    <tr key={v.id} className="border-b border-muted/30">
                      <td className="p-1.5">{v.recordedAt ? new Date(v.recordedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : "—"}</td>
                      <td className="p-1.5 text-center">{v.ventilationMode || "—"}</td>
                      <td className="p-1.5 text-center">{v.setTidalVolume ?? v.expiredTidalVolume ?? "—"}</td>
                      <td className="p-1.5 text-center">{v.respiratoryRateSet ?? "—"}</td>
                      <td className="p-1.5 text-center">{v.peepCpap ?? "—"}</td>
                      <td className="p-1.5 text-center">{v.fio2 ?? "—"}</td>
                      <td className="p-1.5 text-center">{v.peakAirwayPressure ?? "—"}</td>
                      <td className="p-1.5 text-center text-muted-foreground">{v.nurseName || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
      </TabsContent>

      <TabsContent value="doctorsprogress" className="mt-2 pb-2">
        {(profileDoctorsProgress as any[]).length === 0
          ? <p className="text-sm text-muted-foreground text-center py-4">No doctor's progress entries</p>
          : <div className="space-y-3">
              {(profileDoctorsProgress as any[]).map((e: any) => (
                <div key={e.id} className="border rounded-lg p-3 text-xs space-y-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm">{e.primaryConsultantName || '—'}</span>
                    <span className="text-muted-foreground">{e.entryDateTime ? new Date(e.entryDateTime).toLocaleDateString() : '—'}</span>
                  </div>
                  {e.clinicalNotes && <div><span className="font-medium">Clinical Notes:</span> {e.clinicalNotes}</div>}
                  {e.investigationsAdvised && <div><span className="font-medium">Investigations:</span> {e.investigationsAdvised}</div>}
                  {e.treatmentAdvised && <div><span className="font-medium">Treatment:</span> {e.treatmentAdvised}</div>}
                  {e.daysKeynotes && <div><span className="font-medium">Key Notes:</span> {e.daysKeynotes}</div>}
                </div>
              ))}
            </div>}
      </TabsContent>

      <TabsContent value="doctorsvisit" className="mt-2 pb-2">
        {(profileDoctorsVisit as any[]).length === 0
          ? <p className="text-sm text-muted-foreground text-center py-4">No doctor's visit entries</p>
          : <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="p-1.5 text-left">Date</th>
                    <th className="p-1.5 text-left">Time</th>
                    <th className="p-1.5 text-left">Doctor</th>
                    <th className="p-1.5 text-left">Type</th>
                    <th className="p-1.5 text-left">Findings</th>
                  </tr>
                </thead>
                <tbody>
                  {(profileDoctorsVisit as any[]).map((v: any) => (
                    <tr key={v.id} className="border-b border-muted/30">
                      <td className="p-1.5">{v.visitDate ? new Date(v.visitDate).toLocaleDateString() : '—'}</td>
                      <td className="p-1.5">{v.visitTime || '—'}</td>
                      <td className="p-1.5 font-medium">{v.nameOfDoctor || '—'}</td>
                      <td className="p-1.5 capitalize">{v.visitType || '—'}</td>
                      <td className="p-1.5">{v.clinicalNotes || v.procedure || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
      </TabsContent>

      <TabsContent value="nursingassessment" className="mt-2 pb-2">
        {!profileNursingAssessment
          ? <p className="text-sm text-muted-foreground text-center py-4">No nursing assessment recorded</p>
          : <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="border rounded-lg p-2 space-y-1">
                  <p className="font-semibold text-sm mb-1">Admission Details</p>
                  <div><span className="font-medium">Date:</span> {profileNursingAssessment.patientReceivedDate || '—'}</div>
                  <div><span className="font-medium">Time:</span> {profileNursingAssessment.patientReceivedTime || '—'}</div>
                  <div><span className="font-medium">Diagnosis:</span> {profileNursingAssessment.provisionalDiagnosis || '—'}</div>
                  <div><span className="font-medium">Mode:</span> {profileNursingAssessment.modeOfAccess || '—'}</div>
                </div>
                <div className="border rounded-lg p-2 space-y-1">
                  <p className="font-semibold text-sm mb-1">Vitals on Admission</p>
                  <div><span className="font-medium">Temp:</span> {profileNursingAssessment.temperature || '—'}</div>
                  <div><span className="font-medium">Pulse:</span> {profileNursingAssessment.pulse || '—'}</div>
                  <div><span className="font-medium">BP:</span> {profileNursingAssessment.bp || '—'}</div>
                  <div><span className="font-medium">RR:</span> {profileNursingAssessment.respiratoryRate || '—'}</div>
                </div>
              </div>
              <div className="border rounded-lg p-2 space-y-1">
                <p className="font-semibold text-sm mb-1">Risk Scores</p>
                <div><span className="font-medium">Morse Fall Risk:</span> {profileNursingAssessment.morseFallRiskScore || '—'}</div>
                <div><span className="font-medium">Braden Scale:</span> {profileNursingAssessment.bradenScaleTotal || '—'}</div>
                <div><span className="font-medium">Vulnerable:</span> {profileNursingAssessment.vulnerable || '—'}</div>
              </div>
            </div>}
      </TabsContent>

      <TabsContent value="nursingprogress" className="mt-2 pb-2">
        {(profileNursingProgressData as any[]).length === 0
          ? <p className="text-sm text-muted-foreground text-center py-4">No nursing progress notes</p>
          : <div className="space-y-2">
              {(profileNursingProgressData as any[]).map((e: any) => (
                <div key={e.id} className="border rounded-lg p-3 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{e.entryDate ? new Date(e.entryDate).toLocaleDateString() : '—'}</span>
                    <span className="text-muted-foreground">{e.signatureName || '—'}</span>
                  </div>
                  {e.shiftNote && <div><span className="font-medium">Shift:</span> {e.shiftNote}</div>}
                  {e.progressNotes && <p className="text-muted-foreground mt-1">{e.progressNotes}</p>}
                </div>
              ))}
            </div>}
      </TabsContent>

      <TabsContent value="indoorconsultation" className="mt-2 pb-2">
        {(profileIndoorConsultation as any[]).length === 0
          ? <p className="text-sm text-muted-foreground text-center py-4">No indoor consultation entries</p>
          : <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="p-1.5 text-left">Date</th>
                    <th className="p-1.5 text-left">Time</th>
                    <th className="p-1.5 text-left">Clinical Findings</th>
                    <th className="p-1.5 text-left">Orders</th>
                    <th className="p-1.5 text-left">By</th>
                  </tr>
                </thead>
                <tbody>
                  {(profileIndoorConsultation as any[]).map((c: any) => (
                    <tr key={c.id} className="border-b border-muted/30">
                      <td className="p-1.5">{c.entryDate ? new Date(c.entryDate).toLocaleDateString() : '—'}</td>
                      <td className="p-1.5">{c.entryTime || '—'}</td>
                      <td className="p-1.5 max-w-[200px]">{c.clinicalFindings || '—'}</td>
                      <td className="p-1.5 max-w-[200px]">{c.orders || '—'}</td>
                      <td className="p-1.5">{c.recordedBy || c.inChargeDoctor || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
      </TabsContent>

      <TabsContent value="initialassessment" className="mt-2 pb-2">
        {!profileInitialAssessment
          ? <p className="text-sm text-muted-foreground text-center py-4">No initial assessment recorded</p>
          : <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="border rounded-lg p-2 space-y-1">
                  <p className="font-semibold text-sm mb-1">General Info</p>
                  <div><span className="font-medium">Date:</span> {profileInitialAssessment.patientReceivedDate || '—'}</div>
                  <div><span className="font-medium">Time:</span> {profileInitialAssessment.patientReceivedTime || '—'}</div>
                  <div><span className="font-medium">Accompanied by:</span> {profileInitialAssessment.patientAccompaniedBy || '—'}</div>
                  <div><span className="font-medium">Allergies:</span> {profileInitialAssessment.allergies || '—'}</div>
                </div>
                <div className="border rounded-lg p-2 space-y-1">
                  <p className="font-semibold text-sm mb-1">Vitals</p>
                  <div><span className="font-medium">Pulse:</span> {profileInitialAssessment.pulseRate || '—'}</div>
                  <div><span className="font-medium">BP:</span> {profileInitialAssessment.bloodPressure || '—'}</div>
                  <div><span className="font-medium">RR:</span> {profileInitialAssessment.respiratoryRate || '—'}</div>
                  <div><span className="font-medium">Temp:</span> {profileInitialAssessment.temperature || '—'}</div>
                  <div><span className="font-medium">RBS:</span> {profileInitialAssessment.rbs || '—'}</div>
                  <div><span className="font-medium">GCS:</span> E{profileInitialAssessment.gcsEyeOpening}M{profileInitialAssessment.gcsMotorResponse}V{profileInitialAssessment.gcsVerbalResponse}</div>
                </div>
              </div>
            </div>}
      </TabsContent>

      <TabsContent value="surgerynotes" className="mt-2 pb-2">
        {(profileSurgeryNotes as any[]).length === 0
          ? <p className="text-sm text-muted-foreground text-center py-4">No surgery notes recorded</p>
          : <div className="space-y-3">
              {(profileSurgeryNotes as any[]).map((s: any) => (
                <div key={s.id} className="border rounded-lg p-3 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">{s.surgeryDate ? new Date(s.surgeryDate).toLocaleDateString() : '—'}</span>
                    <span className="text-muted-foreground">{s.typeOfAnaesthesia || '—'} anaesthesia</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    <div><span className="font-medium">Surgeon:</span> {s.nameOfSurgeon || s.surgeonName || '—'}</div>
                    <div><span className="font-medium">Pre-op Dx:</span> {s.preoperativeDiagnosis || '—'}</div>
                    <div><span className="font-medium">Procedure:</span> {s.surgeryPerformed || s.surgeryPlanned || '—'}</div>
                    <div><span className="font-medium">Blood Loss:</span> {s.bloodLoss || '—'}</div>
                    <div><span className="font-medium">Start:</span> {s.operationStartedAt || '—'}</div>
                    <div><span className="font-medium">End:</span> {s.operationCompletedAt || '—'}</div>
                  </div>
                  {s.operationNotes && <div><span className="font-medium">Notes:</span> {s.operationNotes}</div>}
                </div>
              ))}
            </div>}
      </TabsContent>
    </Tabs>
  );

  if (!longitudinalProfile && !profileLoading) {
    return <p className="text-center py-8 text-muted-foreground">No profile data available</p>;
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3" />
        <span className="text-muted-foreground">Loading patient profile...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Identity Card */}
      <div className="flex-shrink-0 bg-muted/40 border rounded-lg p-3 flex flex-wrap gap-3 items-start">
        <div className={`p-2.5 rounded-full flex-shrink-0 ${barcodeData?.uhid ? 'bg-primary/10' : 'bg-muted'}`}>
          <User className={`h-6 w-6 ${barcodeData?.uhid ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-base">{displayName}</span>
            {barcodeData?.admissionType && (
              <Badge variant={barcodeData.admissionType === "IPD" ? "default" : "secondary"}>
                {barcodeData.admissionType}
              </Badge>
            )}
            {trackingData?.status && (
              <Badge variant={trackingData.status === "critical" ? "destructive" : trackingData.status === "admitted" ? "default" : "secondary"}>
                {trackingData.status}
              </Badge>
            )}
          </div>
          {barcodeData?.uhid && (
            <p className="text-xs font-mono text-muted-foreground mb-1">{barcodeData.uhid}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {demographics?.gender && <span>Gender: <span className="text-foreground font-medium capitalize">{demographics.gender}</span></span>}
            {demographics?.dateOfBirth && <span>DOB: <span className="text-foreground font-medium">{demographics.dateOfBirth}</span></span>}
            {demographics?.phone && <span>Phone: <span className="text-foreground font-medium">{demographics.phone}</span></span>}
            {(barcodeData?.wardBed || trackingData?.room) && <span>Ward/Bed: <span className="text-foreground font-medium">{barcodeData?.wardBed || trackingData?.room}</span></span>}
            {(barcodeData?.treatingDoctor || trackingData?.attendingDoctor || trackingData?.doctor) && <span>Doctor: <span className="text-foreground font-medium">{barcodeData?.treatingDoctor || trackingData?.attendingDoctor || trackingData?.doctor}</span></span>}
            {trackingData?.diagnosis && <span>Diagnosis: <span className="text-foreground font-medium">{trackingData.diagnosis}</span></span>}
            {trackingData?.bloodGroup && <span>Blood Group: <span className="text-foreground font-medium">{trackingData.bloodGroup}</span></span>}
            {demographics?.email && <span>Email: <span className="text-foreground font-medium">{demographics.email}</span></span>}
            {demographics?.address && <span>Address: <span className="text-foreground font-medium">{demographics.address}</span></span>}
          </div>
        </div>
      </div>

      {/* Main 6-tab layout */}
      <Tabs value={profileActiveSection} onValueChange={setProfileActiveSection} className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-4 h-auto gap-0.5">
          <TabsTrigger value="opd" className="flex items-center justify-center gap-1 text-[9px] sm:text-xs py-1.5 px-1">
            <ClipboardList className="h-3 w-3 hidden sm:block" />
            <span>OPD</span>
          </TabsTrigger>
          <TabsTrigger value="ipd" className="flex items-center justify-center gap-1 text-[9px] sm:text-xs py-1.5 px-1">
            <Bed className="h-3 w-3 hidden sm:block" />
            <span>IPD</span>
          </TabsTrigger>
          <TabsTrigger value="icu" className="flex items-center justify-center gap-1 text-[9px] sm:text-xs py-1.5 px-1">
            <HeartPulse className="h-3 w-3 hidden sm:block" />
            <span>ICU</span>
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center justify-center gap-1 text-[9px] sm:text-xs py-1.5 px-1">
            <FlaskConical className="h-3 w-3 hidden sm:block" />
            <span>Tests</span>
          </TabsTrigger>
          <TabsTrigger value="consent" className="flex items-center justify-center gap-1 text-[9px] sm:text-xs py-1.5 px-1">
            <FileCheck className="h-3 w-3 hidden sm:block" />
            <span>Consents</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center justify-center gap-1 text-[9px] sm:text-xs py-1.5 px-1">
            <DollarSign className="h-3 w-3 hidden sm:block" />
            <span>Billing</span>
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 min-h-0 pr-2 sm:pr-4" style={{ height: 'calc(92vh - 260px)' }}>

          {/* OPD Tab */}
          <TabsContent value="opd" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-blue-500" />
                  OPD Visits ({longitudinalProfile?.opdHistory?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!longitudinalProfile?.opdHistory?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No OPD visits recorded</p>
                ) : (
                  <div className="space-y-3">
                    {longitudinalProfile.opdHistory.map((visit: any) => (
                      <div key={visit.id} className="p-3 border rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">{visit.department || "General OPD"}</Badge>
                            <Badge variant={visit.status === "completed" ? "default" : visit.status === "checked-in" ? "secondary" : "outline"} className="text-xs capitalize">{visit.status}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">{visit.appointmentDate} {visit.timeSlot ? `• ${visit.timeSlot}` : ""}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm">
                          <p><span className="text-muted-foreground">Doctor:</span> {visit.doctorName || "N/A"}</p>
                          <p><span className="text-muted-foreground">Appt ID:</span> {visit.appointmentId || visit.id?.slice(0,8)}</p>
                        </div>
                        {(visit.symptoms || visit.diagnosis) && (
                          <p className="text-sm"><span className="text-muted-foreground">Symptoms:</span> {visit.symptoms || visit.diagnosis}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* IPD Tab */}
          <TabsContent value="ipd" className="space-y-3">
            {longitudinalProfile?.ipdHistory?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bed className="h-4 w-4 text-green-500" />
                    IPD Admissions ({longitudinalProfile.ipdHistory.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {longitudinalProfile.ipdHistory.map((admission: any) => (
                      <div key={admission.id} className="p-3 border rounded-lg text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant={admission.status === "admitted" ? "default" : "secondary"}>{admission.status}</Badge>
                          <span className="text-xs text-muted-foreground">{admission.admissionDate ? new Date(admission.admissionDate).toLocaleDateString() : "N/A"}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1">
                          <p><span className="text-muted-foreground">Ward/Room:</span> {admission.room || admission.ward || "N/A"}</p>
                          <p><span className="text-muted-foreground">Dept:</span> {admission.department || "N/A"}</p>
                          <p><span className="text-muted-foreground">Diagnosis:</span> {admission.diagnosis || "N/A"}</p>
                          <p><span className="text-muted-foreground">Doctor:</span> {admission.doctor || "N/A"}</p>
                        </div>
                        {admission.isInIcu && <Badge variant="destructive" className="mt-1">ICU Stay: {admission.icuDays || 0} days</Badge>}
                        {admission.dischargeDate && <p className="text-green-600 mt-1">Discharged: {new Date(admission.dischargeDate).toLocaleDateString()}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {!profileLatestSession ? (
              <div className="text-center py-6 text-muted-foreground border rounded-lg">
                <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="font-medium text-sm">No IPD monitoring session found</p>
                <p className="text-xs mt-1">Monitoring data will appear here once a session is started in Patient Monitoring.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                  <Activity className="h-3.5 w-3.5 shrink-0" />
                  <span>Session: <strong className="text-foreground">{profileLatestSession.sessionDate}</strong></span>
                  <span>·</span>
                  <span>Ward: <strong className="text-foreground">{profileLatestSession.ward} / {profileLatestSession.bedNumber}</strong></span>
                  <span>·</span>
                  <span>Dx: <strong className="text-foreground">{profileLatestSession.primaryDiagnosis}</strong></span>
                  {profileMonitoringSessions.length > 1 && <Badge variant="outline" className="ml-auto">{profileMonitoringSessions.length} sessions</Badge>}
                </div>
                <MonitoringSubTabs prefix="ipd" />
              </>
            )}
          </TabsContent>

          {/* ICU Tab */}
          <TabsContent value="icu" className="space-y-3">
            {longitudinalProfile?.icuHistory?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <HeartPulse className="h-4 w-4 text-red-500" />
                    ICU Charts ({longitudinalProfile.icuHistory.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {longitudinalProfile.icuHistory.map((chart: any) => (
                      <div key={chart.id} className="p-3 border rounded-lg text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="destructive">ICU Chart</Badge>
                          <span className="text-xs text-muted-foreground">{chart.chartDate ? new Date(chart.chartDate).toLocaleDateString() : "N/A"}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1">
                          <p><span className="text-muted-foreground">Ward/Bed:</span> {chart.ward || "N/A"} / {chart.bedNo || "N/A"}</p>
                          <p><span className="text-muted-foreground">Diagnosis:</span> {chart.diagnosis || "N/A"}</p>
                          <p><span className="text-muted-foreground">Consultant:</span> {chart.admittingConsultant || "N/A"}</p>
                          <p><span className="text-muted-foreground">ICU Consultant:</span> {chart.icuConsultant || "N/A"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {!profileLatestSession ? (
              <div className="text-center py-6 text-muted-foreground border rounded-lg">
                <HeartPulse className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="font-medium text-sm">No ICU monitoring session found</p>
                <p className="text-xs mt-1">Monitoring data will appear here once a session is started.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                  <Activity className="h-3.5 w-3.5 shrink-0" />
                  <span>Session: <strong className="text-foreground">{profileLatestSession.sessionDate}</strong></span>
                  <span>·</span>
                  <span>Ward: <strong className="text-foreground">{profileLatestSession.ward} / {profileLatestSession.bedNumber}</strong></span>
                  <span>·</span>
                  <span>Dx: <strong className="text-foreground">{profileLatestSession.primaryDiagnosis}</strong></span>
                  {profileMonitoringSessions.length > 1 && <Badge variant="outline" className="ml-auto">{profileMonitoringSessions.length} sessions</Badge>}
                </div>
                <MonitoringSubTabs prefix="icu" />
              </>
            )}
          </TabsContent>

          {/* Tests Tab */}
          <TabsContent value="tests" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-teal-500" />
                  Diagnostic Tests & Lab Reports ({longitudinalProfile?.diagnosticTests?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!longitudinalProfile?.diagnosticTests?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No diagnostic tests ordered</p>
                ) : (
                  <div className="space-y-2">
                    {longitudinalProfile.diagnosticTests.map((test: any) => (
                      <div key={test.id} className="p-3 border rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{test.testName}</span>
                            <Badge variant={test.status === "COMPLETED" || test.status === "REPORT_UPLOADED" ? "default" : test.status === "IN_PROGRESS" ? "secondary" : test.status === "CANCELLED" ? "destructive" : "outline"} className="text-xs">
                              {test.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">{test.priority}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">{test.orderedDate ? new Date(test.orderedDate).toLocaleDateString() : "N/A"}</span>
                        </div>
                        <div className="text-xs text-muted-foreground flex gap-4 flex-wrap">
                          <span>Department: {test.department}</span>
                          <span>Type: {test.testType}</span>
                          {test.doctorName && <span>Doctor: {test.doctorName}</span>}
                        </div>
                        {test.reportUrl && (
                          <div className="flex items-center gap-1 mt-1">
                            <FileText className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-xs text-green-600 font-medium">Report Available: {test.reportFileName || "View Report"}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {longitudinalProfile?.medicalRecords?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Medical Records & Documents ({longitudinalProfile.medicalRecords.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {longitudinalProfile.medicalRecords.map((rec: any) => (
                      <div key={rec.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                        <div>
                          <p className="font-medium">{rec.recordType || rec.title || "Medical Record"}</p>
                          <p className="text-xs text-muted-foreground">{rec.description || rec.notes || "—"}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {rec.recordDate ? new Date(rec.recordDate).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Consents Tab */}
          <TabsContent value="consent" className="space-y-4">
            {profileDigitalConsents.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-blue-500" />
                    Digitally Signed Consents ({profileDigitalConsents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profileDigitalConsents.map((dc: any) => (
                      <div key={dc.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs capitalize">{dc.consentType || "consent"}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {dc.createdAt ? new Date(dc.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A"}
                            </span>
                          </div>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setViewingDigitalConsent(dc)}>
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                        <p className="text-sm font-medium mt-1">{dc.consentTitle || dc.consentType}</p>
                        {dc.doctorName && <p className="text-xs text-muted-foreground mt-0.5">Doctor: {dc.doctorName}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {profileDigitalConsents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No consent forms on record for this patient</p>
            )}
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  Billing & Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {longitudinalProfile?.billingHistory?.insurance?.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Insurance Information
                    </h4>
                    {longitudinalProfile.billingHistory.insurance.map((ins: any) => (
                      <div key={ins.id} className="text-sm">
                        <p><strong>Provider:</strong> {ins.providerName}</p>
                        <p><strong>Policy:</strong> {ins.policyNumber}</p>
                        <p><strong>Coverage:</strong> {ins.coverageAmount ? `₹${ins.coverageAmount}` : "N/A"}</p>
                      </div>
                    ))}
                  </div>
                )}
                {!longitudinalProfile?.billingHistory?.bills?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No billing records</p>
                ) : (
                  <div className="space-y-3">
                    {longitudinalProfile.billingHistory.bills.map((bill: any) => (
                      <div key={bill.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={bill.paymentStatus === "paid" ? "default" : bill.paymentStatus === "partial" ? "secondary" : "destructive"}>
                            {bill.paymentStatus}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{bill.billDate ? new Date(bill.billDate).toLocaleDateString() : "N/A"}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p><strong>Total:</strong> ₹{bill.totalAmount || 0}</p>
                          <p><strong>Paid:</strong> ₹{bill.paidAmount || 0}</p>
                          <p><strong>Pending:</strong> ₹{(bill.totalAmount || 0) - (bill.paidAmount || 0)}</p>
                          <p><strong>Bill #:</strong> {bill.billNumber || bill.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </ScrollArea>
      </Tabs>

      {/* Digital Consent Viewer Dialog */}
      <Dialog open={!!viewingDigitalConsent} onOpenChange={(open) => { if (!open) { setViewingDigitalConsent(null); setConsentViewHtml(""); } }}>
        <DialogContent className="max-w-4xl flex flex-col" style={{ height: "90vh", maxHeight: "90vh" }}>
          <DialogHeader className="shrink-0 pb-2 border-b">
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-blue-500" />
              {viewingDigitalConsent?.consentTitle || viewingDigitalConsent?.consentType || "Consent Form"}
            </DialogTitle>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
              {viewingDigitalConsent?.patientName && <span><span className="font-medium text-foreground">Patient:</span> {viewingDigitalConsent.patientName}</span>}
              {viewingDigitalConsent?.doctorName && <span><span className="font-medium text-foreground">Doctor:</span> {viewingDigitalConsent.doctorName}</span>}
              {viewingDigitalConsent?.createdAt && <span><span className="font-medium text-foreground">Date:</span> {new Date(viewingDigitalConsent.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>}
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {consentViewLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">Loading consent form...</p>
                </div>
              </div>
            ) : consentViewHtml ? (
              <iframe ref={consentIframeRef} title="Consent Form" className="w-full h-full border-0 rounded" style={{ minHeight: "500px" }} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">Consent form content could not be loaded.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
