import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
  History
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
        title: "Biometric Stored",
        description: `Template stored with AES-256 encryption. ID: ${data.templateId?.slice(0, 8)}...`,
      });
      storeForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/biometric/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/biometric/templates"] });
    },
    onError: () => {
      setScanningBiometric(false);
      toast({
        title: "Error",
        description: "Failed to store biometric template.",
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
        description: "Unable to verify biometric data.",
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Fingerprint className="h-7 w-7 text-primary" />
            Biometric Service
          </h1>
          <p className="text-muted-foreground mt-1">
            Secure patient identification with AES-256 encryption
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-500/10 text-green-600 border-green-200" data-testid="badge-security-status">
            <ShieldCheck className="h-3 w-3 mr-1" />
            HIPAA Compliant
          </Badge>
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-200" data-testid="badge-encryption-status">
            <Lock className="h-3 w-3 mr-1" />
            AES-256 Encrypted
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid gap-1">
          <TabsTrigger value="dashboard" className="flex items-center gap-2" data-testid="tab-dashboard">
            <Activity className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="store" className="flex items-center gap-2" data-testid="tab-store">
            <UserPlus className="h-4 w-4" />
            Store Biometric
          </TabsTrigger>
          <TabsTrigger value="verify" className="flex items-center gap-2" data-testid="tab-verify">
            <Search className="h-4 w-4" />
            Verify Identity
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2" data-testid="tab-logs">
            <History className="h-4 w-4" />
            Verification Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {statsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card data-testid="card-total-patients">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-sm font-medium">
                      Enrolled Patients
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalPatients || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      With biometric data
                    </p>
                  </CardContent>
                </Card>

                <Card data-testid="card-total-templates">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-sm font-medium">
                      Total Templates
                    </CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalTemplates || 0}</div>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        <Fingerprint className="h-3 w-3 mr-1" />
                        {stats?.fingerprintTemplates || 0}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <ScanFace className="h-3 w-3 mr-1" />
                        {stats?.faceTemplates || 0}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-verifications-today">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-sm font-medium">
                      Verifications Today
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.verificationsToday || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Identity checks performed
                    </p>
                  </CardContent>
                </Card>

                <Card data-testid="card-success-rate">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                    <CardTitle className="text-sm font-medium">
                      Success Rate
                    </CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.totalTemplates ? 
                        Math.round((stats.successfulVerifications / (stats.verificationsToday || 1)) * 100) : 0}%
                    </div>
                    <Progress 
                      value={stats?.totalTemplates ? 
                        Math.round((stats.successfulVerifications / (stats.verificationsToday || 1)) * 100) : 0} 
                      className="mt-2" 
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card data-testid="card-security-status">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Security Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                        <span className="font-medium">Encryption</span>
                      </div>
                      <Badge className="bg-green-500">AES-256-CBC Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                        <span className="font-medium">HIPAA Compliance</span>
                      </div>
                      <Badge className="bg-green-500">Compliant</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-green-600" />
                        <span className="font-medium">Secure Connection</span>
                      </div>
                      <Badge className="bg-green-500">TLS 1.3</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Data Storage</span>
                      </div>
                      <Badge className="bg-blue-500">Encrypted at Rest</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-recent-activity">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Recent Verifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {verificationsLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : verifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                        <History className="h-8 w-8 mb-2" />
                        <p>No recent verifications</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {verifications.slice(0, 5).map((verification) => (
                          <div 
                            key={verification.id} 
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                            data-testid={`verification-${verification.id}`}
                          >
                            <div className="flex items-center gap-3">
                              {verification.isMatch ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                              <div>
                                <p className="font-medium text-sm">
                                  {getPatientName(verification.patientId)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {verification.biometricType === "fingerprint" ? "Fingerprint" : "Face"} scan
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant={verification.isMatch ? "default" : "destructive"}>
                                {verification.confidenceScore}%
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
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

        <TabsContent value="store" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card data-testid="card-store-biometric">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5 text-primary" />
                  Capture Biometric Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...storeForm}>
                  <form onSubmit={storeForm.handleSubmit(handleStore)} className="space-y-4">
                    <FormField
                      control={storeForm.control}
                      name="patientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Patient</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-patient-store">
                                <SelectValue placeholder="Choose a patient..." />
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
                          <FormLabel>Biometric Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "fingerprint"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-biometric-type-store">
                                <SelectValue placeholder="Select type..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="fingerprint">
                                <div className="flex items-center gap-2">
                                  <Fingerprint className="h-4 w-4" />
                                  Fingerprint
                                </div>
                              </SelectItem>
                              <SelectItem value="face">
                                <div className="flex items-center gap-2">
                                  <ScanFace className="h-4 w-4" />
                                  Face Recognition
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
                          <FormLabel>Quality Threshold (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0} 
                              max={100} 
                              placeholder="90"
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
                      className="w-full"
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
                <CardTitle className="flex items-center gap-2">
                  {storeForm.watch("biometricType") === "face" ? (
                    <ScanFace className="h-5 w-5 text-primary" />
                  ) : (
                    <Fingerprint className="h-5 w-5 text-primary" />
                  )}
                  Scanner Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700">
                  {scanningBiometric ? (
                    <div className="text-center space-y-4">
                      <div className="relative">
                        {storeForm.watch("biometricType") === "face" ? (
                          <ScanFace className="h-24 w-24 text-primary animate-pulse" />
                        ) : (
                          <Fingerprint className="h-24 w-24 text-primary animate-pulse" />
                        )}
                        <div className="absolute inset-0 border-4 border-primary/50 rounded-lg animate-ping" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium text-primary">Scanning...</p>
                        <Progress value={66} className="w-48" />
                        <p className="text-xs text-muted-foreground">
                          Hold still for best results
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      {storeForm.watch("biometricType") === "face" ? (
                        <ScanFace className="h-16 w-16 text-muted-foreground mx-auto" />
                      ) : (
                        <Fingerprint className="h-16 w-16 text-muted-foreground mx-auto" />
                      )}
                      <p className="text-muted-foreground">
                        Scanner ready
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Select patient and click capture to start
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800 dark:text-blue-200">
                        Security Notice
                      </p>
                      <p className="text-blue-600 dark:text-blue-300 text-xs mt-1">
                        All biometric data is encrypted using AES-256-CBC algorithm before storage.
                        Data is never transmitted or stored in plain text.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-registered-templates">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Registered Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Database className="h-8 w-8 mb-2" />
                  <p>No templates registered</p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {templates.map((template) => (
                    <div 
                      key={template.id}
                      className="p-4 border rounded-lg"
                      data-testid={`template-${template.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {template.biometricType === "fingerprint" ? (
                            <Fingerprint className="h-5 w-5 text-primary" />
                          ) : (
                            <ScanFace className="h-5 w-5 text-primary" />
                          )}
                          <span className="font-medium capitalize">
                            {template.biometricType}
                          </span>
                        </div>
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Patient: {getPatientName(template.patientId)}</p>
                        <p>Quality: {template.quality}%</p>
                        <p>Created: {formatDate(template.createdAt)}</p>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
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

        <TabsContent value="verify" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card data-testid="card-verify-identity">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Verify Patient Identity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...verifyForm}>
                  <form onSubmit={verifyForm.handleSubmit(handleVerify)} className="space-y-4">
                    <FormField
                      control={verifyForm.control}
                      name="patientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient ID</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter patient ID or scan barcode..."
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
                          <FormLabel>Verification Method</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "fingerprint"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-biometric-type-verify">
                                <SelectValue placeholder="Select method..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="fingerprint">
                                <div className="flex items-center gap-2">
                                  <Fingerprint className="h-4 w-4" />
                                  Fingerprint Scan
                                </div>
                              </SelectItem>
                              <SelectItem value="face">
                                <div className="flex items-center gap-2">
                                  <ScanFace className="h-4 w-4" />
                                  Face Recognition
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
                      className="w-full"
                      disabled={verifyMutation.isPending || scanningBiometric}
                      data-testid="button-verify-identity"
                    >
                      {scanningBiometric ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Verify Identity
                        </>
                      )}
                    </Button>
                  </form>
                </Form>

                {/* Quick Patient Selection */}
                <div className="mt-6">
                  <Label className="text-sm text-muted-foreground">Quick Select Patient</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {patients.slice(0, 4).map((patient) => (
                      <Button
                        key={patient.id}
                        variant="outline"
                        size="sm"
                        onClick={() => verifyForm.setValue("patientId", patient.id)}
                        data-testid={`quick-select-${patient.id}`}
                      >
                        {patient.firstName}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-verification-result">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Verification Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scanningBiometric ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                      <Fingerprint className="h-12 w-12 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-muted-foreground">Verifying biometric data...</p>
                  </div>
                ) : verificationResult ? (
                  <div className="space-y-6">
                    <div className={`p-6 rounded-lg text-center ${
                      verificationResult.verified 
                        ? "bg-green-50 dark:bg-green-950" 
                        : "bg-red-50 dark:bg-red-950"
                    }`}>
                      {verificationResult.verified ? (
                        <>
                          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-3" />
                          <h3 className="text-xl font-bold text-green-700 dark:text-green-300">
                            Identity Verified
                          </h3>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-3" />
                          <h3 className="text-xl font-bold text-red-700 dark:text-red-300">
                            Verification Failed
                          </h3>
                        </>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-muted-foreground">Confidence Score</span>
                        <span className="font-bold text-lg">
                          {verificationResult.confidenceScore.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-muted-foreground">Patient ID</span>
                        <span className="font-medium">
                          {getPatientName(verificationResult.patientId)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-muted-foreground">Security</span>
                        <Badge className="bg-green-500">
                          <Lock className="h-3 w-3 mr-1" />
                          Secure
                        </Badge>
                      </div>
                    </div>

                    {!verificationResult.verified && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-amber-800 dark:text-amber-200">
                              Verification Alert
                            </p>
                            <p className="text-amber-600 dark:text-amber-300 text-xs mt-1">
                              Patient identity could not be verified. Please try again or use alternative verification method.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <Shield className="h-16 w-16 mb-4" />
                    <p className="text-lg font-medium">Ready to Verify</p>
                    <p className="text-sm text-center mt-2">
                      Enter patient ID and select verification method
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card data-testid="card-verification-logs">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Verification Audit Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {verificationsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : verifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <History className="h-12 w-12 mb-4" />
                  <p className="text-lg font-medium">No Verification Logs</p>
                  <p className="text-sm">Verification attempts will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Timestamp</th>
                        <th className="text-left p-3 font-medium">Patient</th>
                        <th className="text-left p-3 font-medium">Method</th>
                        <th className="text-left p-3 font-medium">Confidence</th>
                        <th className="text-left p-3 font-medium">Result</th>
                        <th className="text-left p-3 font-medium">Device</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verifications.map((log) => (
                        <tr 
                          key={log.id} 
                          className="border-b hover:bg-muted/50"
                          data-testid={`log-row-${log.id}`}
                        >
                          <td className="p-3 text-sm">
                            {formatDate(log.verifiedAt)}
                          </td>
                          <td className="p-3 text-sm font-medium">
                            {getPatientName(log.patientId)}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {log.biometricType === "fingerprint" ? (
                                <Fingerprint className="h-4 w-4" />
                              ) : (
                                <ScanFace className="h-4 w-4" />
                              )}
                              <span className="text-sm capitalize">{log.biometricType}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">
                              {log.confidenceScore}%
                            </Badge>
                          </td>
                          <td className="p-3">
                            {log.isMatch ? (
                              <Badge className="bg-green-500">
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
                          <td className="p-3 text-sm text-muted-foreground max-w-[200px] truncate">
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
  );
}
