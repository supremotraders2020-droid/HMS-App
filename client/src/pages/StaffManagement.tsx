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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from "date-fns";
import { 
  Calendar, Users, Clock, FileText, AlertCircle, CheckCircle, 
  Plus, ChevronLeft, ChevronRight, User, Building, Phone, Mail,
  Timer, CalendarDays, BarChart3, TrendingUp, Award, Briefcase, Stethoscope
} from "lucide-react";
import StaffSelfService from "@/components/StaffSelfService";
import NurseDepartmentPreferences from "@/components/NurseDepartmentPreferences";

type UserRole = "ADMIN" | "DOCTOR" | "PATIENT" | "NURSE" | "OPD_MANAGER" | "MEDICAL_STORE" | "PATHOLOGY_LAB";

type CurrentUser = {
  id: string;
  name: string;
  role: UserRole;
};

type StaffMember = {
  id: string;
  userId: string | null;
  employeeCode: string;
  fullName: string;
  role: string;
  department: string | null;
  email: string | null;
  phone: string | null;
  joiningDate: string | null;
  status: string;
  qualifications: string | null;
  designation: string | null;
  createdAt: string;
};

type ShiftRoster = {
  id: string;
  staffId: string;
  department: string;
  shiftDate: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
};

type TaskLog = {
  id: string;
  staffId: string;
  department: string;
  taskType: string;
  taskDescription: string;
  patientId: string | null;
  startTime: Date;
  endTime: Date | null;
  status: string;
  notes: string | null;
  createdAt: string;
};

type AttendanceLog = {
  id: string;
  staffId: string;
  date: string;
  checkInTime: Date | null;
  checkOutTime: Date | null;
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
  createdAt: string;
};

type OvertimeLog = {
  id: string;
  staffId: string;
  date: string;
  hours: string;
  reason: string;
  status: string;
};

type PerformanceMetric = {
  id: string;
  staffId: string;
  periodType: string;
  periodStart: string;
  periodEnd: string;
  tasksCompleted: number;
  attendanceRate: string;
  performanceScore: string;
  aiNotes: string | null;
};

type Analytics = {
  summary: {
    totalStaff: number;
    activeStaff: number;
    onLeaveStaff: number;
    totalShifts: number;
    pendingLeaveRequests: number;
    pendingOvertimeApprovals: number;
  };
  shiftsByType: Record<string, number>;
  shiftStatus: Record<string, number>;
  departmentBreakdown: { department: string; staffCount: number; activeCount: number }[];
};

const SHIFT_TYPES = ["MORNING", "EVENING", "NIGHT", "ON_CALL", "ROTATION"];
const LEAVE_TYPES = ["CASUAL", "SICK", "ANNUAL", "MATERNITY", "PATERNITY", "EMERGENCY", "COMPENSATORY"];
const TASK_TYPES = ["PATIENT_CARE", "MEDICATION_ADMIN", "DOCUMENTATION", "ROUNDS", "EMERGENCY", "TRAINING", "MEETING", "OTHER"];
const DEPARTMENTS = ["OPD", "ICU", "EMERGENCY", "SURGERY", "PEDIATRICS", "GYNECOLOGY", "ORTHOPEDICS", "PATHOLOGY", "PHARMACY", "ADMIN"];

