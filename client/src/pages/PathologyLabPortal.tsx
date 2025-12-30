import { useState, useRef } from "react";
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

  const filteredPendingOrders = pendingOrders.filter(o =>
    o.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.testName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSuggestedTestOrders = suggestedTestOrders.filter(o =>
    o.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.testName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.suggestedTest?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <TabsList>
          <TabsTrigger value="pending-orders" data-testid="tab-pending-orders">
            <Clock className="h-4 w-4 mr-2" />
            Pending Orders ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="my-reports" data-testid="tab-my-reports">
            <FileText className="h-4 w-4 mr-2" />
            Uploaded Reports ({reports.length})
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
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
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
                          {order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          <Dialog open={isUploadDialogOpen && selectedOrder?.id === order.id} onOpenChange={(open) => {
                            setIsUploadDialogOpen(open);
                            if (open) {
                              setSelectedOrder(order);
                              setReportData(prev => ({
                                ...prev,
                                testName: order.testName,
                              }));
                            } else {
                              setSelectedOrder(null);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button size="sm" data-testid={`button-upload-${order.id}`}>
                                <Upload className="h-4 w-4 mr-1" />
                                Upload Report
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <FlaskConical className="h-5 w-5" />
                                  Upload Lab Report
                                </DialogTitle>
                                <DialogDescription>
                                  Enter lab test results for {order.patientName} - {order.testName}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Patient</p>
                                    <p className="font-medium">{order.patientName}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Order Number</p>
                                    <p className="font-mono">{order.orderNumber}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Test</p>
                                    <p className="font-medium">{order.testName}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Referring Doctor</p>
                                    <p className="font-medium">{order.doctorName}</p>
                                  </div>
                                  {order.suggestedTest && (
                                    <div className="col-span-2">
                                      <p className="text-sm text-muted-foreground">Suggested Test</p>
                                      <p className="font-medium text-primary">{order.suggestedTest}</p>
                                    </div>
                                  )}
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="resultValue">Result Value</Label>
                                    <Input
                                      id="resultValue"
                                      value={reportData.resultValue}
                                      onChange={(e) => setReportData(prev => ({ ...prev, resultValue: e.target.value }))}
                                      placeholder="e.g., 120"
                                      data-testid="input-result-value"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="resultUnit">Unit</Label>
                                    <Input
                                      id="resultUnit"
                                      value={reportData.resultUnit}
                                      onChange={(e) => setReportData(prev => ({ ...prev, resultUnit: e.target.value }))}
                                      placeholder="e.g., mg/dL"
                                      data-testid="input-result-unit"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="normalRange">Normal Range</Label>
                                    <Input
                                      id="normalRange"
                                      value={reportData.normalRange}
                                      onChange={(e) => setReportData(prev => ({ ...prev, normalRange: e.target.value }))}
                                      placeholder="e.g., 70-100"
                                      data-testid="input-normal-range"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="interpretation">Interpretation</Label>
                                  <Select
                                    value={reportData.interpretation}
                                    onValueChange={(value: "NORMAL" | "ABNORMAL" | "CRITICAL") => 
                                      setReportData(prev => ({ ...prev, interpretation: value }))
                                    }
                                  >
                                    <SelectTrigger data-testid="select-interpretation">
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
                                  <Label htmlFor="findings">Findings</Label>
                                  <Textarea
                                    id="findings"
                                    value={reportData.findings}
                                    onChange={(e) => setReportData(prev => ({ ...prev, findings: e.target.value }))}
                                    placeholder="Enter detailed findings..."
                                    rows={3}
                                    data-testid="textarea-findings"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="conclusion">Conclusion</Label>
                                  <Textarea
                                    id="conclusion"
                                    value={reportData.conclusion}
                                    onChange={(e) => setReportData(prev => ({ ...prev, conclusion: e.target.value }))}
                                    placeholder="Enter conclusion and recommendations..."
                                    rows={2}
                                    data-testid="textarea-conclusion"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="technicianName">Lab Technician</Label>
                                  <Input
                                    id="technicianName"
                                    value={reportData.labTechnicianName}
                                    onChange={(e) => setReportData(prev => ({ ...prev, labTechnicianName: e.target.value }))}
                                    data-testid="input-technician-name"
                                  />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setIsUploadDialogOpen(false);
                                      setSelectedOrder(null);
                                    }}
                                    data-testid="button-cancel"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleUploadReport}
                                    disabled={uploadReportMutation.isPending || !reportData.resultValue}
                                    data-testid="button-submit-report"
                                  >
                                    {uploadReportMutation.isPending ? (
                                      "Uploading..."
                                    ) : (
                                      <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload Report
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
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
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Report #</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Test</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Interpretation</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReports.map((report: any) => (
                          <TableRow key={report.id} data-testid={`row-report-${report.id}`}>
                            <TableCell className="font-mono text-sm">{report.reportNumber}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                {report.patientName}
                              </div>
                            </TableCell>
                            <TableCell>{report.testName}</TableCell>
                            <TableCell>{getStatusBadge(report.reportStatus)}</TableCell>
                            <TableCell>{getInterpretationBadge(report.interpretation)}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {report.createdAt ? format(new Date(report.createdAt), "dd MMM yyyy") : "-"}
                            </TableCell>
                            <TableCell>
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
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suggested-tests" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Suggested Tests from Doctors
              </CardTitle>
              <CardDescription>
                Tests recommended by doctors for additional diagnosis. These suggestions accompany lab orders to provide context for potential follow-up testing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading suggested tests...</div>
              ) : filteredSuggestedTestOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No suggested tests from doctors</p>
                  <p className="text-sm mt-2">When doctors order lab tests, they can suggest additional tests that appear here.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Ordered Test</TableHead>
                      <TableHead>Suggested Test</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuggestedTestOrders.map((order) => (
                      <TableRow key={order.id} data-testid={`row-suggested-${order.id}`}>
                        <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {order.patientName}
                          </div>
                        </TableCell>
                        <TableCell>{order.testName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium text-primary">{order.suggestedTest}</span>
                          </div>
                        </TableCell>
                        <TableCell>{order.doctorName}</TableCell>
                        <TableCell>{getStatusBadge(order.orderStatus)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy") : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
