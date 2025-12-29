import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { 
  Clock, LogIn, LogOut, Calendar, FileText, 
  CheckCircle, XCircle, AlertCircle, Timer, CalendarDays
} from "lucide-react";

type AttendanceLog = {
  id: string;
  staffId: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  checkInMethod: string | null;
  checkOutMethod: string | null;
  workHours: string | null;
  status: string;
};

type LeaveRequest = {
  id: string;
  staffId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
};

type StaffProfile = {
  id: string;
  userId: string | null;
  fullName: string;
  role: string;
  department: string | null;
  status: string;
};

const LEAVE_TYPES = ["CASUAL", "SICK", "EARNED", "MATERNITY", "PATERNITY", "EMERGENCY", "UNPAID"];

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  CANCELLED: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
  PRESENT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  ABSENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  HALF_DAY: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  LATE: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  ON_LEAVE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

interface StaffSelfServiceProps {
  userId: string;
  userName: string;
  userRole: string;
}

export default function StaffSelfService({ userId, userName, userRole }: StaffSelfServiceProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("attendance");
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaveFormData, setLeaveFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: ""
  });

  const { data: staffProfile } = useQuery<StaffProfile>({
    queryKey: ["/api/staff/me"],
    retry: false,
  });

  const { data: myAttendance = [], isLoading: loadingAttendance } = useQuery<AttendanceLog[]>({
    queryKey: ["/api/attendance/staff", staffProfile?.id],
    enabled: !!staffProfile?.id,
    queryFn: async () => {
      const res = await fetch(`/api/attendance/staff/${staffProfile?.id}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: myLeaves = [], isLoading: loadingLeaves } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave"],
  });

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayAttendance = myAttendance.find(a => a.date === todayStr);
  const isCheckedIn = todayAttendance?.checkInTime && !todayAttendance?.checkOutTime;
  const hasCheckedOut = todayAttendance?.checkOutTime;

  const checkInMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/attendance/check-in", { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/staff"] });
      toast({ title: "Checked in successfully", description: `Welcome, ${userName}!` });
    },
    onError: (error: any) => {
      toast({ title: "Check-in failed", description: error.message || "Please try again", variant: "destructive" });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/attendance/check-out", { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/staff"] });
      toast({ title: "Checked out successfully", description: "Have a great day!" });
    },
    onError: (error: any) => {
      toast({ title: "Check-out failed", description: error.message || "Please try again", variant: "destructive" });
    },
  });

  const createLeaveMutation = useMutation({
    mutationFn: async (data: typeof leaveFormData) => {
      return apiRequest("POST", "/api/leave", {
        ...data,
        staffId: staffProfile?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave"] });
      toast({ title: "Leave request submitted", description: "Waiting for admin approval" });
      setShowLeaveDialog(false);
      setLeaveFormData({ leaveType: "", startDate: "", endDate: "", reason: "" });
    },
    onError: () => {
      toast({ title: "Failed to submit leave request", variant: "destructive" });
    },
  });

  const cancelLeaveMutation = useMutation({
    mutationFn: async (leaveId: string) => {
      return apiRequest("PATCH", `/api/leave/${leaveId}`, { action: "cancel" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave"] });
      toast({ title: "Leave request cancelled" });
    },
    onError: () => {
      toast({ title: "Failed to cancel leave request", variant: "destructive" });
    },
  });

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "--:--";
    try {
      return format(new Date(timeStr), "hh:mm a");
    } catch {
      return timeStr;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM dd, yyyy");
    } catch {
      return dateStr;
    }
  };

  const currentTime = format(new Date(), "hh:mm a");
  const currentDate = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">Manage your attendance and leave requests</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">{currentDate}</p>
          <p className="text-2xl font-mono font-bold">{currentTime}</p>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-lg">
                <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Today's Status</h3>
                <p className="text-sm text-muted-foreground">
                  {!todayAttendance 
                    ? "Not checked in yet" 
                    : isCheckedIn 
                      ? `Checked in at ${formatTime(todayAttendance.checkInTime)}`
                      : `Checked out at ${formatTime(todayAttendance.checkOutTime)}`
                  }
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                size="lg"
                onClick={() => checkInMutation.mutate()}
                disabled={!!isCheckedIn || !!hasCheckedOut || checkInMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
                data-testid="button-check-in"
              >
                <LogIn className="mr-2 h-5 w-5" />
                {checkInMutation.isPending ? "Checking In..." : "Check In"}
              </Button>
              <Button
                size="lg"
                onClick={() => checkOutMutation.mutate()}
                disabled={!isCheckedIn || checkOutMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
                data-testid="button-check-out"
              >
                <LogOut className="mr-2 h-5 w-5" />
                {checkOutMutation.isPending ? "Checking Out..." : "Check Out"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="attendance" className="flex items-center gap-2" data-testid="tab-attendance">
            <Timer className="h-4 w-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="leave" className="flex items-center gap-2" data-testid="tab-leave">
            <FileText className="h-4 w-4" />
            Leave
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                Attendance History
              </CardTitle>
              <CardDescription>Your recent attendance records</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAttendance ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : myAttendance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No attendance records found</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {myAttendance.slice(0, 30).map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                        data-testid={`attendance-record-${record.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[60px]">
                            <p className="text-lg font-bold">{format(new Date(record.date), "dd")}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(record.date), "MMM")}</p>
                          </div>
                          <Separator orientation="vertical" className="h-10" />
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge className={statusColors[record.status] || "bg-slate-100"}>
                                {record.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {record.checkInMethod || "Manual"} Check-in
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">In</p>
                              <p className="font-mono font-medium text-green-600">{formatTime(record.checkInTime)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Out</p>
                              <p className="font-mono font-medium text-red-600">{formatTime(record.checkOutTime)}</p>
                            </div>
                            {record.workHours && (
                              <div>
                                <p className="text-xs text-muted-foreground">Hours</p>
                                <p className="font-mono font-medium">{record.workHours}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Leave Requests</h3>
              <p className="text-sm text-muted-foreground">Manage your leave applications</p>
            </div>
            <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-request-leave">
                  <Calendar className="mr-2 h-4 w-4" />
                  Request Leave
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Leave</DialogTitle>
                  <DialogDescription>Submit a new leave application</DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  createLeaveMutation.mutate(leaveFormData);
                }}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Leave Type</Label>
                      <Select
                        value={leaveFormData.leaveType}
                        onValueChange={(value) => setLeaveFormData(prev => ({ ...prev, leaveType: value }))}
                      >
                        <SelectTrigger data-testid="select-leave-type">
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                        <SelectContent>
                          {LEAVE_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type.replace("_", " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={leaveFormData.startDate}
                          onChange={(e) => setLeaveFormData(prev => ({ ...prev, startDate: e.target.value }))}
                          required
                          data-testid="input-leave-start"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={leaveFormData.endDate}
                          onChange={(e) => setLeaveFormData(prev => ({ ...prev, endDate: e.target.value }))}
                          required
                          data-testid="input-leave-end"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Reason</Label>
                      <Textarea
                        value={leaveFormData.reason}
                        onChange={(e) => setLeaveFormData(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="Provide reason for leave"
                        required
                        data-testid="textarea-leave-reason"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowLeaveDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createLeaveMutation.isPending} data-testid="button-submit-leave">
                      {createLeaveMutation.isPending ? "Submitting..." : "Submit Request"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
              {loadingLeaves ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : myLeaves.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No leave requests found</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {myLeaves.map((leave) => (
                      <div
                        key={leave.id}
                        className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                        data-testid={`leave-record-${leave.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className={statusColors[leave.status] || "bg-slate-100"}>
                                {leave.status}
                              </Badge>
                              <Badge variant="outline">{leave.leaveType.replace("_", " ")}</Badge>
                            </div>
                            <p className="font-medium mt-2">
                              {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                            </p>
                            <p className="text-sm text-muted-foreground">{leave.reason}</p>
                            {leave.reviewNotes && (
                              <p className="text-sm text-muted-foreground italic mt-2">
                                Admin note: {leave.reviewNotes}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {leave.status === "PENDING" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelLeaveMutation.mutate(leave.id)}
                                disabled={cancelLeaveMutation.isPending}
                                data-testid={`button-cancel-leave-${leave.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            )}
                            {leave.status === "APPROVED" && (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                            {leave.status === "REJECTED" && (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                          Submitted: {formatDate(leave.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
