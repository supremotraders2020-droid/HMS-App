import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Upload, 
  Download, 
  FileText, 
  Bell, 
  User, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  Send,
  Stethoscope,
  Activity,
  RefreshCw,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { HOSPITAL_DEPARTMENTS } from "@shared/schema";

interface TechnicianPortalProps {
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
}

interface PendingTest {
  id: string;
  patientId: string;
  patientName: string;
  testName: string;
  testType: string;
  department: string;
  orderedBy: string;
  orderedDate: string;
  priority: "ROUTINE" | "URGENT" | "STAT";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  notes?: string;
}

interface TechnicianReport {
  id: string;
  patientId: string;
  patientName: string;
  testName: string;
  department: string;
  technicianId: string;
  technicianName: string;
  reportDate: string;
  findings?: string;
  recommendations?: string;
  fileName?: string;
  fileData?: string;
  attachmentUrl?: string;
  status: "DRAFT" | "SUBMITTED" | "VERIFIED";
  createdAt: string;
}

const TECHNICIAN_DEPARTMENTS = [
  "Radiology",
  "Pathology",
  "Cardiology",
  "Neurology",
  "Pulmonology",
  "Gastroenterology",
  "Orthopedics",
  "Emergency",
  "ICU"
] as const;

const TEST_TYPES = [
  { value: "MRI", label: "MRI Scan", department: "Radiology" },
  { value: "CT", label: "CT Scan", department: "Radiology" },
  { value: "X-RAY", label: "X-Ray", department: "Radiology" },
  { value: "ULTRASOUND", label: "Ultrasound/Sonography", department: "Radiology" },
  { value: "ECG", label: "ECG/EKG", department: "Cardiology" },
  { value: "ECHO", label: "Echocardiogram", department: "Cardiology" },
  { value: "EEG", label: "EEG", department: "Neurology" },
  { value: "EMG", label: "EMG", department: "Neurology" },
  { value: "PFT", label: "Pulmonary Function Test", department: "Pulmonology" },
  { value: "ENDOSCOPY", label: "Endoscopy", department: "Gastroenterology" },
  { value: "COLONOSCOPY", label: "Colonoscopy", department: "Gastroenterology" },
  { value: "DEXA", label: "DEXA Bone Scan", department: "Orthopedics" },
];

