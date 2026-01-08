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
  Activity
} from "lucide-react";
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
  findings: string;
  conclusion: string;
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
    conclusion: "",
    recommendations: "",
    attachmentFile: null as File | null
  });

  const { data: pendingTests = [], isLoading: testsLoading } = useQuery<PendingTest[]>({
    queryKey: ["/api/technician/pending-tests", selectedDepartment],
  });

  const { data: submittedReports = [], isLoading: reportsLoading } = useQuery<TechnicianReport[]>({
    queryKey: ["/api/technician/reports", currentUserId],
  });

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<any[]>({
    queryKey: ["/api/technician/notifications", currentUserId],
  });

  const submitReportMutation = useMutation({
    mutationFn: async (data: { testId: string; findings: string; conclusion: string; recommendations: string }) => {
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
      setReportForm({ findings: "", conclusion: "", recommendations: "", attachmentFile: null });
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

  const handleSubmitReport = () => {
    if (!selectedTest) return;
    if (!reportForm.findings.trim() || !reportForm.conclusion.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide findings and conclusion for the report.",
        variant: "destructive",
      });
      return;
    }
    submitReportMutation.mutate({
      testId: selectedTest.id,
      findings: reportForm.findings,
      conclusion: reportForm.conclusion,
      recommendations: reportForm.recommendations,
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
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">Upcoming Tests</TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">Submitted Reports</TabsTrigger>
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

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications & Alerts</CardTitle>
              <CardDescription>Suggested tests and updates from doctors</CardDescription>
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
              <Label htmlFor="findings">Findings *</Label>
              <Textarea
                id="findings"
                value={reportForm.findings}
                onChange={(e) => setReportForm({ ...reportForm, findings: e.target.value })}
                placeholder="Enter detailed findings from the diagnostic test..."
                rows={4}
                data-testid="input-findings"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conclusion">Conclusion *</Label>
              <Textarea
                id="conclusion"
                value={reportForm.conclusion}
                onChange={(e) => setReportForm({ ...reportForm, conclusion: e.target.value })}
                placeholder="Enter your conclusion/impression..."
                rows={3}
                data-testid="input-conclusion"
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

            <div className="space-y-2">
              <Label>Attach Report File (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.dcm"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setReportForm({ ...reportForm, attachmentFile: file });
                    }
                  }}
                  data-testid="input-file"
                />
              </div>
              <p className="text-xs text-muted-foreground">Supported: PDF, JPEG, PNG, DICOM</p>
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
        <DialogContent className="max-w-2xl">
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
                  <Label className="text-muted-foreground">Patient</Label>
                  <p className="font-medium">{selectedReport.patientName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Test</Label>
                  <p className="font-medium">{selectedReport.testName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Department</Label>
                  <p className="font-medium">{selectedReport.department}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Report Date</Label>
                  <p className="font-medium">{selectedReport.reportDate}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Findings</Label>
                <p className="mt-1 p-3 bg-muted rounded-md">{selectedReport.findings}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Conclusion</Label>
                <p className="mt-1 p-3 bg-muted rounded-md">{selectedReport.conclusion}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewReportDialogOpen(false)}>
              Close
            </Button>
            <Button data-testid="button-download-report">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
