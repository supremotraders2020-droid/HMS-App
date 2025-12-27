import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Camera, 
  UserCheck, 
  UserX, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Settings, 
  Activity,
  Users,
  Shield,
  ScanFace,
  Fingerprint,
  Eye,
  RefreshCw,
  Download,
  Search,
  ChevronRight
} from "lucide-react";

declare const faceapi: any;

interface FaceRecognitionStats {
  total: number;
  successful: number;
  failed: number;
  avgConfidence: number;
  activeEmbeddings: number;
  patientEmbeddings: number;
  staffEmbeddings: number;
  pendingDuplicateAlerts: number;
  settings: Record<string, string>;
}

interface RecognitionLog {
  id: string;
  userType: string;
  matchedUserId: string | null;
  confidenceScore: string;
  matchStatus: string;
  location: string;
  purpose: string;
  createdAt: string;
}

interface DuplicateAlert {
  id: string;
  newPatientId: string;
  existingPatientId: string;
  confidenceScore: string;
  alertStatus: string;
  createdAt: string;
}

export default function FaceRecognition() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedFace, setCapturedFace] = useState<string | null>(null);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserType, setSelectedUserType] = useState("PATIENT");
  const [recognitionResult, setRecognitionResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("capture");
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<DuplicateAlert | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");

  const { data: stats, isLoading: statsLoading } = useQuery<FaceRecognitionStats>({
    queryKey: ["/api/face-recognition/stats"],
  });

  const { data: logs } = useQuery<RecognitionLog[]>({
    queryKey: ["/api/face-recognition/logs"],
  });

  const { data: duplicateAlerts } = useQuery<DuplicateAlert[]>({
    queryKey: ["/api/face-recognition/duplicate-alerts"],
  });

  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const consentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/face-recognition/consent", "POST", data);
    },
    onSuccess: () => {
      toast({ title: "Consent recorded successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to record consent", description: error.message, variant: "destructive" });
    },
  });

  const embeddingMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/face-recognition/embeddings", "POST", data);
    },
    onSuccess: () => {
      toast({ title: "Face data saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/face-recognition/stats"] });
      setCapturedFace(null);
      setFaceDescriptor(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to save face data", description: error.message, variant: "destructive" });
    },
  });

  const matchMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/face-recognition/match", "POST", data);
    },
    onSuccess: (result) => {
      setRecognitionResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/face-recognition/logs"] });
    },
    onError: (error: any) => {
      toast({ title: "Recognition failed", description: error.message, variant: "destructive" });
    },
  });

  const attendanceMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/face-recognition/attendance", "POST", data);
    },
    onSuccess: (result) => {
      toast({ 
        title: `Attendance Recorded: ${result.punchType}`, 
        description: `Staff ID: ${result.staffId}, Confidence: ${(result.confidenceScore * 100).toFixed(1)}%` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/face-recognition/stats"] });
    },
    onError: (error: any) => {
      toast({ title: "Attendance failed", description: error.message, variant: "destructive" });
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      return await apiRequest(`/api/face-recognition/duplicate-alerts/${id}/resolve`, "POST", { status, notes });
    },
    onSuccess: () => {
      toast({ title: "Alert resolved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/face-recognition/duplicate-alerts"] });
      setResolveDialogOpen(false);
      setSelectedAlert(null);
      setResolveNotes("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to resolve alert", description: error.message, variant: "destructive" });
    },
  });

  const settingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/face-recognition/settings", "POST", data);
    },
    onSuccess: () => {
      toast({ title: "Setting updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/face-recognition/stats"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update setting", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    const loadModels = async () => {
      try {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/dist/face-api.js';
        script.async = true;
        script.onload = async () => {
          try {
            const modelPath = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/model';
            await (window as any).faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
            await (window as any).faceapi.nets.faceLandmark68Net.loadFromUri(modelPath);
            await (window as any).faceapi.nets.faceRecognitionNet.loadFromUri(modelPath);
            setIsModelLoaded(true);
            toast({ title: "Face recognition models loaded" });
          } catch (modelError) {
            console.error("Error loading face-api models:", modelError);
            toast({ title: "Failed to load face models", description: "Check console for details", variant: "destructive" });
          }
        };
        script.onerror = () => {
          toast({ title: "Failed to load face-api library", variant: "destructive" });
        };
        document.body.appendChild(script);
      } catch (error) {
        console.error("Error loading face-api:", error);
        toast({ title: "Failed to load face recognition models", variant: "destructive" });
      }
    };
    loadModels();
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: "user" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({ title: "Failed to access camera", variant: "destructive" });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCapturing(false);
    }
  }, []);

  const captureFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isModelLoaded) return;
    
    setIsProcessing(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0);
      
      const faceApi = (window as any).faceapi;
      const detection = await faceApi
        .detectSingleFace(video, new faceApi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (detection) {
        setCapturedFace(canvas.toDataURL('image/jpeg', 0.8));
        setFaceDescriptor(Array.from(detection.descriptor));
        toast({ title: "Face captured successfully", description: `Quality: ${(detection.detection.score * 100).toFixed(1)}%` });
      } else {
        toast({ title: "No face detected", description: "Please ensure your face is clearly visible", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error capturing face:", error);
      toast({ title: "Face capture failed", variant: "destructive" });
    }
    setIsProcessing(false);
  }, [isModelLoaded, toast]);

  const handleSaveEmbedding = () => {
    if (!faceDescriptor || !selectedUserId) {
      toast({ title: "Please select a user and capture a face", variant: "destructive" });
      return;
    }
    
    consentMutation.mutate({
      userId: selectedUserId,
      userType: selectedUserType,
      consentStatus: true,
    }, {
      onSuccess: () => {
        embeddingMutation.mutate({
          userId: selectedUserId,
          userType: selectedUserType,
          embeddingVector: faceDescriptor,
          captureLocation: "REGISTRATION",
        });
      },
    });
  };

  const handleRecognition = () => {
    if (!faceDescriptor) {
      toast({ title: "Please capture a face first", variant: "destructive" });
      return;
    }
    
    matchMutation.mutate({
      embeddingVector: faceDescriptor,
      userType: selectedUserType,
      purpose: "VERIFICATION",
      location: "OPD",
    });
  };

  const handleAttendance = () => {
    if (!faceDescriptor) {
      toast({ title: "Please capture a face first", variant: "destructive" });
      return;
    }
    
    attendanceMutation.mutate({
      embeddingVector: faceDescriptor,
      location: "MAIN_GATE",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <ScanFace className="h-8 w-8" />
            Face Recognition System
          </h1>
          <p className="text-muted-foreground mt-1">
            Privacy-compliant identity verification for patients and staff
          </p>
        </div>
        <Badge variant={isModelLoaded ? "default" : "destructive"} className="text-sm">
          {isModelLoaded ? "Models Loaded" : "Loading Models..."}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-total-embeddings">{stats?.activeEmbeddings || 0}</p>
                <p className="text-sm text-muted-foreground">Registered Faces</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-successful">{stats?.successful || 0}</p>
                <p className="text-sm text-muted-foreground">Successful Matches</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-failed">{stats?.failed || 0}</p>
                <p className="text-sm text-muted-foreground">Failed Attempts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-alerts">{stats?.pendingDuplicateAlerts || 0}</p>
                <p className="text-sm text-muted-foreground">Pending Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="capture" className="flex items-center gap-2" data-testid="tab-capture">
            <Camera className="h-4 w-4" /> Capture
          </TabsTrigger>
          <TabsTrigger value="verify" className="flex items-center gap-2" data-testid="tab-verify">
            <UserCheck className="h-4 w-4" /> Verify
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2" data-testid="tab-attendance">
            <Clock className="h-4 w-4" /> Attendance
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2" data-testid="tab-alerts">
            <AlertTriangle className="h-4 w-4" /> Alerts
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2" data-testid="tab-settings">
            <Settings className="h-4 w-4" /> Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="capture" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Face Capture
                </CardTitle>
                <CardDescription>
                  Capture face data for new patient or staff registration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  {!isCapturing && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button onClick={startCamera} disabled={!isModelLoaded} data-testid="button-start-camera">
                        <Camera className="mr-2 h-4 w-4" />
                        Start Camera
                      </Button>
                    </div>
                  )}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <RefreshCw className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={captureFrame} 
                    disabled={!isCapturing || isProcessing}
                    className="flex-1"
                    data-testid="button-capture-face"
                  >
                    <ScanFace className="mr-2 h-4 w-4" />
                    Capture Face
                  </Button>
                  <Button 
                    onClick={stopCamera} 
                    variant="outline"
                    disabled={!isCapturing}
                    data-testid="button-stop-camera"
                  >
                    Stop
                  </Button>
                </div>

                {capturedFace && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-4">
                      <img 
                        src={capturedFace} 
                        alt="Captured face" 
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <Badge variant="secondary" className="mb-2">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Face Captured
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          128-dimensional embedding generated
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5" />
                  Register Face
                </CardTitle>
                <CardDescription>
                  Link captured face to a patient or staff member
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>User Type</Label>
                  <Select value={selectedUserType} onValueChange={setSelectedUserType}>
                    <SelectTrigger data-testid="select-user-type">
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PATIENT">Patient</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="DOCTOR">Doctor</SelectItem>
                      <SelectItem value="NURSE">Nurse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Select User</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger data-testid="select-user">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.filter(u => 
                        selectedUserType === "PATIENT" ? u.role === "PATIENT" :
                        selectedUserType === "DOCTOR" ? u.role === "DOCTOR" :
                        selectedUserType === "NURSE" ? u.role === "NURSE" :
                        !["PATIENT", "ADMIN"].includes(u.role)
                      ).map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.username} ({user.id.slice(-6)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="font-medium">Privacy Notice</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    By registering, consent is given for biometric data storage. 
                    Only encrypted face embeddings are stored, not raw images.
                    Consent can be revoked at any time.
                  </p>
                </div>

                <Button 
                  onClick={handleSaveEmbedding}
                  disabled={!faceDescriptor || !selectedUserId || embeddingMutation.isPending}
                  className="w-full"
                  data-testid="button-save-face"
                >
                  {embeddingMutation.isPending ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Save Face Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="verify" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Face Verification
                </CardTitle>
                <CardDescription>
                  Verify identity using face recognition
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!isCapturing && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button onClick={startCamera} disabled={!isModelLoaded} data-testid="button-verify-start-camera">
                        <Camera className="mr-2 h-4 w-4" />
                        Start Camera
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Search Type</Label>
                  <Select value={selectedUserType} onValueChange={setSelectedUserType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PATIENT">Patient</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={captureFrame}
                    disabled={!isCapturing || isProcessing}
                    className="flex-1"
                    data-testid="button-verify-capture"
                  >
                    <ScanFace className="mr-2 h-4 w-4" />
                    Scan Face
                  </Button>
                  <Button 
                    onClick={handleRecognition}
                    disabled={!faceDescriptor || matchMutation.isPending}
                    variant="secondary"
                    className="flex-1"
                    data-testid="button-verify-match"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Find Match
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recognition Result</CardTitle>
              </CardHeader>
              <CardContent>
                {recognitionResult ? (
                  <div className="space-y-4">
                    <div className={`p-6 rounded-lg text-center ${
                      recognitionResult.matched 
                        ? "bg-green-100 dark:bg-green-900/30" 
                        : "bg-red-100 dark:bg-red-900/30"
                    }`}>
                      {recognitionResult.matched ? (
                        <UserCheck className="h-16 w-16 mx-auto text-green-600 mb-4" />
                      ) : (
                        <UserX className="h-16 w-16 mx-auto text-red-600 mb-4" />
                      )}
                      <h3 className="text-xl font-bold">
                        {recognitionResult.matched ? "Identity Verified" : "No Match Found"}
                      </h3>
                      <p className="text-muted-foreground mt-2">
                        Confidence: {(recognitionResult.confidenceScore * 100).toFixed(1)}%
                      </p>
                    </div>

                    {recognitionResult.matched && (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">User ID</span>
                          <span className="font-mono">{recognitionResult.matchedUserId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">User Type</span>
                          <Badge>{recognitionResult.matchedUserType}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Processing Time</span>
                          <span>{recognitionResult.processingTimeMs}ms</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <ScanFace className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>Scan a face to see results</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Staff Attendance
                </CardTitle>
                <CardDescription>
                  Quick punch in/out using face recognition
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative bg-muted rounded-lg overflow-hidden aspect-video">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!isCapturing && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button onClick={startCamera} disabled={!isModelLoaded} data-testid="button-attendance-start">
                        <Camera className="mr-2 h-4 w-4" />
                        Start Camera
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={captureFrame}
                    disabled={!isCapturing || isProcessing}
                    className="flex-1"
                  >
                    <ScanFace className="mr-2 h-4 w-4" />
                    Scan Face
                  </Button>
                  <Button 
                    onClick={handleAttendance}
                    disabled={!faceDescriptor || attendanceMutation.isPending}
                    variant="default"
                    className="flex-1"
                    data-testid="button-punch-attendance"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Punch In/Out
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                {logs?.filter(l => l.purpose === "ATTENDANCE").slice(0, 10).length ? (
                  <div className="space-y-2">
                    {logs?.filter(l => l.purpose === "ATTENDANCE").slice(0, 10).map(log => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {log.matchStatus === "SUCCESS" ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <div>
                            <p className="font-medium">{log.matchedUserId?.slice(-8) || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={log.matchStatus === "SUCCESS" ? "default" : "destructive"}>
                          {log.matchStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    <p>No attendance records yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Duplicate Patient Alerts
              </CardTitle>
              <CardDescription>
                Review potential duplicate patient registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {duplicateAlerts?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>New Patient</TableHead>
                      <TableHead>Existing Patient</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {duplicateAlerts.map(alert => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-mono">{alert.newPatientId.slice(-8)}</TableCell>
                        <TableCell className="font-mono">{alert.existingPatientId.slice(-8)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {(parseFloat(alert.confidenceScore) * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            alert.alertStatus === "PENDING" ? "default" :
                            alert.alertStatus === "CONFIRMED_DUPLICATE" ? "destructive" :
                            "secondary"
                          }>
                            {alert.alertStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(alert.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {alert.alertStatus === "PENDING" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedAlert(alert);
                                setResolveDialogOpen(true);
                              }}
                              data-testid={`button-resolve-alert-${alert.id}`}
                            >
                              Resolve
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending duplicate alerts</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Recognition Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Recognition Threshold</Label>
                      <p className="text-sm text-muted-foreground">
                        Minimum similarity score for a match (0.0 - 1.0)
                      </p>
                    </div>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0.5" 
                      max="0.99"
                      className="w-24"
                      defaultValue={stats?.settings?.recognition_threshold || "0.78"}
                      onBlur={(e) => {
                        settingsMutation.mutate({
                          key: "recognition_threshold",
                          value: e.target.value,
                          description: "Minimum similarity score for face matching",
                        });
                      }}
                      data-testid="input-threshold"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Duplicate Check Enabled</Label>
                      <p className="text-sm text-muted-foreground">
                        Check for duplicate patients during registration
                      </p>
                    </div>
                    <Switch 
                      defaultChecked={stats?.settings?.duplicate_check_enabled !== "false"}
                      onCheckedChange={(checked) => {
                        settingsMutation.mutate({
                          key: "duplicate_check_enabled",
                          value: checked ? "true" : "false",
                          description: "Enable/disable duplicate patient detection",
                        });
                      }}
                      data-testid="switch-duplicate-check"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Attendance Logging</Label>
                      <p className="text-sm text-muted-foreground">
                        Log all attendance attempts
                      </p>
                    </div>
                    <Switch 
                      defaultChecked={stats?.settings?.attendance_logging !== "false"}
                      onCheckedChange={(checked) => {
                        settingsMutation.mutate({
                          key: "attendance_logging",
                          value: checked ? "true" : "false",
                          description: "Enable/disable attendance logging",
                        });
                      }}
                      data-testid="switch-attendance-logging"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Recognitions</span>
                    <span className="font-bold">{stats?.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="font-bold text-green-600">
                      {stats?.total ? ((stats.successful / stats.total) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Avg Confidence</span>
                    <span className="font-bold">
                      {((stats?.avgConfidence || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Patient Faces</span>
                    <span className="font-bold">{stats?.patientEmbeddings || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Staff Faces</span>
                    <span className="font-bold">{stats?.staffEmbeddings || 0}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Label className="text-sm">Recognition Success Rate</Label>
                  <Progress 
                    value={stats?.total ? (stats.successful / stats.total) * 100 : 0} 
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Recognition Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {logs?.slice(0, 20).length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs?.slice(0, 20).map(log => (
                      <TableRow key={log.id}>
                        <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                        <TableCell><Badge variant="outline">{log.userType}</Badge></TableCell>
                        <TableCell>{log.purpose}</TableCell>
                        <TableCell>
                          <Badge variant={log.matchStatus === "SUCCESS" ? "default" : "destructive"}>
                            {log.matchStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{(parseFloat(log.confidenceScore) * 100).toFixed(1)}%</TableCell>
                        <TableCell>{log.location || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="h-32 flex items-center justify-center text-muted-foreground">
                  <p>No recognition logs yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Duplicate Alert</DialogTitle>
            <DialogDescription>
              Review and resolve this potential duplicate patient case
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Patient ID</span>
                  <span className="font-mono">{selectedAlert.newPatientId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Existing Patient ID</span>
                  <span className="font-mono">{selectedAlert.existingPatientId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Match Confidence</span>
                  <Badge>{(parseFloat(selectedAlert.confidenceScore) * 100).toFixed(1)}%</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Resolution Notes</Label>
                <Textarea 
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Add notes about this resolution..."
                  data-testid="textarea-resolve-notes"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setResolveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedAlert && resolveAlertMutation.mutate({
                id: selectedAlert.id,
                status: "CONFIRMED_DUPLICATE",
                notes: resolveNotes,
              })}
              disabled={resolveAlertMutation.isPending}
              data-testid="button-confirm-duplicate"
            >
              Confirm Duplicate
            </Button>
            <Button 
              onClick={() => selectedAlert && resolveAlertMutation.mutate({
                id: selectedAlert.id,
                status: "FALSE_POSITIVE",
                notes: resolveNotes,
              })}
              disabled={resolveAlertMutation.isPending}
              data-testid="button-false-positive"
            >
              False Positive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