const shiftColors: Record<string, string> = {
  MORNING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  EVENING: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  NIGHT: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  ON_CALL: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  ROTATION: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  IN_PROGRESS: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  PRESENT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  ABSENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

interface StaffManagementProps {
  currentUser?: CurrentUser;
}

export default function StaffManagement({ currentUser }: StaffManagementProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("roster");
  
  const isAdmin = currentUser?.role === "ADMIN";
  
  if (currentUser && !isAdmin) {
    return (
      <StaffSelfService 
        userId={currentUser.id} 
        userName={currentUser.name} 
        userRole={currentUser.role} 
      />
    );
  }
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [showAddStaffDialog, setShowAddStaffDialog] = useState(false);
  const [showAddShiftDialog, setShowAddShiftDialog] = useState(false);
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [showLeaveRequestDialog, setShowLeaveRequestDialog] = useState(false);
  const [attendanceRoleFilter, setAttendanceRoleFilter] = useState<string>("all");
  const [attendancePeriodFilter, setAttendancePeriodFilter] = useState<"weekly" | "monthly" | "quarterly">("weekly");

  const { data: staff = [], isLoading: loadingStaff } = useQuery<StaffMember[]>({
    queryKey: ["/api/staff"],
  });

  const startDate = format(weekStart, "yyyy-MM-dd");
  const endDate = format(addDays(weekStart, 6), "yyyy-MM-dd");

  const { data: roster = [], isLoading: loadingRoster } = useQuery<ShiftRoster[]>({
    queryKey: ["/api/roster", { startDate, endDate }],
    queryFn: async () => {
      const res = await fetch(`/api/roster?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error("Failed to fetch roster");
      return res.json();
    },
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery<TaskLog[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: attendance = [], isLoading: loadingAttendance, refetch: refetchAttendance } = useQuery<AttendanceLog[]>({
    queryKey: ["/api/attendance"],
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: leaves = [], isLoading: loadingLeaves, refetch: refetchLeaves } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave"],
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: overtime = [], isLoading: loadingOvertime } = useQuery<OvertimeLog[]>({
    queryKey: ["/api/overtime"],
  });

  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["/api/analytics/staff"],
  });

  const { data: performance = [] } = useQuery<PerformanceMetric[]>({
    queryKey: ["/api/performance"],
  });

  const createStaffMutation = useMutation({
    mutationFn: async (data: Partial<StaffMember>) => {
      return apiRequest("POST", "/api/staff", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({ title: "Staff member added successfully" });
      setShowAddStaffDialog(false);
    },
    onError: () => {
      toast({ title: "Failed to add staff member", variant: "destructive" });
    },
  });

  const createShiftMutation = useMutation({
    mutationFn: async (data: Partial<ShiftRoster>) => {
      return apiRequest("POST", "/api/roster", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roster"] });
      toast({ title: "Shift created successfully" });
      setShowAddShiftDialog(false);
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to create shift", variant: "destructive" });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: Partial<TaskLog>) => {
      return apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task logged successfully" });
      setShowAddTaskDialog(false);
    },
    onError: () => {
      toast({ title: "Failed to log task", variant: "destructive" });
    },
  });

  const createLeaveMutation = useMutation({
    mutationFn: async (data: Partial<LeaveRequest>) => {
      return apiRequest("POST", "/api/leave", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave"] });
      toast({ title: "Leave request submitted" });
      setShowLeaveRequestDialog(false);
    },
    onError: () => {
      toast({ title: "Failed to submit leave request", variant: "destructive" });
    },
  });

  const approveLeavesMutation = useMutation({
    mutationFn: async ({ id, action, reason }: { id: string; action: string; reason?: string }) => {
      return apiRequest("PATCH", `/api/leave/${id}`, { action, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave"] });
      toast({ title: "Leave request updated" });
    },
    onError: () => {
      toast({ title: "Failed to update leave request", variant: "destructive" });
    },
  });

  const approveOvertimeMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      return apiRequest("PATCH", `/api/overtime/${id}`, { action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/overtime"] });
      toast({ title: "Overtime request updated" });
    },
    onError: () => {
      toast({ title: "Failed to update overtime request", variant: "destructive" });
    },
  });

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const filteredStaff = useMemo(() => {
    if (selectedDepartment === "all") return staff;
    return staff.filter(s => s.department === selectedDepartment);
  }, [staff, selectedDepartment]);

  const getShiftsForStaffAndDay = (staffId: string, day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd");
    return roster.filter(r => r.staffId === staffId && r.shiftDate === dayStr);
  };

  const getStaffById = (staffId: string) => staff.find(s => s.id === staffId);

  const filteredAttendance = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    
    if (attendancePeriodFilter === "weekly") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (attendancePeriodFilter === "monthly") {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
    } else {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
    }
    
    return attendance.filter(record => {
      const recordDate = new Date(record.date);
      const isInPeriod = recordDate >= startDate && recordDate <= now;
      
      if (!isInPeriod) return false;
      
      if (attendanceRoleFilter === "all") return true;
      
      const staffMember = staff.find(s => s.id === record.staffId);
      return staffMember?.role === attendanceRoleFilter;
    });
  }, [attendance, attendanceRoleFilter, attendancePeriodFilter, staff]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">Manage hospital staff roster, attendance, and performance</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={showAddStaffDialog} onOpenChange={setShowAddStaffDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-staff">
                <Plus className="h-4 w-4 mr-2" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
                <DialogDescription>Enter the details of the new staff member</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createStaffMutation.mutate({
                  employeeCode: formData.get("employeeCode") as string,
                  fullName: formData.get("fullName") as string,
                  role: formData.get("role") as string,
                  department: formData.get("department") as string || null,
                  email: formData.get("email") as string || null,
                  phone: formData.get("phone") as string || null,
                  qualifications: formData.get("qualifications") as string || null,
                  designation: formData.get("designation") as string || null,
                  status: "ACTIVE",
                });
              }}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employeeCode">Employee Code</Label>
                      <Input id="employeeCode" name="employeeCode" required data-testid="input-employee-code" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" name="fullName" required data-testid="input-full-name" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select name="role" required>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DOCTOR">Doctor</SelectItem>
                          <SelectItem value="NURSE">Nurse</SelectItem>
                          <SelectItem value="TECHNICIAN">Technician</SelectItem>
                          <SelectItem value="PHARMACIST">Pharmacist</SelectItem>
                          <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select name="department" required>
                        <SelectTrigger data-testid="select-department">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" data-testid="input-email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" data-testid="input-phone" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qualifications">Qualifications</Label>
                    <Input id="qualifications" name="qualifications" data-testid="input-qualifications" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Input id="designation" name="designation" data-testid="input-designation" />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="submit" disabled={createStaffMutation.isPending} data-testid="button-submit-staff">
                    {createStaffMutation.isPending ? "Adding..." : "Add Staff"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.summary.totalStaff}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.summary.activeStaff} active, {analytics.summary.onLeaveStaff} on leave
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Scheduled Shifts</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.summary.totalShifts}</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.summary.pendingLeaveRequests}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">Pending Overtime</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.summary.pendingOvertimeApprovals}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="roster" data-testid="tab-roster" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Roster</span>
          </TabsTrigger>
          <TabsTrigger value="staff" data-testid="tab-staff" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Staff</span>
          </TabsTrigger>
          <TabsTrigger value="nurse-prefs" data-testid="tab-nurse-prefs" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            <span className="hidden sm:inline">Nurse Depts</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" data-testid="tab-tasks" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" data-testid="tab-attendance" className="flex items-center gap-2" onClick={() => refetchAttendance()}>
            <Timer className="h-4 w-4" />
            <span className="hidden sm:inline">Attendance</span>
          </TabsTrigger>
          <TabsTrigger value="leave" data-testid="tab-leave" className="flex items-center gap-2" onClick={() => refetchLeaves()}>
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Leave</span>
          </TabsTrigger>
          <TabsTrigger value="performance" data-testid="tab-performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle>Weekly Shift Roster</CardTitle>
                <CardDescription>
                  {format(weekStart, "MMMM d")} - {format(addDays(weekStart, 6), "MMMM d, yyyy")}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-40" data-testid="select-filter-department">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" onClick={() => setWeekStart(subWeeks(weekStart, 1))} data-testid="button-prev-week">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} data-testid="button-today">
                    Today
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setWeekStart(addWeeks(weekStart, 1))} data-testid="button-next-week">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Dialog open={showAddShiftDialog} onOpenChange={setShowAddShiftDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-shift">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Shift
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Shift</DialogTitle>
                      <DialogDescription>Assign a shift to a staff member</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const overrideReason = formData.get("overrideReason") as string;
                      createShiftMutation.mutate({
                        staffId: formData.get("staffId") as string,
                        department: formData.get("department") as string,
                        shiftDate: formData.get("shiftDate") as string,
                        shiftType: formData.get("shiftType") as string,
                        startTime: formData.get("startTime") as string,
                        endTime: formData.get("endTime") as string,
                        status: "SCHEDULED",
                        notes: formData.get("notes") as string,
                        ...(overrideReason ? { overrideReason } : {}),
                      });
                    }}>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Staff Member</Label>
                          <Select name="staffId" required>
                            <SelectTrigger data-testid="select-shift-staff">
                              <SelectValue placeholder="Select staff" />
                            </SelectTrigger>
                            <SelectContent>
                              {staff.map(s => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.fullName} ({s.role})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Department</Label>
                            <Select name="department" required>
                              <SelectTrigger data-testid="select-shift-department">
                                <SelectValue placeholder="Department" />
                              </SelectTrigger>
                              <SelectContent>
                                {DEPARTMENTS.map(dept => (
                                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Shift Type</Label>
                            <Select name="shiftType" required>
                              <SelectTrigger data-testid="select-shift-type">
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                {SHIFT_TYPES.map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input type="date" name="shiftDate" required data-testid="input-shift-date" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Start Time</Label>
                            <Input type="time" name="startTime" required data-testid="input-start-time" />
                          </div>
                          <div className="space-y-2">
                            <Label>End Time</Label>
                            <Input type="time" name="endTime" required data-testid="input-end-time" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Notes</Label>
                          <Textarea name="notes" placeholder="Optional notes" data-testid="input-shift-notes" />
                        </div>
                        <div className="space-y-2">
                          <Label>Override Reason (for conflicts)</Label>
                          <Input name="overrideReason" placeholder="Leave blank unless overriding a conflict" data-testid="input-override-reason" />
                          <p className="text-xs text-muted-foreground">If this shift overlaps with an existing one, provide a reason to proceed</p>
                        </div>
                      </div>
                      <DialogFooter className="mt-6">
                        <Button type="submit" disabled={createShiftMutation.isPending} data-testid="button-submit-shift">
                          {createShiftMutation.isPending ? "Creating..." : "Create Shift"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-8 gap-2 border-b pb-2 mb-2 sticky top-0 bg-background z-10">
                    <div className="font-medium text-sm">Staff</div>
                    {weekDays.map((day, i) => (
                      <div key={i} className={`text-center text-sm ${isSameDay(day, new Date()) ? "font-bold text-primary" : ""}`}>
                        <div className="font-medium">{format(day, "EEE")}</div>
                        <div className="text-muted-foreground">{format(day, "MMM d")}</div>
                      </div>
                    ))}
                  </div>
                  
                  {loadingStaff || loadingRoster ? (
                    <div className="text-center py-8 text-muted-foreground">Loading roster...</div>
                  ) : filteredStaff.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No staff members found</div>
                  ) : (
                    filteredStaff.map(staffMember => (
                      <div key={staffMember.id} className="grid grid-cols-8 gap-2 py-2 border-b hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="text-sm font-medium truncate max-w-[120px]" title={staffMember.fullName}>
                              {staffMember.fullName}
                            </div>
                            <div className="text-xs text-muted-foreground">{staffMember.role}</div>
                          </div>
                        </div>
                        {weekDays.map((day, i) => {
                          const shifts = getShiftsForStaffAndDay(staffMember.id, day);
                          return (
                            <div key={i} className={`min-h-[60px] p-1 rounded ${isSameDay(day, new Date()) ? "bg-primary/5" : ""}`}>
                              {shifts.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-xs">-</div>
                              ) : (
                                <div className="space-y-1">
                                  {shifts.map(shift => (
                                    <div
                                      key={shift.id}
                                      className={`text-xs p-1 rounded ${shiftColors[shift.shiftType] || "bg-gray-100"}`}
                                      title={`${shift.startTime} - ${shift.endTime}`}
                                    >
                                      <div className="font-medium">{shift.shiftType}</div>
                                      <div>{shift.startTime?.slice(0, 5)} - {shift.endTime?.slice(0, 5)}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Directory</CardTitle>
              <CardDescription>All registered staff members</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStaff ? (
                <div className="text-center py-8 text-muted-foreground">Loading staff...</div>
              ) : staff.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No staff members found. Add staff using the button above.</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {staff.map(s => (
                    <Card key={s.id} data-testid={`card-staff-${s.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold truncate">{s.fullName}</h3>
                              <Badge className={statusColors[s.status] || ""}>{s.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{s.employeeCode}</p>
                            <div className="flex items-center gap-2 text-sm mt-1">
                              <Badge variant="outline">{s.role}</Badge>
                              {s.department && <Badge variant="secondary">{s.department}</Badge>}
                            </div>
                            {s.email && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                                <Mail className="h-3 w-3" />
                                {s.email}
                              </div>
                            )}
                            {s.phone && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {s.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nurse-prefs" className="space-y-4">
          <NurseDepartmentPreferences />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle>Task Log</CardTitle>
                <CardDescription>Record and track daily tasks</CardDescription>
              </div>
              <Dialog open={showAddTaskDialog} onOpenChange={setShowAddTaskDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-task">
                    <Plus className="h-4 w-4 mr-2" />
                    Log Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Log New Task</DialogTitle>
                    <DialogDescription>Record a task or activity</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    createTaskMutation.mutate({
                      staffId: formData.get("staffId") as string,
                      department: formData.get("department") as string,
                      taskType: formData.get("taskType") as string,
                      taskDescription: formData.get("taskDescription") as string,
                      startTime: new Date(),
                      status: "IN_PROGRESS",
                      notes: formData.get("notes") as string,
                    });
                  }}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Staff Member</Label>
                        <Select name="staffId" required>
                          <SelectTrigger data-testid="select-task-staff">
                            <SelectValue placeholder="Select staff" />
                          </SelectTrigger>
                          <SelectContent>
                            {staff.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Department</Label>
                          <Select name="department" required>
                            <SelectTrigger data-testid="select-task-department">
                              <SelectValue placeholder="Department" />
                            </SelectTrigger>
                            <SelectContent>
                              {DEPARTMENTS.map(dept => (
                                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Task Type</Label>
                          <Select name="taskType" required>
                            <SelectTrigger data-testid="select-task-type">
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              {TASK_TYPES.map(type => (
                                <SelectItem key={type} value={type}>{type.replace(/_/g, " ")}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Task Description</Label>
                        <Textarea name="taskDescription" required placeholder="Describe the task..." data-testid="input-task-description" />
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea name="notes" placeholder="Additional notes..." data-testid="input-task-notes" />
                      </div>
                    </div>
                    <DialogFooter className="mt-6">
                      <Button type="submit" disabled={createTaskMutation.isPending} data-testid="button-submit-task">
                        {createTaskMutation.isPending ? "Logging..." : "Log Task"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loadingTasks ? (
                <div className="text-center py-8 text-muted-foreground">Loading tasks...</div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No tasks logged yet. Start by logging a task.</div>
              ) : (
                <div className="space-y-4">
                  {tasks.slice(0, 20).map(task => {
                    const staffMember = getStaffById(task.staffId);
                    return (
                      <div key={task.id} className="flex items-start gap-4 p-4 border rounded-lg" data-testid={`task-${task.id}`}>
                        <div className={`p-2 rounded-full ${statusColors[task.status]}`}>
                          {task.status === "COMPLETED" ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium">{task.taskType.replace(/_/g, " ")}</h4>
                            <Badge className={statusColors[task.status]}>{task.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{task.taskDescription}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                            <span className="flex items-center gap-1">
                              {staffMember?.fullName || "Unknown"}
                              {staffMember?.role && <Badge variant="outline" className="text-[10px] px-1 py-0">{staffMember.role}</Badge>}
                            </span>
                            <span>{task.department}</span>
                            <span>{format(new Date(task.createdAt), "MMM d, h:mm a")}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Attendance Records</CardTitle>
                  <CardDescription>Daily attendance tracking</CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={attendanceRoleFilter} onValueChange={setAttendanceRoleFilter}>
                    <SelectTrigger className="w-[140px]" data-testid="select-attendance-role">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="DOCTOR">Doctor</SelectItem>
                      <SelectItem value="NURSE">Nurse</SelectItem>
                      <SelectItem value="OPD_MANAGER">OPD Manager</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select 
                    value={attendancePeriodFilter} 
                    onValueChange={(value: "weekly" | "monthly" | "quarterly") => setAttendancePeriodFilter(value)}
                  >
                    <SelectTrigger className="w-[130px]" data-testid="select-attendance-period">
                      <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingAttendance ? (
                <div className="text-center py-8 text-muted-foreground">Loading attendance...</div>
              ) : filteredAttendance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No attendance records found for {attendanceRoleFilter === "all" ? "all roles" : attendanceRoleFilter} ({attendancePeriodFilter}).
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAttendance.map(record => {
                    const staffMember = getStaffById(record.staffId);
                    return (
                      <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`attendance-${record.id}`}>
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {staffMember?.fullName || "Unknown"}
                              {staffMember?.role && <Badge variant="secondary" className="text-xs">{staffMember.role}</Badge>}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(parseISO(record.date), "EEEE, MMMM d, yyyy")}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm">
                              {record.checkInTime ? format(new Date(record.checkInTime), "h:mm a") : "-"} - {record.checkOutTime ? format(new Date(record.checkOutTime), "h:mm a") : "-"}
                            </div>
                            <div className="text-xs text-muted-foreground">{record.workHours || "-"} hours</div>
                          </div>
                          <Badge className={statusColors[record.status]}>{record.status}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Leave Requests</CardTitle>
                  <CardDescription>Manage leave applications</CardDescription>
                </div>
                <Dialog open={showLeaveRequestDialog} onOpenChange={setShowLeaveRequestDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-request-leave">
                      <Plus className="h-4 w-4 mr-2" />
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
                      const formData = new FormData(e.currentTarget);
                      createLeaveMutation.mutate({
                        leaveType: formData.get("leaveType") as string,
                        startDate: formData.get("startDate") as string,
                        endDate: formData.get("endDate") as string,
                        reason: formData.get("reason") as string,
                      });
                    }}>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Leave Type</Label>
                          <Select name="leaveType" required>
                            <SelectTrigger data-testid="select-leave-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {LEAVE_TYPES.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input type="date" name="startDate" required data-testid="input-leave-start" />
                          </div>
                          <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input type="date" name="endDate" required data-testid="input-leave-end" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Reason</Label>
                          <Textarea name="reason" required placeholder="Explain the reason for leave..." data-testid="input-leave-reason" />
                        </div>
                      </div>
                      <DialogFooter className="mt-6">
                        <Button type="submit" disabled={createLeaveMutation.isPending} data-testid="button-submit-leave">
                          {createLeaveMutation.isPending ? "Submitting..." : "Submit Request"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingLeaves ? (
                  <div className="text-center py-8 text-muted-foreground">Loading leave requests...</div>
                ) : leaves.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No leave requests found.</div>
                ) : (
                  <div className="space-y-3">
                    {leaves.map(leave => {
                      const staffMember = getStaffById(leave.staffId);
                      return (
                        <div key={leave.id} className="p-4 border rounded-lg" data-testid={`leave-${leave.id}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{staffMember?.fullName || "Unknown"}</span>
                                {staffMember?.role && <Badge variant="secondary" className="text-xs">{staffMember.role}</Badge>}
                                <Badge variant="outline">{leave.leaveType}</Badge>
                                <Badge className={statusColors[leave.status]}>{leave.status}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {format(parseISO(leave.startDate), "MMM d")} - {format(parseISO(leave.endDate), "MMM d, yyyy")}
                              </p>
                              <p className="text-sm mt-1">{leave.reason}</p>
                            </div>
                            {leave.status === "PENDING" && (
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => approveLeavesMutation.mutate({ id: leave.id, action: "approve" })}
                                  data-testid={`button-approve-leave-${leave.id}`}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => approveLeavesMutation.mutate({ id: leave.id, action: "reject", reason: "Request denied" })}
                                  data-testid={`button-reject-leave-${leave.id}`}
                                >
                                  <AlertCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Overtime Requests</CardTitle>
                <CardDescription>Review overtime claims</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingOvertime ? (
                  <div className="text-center py-8 text-muted-foreground">Loading overtime requests...</div>
                ) : overtime.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No overtime requests found.</div>
                ) : (
                  <div className="space-y-3">
                    {overtime.map(ot => {
                      const staffMember = getStaffById(ot.staffId);
                      return (
                        <div key={ot.id} className="p-4 border rounded-lg" data-testid={`overtime-${ot.id}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{staffMember?.fullName || "Unknown"}</span>
                                {staffMember?.role && <Badge variant="secondary" className="text-xs">{staffMember.role}</Badge>}
                                <Badge variant="outline">{ot.hours} hours</Badge>
                                <Badge className={statusColors[ot.status]}>{ot.status}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {format(parseISO(ot.date), "MMMM d, yyyy")}
                              </p>
                              <p className="text-sm mt-1">{ot.reason}</p>
                            </div>
                            {ot.status === "PENDING" && (
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => approveOvertimeMutation.mutate({ id: ot.id, action: "approve" })}
                                  data-testid={`button-approve-overtime-${ot.id}`}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => approveOvertimeMutation.mutate({ id: ot.id, action: "reject" })}
                                  data-testid={`button-reject-overtime-${ot.id}`}
                                >
                                  <AlertCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Staff performance overview</CardDescription>
              </CardHeader>
              <CardContent>
                {performance.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No performance data available yet.</div>
                ) : (
                  <div className="space-y-4">
                    {performance.slice(0, 10).map(metric => {
                      const staffMember = getStaffById(metric.staffId);
                      return (
                        <div key={metric.id} className="p-4 border rounded-lg" data-testid={`performance-${metric.id}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {staffMember?.fullName || "Unknown"}
                                {staffMember?.role && <Badge variant="secondary" className="text-xs">{staffMember.role}</Badge>}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(parseISO(metric.periodStart), "MMM d")} - {format(parseISO(metric.periodEnd), "MMM d, yyyy")}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <div className="text-2xl font-bold text-primary">{metric.performanceScore}</div>
                                <div className="text-xs text-muted-foreground">Score</div>
                              </div>
                            </div>
                          </div>
                          <Separator className="my-3" />
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-lg font-semibold">{metric.tasksCompleted}</div>
                              <div className="text-xs text-muted-foreground">Tasks</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold">{metric.attendanceRate}%</div>
                              <div className="text-xs text-muted-foreground">Attendance</div>
                            </div>
                            <div>
                              <Badge variant="outline">{metric.periodType}</Badge>
                            </div>
                          </div>
                          {metric.aiNotes && (
                            <p className="text-sm text-muted-foreground mt-3 italic">{metric.aiNotes}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Overview</CardTitle>
                <CardDescription>Staff distribution by department</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.departmentBreakdown && analytics.departmentBreakdown.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.departmentBreakdown.map(dept => (
                      <div key={dept.department} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{dept.department}</div>
                            <div className="text-sm text-muted-foreground">{dept.staffCount} staff members</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">{dept.activeCount}</div>
                          <div className="text-xs text-muted-foreground">Active</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No department data available.</div>
                )}

                {analytics && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Shift Distribution</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(analytics.shiftsByType || {}).map(([type, count]) => (
                        <div key={type} className="p-3 rounded-lg bg-muted/50">
                          <div className="text-lg font-bold">{count as number}</div>
                          <div className="text-xs text-muted-foreground">{type} shifts</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
