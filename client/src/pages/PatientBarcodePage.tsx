import { useState, useRef, useEffect, useCallback } from "react";
import { PatientProfileView } from "@/components/PatientProfileView";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { BrowserMultiFormatReader, BrowserQRCodeReader } from "@zxing/browser";
import { 
  QrCode, 
  Scan, 
  User, 
  Activity, 
  Pill, 
  FileText, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Heart,
  Thermometer,
  Droplets,
  Wind,
  History,
  Shield,
  X,
  Loader2,
  Camera,
  CameraOff,
  Video,
  Users,
  Plus,
  Eye,
  Stethoscope,
  ClipboardList,
  FolderOpen,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Printer,
  Download,
  FlaskConical,
  FileCheck,
  Bed,
  HeartPulse,
  LogOut,
  ChevronRight
} from "lucide-react";

interface PatientMovement {
  id: string;
  trackingPatientId: string;
  eventType: string;
  fromLocation: string | null;
  toLocation: string | null;
  performedBy: string | null;
  notes: string | null;
  occurredAt: string;
}

function PatientMovementTimeline({ patientId }: { patientId: string | null }) {
  const { data: movements = [], isLoading } = useQuery<PatientMovement[]>({
    queryKey: ["/api/tracking/patients", patientId, "movements"],
    refetchInterval: 10000,
    staleTime: 0,
    refetchOnWindowFocus: true,
    enabled: Boolean(patientId),
  });

  const getEventIcon = (eventType: string) => {
    switch ((eventType || "").toLowerCase()) {
      case "admission": return <Plus className="h-4 w-4 text-green-600" />;
      case "discharge": return <LogOut className="h-4 w-4 text-blue-600" />;
      case "icu_transfer": return <HeartPulse className="h-4 w-4 text-red-600" />;
      case "ward_transfer": return <Bed className="h-4 w-4 text-purple-600" />;
      default: return <MapPin className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch ((eventType || "").toLowerCase()) {
      case "admission": return "border-green-500 bg-green-50 dark:bg-green-900/20";
      case "discharge": return "border-blue-500 bg-blue-50 dark:bg-blue-900/20";
      case "icu_transfer": return "border-red-500 bg-red-50 dark:bg-red-900/20";
      case "ward_transfer": return "border-purple-500 bg-purple-50 dark:bg-purple-900/20";
      default: return "border-gray-500 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  if (!patientId) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          Movement Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center text-muted-foreground py-4">Loading...</div>
        ) : movements.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">No movement history recorded</div>
        ) : (
          <div className="relative space-y-4">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
            {movements.map((movement) => {
              const d = new Date(movement.occurredAt);
              const date = d.toLocaleDateString();
              const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              return (
                <div key={movement.id} className="relative pl-10">
                  <div className="absolute left-2 top-2 w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                    {getEventIcon(movement.eventType)}
                  </div>
                  <div className={cn("p-3 rounded-lg border-l-4", getEventColor(movement.eventType))}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium capitalize">
                        {(movement.eventType || "").replace(/_/g, " ")}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{date} {time}</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {movement.fromLocation && movement.toLocation && (
                        <div className="flex items-center gap-2">
                          <span>{movement.fromLocation}</span>
                          <ChevronRight className="h-4 w-4" />
                          <span className="font-medium">{movement.toLocation}</span>
                        </div>
                      )}
                      {movement.notes && <p className="mt-1 text-xs">{movement.notes}</p>}
                      {movement.performedBy && <p className="mt-1 text-xs">By: {movement.performedBy}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PatientBarcodePageProps {
  currentRole?: string;
}

interface PatientData {
  barcode: {
    id: string;
    uhid: string;
    admissionType: string;
    wardBed: string | null;
    treatingDoctor: string | null;
    createdAt: string;
  };
  patient: {
    id: string;
    name: string;
    uhid: string;
    admissionType: string;
    wardBed: string | null;
    treatingDoctor: string | null;
    age?: number;
    gender?: string;
    status: string;
  };
  scanInfo: {
    scannedBy: string;
    scannedAt: string;
    role: string;
  };
  vitals?: {
    heartRate?: number;
    systolicBp?: number;
    diastolicBp?: number;
    temperature?: number;
    spo2?: number;
    respiratoryRate?: number;
    recordedAt?: string;
  };
  allergies?: {
    drugAllergies?: string;
    foodAllergies?: string;
    specialPrecautions?: string;
  };
  prescriptions?: any[];
  billing?: any[];
  monitoringSession?: any;
  allSessions?: any[];
}

export default function PatientBarcodePage({ currentRole }: PatientBarcodePageProps) {
  const { toast } = useToast();
  const isAdmin = currentRole === "ADMIN";
  const [uhidInput, setUhidInput] = useState("");
  const [scannedPatient, setScannedPatient] = useState<PatientData | null>(null);
  const [showScanner, setShowScanner] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [selectedPatientForBarcode, setSelectedPatientForBarcode] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const controlsRef = useRef<any>(null);

  const openBarcodeModal = (patient: any) => {
    setSelectedPatientForBarcode(patient);
    setBarcodeModalOpen(true);
  };

  const downloadBarcode = async (uhid: string, patientName: string) => {
    try {
      const response = await fetch(`/api/barcodes/image/${uhid}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to download barcode");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `barcode-${uhid}-${patientName.replace(/\s+/g, "_")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Downloaded",
        description: "Barcode image saved successfully",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download barcode image",
        variant: "destructive",
      });
    }
  };

  const printBarcode = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow && selectedPatientForBarcode) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Patient QR Code - ${selectedPatientForBarcode.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
              .qr-container { border: 2px solid #333; padding: 20px; display: inline-block; }
              .patient-name { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
              .uhid { font-size: 14px; color: #666; margin-bottom: 15px; }
              .qr-img { width: 150px; height: 150px; }
              .hospital-name { font-size: 12px; margin-top: 10px; color: #888; }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="patient-name">${selectedPatientForBarcode.name}</div>
              <div class="uhid">UHID: ${selectedPatientForBarcode.barcode.uhid}</div>
              <img class="qr-img" src="/api/barcodes/image/${selectedPatientForBarcode.barcode.uhid}" />
              <div class="hospital-name">Gravity Hospital - Gravity AI Manager</div>
            </div>
            <script>
              setTimeout(() => { window.print(); window.close(); }, 500);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const scanMutation = useMutation({
    mutationFn: async (uhid: string) => {
      const response = await apiRequest("POST", "/api/barcode/scan", { uhid });
      return response.json();
    },
    onSuccess: (data) => {
      setScannedPatient(data);
      setShowScanner(false);
      stopCamera();
      toast({
        title: "Patient Found",
        description: `Successfully loaded data for ${data.patient.name}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Scan Failed",
        description: error.message || "Could not find patient with this UHID",
        variant: "destructive",
      });
    },
  });

  const { data: allBarcodes, refetch: refetchBarcodes } = useQuery<any[]>({
    queryKey: ["/api/barcodes"],
    enabled: showScanner,
  });

  const { data: patientsWithBarcodes, refetch: refetchPatients, isLoading: loadingPatients } = useQuery<any[]>({
    queryKey: ["/api/patients/with-barcodes"],
    enabled: showScanner,
  });

  const { data: longitudinalProfile, isLoading: longitudinalLoading } = useQuery<any>({
    queryKey: ["/api/service-patients", scannedPatient?.patient?.id, "longitudinal-profile"],
    queryFn: async () => {
      if (!scannedPatient?.patient?.id) return null;
      const res = await fetch(`/api/service-patients/${scannedPatient.patient.id}/longitudinal-profile`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!scannedPatient?.patient?.id && !showScanner,
    refetchInterval: scannedPatient?.patient?.id && !showScanner ? 30000 : false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: allTrackingPatients = [] } = useQuery<any[]>({
    queryKey: ["/api/tracking/patients"],
    refetchInterval: 30000,
  });

  // Monitoring sessions store tracking_patient ID, NOT service_patient ID (barcode.patientId)
  // Resolve the tracking patient ID by name matching against allTrackingPatients
  const scannedPatientName = scannedPatient?.patient?.name;
  const scannedPatientId = (() => {
    if (!scannedPatientName || !allTrackingPatients.length) return null;
    const lower = scannedPatientName.toLowerCase().trim();
    const match = (allTrackingPatients as any[]).find((t: any) => {
      const tn = (t.name || "").toLowerCase().trim();
      if (tn === lower) return true;
      const parts = lower.split(" ").filter(Boolean);
      return parts.length > 0 && parts.every((p: string) => tn.includes(p));
    });
    return match?.id || null;
  })();

  const { data: ipdSessions = [], isLoading: ipdSessionsLoading } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/sessions/patient", scannedPatientId],
    queryFn: async () => {
      if (!scannedPatientId) return [];
      const res = await fetch(`/api/patient-monitoring/sessions/patient/${scannedPatientId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!scannedPatientId && !showScanner,
    refetchInterval: 10000,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const latestIpdSession = ipdSessions[0];
  const latestSessionId = latestIpdSession?.id;

  const { data: ipdVitals = [], isLoading: ipdVitalsLoading } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/vitals", latestSessionId],
    queryFn: async () => {
      if (!latestSessionId) return [];
      const res = await fetch(`/api/patient-monitoring/vitals/${latestSessionId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!latestSessionId && !showScanner,
    refetchInterval: 10000,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: ipdIntake = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/intake", latestSessionId],
    queryFn: async () => {
      if (!latestSessionId) return [];
      const res = await fetch(`/api/patient-monitoring/intake/${latestSessionId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!latestSessionId && !showScanner,
    refetchInterval: 10000,
    staleTime: 0,
  });

  const { data: ipdOutput = [] } = useQuery<any[]>({
    queryKey: ["/api/patient-monitoring/output", latestSessionId],
    queryFn: async () => {
      if (!latestSessionId) return [];
      const res = await fetch(`/api/patient-monitoring/output/${latestSessionId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!latestSessionId && !showScanner,
    refetchInterval: 10000,
    staleTime: 0,
  });

  const { data: icuCharts = [], isLoading: icuChartsLoading } = useQuery<any[]>({
    queryKey: ["/api/patients", scannedPatientId, "icu-charts"],
    queryFn: async () => {
      if (!scannedPatientId) return [];
      const res = await fetch(`/api/patients/${scannedPatientId}/icu-charts`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!scannedPatientId && !showScanner,
    refetchInterval: 30000,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const latestIcuChart = icuCharts[0];

  const totalIntake = ipdIntake.reduce((sum: number, r: any) => sum + (r.hourlyTotal || 0), 0);
  const totalOutput = ipdOutput.reduce((sum: number, r: any) => sum + (r.hourlyTotal || 0), 0);
  const fluidBalance = totalIntake - totalOutput;
  const lastVital = ipdVitals.length > 0 ? ipdVitals[ipdVitals.length - 1] : null;

  const getTrackingPatientId = (name: string): string | null => {
    if (!name || !allTrackingPatients.length) return null;
    const lower = name.toLowerCase().trim();
    const match = allTrackingPatients.find((t: any) => {
      const tn = (t.name || "").toLowerCase().trim();
      if (tn === lower) return true;
      const parts = lower.split(" ").filter(Boolean);
      return parts.length > 0 && parts.every((p: string) => tn.includes(p));
    });
    return match?.id || null;
  };

  const generateAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/barcodes/generate-all", {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Barcodes Generated",
        description: data.message,
      });
      refetchBarcodes();
      refetchPatients();
      queryClient.invalidateQueries({ queryKey: ["/api/barcodes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients/with-barcodes"] });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Could not generate barcodes",
        variant: "destructive",
      });
    },
  });

  const extractUHID = (barcodeText: string): string | null => {
    const text = barcodeText.trim();
    if (text.startsWith("HMS:")) {
      const parts = text.split(":");
      return parts[1] || null;
    }
    if (text.match(/^GRAV-(IPD|OPD)-\d{4}-\d+$/)) {
      return text;
    }
    return null;
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsScanning(true);
      setCameraActive(true);
      
      // Use QR Code specific reader for better detection
      if (!readerRef.current) {
        readerRef.current = new BrowserQRCodeReader();
      }

      // Get available video devices - prefer back camera on mobile
      const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
      let selectedDeviceId: string | undefined = undefined;
      
      if (videoInputDevices.length > 0) {
        const backCamera = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );
        selectedDeviceId = backCamera?.deviceId || videoInputDevices[0].deviceId;
      }

      // Wait for video element to be rendered
      let attempts = 0;
      while (!videoRef.current && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!videoRef.current) {
        setCameraError("Video element not ready. Please refresh and try again.");
        setCameraActive(false);
        setIsScanning(false);
        return;
      }

      console.log("Starting QR code scanner with device:", selectedDeviceId);
      
      controlsRef.current = await readerRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error, controls) => {
          if (result) {
            const barcodeText = result.getText();
            console.log("QR Code detected:", barcodeText);
            const uhid = extractUHID(barcodeText);
            
            if (uhid && !scanMutation.isPending) {
              controls.stop();
              setCameraActive(false);
              setIsScanning(false);
              setUhidInput(uhid);
              scanMutation.mutate(uhid);
            }
          }
        }
      );
    } catch (err: any) {
      console.error("Camera error:", err);
      setCameraError(err.message || "Could not access camera. Please use manual entry.");
      setCameraActive(false);
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleScan = () => {
    if (!uhidInput.trim()) {
      // If no UHID entered, start camera scanner instead
      startCamera();
      return;
    }
    scanMutation.mutate(uhidInput.trim());
  };

  const handleQuickScan = (uhid: string) => {
    setUhidInput(uhid);
    scanMutation.mutate(uhid);
  };

  const resetScanner = () => {
    setScannedPatient(null);
    setShowScanner(true);
    setUhidInput("");
    setActiveTab("overview");
  };

  const parseAllergies = (allergiesStr?: string): string[] => {
    if (!allergiesStr) return [];
    try {
      return JSON.parse(allergiesStr);
    } catch {
      return allergiesStr.split(",").map(a => a.trim()).filter(Boolean);
    }
  };

  const userRole = scannedPatient?.scanInfo?.role || "";
  const isAuthorizedRole = userRole === "ADMIN" || userRole === "DOCTOR" || userRole === "NURSE";
  const canSeePrescriptions = isAuthorizedRole;
  const canSeeBilling = isAuthorizedRole;
  const canSeeVitals = isAuthorizedRole;
  const canSeeNursing = isAuthorizedRole;
  const canSeeDocuments = isAuthorizedRole;

  if (showScanner) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <QrCode className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Patient Barcode Scanner</h1>
            <p className="text-muted-foreground">Scan patient UHID barcode or enter manually</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5" />
                Scan / Enter UHID
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter UHID (e.g., GRAV-IPD-2025-000001)"
                  value={uhidInput}
                  onChange={(e) => setUhidInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScan()}
                  className="text-lg font-mono"
                  data-testid="input-uhid"
                />
                <Button 
                  onClick={handleScan} 
                  disabled={scanMutation.isPending}
                  data-testid="button-scan"
                >
                  {scanMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Scan className="h-4 w-4" />
                  )}
                  <span className="ml-2">Scan</span>
                </Button>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                {cameraActive ? (
                  <div className="space-y-3">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                      <video 
                        ref={videoRef} 
                        className="w-full h-full object-cover"
                        autoPlay 
                        playsInline
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-24 border-2 border-white/70 rounded-lg" />
                      </div>
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button 
                        variant="outline" 
                        onClick={stopCamera}
                        data-testid="button-stop-camera"
                      >
                        <CameraOff className="h-4 w-4 mr-2" />
                        Stop Camera
                      </Button>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Scanning for barcode... Position UHID barcode in frame</span>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      Or enter UHID manually above if camera scan doesn't work
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    {cameraError ? (
                      <Alert variant="destructive" className="text-left">
                        <CameraOff className="h-4 w-4" />
                        <AlertTitle>Camera Error</AlertTitle>
                        <AlertDescription>{cameraError}</AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <Video className="h-16 w-16 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Use camera to scan barcode or enter UHID manually above
                        </p>
                      </>
                    )}
                    <Button 
                      variant="outline" 
                      onClick={startCamera}
                      data-testid="button-start-camera"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Start Camera
                    </Button>
                  </div>
                )}
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Secure Access</AlertTitle>
                <AlertDescription>
                  Only Doctors, Nurses, and Administrators can scan patient barcodes.
                  All scans are logged for NABH compliance.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Patients
              </CardTitle>
              {isAdmin && (
                <Button 
                  onClick={() => generateAllMutation.mutate()}
                  disabled={generateAllMutation.isPending}
                  size="sm"
                  data-testid="button-generate-all"
                >
                  {generateAllMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Generate All Barcodes
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {loadingPatients ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : patientsWithBarcodes && patientsWithBarcodes.length > 0 ? (
                  <div className="space-y-2">
                    {patientsWithBarcodes.map((patient) => (
                      <div
                        key={patient.id}
                        className={`flex items-center justify-between p-3 rounded-lg border hover-elevate ${patient.hasBarcode ? 'cursor-pointer' : 'opacity-60'}`}
                        onClick={() => patient.hasBarcode && handleQuickScan(patient.barcode.uhid)}
                        data-testid={`patient-item-${patient.id}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`p-2 rounded-full flex-shrink-0 ${patient.hasBarcode ? 'bg-primary/10' : 'bg-muted'}`}>
                            <User className={`h-4 w-4 ${patient.hasBarcode ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{patient.name}</p>
                            {patient.hasBarcode ? (
                              <p className="text-sm text-muted-foreground font-mono truncate">{patient.barcode.uhid}</p>
                            ) : (
                              <p className="text-sm text-muted-foreground">No barcode assigned</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          {patient.hasBarcode ? (
                            <>
                              <Badge variant={patient.barcode.admissionType === "IPD" ? "default" : "secondary"}>
                                {patient.barcode.admissionType}
                              </Badge>
                              {patient.barcode.wardBed && (
                                <Badge variant="outline" className="hidden sm:inline-flex">{patient.barcode.wardBed}</Badge>
                              )}
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={(e) => { e.stopPropagation(); openBarcodeModal(patient); }}
                                title="View Barcode"
                                data-testid={`button-view-barcode-${patient.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Pending</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No patients found</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* QR Code Modal */}
        <Dialog open={barcodeModalOpen} onOpenChange={setBarcodeModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Patient QR Code
              </DialogTitle>
              <DialogDescription>
                Scan this QR code to access patient information
              </DialogDescription>
            </DialogHeader>
            {selectedPatientForBarcode && (
              <div className="space-y-4">
                <div className="text-center space-y-2 p-4 bg-muted rounded-lg">
                  <p className="font-bold text-lg">{selectedPatientForBarcode.name}</p>
                  <p className="text-sm text-muted-foreground font-mono">{selectedPatientForBarcode.barcode?.uhid}</p>
                  <div className="flex justify-center gap-2 flex-wrap">
                    <Badge variant={selectedPatientForBarcode.barcode?.admissionType === "IPD" ? "default" : "secondary"}>
                      {selectedPatientForBarcode.barcode?.admissionType}
                    </Badge>
                    {selectedPatientForBarcode.barcode?.wardBed && (
                      <Badge variant="outline">{selectedPatientForBarcode.barcode.wardBed}</Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-center p-4 bg-white rounded-lg border">
                  <img 
                    src={`/api/barcodes/image/${selectedPatientForBarcode.barcode?.uhid}`}
                    alt={`Barcode for ${selectedPatientForBarcode.name}`}
                    className="max-w-full h-auto"
                    data-testid="barcode-image"
                  />
                </div>

                <div className="bg-muted/50 p-3 rounded-lg text-sm">
                  <p className="font-medium mb-2">Encryption Process:</p>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>UHID + Patient ID combined with HMAC-SHA256</li>
                    <li>12-character signature appended for integrity</li>
                    <li>Format: HMS:UHID:SIGNATURE</li>
                    <li>Verified on scan to prevent tampering</li>
                  </ul>
                </div>

                <div className="flex justify-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => downloadBarcode(selectedPatientForBarcode.barcode?.uhid, selectedPatientForBarcode.name)}
                    data-testid="button-download-barcode"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={printBarcode}
                    data-testid="button-print-barcode"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button 
                    onClick={() => {
                      setBarcodeModalOpen(false);
                      handleQuickScan(selectedPatientForBarcode.barcode?.uhid);
                    }}
                    data-testid="button-scan-barcode"
                  >
                    <Scan className="h-4 w-4 mr-2" />
                    View Patient Data
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (!scannedPatient) return null;

  const drugAllergies = parseAllergies(scannedPatient.allergies?.drugAllergies);
  const foodAllergies = parseAllergies(scannedPatient.allergies?.foodAllergies);
  const hasAllergies = drugAllergies.length > 0 || foodAllergies.length > 0;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button variant="outline" onClick={resetScanner} data-testid="button-back-scanner">
          <X className="h-4 w-4 mr-2" />
          Back to Scanner
        </Button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Scanned at {new Date(scannedPatient.scanInfo.scannedAt).toLocaleTimeString()} by {scannedPatient.scanInfo.scannedBy}
          <Badge variant="outline" className="text-xs">{scannedPatient.scanInfo.role}</Badge>
        </div>
      </div>

      {/* Patient Identity Banner */}
      <div className="bg-muted/40 border rounded-lg p-4 flex flex-wrap gap-4 items-start">
        <div className="p-3 rounded-full bg-primary/10 flex-shrink-0">
          <User className="h-7 w-7 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl font-bold">{scannedPatient.patient.name}</h1>
            <Badge variant={scannedPatient.patient.admissionType === "IPD" ? "default" : "secondary"}>
              {scannedPatient.patient.admissionType}
            </Badge>
            <Badge variant={scannedPatient.patient.status === "active" || scannedPatient.patient.status === "admitted" ? "default" : "secondary"}>
              {scannedPatient.patient.status}
            </Badge>
          </div>
          <p className="text-sm font-mono text-muted-foreground mb-2">{scannedPatient.patient.uhid}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
            {scannedPatient.patient.gender && (
              <span>Gender: <span className="text-foreground font-medium capitalize">{scannedPatient.patient.gender}</span></span>
            )}
            {(longitudinalProfile?.patient?.dateOfBirth) && (
              <span>DOB: <span className="text-foreground font-medium">{longitudinalProfile.patient.dateOfBirth}</span></span>
            )}
            {longitudinalProfile?.patient?.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                Phone: <span className="text-foreground font-medium">{longitudinalProfile.patient.phone}</span>
              </span>
            )}
            {scannedPatient.patient.wardBed && (
              <span>Ward/Bed: <span className="text-foreground font-medium">{scannedPatient.patient.wardBed}</span></span>
            )}
            {scannedPatient.patient.treatingDoctor && (
              <span>Doctor: <span className="text-foreground font-medium">{scannedPatient.patient.treatingDoctor}</span></span>
            )}
            {(scannedPatient.monitoringSession?.primaryDiagnosis || scannedPatient.monitoringSession?.diagnosis || longitudinalProfile?.ipdHistory?.[0]?.diagnosis) && (
              <span>Diagnosis: <span className="text-foreground font-medium">{scannedPatient.monitoringSession?.primaryDiagnosis || scannedPatient.monitoringSession?.diagnosis || longitudinalProfile?.ipdHistory?.[0]?.diagnosis}</span></span>
            )}
            {scannedPatient.patient.age && !longitudinalProfile?.patient?.dateOfBirth && (
              <span>Age: <span className="text-foreground font-medium">{scannedPatient.patient.age} yrs</span></span>
            )}
            {longitudinalProfile?.patient?.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                <span className="text-foreground font-medium">{longitudinalProfile.patient.email}</span>
              </span>
            )}

            {longitudinalProfile?.patient?.insuranceProvider && (
              <span>Insurance: <span className="text-foreground font-medium">{longitudinalProfile.patient.insuranceProvider}</span></span>
            )}
          </div>
          {longitudinalLoading && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading additional details...
            </p>
          )}
        </div>
      </div>

      {hasAllergies && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Allergy Alert</AlertTitle>
          <AlertDescription>
            <div className="flex flex-wrap gap-2 mt-2">
              {drugAllergies.map((allergy, i) => (
                <Badge key={i} variant="destructive">{allergy}</Badge>
              ))}
              {foodAllergies.map((allergy, i) => (
                <Badge key={`food-${i}`} variant="outline" className="border-destructive text-destructive">
                  {allergy}
                </Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <PatientProfileView
        servicePatientId={scannedPatient.patient.id}
        patientName={scannedPatient.patient.name}
        demographics={{
          name: scannedPatient.patient.name,
          gender: scannedPatient.patient.gender,
          dateOfBirth: longitudinalProfile?.patient?.dateOfBirth,
          phone: longitudinalProfile?.patient?.phone,
          email: longitudinalProfile?.patient?.email,
          address: longitudinalProfile?.patient?.address,
          insuranceProvider: longitudinalProfile?.patient?.insuranceProvider,
        }}
        barcodeData={{
          uhid: scannedPatient.patient.uhid,
          admissionType: scannedPatient.patient.admissionType,
          wardBed: scannedPatient.patient.wardBed,
          treatingDoctor: scannedPatient.patient.treatingDoctor,
        }}
        trackingData={null}
        enabled={true}
        hideHeader={true}
      />
    </div>
  );
}
