import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  Plus,
  History,
  Shield,
  X,
  Loader2
} from "lucide-react";

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

export default function PatientBarcodePage() {
  const { toast } = useToast();
  const [uhidInput, setUhidInput] = useState("");
  const [scannedPatient, setScannedPatient] = useState<PatientData | null>(null);
  const [showScanner, setShowScanner] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const scanMutation = useMutation({
    mutationFn: async (uhid: string) => {
      const response = await apiRequest("POST", "/api/barcode/scan", { uhid });
      return response.json();
    },
    onSuccess: (data) => {
      setScannedPatient(data);
      setShowScanner(false);
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

  const { data: allBarcodes } = useQuery<any[]>({
    queryKey: ["/api/barcodes"],
    enabled: showScanner,
  });

  const handleScan = () => {
    if (!uhidInput.trim()) {
      toast({
        title: "Enter UHID",
        description: "Please enter a valid UHID to scan",
        variant: "destructive",
      });
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

              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <QrCode className="h-16 w-16 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Position the patient's wristband barcode in front of the camera
                  <br />
                  or manually enter the UHID above
                </p>
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Active Patient Barcodes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {allBarcodes && allBarcodes.length > 0 ? (
                  <div className="space-y-2">
                    {allBarcodes.filter(b => b.isActive).map((barcode) => (
                      <div
                        key={barcode.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover-elevate cursor-pointer"
                        onClick={() => handleQuickScan(barcode.uhid)}
                        data-testid={`barcode-item-${barcode.uhid}`}
                      >
                        <div className="flex items-center gap-3">
                          <QrCode className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{barcode.patientName}</p>
                            <p className="text-sm text-muted-foreground font-mono">{barcode.uhid}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={barcode.admissionType === "IPD" ? "default" : "secondary"}>
                            {barcode.admissionType}
                          </Badge>
                          {barcode.wardBed && (
                            <Badge variant="outline">{barcode.wardBed}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <QrCode className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No active patient barcodes</p>
                    <p className="text-sm">Barcodes are generated on patient admission</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!scannedPatient) return null;

  const drugAllergies = parseAllergies(scannedPatient.allergies?.drugAllergies);
  const foodAllergies = parseAllergies(scannedPatient.allergies?.foodAllergies);
  const hasAllergies = drugAllergies.length > 0 || foodAllergies.length > 0;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
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
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <User className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="vitals" data-testid="tab-vitals">
            <Activity className="h-4 w-4 mr-2" />
            Vitals
          </TabsTrigger>
          <TabsTrigger value="prescriptions" data-testid="tab-prescriptions">
            <Pill className="h-4 w-4 mr-2" />
            Prescriptions
          </TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
          {scannedPatient.billing && (
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

        <TabsContent value="vitals" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Vital Signs History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scannedPatient.vitals ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4 text-center">
                    <Heart className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    <div className="text-3xl font-bold">{scannedPatient.vitals.heartRate || "—"}</div>
                    <div className="text-sm text-muted-foreground">Heart Rate (bpm)</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <Droplets className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <div className="text-3xl font-bold">
                      {scannedPatient.vitals.systolicBp || "—"}/{scannedPatient.vitals.diastolicBp || "—"}
                    </div>
                    <div className="text-sm text-muted-foreground">Blood Pressure (mmHg)</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <Thermometer className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                    <div className="text-3xl font-bold">{scannedPatient.vitals.temperature || "—"}°F</div>
                    <div className="text-sm text-muted-foreground">Temperature</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <Wind className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <div className="text-3xl font-bold">{scannedPatient.vitals.spo2 || "—"}%</div>
                    <div className="text-sm text-muted-foreground">SpO2</div>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No vitals recorded for this patient</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                      <div className="flex items-center justify-between mb-2">
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

        <TabsContent value="reports" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Reports & Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Lab reports and documents will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {scannedPatient.billing && (
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
                        <div className="flex items-center justify-between">
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