export default function TechnicianPortal({ currentUserId, currentUserName, currentUserRole }: TechnicianPortalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTest, setSelectedTest] = useState<PendingTest | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isViewReportDialogOpen, setIsViewReportDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<TechnicianReport | null>(null);
  
  const [reportForm, setReportForm] = useState({
    findings: "",
    recommendations: "",
    attachmentFile: null as File | null
  });

  const { data: pendingTests = [], isLoading: testsLoading } = useQuery<PendingTest[]>({
    queryKey: ["/api/technician/pending-tests"],
  });

  const { data: submittedReports = [], isLoading: reportsLoading } = useQuery<TechnicianReport[]>({
    queryKey: ["/api/technician/reports", currentUserId],
  });

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<any[]>({
    queryKey: ["/api/technician/notifications", currentUserId],
  });

  const submitReportMutation = useMutation({
    mutationFn: async (data: { 
      testOrderId: string; 
      findings: string;
      recommendations: string;
      fileName?: string;
      fileType?: string;
      fileData?: string;
      technicianId: string;
      technicianName: string;
    }) => {
      const response = await apiRequest("POST", "/api/technician/submit-report", data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Report Submitted",
        description: "Report has been submitted successfully. Notifications sent to patient, doctor, and admin.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/technician/pending-tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/technician/reports"] });
      setIsUploadDialogOpen(false);
      setSelectedTest(null);
      setReportForm({ findings: "", recommendations: "", attachmentFile: null });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredTests = pendingTests.filter(test => {
    const matchesSearch = test.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.testName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "all" || test.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleUploadReport = (test: PendingTest) => {
    setSelectedTest(test);
    setIsUploadDialogOpen(true);
  };

  const handleDownloadReport = (report: any) => {
    if (report.fileData && report.fileName) {
      const link = document.createElement('a');
      link.href = report.fileData;
      link.download = report.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Download started", description: `Downloading ${report.fileName}` });
    } else {
      toast({ 
        title: "No file attached", 
        description: "This report does not have an attached file to download.",
        variant: "destructive" 
      });
    }
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleSubmitReport = async () => {
    if (!selectedTest) return;
    if (!reportForm.attachmentFile) {
      toast({
        title: "Missing Report File",
        description: "Please attach a report file (PDF, JPEG, PNG, or DICOM).",
        variant: "destructive",
      });
      return;
    }

    if (reportForm.attachmentFile.size > MAX_FILE_SIZE) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 10MB. Please choose a smaller file.",
        variant: "destructive",
      });
      return;
    }

    let fileData: string | undefined;
    let fileName: string | undefined;
    let fileType: string | undefined;

    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(reportForm.attachmentFile!);
    });
    fileData = await base64Promise;
    fileName = reportForm.attachmentFile.name;
    fileType = reportForm.attachmentFile.type;

    submitReportMutation.mutate({
      testOrderId: selectedTest.id,
      findings: reportForm.findings,
      recommendations: reportForm.recommendations,
      fileName,
      fileType,
      fileData,
      technicianId: currentUserId,
      technicianName: currentUserName
    });
  };

  const handleViewReport = (report: TechnicianReport) => {
    setSelectedReport(report);
    setIsViewReportDialogOpen(true);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "STAT":
        return <Badge className="bg-red-500 hover:bg-red-600">STAT</Badge>;
      case "URGENT":
        return <Badge className="bg-orange-500 hover:bg-orange-600">Urgent</Badge>;
      default:
        return <Badge variant="secondary">Routine</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-blue-500 hover:bg-blue-600"><Clock className="w-3 h-3 mr-1" /> In Progress</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  const pendingCount = pendingTests.filter(t => t.status === "PENDING").length;
  const inProgressCount = pendingTests.filter(t => t.status === "IN_PROGRESS").length;
  const completedToday = submittedReports.filter(r => {
    const reportDate = new Date(r.createdAt);
    const today = new Date();
    return reportDate.toDateString() === today.toDateString();
  }).length;

  if (testsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Activity className="w-8 h-8 text-primary" />
            Technician Portal
          </h1>
          <p className="text-muted-foreground">Welcome, {currentUserName} - Manage diagnostic tests and reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Tests</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500" data-testid="text-pending-count">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500" data-testid="text-inprogress-count">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">Currently working</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500" data-testid="text-completed-count">{completedToday}</div>
            <p className="text-xs text-muted-foreground">Reports submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-notifications-count">{notifications.length}</div>
            <p className="text-xs text-muted-foreground">New alerts</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="pending" data-testid="tab-pending">Upcoming Tests</TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">Submitted Reports</TabsTrigger>
          <TabsTrigger value="scans" data-testid="tab-scans">Scan Catalog</TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by patient name or test..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                    data-testid="input-search"
                  />
                </div>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-[180px]" data-testid="select-department">
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {TECHNICIAN_DEPARTMENTS.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Test</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Ordered By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No pending tests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTests.map((test) => (
                      <TableRow key={test.id} data-testid={`row-test-${test.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{test.patientName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{test.testName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{test.department}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Stethoscope className="w-3 h-3" />
                            {test.orderedBy}
                          </div>
                        </TableCell>
                        <TableCell>{test.orderedDate}</TableCell>
                        <TableCell>{getPriorityBadge(test.priority)}</TableCell>
                        <TableCell>{getStatusBadge(test.status)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleUploadReport(test)}
                            disabled={test.status === "COMPLETED"}
                            data-testid={`button-upload-${test.id}`}
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            Upload Report
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Submitted Reports</CardTitle>
              <CardDescription>View and download your submitted diagnostic reports</CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </div>
              ) : submittedReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No reports submitted yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Test</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Report Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submittedReports.map((report) => (
                      <TableRow key={report.id} data-testid={`row-report-${report.id}`}>
                        <TableCell className="font-medium">{report.patientName}</TableCell>
                        <TableCell>{report.testName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{report.department}</Badge>
                        </TableCell>
                        <TableCell>{report.reportDate}</TableCell>
                        <TableCell>
                          <Badge className={report.status === "VERIFIED" ? "bg-green-500" : "bg-blue-500"}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewReport(report)}
                              data-testid={`button-view-${report.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadReport(report)}
                              data-testid={`button-download-${report.id}`}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scans" className="space-y-4">
          <ScanCatalogTab />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Notifications & Alerts</CardTitle>
                  <CardDescription>Suggested tests and updates from doctors</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/technician/notifications"] })}
                  data-testid="button-refresh-notifications"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No new notifications
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification: any) => (
                    <div
                      key={notification.id}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                      data-testid={`notification-${notification.id}`}
                    >
                      <Bell className="w-5 h-5 text-primary mt-1" />
                      <div className="flex-1">
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.createdAt && format(new Date(notification.createdAt), "MMM d, yyyy h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Diagnostic Report</DialogTitle>
            <DialogDescription>
              Submit findings for {selectedTest?.patientName} - {selectedTest?.testName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Patient</Label>
                <p className="text-sm font-medium">{selectedTest?.patientName}</p>
              </div>
              <div>
                <Label>Test Type</Label>
                <p className="text-sm font-medium">{selectedTest?.testName}</p>
              </div>
              <div>
                <Label>Department</Label>
                <p className="text-sm font-medium">{selectedTest?.department}</p>
              </div>
              <div>
                <Label>Ordered By</Label>
                <p className="text-sm font-medium">{selectedTest?.orderedBy}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Attach Report File *</Label>
              <div 
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.dcm"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        toast({
                          title: "File Too Large",
                          description: "Maximum file size is 10MB. Please choose a smaller file.",
                          variant: "destructive",
                        });
                        return;
                      }
                      setReportForm({ ...reportForm, attachmentFile: file });
                    }
                  }}
                  data-testid="input-file"
                />
                {reportForm.attachmentFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-10 h-10 text-primary" />
                    <p className="font-medium">{reportForm.attachmentFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(reportForm.attachmentFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportForm({ ...reportForm, attachmentFile: null });
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      Remove File
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-10 h-10 text-muted-foreground" />
                    <p className="font-medium">Click to upload report file</p>
                    <p className="text-sm text-muted-foreground">PDF, JPEG, PNG, DICOM (max 10MB)</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="findings">Test Findings / Report *</Label>
              <Textarea
                id="findings"
                value={reportForm.findings}
                onChange={(e) => setReportForm({ ...reportForm, findings: e.target.value })}
                placeholder="Enter detailed findings of the test (e.g., observations, measurements, impressions)..."
                rows={4}
                data-testid="input-findings"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommendations">Recommendations (Optional)</Label>
              <Textarea
                id="recommendations"
                value={reportForm.recommendations}
                onChange={(e) => setReportForm({ ...reportForm, recommendations: e.target.value })}
                placeholder="Any recommendations for further tests or follow-up..."
                rows={2}
                data-testid="input-recommendations"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReport}
              disabled={submitReportMutation.isPending}
              data-testid="button-submit-report"
            >
              {submitReportMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewReportDialogOpen} onOpenChange={setIsViewReportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Report</DialogTitle>
            <DialogDescription>
              {selectedReport?.patientName} - {selectedReport?.testName}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Patient</Label>
                  <p className="font-medium">{selectedReport.patientName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Test</Label>
                  <p className="font-medium">{selectedReport.testName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Department</Label>
                  <p className="font-medium">{selectedReport.department}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Report Date</Label>
                  <p className="font-medium">{selectedReport.reportDate}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-muted-foreground text-xs">Test Findings / Report</Label>
                {selectedReport.findings ? (
                  <div className="mt-2 p-4 bg-muted rounded-md whitespace-pre-wrap text-sm">
                    {selectedReport.findings}
                  </div>
                ) : (
                  <p className="mt-2 text-muted-foreground italic text-sm">No findings recorded</p>
                )}
              </div>

              {selectedReport.recommendations && (
                <div>
                  <Label className="text-muted-foreground text-xs">Recommendations</Label>
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md text-sm">
                    {selectedReport.recommendations}
                  </div>
                </div>
              )}

              {selectedReport.fileData && (
                <div>
                  <Label className="text-muted-foreground text-xs">Attached Report File</Label>
                  <div className="mt-2 p-3 bg-muted rounded-md flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-sm">{selectedReport.fileName || 'Report file'}</span>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewReportDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => selectedReport && handleDownloadReport(selectedReport)} data-testid="button-download-report">
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Radiology Master Scan List
const RADIOLOGY_SCAN_CATALOG = {
  CT_SCAN: {
    title: "CT SCAN (Computed Tomography)",
    subcategories: [
      { name: "CT Brain", scans: ["Plain CT Brain", "CT Brain with Contrast", "CT Brain Trauma", "CT Brain Stroke Protocol", "CT Brain Angiography", "CT Brain Venography"] },
      { name: "CT Head & Neck", scans: ["CT PNS", "CT Orbit", "CT Temporal Bone", "CT Neck Soft Tissue", "CT Neck Angiography"] },
      { name: "CT Chest", scans: ["CT Chest Plain", "CT Chest Contrast", "HRCT Chest", "CT Pulmonary Angiography (CTPA)", "CT Chest Trauma"] },
      { name: "CT Abdomen & Pelvis", scans: ["CT Abdomen Plain", "CT Abdomen with Contrast", "CT KUB", "CT Abdomen + Pelvis", "CT Triple Phase Liver", "CT Pancreas Protocol", "CT Urography"] },
      { name: "CT Spine", scans: ["CT Cervical Spine", "CT Dorsal Spine", "CT Lumbar Spine", "CT Whole Spine", "CT Spine Trauma"] },
      { name: "CT Cardiac & Vascular", scans: ["CT Coronary Angiography", "CT Aortogram", "CT Peripheral Angiography", "CT Renal Angiography", "CT Mesenteric Angiography"] }
    ]
  },
  MRI: {
    title: "MRI (Magnetic Resonance Imaging)",
    subcategories: [
      { name: "MRI Brain", scans: ["MRI Brain Plain", "MRI Brain with Contrast", "MRI Brain Epilepsy Protocol", "MRI Brain Stroke Protocol", "MRI Brain Tumor Protocol", "MRI Brain Angiography (MRA)", "MR Venography (MRV)"] },
      { name: "MRI Spine", scans: ["MRI Cervical Spine", "MRI Dorsal Spine", "MRI Lumbar Spine", "MRI Whole Spine"] },
      { name: "MRI Head & Neck", scans: ["MRI Orbit", "MRI PNS", "MRI Internal Auditory Canal (IAC)", "MRI Neck Soft Tissue"] },
      { name: "MRI Chest & Abdomen", scans: ["MRI Liver", "MRCP", "MRI Pancreas", "MRI Abdomen", "MRI Pelvis"] },
      { name: "MRI Musculoskeletal", scans: ["MRI Knee", "MRI Shoulder", "MRI Ankle", "MRI Wrist", "MRI Hip", "MRI Elbow"] },
      { name: "MRI Cardiac & Vascular", scans: ["Cardiac MRI", "MR Angiography (Peripheral)", "MR Renal Angiography"] }
    ]
  },
  USG: {
    title: "USG (Ultrasound / Sonography)",
    subcategories: [
      { name: "General Ultrasound", scans: ["USG Whole Abdomen", "USG Upper Abdomen", "USG Lower Abdomen", "USG KUB", "USG Pelvis (Male/Female)"] },
      { name: "Obstetric & Gynec", scans: ["USG Early Pregnancy", "USG NT Scan", "USG Anomaly Scan", "USG Growth Scan", "USG Doppler Pregnancy", "USG TVS"] },
      { name: "Small Parts", scans: ["USG Thyroid", "USG Breast", "USG Scrotum", "USG Soft Tissue", "USG Neck"] },
      { name: "Doppler Studies", scans: ["Carotid Doppler", "Venous Doppler (Upper / Lower Limb)", "Arterial Doppler (Upper / Lower Limb)", "Renal Doppler", "Portal Doppler", "Obstetric Doppler"] },
      { name: "Interventional USG", scans: ["USG Guided FNAC", "USG Guided Biopsy", "USG Guided Drainage"] }
    ]
  },
  XRAY: {
    title: "X-RAY (Digital Radiography)",
    subcategories: [
      { name: "Chest", scans: ["X-Ray Chest PA", "X-Ray Chest AP", "X-Ray Chest Lateral"] },
      { name: "Abdomen", scans: ["X-Ray Abdomen Erect", "X-Ray Abdomen Supine"] },
      { name: "Spine", scans: ["X-Ray Cervical Spine", "X-Ray Dorsal Spine", "X-Ray Lumbar Spine", "X-Ray Whole Spine"] },
      { name: "Limbs & Joints", scans: ["X-Ray Shoulder", "X-Ray Elbow", "X-Ray Wrist", "X-Ray Hand", "X-Ray Hip", "X-Ray Knee", "X-Ray Ankle", "X-Ray Foot"] },
      { name: "Skull & Face", scans: ["X-Ray Skull", "X-Ray PNS", "X-Ray Mandible", "X-Ray Nasal Bone"] },
      { name: "Special X-Rays", scans: ["IVP", "MCU", "HSG", "Barium Swallow", "Barium Meal", "Barium Enema"] }
    ]
  },
  SPECIAL: {
    title: "Special Radiology / Advanced Studies",
    subcategories: [
      { name: "Advanced Studies", scans: ["CT Angiography", "MR Angiography", "CT / MRI Enterography", "CT / MRI Fistulogram", "PET-CT (if oncology)", "Bone Densitometry (DEXA)"] }
    ]
  }
};

function ScanCatalogTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["CT_SCAN"]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const filterScans = (scans: string[]) => {
    if (!searchTerm) return scans;
    return scans.filter(scan => scan.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case "CT_SCAN": return <Activity className="w-5 h-5 text-blue-500" />;
      case "MRI": return <Activity className="w-5 h-5 text-purple-500" />;
      case "USG": return <Activity className="w-5 h-5 text-green-500" />;
      case "XRAY": return <Activity className="w-5 h-5 text-amber-500" />;
      case "SPECIAL": return <Activity className="w-5 h-5 text-red-500" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const totalScans = Object.values(RADIOLOGY_SCAN_CATALOG).reduce(
    (total, category) => total + category.subcategories.reduce((sum, sub) => sum + sub.scans.length, 0), 0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <CardTitle>Radiology Scan Catalog</CardTitle>
            <CardDescription>Complete list of {totalScans} available diagnostic scans</CardDescription>
          </div>
          <div className="flex-1">
            <div className="relative max-w-md ml-auto">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search scans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {Object.entries(RADIOLOGY_SCAN_CATALOG).map(([key, category]) => {
              const hasMatchingScans = category.subcategories.some(sub => filterScans(sub.scans).length > 0);
              if (searchTerm && !hasMatchingScans) return null;
              
              return (
                <div key={key} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleCategory(key)}
                    className="w-full flex items-center justify-between p-4 bg-muted/50 text-left"
                  >
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(key)}
                      <span className="font-semibold">{category.title}</span>
                      <Badge variant="secondary" className="ml-2">
                        {category.subcategories.reduce((sum, sub) => sum + sub.scans.length, 0)} scans
                      </Badge>
                    </div>
                    {expandedCategories.includes(key) ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                  
                  {expandedCategories.includes(key) && (
                    <div className="p-4 space-y-4">
                      {category.subcategories.map((subcategory, idx) => {
                        const filteredScans = filterScans(subcategory.scans);
                        if (searchTerm && filteredScans.length === 0) return null;
                        
                        return (
                          <div key={idx} className="space-y-2">
                            <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">
                              {subcategory.name}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {filteredScans.map((scan, scanIdx) => (
                                <div 
                                  key={scanIdx}
                                  className="flex items-center gap-2 p-2 bg-background border rounded-md text-sm"
                                >
                                  <div className="w-2 h-2 rounded-full bg-primary/60" />
                                  {scan}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
