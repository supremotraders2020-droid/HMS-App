import { useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import {
  FlaskConical,
  Upload,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Users,
  Activity,
  Beaker,
  Plus,
  File,
  Eye,
  Download,
  Calendar,
  Lightbulb,
  TestTubes,
  Filter,
  ChevronsUpDown,
  Check,
  Sparkles,
  Microscope,
  Droplets,
  Heart,
  Brain,
  Pill,
  ChevronDown,
  ChevronRight,
  User,
  Phone,
  MapPin,
  Info,
  Loader2,
} from "lucide-react";

interface PathologyLabPortalProps {
  currentUserId: string;
  currentUserName: string;
}

interface LabTestOrder {
  id: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  testId: string;
  testName: string;
  testCode: string;
  priority: string;
  orderStatus: string;
  clinicalNotes?: string;
  suggestedTest?: string;
  createdAt: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  medicalRecordNumber?: string;
}

interface LabReport {
  id: string;
  reportNumber: string;
  patientId: string;
  patientName: string;
  testName: string;
  reportStatus: string;
  interpretation?: string;
  createdAt: string;
}

interface PathologyLab {
  id: string;
  labName: string;
  labCode: string;
  labType: string;
  isActive: boolean;
}

interface LabTestCatalog {
  id: string;
  testCode: string;
  testName: string;
  testCategory: string;
  sampleType: string;
  description?: string;
  price: string;
  turnaroundTime?: string;
  normalRange?: string;
  instructions?: string;
  isActive: boolean;
}

export default function PathologyLabPortal({ currentUserId, currentUserName }: PathologyLabPortalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending-orders");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LabTestOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [uploadFormData, setUploadFormData] = useState({
    orderId: "",
    patientName: "",
    testName: "",
    resultSummary: "",
    reportDate: new Date().toISOString().split('T')[0],
    remarks: "",
    interpretation: "NORMAL" as "NORMAL" | "ABNORMAL" | "CRITICAL",
  });

  const [reportData, setReportData] = useState({
    testName: "",
    resultValue: "",
    resultUnit: "",
    normalRange: "",
    interpretation: "NORMAL" as "NORMAL" | "ABNORMAL" | "CRITICAL",
    findings: "",
    conclusion: "",
    labTechnicianName: currentUserName,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<LabTestOrder[]>({
    queryKey: ["/api/lab-test-orders"],
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery<LabReport[]>({
    queryKey: ["/api/lab-reports"],
  });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: labs = [] } = useQuery<PathologyLab[]>({
    queryKey: ["/api/pathology-labs"],
  });

  // Fetch lab tests from catalog for Available Tests tab
  const { data: labTestCatalog = [], isLoading: isLoadingLabTests } = useQuery<LabTestCatalog[]>({
    queryKey: ['/api/lab-tests'],
  });

  // State for Available Tests feature
  const [availableTestsSearch, setAvailableTestsSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [availableTestsOpen, setAvailableTestsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedTestDetails, setSelectedTestDetails] = useState<LabTestCatalog | null>(null);
  const [isTestDetailsOpen, setIsTestDetailsOpen] = useState(false);
  
  // State for Walk-in Patient Report
  const [isWalkInReportOpen, setIsWalkInReportOpen] = useState(false);
  const [walkInPatientData, setWalkInPatientData] = useState({
    patientName: '',
    patientAge: '',
    patientGender: 'Male',
    patientPhone: '',
    patientAddress: '',
    referredBy: '',
  });
  const [selectedTestForWalkIn, setSelectedTestForWalkIn] = useState<LabTestCatalog | null>(null);
  const [walkInTestSearch, setWalkInTestSearch] = useState('');
  const [isWalkInTestSelectOpen, setIsWalkInTestSelectOpen] = useState(false);

  // Get unique categories from lab tests
  const testCategories = useMemo(() => {
    const categories = new Set(labTestCatalog.map(test => test.testCategory));
    return ['all', ...Array.from(categories).sort()];
  }, [labTestCatalog]);

  // Filter lab tests by category and search
  const filteredLabTests = useMemo(() => {
    return labTestCatalog.filter(test => {
      const matchesCategory = selectedCategory === 'all' || test.testCategory === selectedCategory;
      const matchesSearch = availableTestsSearch === '' || 
        test.testName.toLowerCase().includes(availableTestsSearch.toLowerCase()) ||
        test.testCode.toLowerCase().includes(availableTestsSearch.toLowerCase());
      return matchesCategory && matchesSearch && test.isActive;
    });
  }, [labTestCatalog, selectedCategory, availableTestsSearch]);

  // Group filtered tests by category for display
  const groupedTests = useMemo(() => {
    const groups: Record<string, LabTestCatalog[]> = {};
    filteredLabTests.forEach(test => {
      if (!groups[test.testCategory]) {
        groups[test.testCategory] = [];
      }
      groups[test.testCategory].push(test);
    });
    return groups;
  }, [filteredLabTests]);

  // Category icon mapping
  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, any> = {
      'HAEMATOLOGY': Droplets,
      'BIOCHEMISTRY': Beaker,
      'SEROLOGY': Heart,
      'MICROBIOLOGY': Microscope,
      'HISTOPATHOLOGY': Microscope,
      'CLINICAL PATHOLOGY': FlaskConical,
      'ENDOCRINOLOGY': Activity,
      'TUMOR MARKERS': Brain,
      'IMMUNOLOGY': Heart,
      'GENETICS': Brain,
    };
    return iconMap[category] || FlaskConical;
  };

  // Category color mapping
  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'HAEMATOLOGY': 'from-red-500/20 to-red-600/10 border-red-500/30',
      'BIOCHEMISTRY': 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
      'SEROLOGY': 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
      'MICROBIOLOGY': 'from-green-500/20 to-green-600/10 border-green-500/30',
      'HISTOPATHOLOGY': 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
      'CLINICAL PATHOLOGY': 'from-teal-500/20 to-teal-600/10 border-teal-500/30',
      'ENDOCRINOLOGY': 'from-pink-500/20 to-pink-600/10 border-pink-500/30',
      'TUMOR MARKERS': 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
      'IMMUNOLOGY': 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30',
      'GENETICS': 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
    };
    return colorMap[category] || 'from-gray-500/20 to-gray-600/10 border-gray-500/30';
  };

  // Toggle category expansion
  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // View test details
  const handleViewTestDetails = (test: LabTestCatalog) => {
    setSelectedTestDetails(test);
    setIsTestDetailsOpen(true);
  };

  // Filter tests for walk-in selection
  const filteredWalkInTests = useMemo(() => {
    if (!walkInTestSearch) return labTestCatalog.filter(t => t.isActive).slice(0, 50);
    return labTestCatalog.filter(test => 
      test.isActive && (
        test.testName.toLowerCase().includes(walkInTestSearch.toLowerCase()) ||
        test.testCode.toLowerCase().includes(walkInTestSearch.toLowerCase())
      )
    ).slice(0, 50);
  }, [labTestCatalog, walkInTestSearch]);

  const uploadReportMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/lab-reports", data);
    },
    onSuccess: () => {
      toast({
        title: "Report Uploaded",
        description: "Lab report has been uploaded successfully. Notifications sent to patient, doctor, and medical staff.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/lab-reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lab-test-orders"] });
      setIsUploadDialogOpen(false);
      setSelectedOrder(null);
      setReportData({
        testName: "",
        resultValue: "",
        resultUnit: "",
        normalRange: "",
        interpretation: "NORMAL",
        findings: "",
        conclusion: "",
        labTechnicianName: currentUserName,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload lab report",
        variant: "destructive",
      });
    },
  });

  const handleUploadReport = () => {
    if (!selectedOrder) return;

    const lab = labs.find(l => l.isActive) || { id: currentUserId, labName: "Hospital Lab", labCode: "HL001" };

    uploadReportMutation.mutate({
      orderId: selectedOrder.id,
      patientId: selectedOrder.patientId,
      patientName: selectedOrder.patientName,
      doctorId: selectedOrder.doctorId,
      doctorName: selectedOrder.doctorName,
      testId: selectedOrder.testId,
      testName: reportData.testName || selectedOrder.testName,
      testCode: selectedOrder.testCode,
      labId: lab.id,
      labName: lab.labName,
      reportStatus: "COMPLETED",
      resultValue: reportData.resultValue,
      resultUnit: reportData.resultUnit,
      normalRange: reportData.normalRange,
      interpretation: reportData.interpretation,
      findings: reportData.findings,
      conclusion: reportData.conclusion,
      labTechnicianName: reportData.labTechnicianName,
      uploadedBy: currentUserId,
      uploadedByName: currentUserName,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF or image file (JPEG, PNG)",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a PDF or image file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!uploadFormData.orderId) {
      toast({
        title: "Order Required",
        description: "Please select a pending order to upload report for",
        variant: "destructive",
      });
      return;
    }

    const selectedOrderData = pendingOrders.find(o => o.id === uploadFormData.orderId);
    if (!selectedOrderData) {
      toast({
        title: "Order Not Found",
        description: "Selected order is no longer pending",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('reportFile', selectedFile);
      formData.append('orderId', uploadFormData.orderId);
      formData.append('orderNumber', selectedOrderData.orderNumber);
      formData.append('patientId', selectedOrderData.patientId);
      formData.append('patientName', selectedOrderData.patientName);
      formData.append('doctorId', selectedOrderData.doctorId);
      formData.append('doctorName', selectedOrderData.doctorName);
      formData.append('testId', selectedOrderData.testId);
      formData.append('testName', uploadFormData.testName || selectedOrderData.testName);
      formData.append('resultSummary', uploadFormData.resultSummary);
      formData.append('reportDate', uploadFormData.reportDate);
      formData.append('remarks', uploadFormData.remarks);
      formData.append('interpretation', uploadFormData.interpretation);

      const response = await fetch('/api/lab-reports/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      toast({
        title: "Report Uploaded Successfully",
        description: "The lab report has been uploaded and notifications sent to patient, doctor, and staff.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/lab-reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lab-test-orders"] });

      setShowUploadForm(false);
      setSelectedFile(null);
      setUploadFormData({
        orderId: "",
        patientName: "",
        testName: "",
        resultSummary: "",
        reportDate: new Date().toISOString().split('T')[0],
        remarks: "",
        interpretation: "NORMAL",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload lab report",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const pendingOrders = orders.filter(o => 
    o.orderStatus !== "COMPLETED" && o.orderStatus !== "CANCELLED"
  );
  const completedOrders = orders.filter(o => o.orderStatus === "COMPLETED");

  // Orders with suggested tests (from doctor recommendations)
  const suggestedTestOrders = orders.filter(o => o.suggestedTest && o.suggestedTest.trim() !== "");

  const filteredPendingOrders = pendingOrders
    .filter(o =>
      o.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.testName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredSuggestedTestOrders = suggestedTestOrders.filter(o =>
    o.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.testName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.suggestedTest?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredReports = reports.filter(r =>
    r.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reportNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.testName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "SAMPLE_COLLECTED":
        return <Badge variant="secondary"><Beaker className="h-3 w-3 mr-1" />Sample Collected</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-blue-500"><Activity className="h-3 w-3 mr-1" />In Progress</Badge>;
      case "COMPLETED":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInterpretationBadge = (interpretation?: string) => {
    switch (interpretation) {
      case "NORMAL":
        return <Badge className="bg-green-500">Normal</Badge>;
      case "ABNORMAL":
        return <Badge className="bg-amber-500">Abnormal</Badge>;
      case "CRITICAL":
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return <Badge variant="destructive">Urgent</Badge>;
      case "STAT":
        return <Badge variant="destructive">STAT</Badge>;
      case "ROUTINE":
        return <Badge variant="secondary">Routine</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="text-page-title">
            <FlaskConical className="h-8 w-8 text-primary" />
            Pathology Lab Portal
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage lab test orders and upload reports
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold" data-testid="text-pending-count">{pendingOrders.length}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Today</p>
                <p className="text-2xl font-bold" data-testid="text-completed-count">
                  {completedOrders.filter(o => 
                    new Date(o.createdAt).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <p className="text-2xl font-bold" data-testid="text-reports-count">{reports.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Alerts</p>
                <p className="text-2xl font-bold" data-testid="text-critical-count">
                  {reports.filter(r => r.interpretation === "CRITICAL").length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient name, order number, or test..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="pending-orders" data-testid="tab-pending-orders">
            <Clock className="h-4 w-4 mr-2" />
            Pending Orders ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="my-reports" data-testid="tab-my-reports">
            <FileText className="h-4 w-4 mr-2" />
            Uploaded Reports ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="available-tests" data-testid="tab-available-tests" className="bg-gradient-to-r from-primary/10 to-primary/5">
            <FlaskConical className="h-4 w-4 mr-2" />
            Available Tests ({labTestCatalog.length})
          </TabsTrigger>
          <TabsTrigger value="suggested-tests" data-testid="tab-suggested-tests">
            <Lightbulb className="h-4 w-4 mr-2" />
            Suggested Tests ({suggestedTestOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending-orders" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Lab Test Orders Awaiting Results</CardTitle>
              <CardDescription>
                Select an order to upload lab report results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
              ) : filteredPendingOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending lab test orders</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Test</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date & Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPendingOrders.map((order) => (
                      <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                        <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {order.patientName}
                          </div>
                        </TableCell>
                        <TableCell>{order.testName}</TableCell>
                        <TableCell>{order.doctorName}</TableCell>
                        <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                        <TableCell>{getStatusBadge(order.orderStatus)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy, HH:mm") : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-reports" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Lab Report
                </CardTitle>
                <CardDescription>
                  Upload a new lab report with PDF/image file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="selectOrder">Select Pending Order *</Label>
                    <Select
                      value={uploadFormData.orderId}
                      onValueChange={(value) => {
                        const order = pendingOrders.find(o => o.id === value);
                        setUploadFormData(prev => ({
                          ...prev,
                          orderId: value,
                          patientName: order?.patientName || "",
                          testName: order?.testName || "",
                        }));
                      }}
                    >
                      <SelectTrigger data-testid="select-pending-order">
                        <SelectValue placeholder="Select a pending order" />
                      </SelectTrigger>
                      <SelectContent>
                        {pendingOrders.length === 0 ? (
                          <SelectItem value="none" disabled>No pending orders</SelectItem>
                        ) : (
                          pendingOrders.map((order) => (
                            <SelectItem key={order.id} value={order.id}>
                              {order.patientName} - {order.testName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {uploadFormData.orderId && (
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      <p><strong>Patient:</strong> {uploadFormData.patientName}</p>
                      <p><strong>Test:</strong> {uploadFormData.testName}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="resultSummary">Result Summary</Label>
                    <Textarea
                      id="resultSummary"
                      value={uploadFormData.resultSummary}
                      onChange={(e) => setUploadFormData(prev => ({ ...prev, resultSummary: e.target.value }))}
                      placeholder="Brief summary of test results..."
                      rows={2}
                      data-testid="textarea-result-summary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reportDate">Report Date</Label>
                    <Input
                      id="reportDate"
                      type="date"
                      value={uploadFormData.reportDate}
                      onChange={(e) => setUploadFormData(prev => ({ ...prev, reportDate: e.target.value }))}
                      data-testid="input-report-date"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="uploadInterpretation">Interpretation</Label>
                    <Select
                      value={uploadFormData.interpretation}
                      onValueChange={(value: "NORMAL" | "ABNORMAL" | "CRITICAL") => 
                        setUploadFormData(prev => ({ ...prev, interpretation: value }))
                      }
                    >
                      <SelectTrigger data-testid="select-upload-interpretation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="ABNORMAL">Abnormal</SelectItem>
                        <SelectItem value="CRITICAL">Critical (Urgent)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea
                      id="remarks"
                      value={uploadFormData.remarks}
                      onChange={(e) => setUploadFormData(prev => ({ ...prev, remarks: e.target.value }))}
                      placeholder="Any additional remarks..."
                      rows={2}
                      data-testid="textarea-remarks"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Report File (PDF/Image) *</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                        className="flex-1"
                        data-testid="input-report-file"
                      />
                    </div>
                    {selectedFile && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <File className="h-4 w-4" />
                        {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleFileUpload}
                    disabled={isUploading || !selectedFile || !uploadFormData.orderId}
                    data-testid="button-upload-file"
                  >
                    {isUploading ? (
                      "Uploading..."
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Report
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Uploaded Lab Reports</CardTitle>
                <CardDescription>
                  View all lab reports uploaded
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading reports...</div>
                ) : filteredReports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No lab reports uploaded yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <ScrollArea className="h-[400px]">
                      <Table className="min-w-[700px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="whitespace-nowrap">Report #</TableHead>
                            <TableHead className="whitespace-nowrap">Patient</TableHead>
                            <TableHead className="whitespace-nowrap">Test</TableHead>
                            <TableHead className="whitespace-nowrap">Status</TableHead>
                            <TableHead className="whitespace-nowrap">Interpretation</TableHead>
                            <TableHead className="whitespace-nowrap">Date</TableHead>
                            <TableHead className="whitespace-nowrap sticky right-0 bg-card">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredReports.map((report: any) => (
                            <TableRow key={report.id} data-testid={`row-report-${report.id}`}>
                              <TableCell className="font-mono text-sm whitespace-nowrap">{report.reportNumber}</TableCell>
                              <TableCell className="whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                                  {report.patientName}
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate" title={report.testName}>{report.testName}</TableCell>
                              <TableCell className="whitespace-nowrap">{getStatusBadge(report.reportStatus)}</TableCell>
                              <TableCell className="whitespace-nowrap">{getInterpretationBadge(report.interpretation)}</TableCell>
                              <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                                {report.createdAt ? format(new Date(report.createdAt), "dd MMM yyyy") : "-"}
                              </TableCell>
                              <TableCell className="sticky right-0 bg-card">
                                {report.pdfUrl && (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => window.open(report.pdfUrl, '_blank')}
                                      title="View Report"
                                      data-testid={`button-view-report-${report.id}`}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = report.pdfUrl;
                                        link.download = `${report.reportNumber}.pdf`;
                                        link.click();
                                      }}
                                      title="Download Report"
                                      data-testid={`button-download-report-${report.id}`}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Available Tests Tab - Modern Card UI */}
        <TabsContent value="available-tests" className="mt-4">
          <div className="space-y-6">
            {/* Header Card with Gradient */}
            <Card className="border-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/20">
                    <FlaskConical className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-500" />
                      Available Tests Catalog
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Browse and search from {labTestCatalog.length}+ laboratory tests synced from the Pathology module
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Filter Controls */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Filter by Category:</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-[220px]" data-testid="select-available-test-category">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        {testCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category === 'all' ? 'All Categories' : category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1 min-w-[250px]">
                    <Popover open={availableTestsOpen} onOpenChange={setAvailableTestsOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={availableTestsOpen}
                          className="w-full justify-between h-10"
                          data-testid="button-available-tests-dropdown"
                          disabled={isLoadingLabTests}
                        >
                          {isLoadingLabTests ? (
                            <span className="flex items-center gap-2">
                              <Clock className="h-4 w-4 animate-spin" />
                              Loading tests...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Search className="h-4 w-4" />
                              Search tests by name or code...
                            </span>
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="Search tests by name or code..." 
                            value={availableTestsSearch}
                            onValueChange={setAvailableTestsSearch}
                            data-testid="input-available-tests-search"
                          />
                          <CommandList className="max-h-[350px]">
                            <CommandEmpty>No tests found. Try a different search.</CommandEmpty>
                            {Object.entries(groupedTests).slice(0, 10).map(([category, tests]) => (
                              <CommandGroup key={category} heading={category}>
                                {tests.slice(0, 10).map((test) => {
                                  const CategoryIcon = getCategoryIcon(category);
                                  return (
                                    <CommandItem
                                      key={test.id}
                                      value={test.testName}
                                      onSelect={() => setAvailableTestsOpen(false)}
                                      data-testid={`option-available-test-${test.testCode}`}
                                      className="cursor-pointer"
                                    >
                                      <CategoryIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                      <div className="flex flex-col flex-1">
                                        <span className="font-medium">{test.testName}</span>
                                        <span className="text-xs text-muted-foreground">{test.testCode} - {test.sampleType}</span>
                                      </div>
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        {test.price}
                                      </Badge>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2">
              <Button onClick={() => setIsWalkInReportOpen(true)} data-testid="button-walk-in-report">
                <Plus className="h-4 w-4 mr-2" />
                Create Walk-in Patient Report
              </Button>
            </div>

            {/* Tests Grid Display - All Departments */}
            <div className="space-y-4">
              {isLoadingLabTests ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
                    <p className="text-muted-foreground">Loading available tests...</p>
                  </CardContent>
                </Card>
              ) : Object.keys(groupedTests).length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No tests found matching your criteria</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2" 
                      onClick={() => {
                        setSelectedCategory('all');
                        setAvailableTestsSearch('');
                      }}
                      data-testid="button-clear-filters"
                    >
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                Object.entries(groupedTests).map(([category, tests]) => {
                  const CategoryIcon = getCategoryIcon(category);
                  const categoryColor = getCategoryColor(category);
                  const isExpanded = expandedCategories.has(category);
                  return (
                    <Card key={category} className={`border bg-gradient-to-r ${categoryColor} transition-all duration-200`}>
                      <CardHeader 
                        className="pb-3 cursor-pointer hover-elevate"
                        onClick={() => toggleCategoryExpansion(category)}
                        data-testid={`category-header-${category.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-background/80">
                              <CategoryIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{category}</CardTitle>
                              <CardDescription>{tests.length} tests available</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{tests.length} Tests</Badge>
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      {isExpanded && (
                        <CardContent>
                          <ScrollArea className="max-h-[400px]">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {tests.map((test) => (
                                <div
                                  key={test.id}
                                  className="p-3 rounded-lg bg-background/60 border border-border/50 hover:bg-background/80 hover:border-primary/30 transition-all duration-150 cursor-pointer"
                                  onClick={() => handleViewTestDetails(test)}
                                  data-testid={`card-test-${test.testCode}`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate" title={test.testName}>
                                        {test.testName}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        <span className="font-mono">{test.testCode}</span> • {test.sampleType}
                                      </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <Badge variant="outline" className="text-xs shrink-0">
                                        Rs. {test.price}
                                      </Badge>
                                      <Eye className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      )}
                    </Card>
                  );
                })
              )}
            </div>

            {/* Summary Stats */}
            <Card className="mt-4">
              <CardContent className="py-4">
                <div className="flex items-center justify-center gap-8 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{labTestCatalog.filter(t => t.isActive).length}</p>
                    <p className="text-muted-foreground">Total Tests</p>
                  </div>
                  <Separator orientation="vertical" className="h-10" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{Object.keys(groupedTests).length}</p>
                    <p className="text-muted-foreground">Departments</p>
                  </div>
                  <Separator orientation="vertical" className="h-10" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{filteredLabTests.length}</p>
                    <p className="text-muted-foreground">Filtered Results</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Suggested Tests Tab - Enhanced Card UI */}
        <TabsContent value="suggested-tests" className="mt-4">
          <div className="space-y-6">
            {/* Header Card with Gradient */}
            <Card className="border-0 bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-transparent">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-yellow-500/20">
                    <Lightbulb className="h-8 w-8 text-yellow-500" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      Suggested Tests from Doctors
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Tests recommended by doctors for additional diagnosis. These suggestions accompany lab orders to provide context for potential follow-up testing.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardContent className="pt-6">
                {ordersLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
                    <p>Loading suggested tests...</p>
                  </div>
                ) : filteredSuggestedTestOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 rounded-full bg-yellow-500/10 w-fit mx-auto mb-4">
                      <Lightbulb className="h-12 w-12 text-yellow-500/50" />
                    </div>
                    <p className="text-lg font-medium text-muted-foreground">No suggested tests from doctors</p>
                    <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                      When doctors order lab tests, they can suggest additional tests that will appear here for follow-up.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredSuggestedTestOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-4 rounded-lg border bg-gradient-to-r from-yellow-500/5 to-transparent hover:from-yellow-500/10 transition-all duration-200"
                        data-testid={`card-suggested-${order.id}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-yellow-500/20">
                              <Lightbulb className="h-5 w-5 text-yellow-500" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-sm text-muted-foreground">{order.orderNumber}</span>
                                {getStatusBadge(order.orderStatus)}
                              </div>
                              <p className="font-semibold text-primary text-lg">{order.suggestedTest}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {order.patientName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Beaker className="h-3 w-3" />
                                  Ordered: {order.testName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy") : "-"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Recommended by</p>
                            <p className="font-medium">{order.doctorName}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Test Details Dialog */}
      <Dialog open={isTestDetailsOpen} onOpenChange={setIsTestDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              Test Details
            </DialogTitle>
            <DialogDescription>
              Complete information about the selected test
            </DialogDescription>
          </DialogHeader>
          {selectedTestDetails && (
            <div className="space-y-6">
              <div className="bg-primary/5 p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold">{selectedTestDetails.testName}</h3>
                  <Badge variant="outline" className="font-mono">{selectedTestDetails.testCode}</Badge>
                </div>
                <Badge className="bg-primary/20 text-primary">{selectedTestDetails.testCategory}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Droplets className="h-3 w-3" />
                    Sample Type
                  </Label>
                  <p className="font-medium">{selectedTestDetails.sampleType}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Turnaround Time
                  </Label>
                  <p className="font-medium">{selectedTestDetails.turnaroundTime || 'Not specified'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Price</Label>
                  <p className="font-medium text-lg text-primary">Rs. {selectedTestDetails.price}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={selectedTestDetails.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {selectedTestDetails.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              {selectedTestDetails.normalRange && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Normal Range / Reference Values</Label>
                  <p className="bg-muted/50 p-3 rounded-lg text-sm">{selectedTestDetails.normalRange}</p>
                </div>
              )}

              {selectedTestDetails.description && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="bg-muted/50 p-3 rounded-lg text-sm">{selectedTestDetails.description}</p>
                </div>
              )}

              {selectedTestDetails.instructions && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Patient Instructions
                  </Label>
                  <p className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg text-sm">
                    {selectedTestDetails.instructions}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsTestDetailsOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setSelectedTestForWalkIn(selectedTestDetails);
                  setIsTestDetailsOpen(false);
                  setIsWalkInReportOpen(true);
                }} data-testid="button-create-report-from-details">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Report for Walk-in Patient
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Walk-in Patient Report Dialog */}
      <Dialog open={isWalkInReportOpen} onOpenChange={setIsWalkInReportOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Create Walk-in Patient Report
            </DialogTitle>
            <DialogDescription>
              Create a lab report for a walk-in patient (not registered in the system)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Patient Information */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2 text-lg">
                <User className="h-4 w-4" />
                Patient Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="walkInPatientName">Patient Name *</Label>
                  <Input
                    id="walkInPatientName"
                    value={walkInPatientData.patientName}
                    onChange={(e) => setWalkInPatientData({ ...walkInPatientData, patientName: e.target.value })}
                    placeholder="Enter patient name"
                    data-testid="input-walkin-patient-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="walkInPatientAge">Age *</Label>
                  <Input
                    id="walkInPatientAge"
                    value={walkInPatientData.patientAge}
                    onChange={(e) => setWalkInPatientData({ ...walkInPatientData, patientAge: e.target.value })}
                    placeholder="e.g., 35 Years"
                    data-testid="input-walkin-patient-age"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="walkInPatientGender">Gender *</Label>
                  <Select 
                    value={walkInPatientData.patientGender} 
                    onValueChange={(v) => setWalkInPatientData({ ...walkInPatientData, patientGender: v })}
                  >
                    <SelectTrigger data-testid="select-walkin-gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="walkInPatientPhone">Phone Number</Label>
                  <Input
                    id="walkInPatientPhone"
                    value={walkInPatientData.patientPhone}
                    onChange={(e) => setWalkInPatientData({ ...walkInPatientData, patientPhone: e.target.value })}
                    placeholder="Enter phone number"
                    data-testid="input-walkin-patient-phone"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="walkInPatientAddress">Address</Label>
                  <Input
                    id="walkInPatientAddress"
                    value={walkInPatientData.patientAddress}
                    onChange={(e) => setWalkInPatientData({ ...walkInPatientData, patientAddress: e.target.value })}
                    placeholder="Enter patient address"
                    data-testid="input-walkin-patient-address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="walkInReferredBy">Referred By (Doctor/Self)</Label>
                  <Input
                    id="walkInReferredBy"
                    value={walkInPatientData.referredBy}
                    onChange={(e) => setWalkInPatientData({ ...walkInPatientData, referredBy: e.target.value })}
                    placeholder="e.g., Dr. Smith or Self"
                    data-testid="input-walkin-referred-by"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Test Selection */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2 text-lg">
                <FlaskConical className="h-4 w-4" />
                Select Test *
              </h4>
              {selectedTestForWalkIn ? (
                <div className="p-4 border rounded-lg bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{selectedTestForWalkIn.testName}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedTestForWalkIn.testCode} • {selectedTestForWalkIn.sampleType} • Rs. {selectedTestForWalkIn.price}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTestForWalkIn(null)}>
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <Popover open={isWalkInTestSelectOpen} onOpenChange={setIsWalkInTestSelectOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between" data-testid="button-select-walkin-test">
                      <span className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Search and select a test...
                      </span>
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search tests by name or code..."
                        value={walkInTestSearch}
                        onValueChange={setWalkInTestSearch}
                        data-testid="input-search-walkin-test"
                      />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty>No tests found.</CommandEmpty>
                        <CommandGroup heading="Available Tests">
                          {filteredWalkInTests.map((test) => {
                            const CategoryIcon = getCategoryIcon(test.testCategory);
                            return (
                              <CommandItem
                                key={test.id}
                                value={test.testName}
                                onSelect={() => {
                                  setSelectedTestForWalkIn(test);
                                  setIsWalkInTestSelectOpen(false);
                                  setWalkInTestSearch('');
                                }}
                                className="cursor-pointer"
                                data-testid={`option-walkin-test-${test.testCode}`}
                              >
                                <CategoryIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                <div className="flex flex-col flex-1">
                                  <span className="font-medium">{test.testName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {test.testCode} • {test.testCategory} • {test.sampleType}
                                  </span>
                                </div>
                                <Badge variant="outline" className="ml-2">Rs. {test.price}</Badge>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <Separator />

            {/* Report Details */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2 text-lg">
                <FileText className="h-4 w-4" />
                Report Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="walkInResultValue">Result Value *</Label>
                  <Input
                    id="walkInResultValue"
                    value={reportData.resultValue}
                    onChange={(e) => setReportData({ ...reportData, resultValue: e.target.value })}
                    placeholder="Enter result value"
                    data-testid="input-walkin-result-value"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="walkInResultUnit">Unit</Label>
                  <Input
                    id="walkInResultUnit"
                    value={reportData.resultUnit}
                    onChange={(e) => setReportData({ ...reportData, resultUnit: e.target.value })}
                    placeholder="e.g., mg/dL, cells/μL"
                    data-testid="input-walkin-result-unit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="walkInNormalRange">Normal Range</Label>
                  <Input
                    id="walkInNormalRange"
                    value={reportData.normalRange}
                    onChange={(e) => setReportData({ ...reportData, normalRange: e.target.value })}
                    placeholder="e.g., 70-100"
                    data-testid="input-walkin-normal-range"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="walkInInterpretation">Interpretation *</Label>
                  <Select 
                    value={reportData.interpretation} 
                    onValueChange={(v) => setReportData({ ...reportData, interpretation: v as any })}
                  >
                    <SelectTrigger data-testid="select-walkin-interpretation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="ABNORMAL">Abnormal</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="walkInFindings">Findings</Label>
                  <Textarea
                    id="walkInFindings"
                    value={reportData.findings}
                    onChange={(e) => setReportData({ ...reportData, findings: e.target.value })}
                    placeholder="Enter detailed findings..."
                    rows={3}
                    data-testid="textarea-walkin-findings"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="walkInConclusion">Conclusion</Label>
                  <Textarea
                    id="walkInConclusion"
                    value={reportData.conclusion}
                    onChange={(e) => setReportData({ ...reportData, conclusion: e.target.value })}
                    placeholder="Enter conclusion..."
                    rows={2}
                    data-testid="textarea-walkin-conclusion"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => {
              setIsWalkInReportOpen(false);
              setSelectedTestForWalkIn(null);
              setWalkInPatientData({
                patientName: '',
                patientAge: '',
                patientGender: 'Male',
                patientPhone: '',
                patientAddress: '',
                referredBy: '',
              });
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!walkInPatientData.patientName || !walkInPatientData.patientAge || !selectedTestForWalkIn || !reportData.resultValue) {
                  toast({
                    title: "Missing Information",
                    description: "Please fill in all required fields (Patient Name, Age, Test, and Result Value)",
                    variant: "destructive",
                  });
                  return;
                }

                const lab = labs.find(l => l.isActive) || { id: currentUserId, labName: "Hospital Lab", labCode: "HL001" };

                uploadReportMutation.mutate({
                  patientId: `WALKIN-${Date.now()}`,
                  patientName: walkInPatientData.patientName,
                  patientAge: walkInPatientData.patientAge,
                  patientGender: walkInPatientData.patientGender,
                  patientPhone: walkInPatientData.patientPhone,
                  patientAddress: walkInPatientData.patientAddress,
                  referredBy: walkInPatientData.referredBy || 'Self',
                  isWalkIn: true,
                  testId: selectedTestForWalkIn.id,
                  testName: selectedTestForWalkIn.testName,
                  testCode: selectedTestForWalkIn.testCode,
                  testCategory: selectedTestForWalkIn.testCategory,
                  sampleType: selectedTestForWalkIn.sampleType,
                  labId: lab.id,
                  labName: lab.labName,
                  reportStatus: "COMPLETED",
                  resultValue: reportData.resultValue,
                  resultUnit: reportData.resultUnit,
                  normalRange: reportData.normalRange || selectedTestForWalkIn.normalRange || '',
                  interpretation: reportData.interpretation,
                  findings: reportData.findings,
                  conclusion: reportData.conclusion,
                  labTechnicianName: currentUserName,
                  uploadedBy: currentUserId,
                  uploadedByName: currentUserName,
                });

                setIsWalkInReportOpen(false);
                setSelectedTestForWalkIn(null);
                setWalkInPatientData({
                  patientName: '',
                  patientAge: '',
                  patientGender: 'Male',
                  patientPhone: '',
                  patientAddress: '',
                  referredBy: '',
                });
                setReportData({
                  testName: "",
                  resultValue: "",
                  resultUnit: "",
                  normalRange: "",
                  interpretation: "NORMAL",
                  findings: "",
                  conclusion: "",
                  labTechnicianName: currentUserName,
                });
              }}
              disabled={uploadReportMutation.isPending}
              data-testid="button-submit-walkin-report"
            >
              {uploadReportMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Report...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Report
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
