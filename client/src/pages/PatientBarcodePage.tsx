import { useState, useRef, useEffect, useCallback } from "react";
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
            {longitudinalProfile?.patient?.address && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-foreground font-medium">{longitudinalProfile.patient.address}</span>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-1">
        <TabsList className="inline-flex w-max gap-1">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <User className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          {canSeePrescriptions && (
            <TabsTrigger value="prescriptions" data-testid="tab-prescriptions">
              <Pill className="h-4 w-4 mr-2" />
              Prescription
            </TabsTrigger>
          )}
          {canSeeNursing && (
            <TabsTrigger value="ipd-monitoring" data-testid="tab-ipd-monitoring">
              <Activity className="h-4 w-4 mr-2" />
              IPD Monitoring
            </TabsTrigger>
          )}
          {canSeeNursing && (
            <TabsTrigger value="icu-monitoring" data-testid="tab-icu-monitoring">
              <HeartPulse className="h-4 w-4 mr-2" />
              ICU Monitoring
            </TabsTrigger>
          )}
          {canSeeDocuments && (
            <TabsTrigger value="reports" data-testid="tab-reports">
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
          )}
          {canSeeDocuments && (
            <TabsTrigger value="documents" data-testid="tab-documents">
              <FolderOpen className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
          )}
          {canSeeBilling && (
            <TabsTrigger value="billing" data-testid="tab-billing">
              <DollarSign className="h-4 w-4 mr-2" />
              Billing
            </TabsTrigger>
          )}
        </TabsList>
        </div>


        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Name</div>
                  <div className="font-medium">{scannedPatient.patient.name}</div>
                  
                  <div className="text-muted-foreground">UHID</div>
                  <div className="font-mono text-sm">{scannedPatient.patient.uhid}</div>
                  
                  <div className="text-muted-foreground">Age/Gender</div>
                  <div>{scannedPatient.patient.age || "—"} / {scannedPatient.patient.gender || "—"}</div>
                  
                  <div className="text-muted-foreground">Ward/Bed</div>
                  <div>{scannedPatient.patient.wardBed || "—"}</div>
                  
                  <div className="text-muted-foreground">Treating Doctor</div>
                  <div>{scannedPatient.patient.treatingDoctor || "—"}</div>
                  
                  <div className="text-muted-foreground">Admission Type</div>
                  <div>
                    <Badge variant="outline">{scannedPatient.patient.admissionType}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {canSeeVitals && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Latest Vitals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scannedPatient.vitals ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        <div>
                          <div className="text-2xl font-bold">{scannedPatient.vitals.heartRate || "—"}</div>
                          <div className="text-xs text-muted-foreground">Heart Rate (bpm)</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-blue-500" />
                        <div>
                          <div className="text-2xl font-bold">
                            {scannedPatient.vitals.systolicBp || "—"}/{scannedPatient.vitals.diastolicBp || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">Blood Pressure</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-orange-500" />
                        <div>
                          <div className="text-2xl font-bold">{scannedPatient.vitals.temperature || "—"}°</div>
                          <div className="text-xs text-muted-foreground">Temperature</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wind className="h-4 w-4 text-green-500" />
                        <div>
                          <div className="text-2xl font-bold">{scannedPatient.vitals.spo2 || "—"}%</div>
                          <div className="text-xs text-muted-foreground">SpO2</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No vitals recorded yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Scan Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Scanned By</div>
                  <div className="font-medium">{scannedPatient.scanInfo.scannedBy}</div>
                  
                  <div className="text-muted-foreground">Role</div>
                  <div><Badge variant="outline">{scannedPatient.scanInfo.role}</Badge></div>
                  
                  <div className="text-muted-foreground">Scan Time</div>
                  <div className="text-xs">{new Date(scannedPatient.scanInfo.scannedAt).toLocaleString()}</div>
                </div>
                <Separator />
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Scan verified and logged</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4">
          {longitudinalLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading patient history...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                const latestIpd = longitudinalProfile?.ipdHistory?.[0];
                const monSess = scannedPatient.monitoringSession;
                const admDate = latestIpd?.admissionDate || monSess?.admissionDateTime;
                const totalDays = admDate ? Math.floor((Date.now() - new Date(admDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                const icuDays = latestIpd?.icuDays || 0;
                const genWardDays = Math.max(0, totalDays - icuDays);
                const ventDays = latestIpd?.ventilatorDays || 0;
                const patientName = scannedPatient.patient.name;
                const patientAge = monSess?.age || scannedPatient.patient.age;
                const patientGender = monSess?.sex || scannedPatient.patient.gender;
                const bloodGroup = monSess?.bloodGroup || latestIpd?.bloodGroup || "N/A";
                const room = monSess ? `${monSess.ward} ${monSess.bedNumber}` : (scannedPatient.patient.wardBed || latestIpd?.room || "N/A");
                const diagnosis = monSess?.primaryDiagnosis || latestIpd?.diagnosis || "N/A";
                const doctor = monSess?.admittingConsultant || scannedPatient.patient.treatingDoctor || latestIpd?.attendingDoctor || latestIpd?.doctor || "N/A";
                const status = scannedPatient.patient.status;
                return (
                  <>
                    {/* Top 2-column grid: Patient Details + Admission & Stay Duration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Patient Details */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" /> Patient Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1.5 text-sm">
                          {[
                            { label: "Name", value: patientName },
                            { label: "Age", value: patientAge ? `${patientAge} years` : "N/A" },
                            { label: "Gender", value: patientGender || "N/A" },
                            { label: "Blood Group", value: bloodGroup },
                            { label: "Room", value: room },
                            { label: "Diagnosis", value: diagnosis },
                            { label: "Attending Doctor", value: doctor },
                          ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between gap-2">
                              <span className="text-muted-foreground shrink-0">{label}:</span>
                              <span className="font-medium text-right">{value}</span>
                            </div>
                          ))}
                          <div className="flex justify-between gap-2 pt-1">
                            <span className="text-muted-foreground shrink-0">Status:</span>
                            <Badge variant={status === "critical" ? "destructive" : status === "admitted" || status === "active" ? "default" : "secondary"} className="text-xs">
                              {status || "N/A"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Right: Admission & Stay Duration */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" /> Admission &amp; Stay Duration
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between pb-1">
                            <span className="text-muted-foreground">Admission Date:</span>
                            <span className="font-medium">{admDate ? new Date(admDate).toLocaleDateString() : "N/A"}</span>
                          </div>
                          {admDate ? (
                            <>
                              <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg">
                                <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                                  <Bed className="h-3.5 w-3.5" /> Total Hospital Stay:
                                </span>
                                <span className="font-bold text-blue-700 dark:text-blue-300">{totalDays} days</span>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/40 rounded-lg">
                                <span className="flex items-center gap-1.5 text-green-700 dark:text-green-300">
                                  <Activity className="h-3.5 w-3.5" /> General Ward:
                                </span>
                                <span className="font-bold text-green-700 dark:text-green-300">{genWardDays} days</span>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/40 rounded-lg">
                                <span className="flex items-center gap-1.5 text-red-700 dark:text-red-300">
                                  <HeartPulse className="h-3.5 w-3.5" /> ICU Stay:
                                </span>
                                <span className="font-bold text-red-700 dark:text-red-300">{icuDays} days</span>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-cyan-50 dark:bg-cyan-950/40 rounded-lg">
                                <span className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-300">
                                  <Wind className="h-3.5 w-3.5" /> Ventilator:
                                </span>
                                <span className="font-bold text-cyan-700 dark:text-cyan-300">{ventDays} days</span>
                              </div>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No IPD admission found</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Additional Information */}
                    {latestIpd && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Activity className="h-4 w-4 text-muted-foreground" /> Additional Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-muted-foreground">Currently in ICU:</span>
                              <Badge variant={latestIpd.isInIcu ? "default" : "secondary"} className="text-xs">
                                {latestIpd.isInIcu ? "Yes" : "No"}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-muted-foreground">Department:</span>
                              <span className="font-medium">{latestIpd.department || "N/A"}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-muted-foreground">Assigned Nurse:</span>
                              <span className="font-medium">{latestIpd.assignedNurse || "N/A"}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-muted-foreground">ICU Transfer Date:</span>
                              <span className="font-medium">{latestIpd.icuTransferDate ? new Date(latestIpd.icuTransferDate).toLocaleDateString() : "N/A"}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* OPD Visits */}
                    {longitudinalProfile?.opdHistory?.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-blue-500" />
                            OPD Visits ({longitudinalProfile.opdHistory.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {longitudinalProfile.opdHistory.map((visit: any) => (
                            <div key={visit.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium text-sm">{visit.department || "General"}</p>
                                <p className="text-xs text-muted-foreground">{visit.doctorName || visit.doctor || "—"}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">{visit.appointmentDate ? new Date(visit.appointmentDate).toLocaleDateString() : "—"}</p>
                                <Badge variant="outline" className="text-xs">{visit.status || "—"}</Badge>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Prescriptions */}
                    {longitudinalProfile?.medicationHistory?.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Pill className="h-4 w-4 text-green-500" />
                            Prescriptions ({longitudinalProfile.medicationHistory.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {longitudinalProfile.medicationHistory.map((rx: any) => (
                            <div key={rx.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium text-sm">{rx.diagnosis || rx.chiefComplaint || "Prescription"}</p>
                                <p className="text-xs text-muted-foreground">{rx.doctorName || "—"}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-xs text-muted-foreground">{rx.createdAt ? new Date(rx.createdAt).toLocaleDateString() : "—"}</span>
                                <Badge variant={rx.status === "finalized" ? "default" : "secondary"} className="text-xs ml-1">{rx.status || "draft"}</Badge>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Diagnostic Tests */}
                    {longitudinalProfile?.diagnosticTests?.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <FlaskConical className="h-4 w-4 text-orange-500" />
                            Diagnostic Tests ({longitudinalProfile.diagnosticTests.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {longitudinalProfile.diagnosticTests.map((t: any) => (
                            <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <p className="font-medium text-sm">{t.testName || t.panelName || "Test"}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{t.status || "ordered"}</Badge>
                                <span className="text-xs text-muted-foreground">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—"}</span>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Consent Forms */}
                    {longitudinalProfile?.consentRecords?.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <FileCheck className="h-4 w-4 text-purple-500" />
                            Consent Forms ({longitudinalProfile.consentRecords.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {longitudinalProfile.consentRecords.map((c: any) => (
                            <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <p className="font-medium text-sm">{c.title || c.consentType || "Consent"}</p>
                              <span className="text-xs text-muted-foreground">{c.uploadedAt ? new Date(c.uploadedAt).toLocaleDateString() : "—"}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Medical Records */}
                    {longitudinalProfile?.medicalRecords?.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            Medical Records ({longitudinalProfile.medicalRecords.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {longitudinalProfile.medicalRecords.slice(0, 5).map((rec: any) => (
                            <div key={rec.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium text-sm">{rec.recordType || "Record"}</p>
                                <p className="text-xs text-muted-foreground">{rec.description || "—"}</p>
                              </div>
                              <span className="text-xs text-muted-foreground">{rec.recordDate ? new Date(rec.recordDate).toLocaleDateString() : "—"}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Billing Summary */}
                    {longitudinalProfile?.billingHistory?.bills?.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            Billing Summary ({longitudinalProfile.billingHistory.bills.length} bills)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {longitudinalProfile.billingHistory.bills.slice(0, 3).map((bill: any) => (
                            <div key={bill.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium text-sm">Bill #{bill.billNumber}</p>
                                <p className="text-xs text-muted-foreground">{bill.billDate ? new Date(bill.billDate).toLocaleDateString() : "—"}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">₹{bill.totalAmount}</p>
                                <Badge variant={bill.paymentStatus === "PAID" ? "default" : "secondary"} className="text-xs">{bill.paymentStatus}</Badge>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Movement Timeline */}
                    <PatientMovementTimeline patientId={getTrackingPatientId(patientName)} />

                    {/* Empty state */}
                    {!latestIpd && !monSess && longitudinalProfile?.opdHistory?.length === 0 &&
                     longitudinalProfile?.medicationHistory?.length === 0 &&
                     longitudinalProfile?.diagnosticTests?.length === 0 &&
                     longitudinalProfile?.consentRecords?.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <History className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p className="font-medium">No history records found</p>
                        <p className="text-sm mt-1">Medical activities will appear here as they are recorded.</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </TabsContent>

        {canSeePrescriptions && (
          <TabsContent value="prescriptions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Active Prescriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scannedPatient.prescriptions && scannedPatient.prescriptions.length > 0 ? (
                  <div className="space-y-4">
                    {scannedPatient.prescriptions.map((rx: any) => (
                      <div key={rx.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                          <div className="font-medium">{rx.diagnosis || "Prescription"}</div>
                          <Badge variant={rx.status === "finalized" ? "default" : "secondary"}>
                            {rx.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Doctor: {rx.doctorName}</p>
                          <p>Date: {new Date(rx.prescriptionDate).toLocaleDateString()}</p>
                        </div>
                        {rx.medications && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">Medications:</p>
                            <p className="text-sm text-muted-foreground">{rx.medications}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Pill className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No active prescriptions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {canSeeNursing && (
          <TabsContent value="ipd-monitoring" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Vital Signs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scannedPatient.vitals ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        <div>
                          <div className="text-2xl font-bold">{scannedPatient.vitals.heartRate || "—"}</div>
                          <div className="text-xs text-muted-foreground">Heart Rate (bpm)</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-blue-500" />
                        <div>
                          <div className="text-2xl font-bold">
                            {scannedPatient.vitals.systolicBp || "—"}/{scannedPatient.vitals.diastolicBp || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">Blood Pressure</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-orange-500" />
                        <div>
                          <div className="text-2xl font-bold">{scannedPatient.vitals.temperature || "—"}°F</div>
                          <div className="text-xs text-muted-foreground">Temperature</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wind className="h-4 w-4 text-green-500" />
                        <div>
                          <div className="text-2xl font-bold">{scannedPatient.vitals.spo2 || "—"}%</div>
                          <div className="text-xs text-muted-foreground">SpO2</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No vitals recorded</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    IPD Nursing Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scannedPatient.monitoringSession ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <Badge variant="outline">Session #{scannedPatient.monitoringSession.id}</Badge>
                        <Badge variant={scannedPatient.monitoringSession.status === "active" ? "default" : "secondary"}>
                          {scannedPatient.monitoringSession.status}
                        </Badge>
                      </div>
                      {scannedPatient.monitoringSession.notes && (
                        <p className="text-sm text-muted-foreground">{scannedPatient.monitoringSession.notes}</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No monitoring sessions</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Recent IPD Monitoring Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scannedPatient.allSessions && scannedPatient.allSessions.length > 0 ? (
                    <div className="space-y-2">
                      {scannedPatient.allSessions.slice(0, 5).map((session: any) => (
                        <div key={session.id} className="flex items-center justify-between p-2 border rounded-lg">
                          <div className="text-sm">
                            <p className="font-medium">{new Date(session.sessionDate).toLocaleDateString()}</p>
                            <p className="text-muted-foreground text-xs">{session.shift || "Day Shift"}</p>
                          </div>
                          <Badge variant="outline">{session.status}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No IPD monitoring sessions</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {canSeeNursing && (
          <TabsContent value="icu-monitoring" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HeartPulse className="h-5 w-5" />
                    ICU Vital Signs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scannedPatient.vitals ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        <div>
                          <div className="text-2xl font-bold">{scannedPatient.vitals.heartRate || "—"}</div>
                          <div className="text-xs text-muted-foreground">Heart Rate (bpm)</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-blue-500" />
                        <div>
                          <div className="text-2xl font-bold">
                            {scannedPatient.vitals.systolicBp || "—"}/{scannedPatient.vitals.diastolicBp || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">Blood Pressure</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-orange-500" />
                        <div>
                          <div className="text-2xl font-bold">{scannedPatient.vitals.temperature || "—"}°F</div>
                          <div className="text-xs text-muted-foreground">Temperature</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wind className="h-4 w-4 text-green-500" />
                        <div>
                          <div className="text-2xl font-bold">{scannedPatient.vitals.spo2 || "—"}%</div>
                          <div className="text-xs text-muted-foreground">SpO2</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <HeartPulse className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No ICU vitals recorded</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Allergies & Precautions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hasAllergies || scannedPatient.allergies?.specialPrecautions ? (
                    <div className="space-y-3">
                      {drugAllergies.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Drug Allergies:</p>
                          <div className="flex flex-wrap gap-1">
                            {drugAllergies.map((a, i) => (
                              <Badge key={i} variant="destructive">{a}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {foodAllergies.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Food Allergies:</p>
                          <div className="flex flex-wrap gap-1">
                            {foodAllergies.map((a, i) => (
                              <Badge key={i} variant="outline">{a}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {scannedPatient.allergies?.specialPrecautions && (
                        <div>
                          <p className="text-sm font-medium mb-1">Special Precautions:</p>
                          <p className="text-sm text-muted-foreground">{scannedPatient.allergies.specialPrecautions}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" />
                      <p className="text-sm">No known allergies</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    ICU Nursing Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scannedPatient.monitoringSession ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <Badge variant="outline">Session #{scannedPatient.monitoringSession.id}</Badge>
                        <Badge variant={scannedPatient.monitoringSession.status === "active" ? "default" : "secondary"}>
                          {scannedPatient.monitoringSession.status}
                        </Badge>
                      </div>
                      {scannedPatient.monitoringSession.notes && (
                        <p className="text-sm text-muted-foreground">{scannedPatient.monitoringSession.notes}</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Stethoscope className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No ICU monitoring notes</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {canSeeDocuments && (
          <TabsContent value="reports" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Lab Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Lab reports and test results will appear here</p>
                  <p className="text-sm mt-2">Reports are linked when pathology tests are completed</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {canSeeDocuments && (
          <TabsContent value="documents" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Patient Documents
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg hover-elevate cursor-pointer">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="font-medium">Consent Forms</p>
                          <p className="text-sm text-muted-foreground">Admission & procedure consents</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg hover-elevate cursor-pointer">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-green-500" />
                        <div>
                          <p className="font-medium">Medical Records</p>
                          <p className="text-sm text-muted-foreground">Previous medical history</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg hover-elevate cursor-pointer">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-purple-500" />
                        <div>
                          <p className="font-medium">Insurance Documents</p>
                          <p className="text-sm text-muted-foreground">Insurance cards & claims</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg hover-elevate cursor-pointer">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-orange-500" />
                        <div>
                          <p className="font-medium">Discharge Summary</p>
                          <p className="text-sm text-muted-foreground">Final reports & instructions</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {canSeeBilling && scannedPatient.billing && (
          <TabsContent value="billing" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Billing Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scannedPatient.billing.length > 0 ? (
                  <div className="space-y-4">
                    {scannedPatient.billing.map((bill: any) => (
                      <div key={bill.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <p className="font-medium">Bill #{bill.billNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(bill.billDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">₹{bill.totalAmount}</p>
                            <Badge variant={bill.paymentStatus === "PAID" ? "default" : "secondary"}>
                              {bill.paymentStatus}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No billing records</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
