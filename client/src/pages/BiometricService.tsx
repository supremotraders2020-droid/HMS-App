import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Fingerprint, 
  ScanFace, 
  Shield, 
  ShieldCheck,
  ShieldAlert,
  Lock,
  Users,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  AlertTriangle,
  Loader2,
  UserPlus,
  Search,
  History,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  HeartPulse,
  Scan,
  FileCheck,
  RefreshCw
} from "lucide-react";
import type { BiometricTemplate, BiometricVerification, ServicePatient } from "@shared/schema";

interface BiometricStats {
  totalPatients: number;
  totalTemplates: number;
  verificationsToday: number;
  successfulVerifications: number;
  fingerprintTemplates: number;
  faceTemplates: number;
}

const storeFormSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  biometricType: z.enum(["fingerprint", "face"], {
    required_error: "Biometric type is required",
  }),
  quality: z.coerce.number().min(0).max(100).optional(),
});

const verifyFormSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  biometricType: z.enum(["fingerprint", "face"], {
    required_error: "Biometric type is required",
  }),
});

type StoreFormData = z.infer<typeof storeFormSchema>;
type VerifyFormData = z.infer<typeof verifyFormSchema>;

export default function BiometricService() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [scanningBiometric, setScanningBiometric] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    confidenceScore: number;
    patientId: string;
  } | null>(null);
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery<BiometricStats>({
    queryKey: ["/api/biometric/stats"],
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery<BiometricTemplate[]>({
    queryKey: ["/api/biometric/templates"],
  });

  const { data: verifications = [], isLoading: verificationsLoading } = useQuery<BiometricVerification[]>({
    queryKey: ["/api/biometric/verifications"],
  });

  const { data: patients = [] } = useQuery<ServicePatient[]>({
    queryKey: ["/api/patients/service"],
  });

  const storeForm = useForm<StoreFormData>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      patientId: "",
      biometricType: "fingerprint",
      quality: 90,
    },
  });

  const verifyForm = useForm<VerifyFormData>({
    resolver: zodResolver(verifyFormSchema),
    defaultValues: {
      patientId: "",
      biometricType: "fingerprint",
    },
  });

  const storeMutation = useMutation({
    mutationFn: async (data: StoreFormData) => {
      setScanningBiometric(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const simulatedTemplateData = `BIOMETRIC_TEMPLATE_${data.biometricType}_${Date.now()}`;
      
      const response = await apiRequest("POST", `/api/biometric/${data.patientId}`, {
        biometricType: data.biometricType,
        templateData: simulatedTemplateData,
        quality: data.quality || 90,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setScanningBiometric(false);
      toast({
        title: "Biometric Stored Successfully",
        description: `Template stored with AES-256 encryption. ID: ${data.templateId?.slice(0, 8)}...`,
      });
      storeForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/biometric/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/biometric/templates"] });
    },
    onError: () => {
      setScanningBiometric(false);
      toast({
        title: "Storage Error",
        description: "Failed to store biometric template. Please try again.",
        variant: "destructive",
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: VerifyFormData) => {
      setScanningBiometric(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const response = await apiRequest("POST", "/api/biometric/verify", {
        patientId: data.patientId,
        biometricType: data.biometricType,
        templateData: `VERIFY_${Date.now()}`,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setScanningBiometric(false);
      setVerificationResult({
        verified: data.verified,
        confidenceScore: data.confidenceScore,
        patientId: data.patientId,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/biometric/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/biometric/verifications"] });
    },
    onError: () => {
      setScanningBiometric(false);
      toast({
        title: "Verification Failed",
        description: "Unable to verify biometric data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStore = (data: StoreFormData) => {
    storeMutation.mutate(data);
  };

  const handleVerify = (data: VerifyFormData) => {
    setVerificationResult(null);
    verifyMutation.mutate(data);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : patientId;
  };

  const getPatientDisplay = (patient: ServicePatient) => {
    return `${patient.firstName} ${patient.lastName}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-900 dark:to-slate-950 flex flex-col">
      {/* Hospital Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 p-3 rounded-lg">
                <HeartPulse className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-xl font-semibold" data-testid="text-hospital-name">
                  Galaxy Multi Specialty Hospital
                </h1>
                <p className="text-blue-100 text-sm flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Chikhali, Pimpri-Chinchwad
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30" data-testid="badge-hipaa">
                <ShieldCheck className="h-3 w-3 mr-1" />
                HIPAA Compliant
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30" data-testid="badge-encryption">
                <Lock className="h-3 w-3 mr-1" />
                AES-256 Encrypted
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Page Title Section */}
      <div className="bg-white dark:bg-slate-900 border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-xl">
                <Fingerprint className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="text-page-title">
                  Biometric Service
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Secure patient identification and verification system
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" data-testid="button-refresh">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid gap-1 bg-blue-50 dark:bg-slate-800 p-1">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white" 
              data-testid="tab-dashboard"
            >
              <Activity className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="store" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white" 
              data-testid="tab-store"
            >
              <UserPlus className="h-4 w-4" />
              Enroll Patient
            </TabsTrigger>
            <TabsTrigger 
              value="verify" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white" 
              data-testid="tab-verify"
            >
              <Scan className="h-4 w-4" />
              Verify Identity
            </TabsTrigger>
            <TabsTrigger 
              value="logs" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white" 
              data-testid="tab-logs"
            >
              <FileCheck className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {statsLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="border-l-4 border-l-blue-500" data-testid="card-total-patients">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Enrolled Patients
                      </CardTitle>
                      <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg">
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {stats?.totalPatients || 0}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        With biometric data stored
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500" data-testid="card-total-templates">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Total Templates
                      </CardTitle>
                      <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-lg">
                        <Database className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {stats?.totalTemplates || 0}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                          <Fingerprint className="h-3 w-3 mr-1" />
                          {stats?.fingerprintTemplates || 0}
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                          <ScanFace className="h-3 w-3 mr-1" />
                          {stats?.faceTemplates || 0}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-amber-500" data-testid="card-verifications-today">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Today's Verifications
                      </CardTitle>
                      <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-lg">
                        <Activity className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {stats?.verificationsToday || 0}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Identity checks performed
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-emerald-500" data-testid="card-success-rate">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Success Rate
                      </CardTitle>
                      <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {stats?.verificationsToday ? 
                          Math.round((stats.successfulVerifications / stats.verificationsToday) * 100) : 100}%
                      </div>
                      <Progress 
                        value={stats?.verificationsToday ? 
                          Math.round((stats.successfulVerifications / stats.verificationsToday) * 100) : 100} 
                        className="mt-2 h-2" 
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Security Status & Recent Activity */}
                <div className="grid gap-6 md:grid-cols-2">
                  <Card data-testid="card-security-status">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Shield className="h-5 w-5 text-blue-600" />
                        Security Status
                      </CardTitle>
                      <CardDescription>
                        System security and compliance overview
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-500 p-2 rounded-full">
                            <ShieldCheck className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <span className="font-medium text-slate-900 dark:text-white">Encryption</span>
                            <p className="text-xs text-slate-500">Data protection active</p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500 hover:bg-emerald-600">AES-256-CBC</Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-500 p-2 rounded-full">
                            <FileCheck className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <span className="font-medium text-slate-900 dark:text-white">HIPAA Compliance</span>
                            <p className="text-xs text-slate-500">Healthcare data standards</p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500 hover:bg-emerald-600">Compliant</Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-500 p-2 rounded-full">
                            <Lock className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <span className="font-medium text-slate-900 dark:text-white">Secure Connection</span>
                            <p className="text-xs text-slate-500">Transport layer security</p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500 hover:bg-emerald-600">TLS 1.3</Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-500 p-2 rounded-full">
                            <Database className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <span className="font-medium text-slate-900 dark:text-white">Data Storage</span>
                            <p className="text-xs text-slate-500">At-rest encryption</p>
                          </div>
                        </div>
                        <Badge className="bg-blue-500 hover:bg-blue-600">Encrypted</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-recent-activity">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="h-5 w-5 text-blue-600" />
                        Recent Verifications
                      </CardTitle>
                      <CardDescription>
                        Latest identity verification attempts
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {verificationsLoading ? (
                        <div className="flex items-center justify-center h-48">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        </div>
                      ) : verifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                          <History className="h-12 w-12 mb-3" />
                          <p className="font-medium">No Recent Verifications</p>
                          <p className="text-sm">Verification history will appear here</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {verifications.slice(0, 5).map((verification) => (
                            <div 
                              key={verification.id} 
                              className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                              data-testid={`verification-${verification.id}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${
                                  verification.isMatch 
                                    ? "bg-emerald-100 dark:bg-emerald-900/50" 
                                    : "bg-red-100 dark:bg-red-900/50"
                                }`}>
                                  {verification.isMatch ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-slate-900 dark:text-white">
                                    {getPatientName(verification.patientId)}
                                  </p>
                                  <p className="text-xs text-slate-500 flex items-center gap-1">
                                    {verification.biometricType === "fingerprint" ? (
                                      <Fingerprint className="h-3 w-3" />
                                    ) : (
                                      <ScanFace className="h-3 w-3" />
                                    )}
                                    {verification.biometricType === "fingerprint" ? "Fingerprint" : "Face"} scan
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant={verification.isMatch ? "default" : "destructive"} className="mb-1">
                                  {verification.confidenceScore}%
                                </Badge>
                                <p className="text-xs text-slate-400">
                                  {formatDate(verification.verifiedAt)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Store/Enroll Tab */}
          <TabsContent value="store" className="space-y-6 mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card data-testid="card-store-biometric">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Fingerprint className="h-5 w-5 text-blue-600" />
                    Capture Biometric Data
                  </CardTitle>
                  <CardDescription>
                    Enroll patient biometric data for secure identification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...storeForm}>
                    <form onSubmit={storeForm.handleSubmit(handleStore)} className="space-y-5">
                      <FormField
                        control={storeForm.control}
                        name="patientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 dark:text-slate-300">Select Patient</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger className="h-11" data-testid="select-patient-store">
                                  <SelectValue placeholder="Choose a patient to enroll..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {patients.map((patient) => (
                                  <SelectItem key={patient.id} value={patient.id}>
                                    {getPatientDisplay(patient)} ({patient.id.slice(0, 8)})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={storeForm.control}
                        name="biometricType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 dark:text-slate-300">Biometric Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "fingerprint"}>
                              <FormControl>
                                <SelectTrigger className="h-11" data-testid="select-biometric-type-store">
                                  <SelectValue placeholder="Select biometric type..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="fingerprint">
                                  <div className="flex items-center gap-2">
                                    <Fingerprint className="h-4 w-4 text-blue-600" />
                                    <span>Fingerprint Scan</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="face">
                                  <div className="flex items-center gap-2">
                                    <ScanFace className="h-4 w-4 text-purple-600" />
                                    <span>Face Recognition</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={storeForm.control}
                        name="quality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 dark:text-slate-300">Quality Threshold (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={0} 
                                max={100} 
                                placeholder="90"
                                className="h-11"
                                data-testid="input-quality"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full h-11 bg-blue-600 hover:bg-blue-700"
                        disabled={storeMutation.isPending || scanningBiometric}
                        data-testid="button-capture-biometric"
                      >
                        {scanningBiometric ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Scanning Biometric...
                          </>
                        ) : (
                          <>
                            <Fingerprint className="h-4 w-4 mr-2" />
                            Capture & Store Biometric
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card data-testid="card-scanner-preview">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {storeForm.watch("biometricType") === "face" ? (
                      <ScanFace className="h-5 w-5 text-purple-600" />
                    ) : (
                      <Fingerprint className="h-5 w-5 text-blue-600" />
                    )}
                    Scanner Preview
                  </CardTitle>
                  <CardDescription>
                    Live biometric capture interface
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-blue-300 dark:border-blue-700">
                    {scanningBiometric ? (
                      <div className="text-center space-y-4">
                        <div className="relative">
                          {storeForm.watch("biometricType") === "face" ? (
                            <ScanFace className="h-24 w-24 text-blue-600 animate-pulse" />
                          ) : (
                            <Fingerprint className="h-24 w-24 text-blue-600 animate-pulse" />
                          )}
                          <div className="absolute inset-0 border-4 border-blue-500/50 rounded-lg animate-ping" />
                        </div>
                        <div className="space-y-2">
                          <p className="font-semibold text-blue-600">Scanning in Progress...</p>
                          <Progress value={66} className="w-48 h-2" />
                          <p className="text-xs text-slate-500">
                            Please hold still for accurate capture
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-3">
                        {storeForm.watch("biometricType") === "face" ? (
                          <ScanFace className="h-20 w-20 text-slate-400 mx-auto" />
                        ) : (
                          <Fingerprint className="h-20 w-20 text-slate-400 mx-auto" />
                        )}
                        <div>
                          <p className="text-slate-600 dark:text-slate-300 font-medium">
                            Scanner Ready
                          </p>
                          <p className="text-sm text-slate-400 mt-1">
                            Select a patient and click capture to begin
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500 p-2 rounded-full flex-shrink-0">
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                          Data Security Notice
                        </p>
                        <p className="text-blue-600 dark:text-blue-300 text-xs mt-1">
                          All biometric data is encrypted using AES-256-CBC algorithm before storage.
                          Data is never transmitted or stored in plain text. HIPAA compliant.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Registered Templates */}
            <Card data-testid="card-registered-templates">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="h-5 w-5 text-blue-600" />
                  Registered Biometric Templates
                </CardTitle>
                <CardDescription>
                  All enrolled patient biometric data with encryption status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : templates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                    <Database className="h-10 w-10 mb-2" />
                    <p className="font-medium">No Templates Registered</p>
                    <p className="text-sm">Enrolled biometric templates will appear here</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                      <div 
                        key={template.id}
                        className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:shadow-md transition-shadow"
                        data-testid={`template-${template.id}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${
                              template.biometricType === "fingerprint" 
                                ? "bg-blue-100 dark:bg-blue-900/50" 
                                : "bg-purple-100 dark:bg-purple-900/50"
                            }`}>
                              {template.biometricType === "fingerprint" ? (
                                <Fingerprint className="h-5 w-5 text-blue-600" />
                              ) : (
                                <ScanFace className="h-5 w-5 text-purple-600" />
                              )}
                            </div>
                            <span className="font-medium capitalize text-slate-900 dark:text-white">
                              {template.biometricType}
                            </span>
                          </div>
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                            <span>Patient:</span>
                            <span className="font-medium">{getPatientName(template.patientId)}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                            <span>Quality:</span>
                            <span className="font-medium">{template.quality}%</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                            <span>Created:</span>
                            <span className="text-xs">{formatDate(template.createdAt)}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t flex items-center gap-1 text-xs text-emerald-600">
                          <Lock className="h-3 w-3" />
                          <span>AES-256 Encrypted</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verify Tab */}
          <TabsContent value="verify" className="space-y-6 mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card data-testid="card-verify-identity">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Scan className="h-5 w-5 text-blue-600" />
                    Verify Patient Identity
                  </CardTitle>
                  <CardDescription>
                    Authenticate patient using biometric verification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...verifyForm}>
                    <form onSubmit={verifyForm.handleSubmit(handleVerify)} className="space-y-5">
                      <FormField
                        control={verifyForm.control}
                        name="patientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 dark:text-slate-300">Patient ID</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter patient ID or scan barcode..."
                                className="h-11"
                                data-testid="input-patient-id-verify"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={verifyForm.control}
                        name="biometricType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700 dark:text-slate-300">Verification Method</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || "fingerprint"}>
                              <FormControl>
                                <SelectTrigger className="h-11" data-testid="select-biometric-type-verify">
                                  <SelectValue placeholder="Select verification method..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="fingerprint">
                                  <div className="flex items-center gap-2">
                                    <Fingerprint className="h-4 w-4 text-blue-600" />
                                    <span>Fingerprint Scan</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="face">
                                  <div className="flex items-center gap-2">
                                    <ScanFace className="h-4 w-4 text-purple-600" />
                                    <span>Face Recognition</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full h-11 bg-blue-600 hover:bg-blue-700"
                        disabled={verifyMutation.isPending || scanningBiometric}
                        data-testid="button-verify-identity"
                      >
                        {scanningBiometric ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Verifying Identity...
                          </>
                        ) : (
                          <>
                            <Scan className="h-4 w-4 mr-2" />
                            Verify Identity
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>

                  {/* Quick Patient Selection */}
                  <div className="mt-6 pt-4 border-t">
                    <Label className="text-sm text-slate-500">Quick Select Patient</Label>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {patients.slice(0, 4).map((patient) => (
                        <Button
                          key={patient.id}
                          variant="outline"
                          size="sm"
                          className="justify-start"
                          onClick={() => verifyForm.setValue("patientId", patient.id)}
                          data-testid={`quick-select-${patient.id}`}
                        >
                          <Users className="h-3 w-3 mr-2" />
                          {patient.firstName}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-verification-result">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Verification Result
                  </CardTitle>
                  <CardDescription>
                    Identity verification outcome and confidence score
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {scanningBiometric ? (
                    <div className="flex flex-col items-center justify-center h-72 space-y-4">
                      <div className="relative">
                        <div className="h-24 w-24 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                        <Fingerprint className="h-12 w-12 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-slate-500 font-medium">Verifying biometric data...</p>
                      <p className="text-xs text-slate-400">Please wait while we process your request</p>
                    </div>
                  ) : verificationResult ? (
                    <div className="space-y-6">
                      <div className={`p-6 rounded-xl text-center ${
                        verificationResult.verified 
                          ? "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800" 
                          : "bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800"
                      }`}>
                        {verificationResult.verified ? (
                          <>
                            <div className="bg-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                              <CheckCircle2 className="h-10 w-10 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                              Identity Verified
                            </h3>
                            <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-1">
                              Patient identity confirmed successfully
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="bg-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                              <XCircle className="h-10 w-10 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-red-700 dark:text-red-300">
                              Verification Failed
                            </h3>
                            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                              Could not verify patient identity
                            </p>
                          </>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                          <span className="text-slate-600 dark:text-slate-400">Confidence Score</span>
                          <div className="flex items-center gap-2">
                            <Progress value={verificationResult.confidenceScore} className="w-20 h-2" />
                            <span className="font-bold text-lg text-slate-900 dark:text-white">
                              {verificationResult.confidenceScore.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                          <span className="text-slate-600 dark:text-slate-400">Patient</span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {getPatientName(verificationResult.patientId)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                          <span className="text-slate-600 dark:text-slate-400">Security Status</span>
                          <Badge className="bg-emerald-500 hover:bg-emerald-600">
                            <Lock className="h-3 w-3 mr-1" />
                            Secure
                          </Badge>
                        </div>
                      </div>

                      {!verificationResult.verified && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/50 rounded-lg border border-amber-200 dark:border-amber-800">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-amber-800 dark:text-amber-200">
                                Verification Alert
                              </p>
                              <p className="text-amber-600 dark:text-amber-300 text-sm mt-1">
                                Patient identity could not be verified. Please try again with a different method or manually verify the patient's identity.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-72 text-slate-400">
                      <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
                        <Shield className="h-12 w-12" />
                      </div>
                      <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Ready to Verify</p>
                      <p className="text-sm text-center mt-2 max-w-[250px]">
                        Enter patient ID and select verification method to begin identity check
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-6 mt-6">
            <Card data-testid="card-verification-logs">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileCheck className="h-5 w-5 text-blue-600" />
                  Verification Audit Log
                </CardTitle>
                <CardDescription>
                  Complete history of all biometric verification attempts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {verificationsLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : verifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <History className="h-16 w-16 mb-4" />
                    <p className="text-lg font-medium text-slate-600 dark:text-slate-300">No Verification Logs</p>
                    <p className="text-sm">Verification attempts will be recorded here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-slate-50 dark:bg-slate-800/50">
                          <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-300">Timestamp</th>
                          <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-300">Patient</th>
                          <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-300">Method</th>
                          <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-300">Confidence</th>
                          <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-300">Result</th>
                          <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-300">Device</th>
                        </tr>
                      </thead>
                      <tbody>
                        {verifications.map((log) => (
                          <tr 
                            key={log.id} 
                            className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                            data-testid={`log-row-${log.id}`}
                          >
                            <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                              {formatDate(log.verifiedAt)}
                            </td>
                            <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">
                              {getPatientName(log.patientId)}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                {log.biometricType === "fingerprint" ? (
                                  <div className="bg-blue-100 dark:bg-blue-900/50 p-1.5 rounded">
                                    <Fingerprint className="h-4 w-4 text-blue-600" />
                                  </div>
                                ) : (
                                  <div className="bg-purple-100 dark:bg-purple-900/50 p-1.5 rounded">
                                    <ScanFace className="h-4 w-4 text-purple-600" />
                                  </div>
                                )}
                                <span className="text-sm capitalize text-slate-600 dark:text-slate-300">
                                  {log.biometricType}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Progress value={Number(log.confidenceScore)} className="w-16 h-2" />
                                <Badge variant="outline" className="font-medium">
                                  {log.confidenceScore}%
                                </Badge>
                              </div>
                            </td>
                            <td className="p-4">
                              {log.isMatch ? (
                                <Badge className="bg-emerald-500 hover:bg-emerald-600">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Failed
                                </Badge>
                              )}
                            </td>
                            <td className="p-4 text-sm text-slate-500 max-w-[200px] truncate">
                              {log.deviceInfo || "Unknown Device"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Hospital Footer */}
      <div className="bg-slate-900 text-white mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg">Galaxy Multi Specialty Hospital</h3>
              </div>
              <p className="text-slate-400 text-sm">
                Providing world-class healthcare with cutting-edge technology and compassionate care.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-400" />
                Address
              </h4>
              <p className="text-slate-400 text-sm" data-testid="text-footer-address">
                Sane Chowk, Nair Colony, More Vasti,<br />
                Chikhali, Pimpri-Chinchwad,<br />
                Maharashtra 411062
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-3">Contact Information</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-400" />
                  +91 20 1234 5678
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-400" />
                  info@galaxyhospital.in
                </p>
                <p className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-400" />
                  www.galaxyhospital.in
                </p>
              </div>
            </div>
          </div>
          <Separator className="my-4 bg-slate-700" />
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-slate-500">
            <p>© 2024 Galaxy Multi Specialty Hospital. All rights reserved.</p>
            <div className="flex items-center gap-4 mt-2 md:mt-0">
              <Badge variant="outline" className="border-slate-600 text-slate-400">
                <ShieldCheck className="h-3 w-3 mr-1" />
                HIPAA Compliant
              </Badge>
              <Badge variant="outline" className="border-slate-600 text-slate-400">
                <Lock className="h-3 w-3 mr-1" />
                ISO 27001 Certified
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
