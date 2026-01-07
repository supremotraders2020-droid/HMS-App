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
  Download
} from "lucide-react";

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
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${patient.hasBarcode ? 'bg-primary/10' : 'bg-muted'}`}>
                            <User className={`h-4 w-4 ${patient.hasBarcode ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <p className="font-medium">{patient.name}</p>
                            {patient.hasBarcode ? (
                              <p className="text-sm text-muted-foreground font-mono">{patient.barcode.uhid}</p>
                            ) : (
                              <p className="text-sm text-muted-foreground">No barcode assigned</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {patient.hasBarcode ? (
                            <>
                              <Badge variant={patient.barcode.admissionType === "IPD" ? "default" : "secondary"}>
                                {patient.barcode.admissionType}
                              </Badge>
                              {patient.barcode.wardBed && (
                                <Badge variant="outline">{patient.barcode.wardBed}</Badge>
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
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={resetScanner} data-testid="button-back-scanner">
            <X className="h-4 w-4 mr-2" />
            Back to Scanner
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{scannedPatient.patient.name}</h1>
            <p className="text-muted-foreground font-mono">{scannedPatient.patient.uhid}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{scannedPatient.scanInfo.role}</Badge>
          <Badge variant={scannedPatient.patient.admissionType === "IPD" ? "default" : "secondary"}>
            {scannedPatient.patient.admissionType}
          </Badge>
          <Badge variant={scannedPatient.patient.status === "active" ? "default" : "secondary"}>
            {scannedPatient.patient.status}
          </Badge>
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
        <TabsList className="inline-flex flex-wrap gap-1">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <User className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          {canSeePrescriptions && (
            <TabsTrigger value="prescriptions" data-testid="tab-prescriptions">
              <Pill className="h-4 w-4 mr-2" />
              Prescription
            </TabsTrigger>
          )}
          {canSeeNursing && (
            <TabsTrigger value="nursing" data-testid="tab-nursing">
              <Stethoscope className="h-4 w-4 mr-2" />
              Nursing
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
          <TabsContent value="nursing" className="mt-4">
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
                    Nursing Notes
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Recent Monitoring Sessions
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
                      <p className="text-sm">No monitoring sessions</p>
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
