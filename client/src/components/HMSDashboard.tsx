import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useNotifications } from "@/hooks/use-notifications";
import { 
  Users, 
  Calendar, 
  Activity, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  Stethoscope,
  FileText,
  HeartPulse,
  Shield,
  UserCheck,
  BarChart3,
  MapPin,
  Phone,
  Mail,
  Globe,
  Building2,
  Ambulance,
  Pill,
  Bed,
  ClipboardList,
  CheckCircle,
  XCircle,
  Bell,
  Eye
} from "lucide-react";
import type { ActivityLog, Appointment, ServicePatient, CriticalAlert } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

type UserRole = "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "PATIENT" | "NURSE" | "OPD_MANAGER" | "MEDICAL_STORE" | "PATHOLOGY_LAB" | "TECHNICIAN";

interface HMSDashboardProps {
  currentRole: UserRole;
  userName: string;
  hospitalName: string;
  userId: string;
}

function CriticalAlertsPanel() {
  const { data: criticalAlerts = [], isLoading } = useQuery<CriticalAlert[]>({
    queryKey: ['/api/critical-alerts'],
    refetchInterval: 10000, 
  });

  const activeAlerts = criticalAlerts.filter(alert => alert.status === 'active');

  const handleAcknowledge = async (alertId: number) => {
    try {
      await apiRequest("PATCH", `/api/critical-alerts/${alertId}/acknowledge`, {});
      queryClient.invalidateQueries({ queryKey: ['/api/critical-alerts'] });
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
    }
  };

  const handleResolve = async (alertId: number) => {
    try {
      await apiRequest("PATCH", `/api/critical-alerts/${alertId}/resolve`, { resolutionNotes: "Resolved by admin" });
      queryClient.invalidateQueries({ queryKey: ['/api/critical-alerts'] });
    } catch (error) {
      console.error("Failed to resolve alert:", error);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (activeAlerts.length === 0) {
    return (
      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-3 text-green-700 dark:text-green-400">
            <CheckCircle className="h-6 w-6" />
            <span className="text-lg font-medium">No Active Critical Alerts</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card className="border-2 border-red-400 dark:border-red-700 bg-red-50/80 dark:bg-red-950/30 shadow-lg shadow-red-500/10">
        <CardHeader className="pb-3 border-b border-red-200 dark:border-red-800">
          <CardTitle className="flex items-center gap-3 text-red-700 dark:text-red-400">
            <div className="relative">
              <AlertTriangle className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
            </div>
            Critical Alerts ({activeAlerts.length})
          </CardTitle>
          <CardDescription className="text-red-600/80 dark:text-red-400/80">
            Immediate attention required for the following alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {activeAlerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-red-200 dark:border-red-800 shadow-sm"
              data-testid={`critical-alert-${alert.id}`}
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="destructive" 
                    className="uppercase text-xs"
                    data-testid={`alert-severity-${alert.id}`}
                  >
                    {alert.severity}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {alert.alertType.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {alert.alertTitle}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {alert.alertMessage}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'Just now'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAcknowledge(alert.id)}
                  className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950"
                  data-testid={`button-acknowledge-${alert.id}`}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Acknowledge
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleResolve(alert.id)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid={`button-resolve-${alert.id}`}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Resolve
                </Button>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function HMSDashboard({ currentRole, userName, hospitalName, userId }: HMSDashboardProps) {
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);

  // Initialize WebSocket connection for real-time updates
  useNotifications({ 
    userId, 
    userRole: currentRole,
    enabled: !!userId 
  });

  // Fetch activity logs from API
  const { data: activityLogs = [], isLoading: activitiesLoading } = useQuery<ActivityLog[]>({
    queryKey: ['/api/activity-logs'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch appointments for real-time display (updated via WebSocket)
  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
  });

  // Fetch active patient count from tracking system
  const { data: activePatientData } = useQuery<{ count: number }>({
    queryKey: ['/api/tracking/patients/active-count'],
  });

  // Fetch critical alerts for stat card (same data as CriticalAlertsPanel)
  const { data: criticalAlertsData = [] } = useQuery<CriticalAlert[]>({
    queryKey: ['/api/critical-alerts'],
    refetchInterval: 10000,
  });
  const activeCriticalAlerts = criticalAlertsData.filter(alert => alert.status === 'active');

  // For NURSE: fetch assigned patients to filter activity logs
  const { data: assignedPatients = [] } = useQuery<ServicePatient[]>({
    queryKey: currentRole === "NURSE" && userId 
      ? ["/api/patients/assigned", userId]
      : ["/api/patients/service"],
    enabled: currentRole === "NURSE",
  });

  // Get assigned patient names for NURSE filtering
  const nursePatientNames = currentRole === "NURSE"
    ? assignedPatients.map(p => `${p.firstName} ${p.lastName}`.toLowerCase())
    : [];

  // Get today's appointments count
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(apt => apt.appointmentDate === today);

  // Filter activity logs based on user role
  const filteredActivityLogs = activityLogs.filter(activity => {
    // Check if activity is consent-related (entity_type contains "consent")
    const isConsentActivity = activity.entityType?.toLowerCase().includes("consent") || 
                              activity.action.toLowerCase().includes("consent");
    
    // NURSE: only show activity related to their assigned patients
    // Hide consent-related activity (only ADMIN should see consent activity)
    if (currentRole === "NURSE") {
      // Hide consent-related activities from NURSE
      if (isConsentActivity) {
        return false;
      }
      // Only show patient-related activity for assigned patients
      if (activity.entityType === "patient") {
        return nursePatientNames.some(name => 
          activity.action.toLowerCase().includes(name)
        );
      }
      // Show general hospital activities (appointments, system, etc.)
      return true;
    }
    
    // Non-ADMIN users: hide consent-related activities
    if (currentRole !== "ADMIN") {
      if (isConsentActivity) {
        return false;
      }
    }
    
    // ADMIN sees everything
    return true;
  });

  // Get recent activities (limit 5 for dashboard)
  const recentActivities = filteredActivityLogs.slice(0, 5);

  // Format time ago
  const formatTimeAgo = (date: Date | string | null) => {
    if (!date) return "Just now";
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Dashboard data with real counts from database
  const activePatientCount = activePatientData?.count ?? 0;
  const criticalAlertCount = activeCriticalAlerts.length;

  const getDashboardData = (role: UserRole) => {
    const commonStats = [
      { title: "Active Patients", value: activePatientCount.toString(), change: "+12%", icon: Users, urgent: false },
      { title: "Today's Appointments", value: todayAppointments.length.toString(), change: "Live", icon: Calendar, urgent: false }
    ];

    const roleSpecificStats: Record<UserRole, any[]> = {
      SUPER_ADMIN: [
        { title: "Total Users", value: "156", change: "+12", icon: Users, urgent: false },
        { title: "System Health", value: "99.9%", change: "+0.1%", icon: Shield, urgent: false },
        { title: "Pending Approvals", value: "8", change: "+3", icon: Clock, urgent: false },
        { title: "Audit Events", value: "1,234", change: "+45", icon: Activity, urgent: false }
      ],
      ADMIN: [
        ...commonStats,
        { title: "System Uptime", value: "99.9%", change: "+0.1%", icon: Shield, urgent: false },
        { title: "Critical Alerts", value: criticalAlertCount.toString(), change: criticalAlertCount > 0 ? "Active" : "None", icon: AlertTriangle, urgent: criticalAlertCount > 0 }
      ],
      DOCTOR: [
        { title: "My Patients", value: "42", change: "+3", icon: Users, urgent: false },
        { title: "Today's Consultations", value: "12", change: "+2", icon: Stethoscope, urgent: false },
        { title: "Pending Reports", value: "7", change: "-1", icon: FileText, urgent: false },
        { title: "Emergency Cases", value: "2", change: "+1", icon: AlertTriangle, urgent: true }
      ],
      NURSE: [
        { title: "Assigned Patients", value: "28", change: "+1", icon: Users, urgent: false },
        { title: "Vitals Due", value: "8", change: "-3", icon: HeartPulse, urgent: false },
        { title: "Medication Due", value: "15", change: "+2", icon: Clock, urgent: false },
        { title: "Critical Patients", value: "3", change: "0", icon: AlertTriangle, urgent: true }
      ],
      OPD_MANAGER: [
        { title: "Queue Length", value: "25", change: "-5", icon: Users, urgent: false },
        { title: "Average Wait", value: "22m", change: "-8m", icon: Clock, urgent: false },
        { title: "Completed Today", value: "67", change: "+12", icon: TrendingUp, urgent: false },
        { title: "Delayed Appointments", value: "4", change: "+2", icon: AlertTriangle, urgent: true }
      ],
      PATIENT: [
        { title: "Upcoming Appointments", value: "2", change: "+1", icon: Calendar, urgent: false },
        { title: "Test Results", value: "3", change: "+1", icon: FileText, urgent: false },
        { title: "Prescriptions", value: "2", change: "0", icon: HeartPulse, urgent: false },
        { title: "Follow-ups Due", value: "1", change: "+1", icon: Clock, urgent: true }
      ],
      MEDICAL_STORE: [
        { title: "Pending Orders", value: "15", change: "+3", icon: FileText, urgent: false },
        { title: "Low Stock Items", value: "5", change: "+2", icon: AlertTriangle, urgent: true },
        { title: "Dispensed Today", value: "28", change: "+5", icon: TrendingUp, urgent: false },
        { title: "Revenue Today", value: "Rs. 12.5K", change: "+8%", icon: BarChart3, urgent: false }
      ],
      PATHOLOGY_LAB: [
        { title: "Pending Tests", value: "12", change: "+2", icon: FileText, urgent: false },
        { title: "Reports Uploaded", value: "34", change: "+5", icon: TrendingUp, urgent: false },
        { title: "Critical Results", value: "2", change: "+1", icon: AlertTriangle, urgent: true },
        { title: "Samples Collected", value: "18", change: "+3", icon: Activity, urgent: false }
      ],
      TECHNICIAN: [
        { title: "Pending Scans", value: "8", change: "+2", icon: FileText, urgent: false },
        { title: "Reports Uploaded", value: "15", change: "+3", icon: TrendingUp, urgent: false },
        { title: "Today's Procedures", value: "12", change: "+4", icon: Activity, urgent: false },
        { title: "Urgent Requests", value: "3", change: "+1", icon: AlertTriangle, urgent: true }
      ]
    };

    return roleSpecificStats[role];
  };

  const dashboardStats = getDashboardData(currentRole);

  const getActivityBadgeVariant = (type: string) => {
    switch (type) {
      case "urgent": return "destructive";
      case "success": return "default";
      case "info": return "secondary";
      case "warning": return "outline";
      default: return "outline";
    }
  };

  const getActivityIndicatorColor = (type: string) => {
    switch (type) {
      case "urgent": return "bg-red-500";
      case "success": return "bg-green-500";
      case "info": return "bg-blue-500";
      case "warning": return "bg-yellow-500";
      default: return "bg-gray-400";
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "SUPER_ADMIN": return "from-red-500/25 to-rose-600/15";
      case "ADMIN": return "from-violet-500/25 to-purple-600/15";
      case "DOCTOR": return "from-cyan-500/25 to-blue-600/15";
      case "NURSE": return "from-emerald-500/25 to-green-600/15";
      case "OPD_MANAGER": return "from-amber-500/25 to-orange-600/15";
      case "PATIENT": return "from-teal-500/25 to-cyan-600/15";
      case "MEDICAL_STORE": return "from-rose-500/25 to-pink-600/15";
      case "PATHOLOGY_LAB": return "from-indigo-500/25 to-blue-600/15";
      case "TECHNICIAN": return "from-sky-500/25 to-blue-600/15";
      default: return "from-slate-500/25 to-gray-600/15";
    }
  };

  const getStatCardGradient = (urgent: boolean, index: number) => {
    if (urgent) {
      return "bg-gradient-to-br from-red-50 via-rose-50/80 to-orange-50/60 dark:from-red-950/40 dark:via-rose-900/30 dark:to-red-950/20 border-red-300 dark:border-red-700";
    }
    const gradients = [
      "bg-gradient-to-br from-cyan-50 via-teal-50/80 to-blue-50/60 dark:from-cyan-950/40 dark:via-teal-900/30 dark:to-cyan-950/20 border-cyan-300 dark:border-cyan-700",
      "bg-gradient-to-br from-emerald-50 via-green-50/80 to-teal-50/60 dark:from-emerald-950/40 dark:via-green-900/30 dark:to-emerald-950/20 border-emerald-300 dark:border-emerald-700",
      "bg-gradient-to-br from-violet-50 via-purple-50/80 to-indigo-50/60 dark:from-violet-950/40 dark:via-purple-900/30 dark:to-violet-950/20 border-violet-300 dark:border-violet-700",
      "bg-gradient-to-br from-amber-50 via-orange-50/80 to-yellow-50/60 dark:from-amber-950/40 dark:via-orange-900/30 dark:to-amber-950/20 border-amber-300 dark:border-amber-700"
    ];
    return gradients[index % gradients.length];
  };

  const getStatIconColors = (index: number, urgent: boolean) => {
    if (urgent) {
      return "bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30";
    }
    const colors = [
      "bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-lg shadow-cyan-500/30",
      "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30",
      "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30",
      "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30"
    ];
    return colors[index % colors.length];
  };

  const renderActivityItem = (activity: ActivityLog, index: number, isLast: boolean) => (
    <div 
      key={activity.id} 
      className="flex items-start gap-4 p-3 rounded-lg hover-elevate transition-all duration-200" 
      data-testid={`activity-${index}`}
    >
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${getActivityIndicatorColor(activity.activityType)} mt-2`} />
        {!isLast && (
          <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-px h-8 bg-border" />
        )}
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none text-foreground">
          {activity.action}
        </p>
        <p className="text-sm text-muted-foreground">
          by <span className="font-medium text-foreground">{activity.performedBy}</span> • {formatTimeAgo(activity.createdAt)}
        </p>
      </div>
      <Button 
        variant="outline"
        size="sm"
        onClick={() => setSelectedActivity(activity)}
        className="text-xs"
        data-testid={`button-activity-info-${index}`}
      >
        info
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen hospital-hero hospital-scrollbar">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6 page-content">
        {/* Welcome Header with Hospital Styling */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative"
        >
          <div className={`absolute inset-0 bg-gradient-to-r ${getRoleColor(currentRole)} rounded-xl opacity-40 blur-sm`} />
          <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-white/60 dark:border-slate-700/60 rounded-xl p-6 md:p-8 shadow-xl shadow-primary/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <h1 className="hero-title text-foreground flex items-center gap-3 flex-wrap">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className={`p-3 rounded-xl bg-gradient-to-br ${getRoleColor(currentRole)} shadow-lg`}
                  >
                    {currentRole === "DOCTOR" && <Stethoscope className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />}
                    {currentRole === "NURSE" && <HeartPulse className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />}
                    {currentRole === "ADMIN" && <Shield className="h-6 w-6 text-violet-600 dark:text-violet-400" />}
                    {currentRole === "OPD_MANAGER" && <BarChart3 className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
                    {currentRole === "PATIENT" && <UserCheck className="h-6 w-6 text-teal-600 dark:text-teal-400" />}
                  </motion.div>
                  Welcome back, {userName}
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  {hospitalName} • {currentRole.replace("_", " ")} Dashboard
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="flex items-center gap-3 px-4 py-2 bg-emerald-50/80 dark:bg-emerald-900/30 rounded-full border border-emerald-200/50 dark:border-emerald-700/50"
                >
                  <div className="relative flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    System Online
                  </div>
                </motion.div>
                {currentRole === "ADMIN" && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50/80 dark:bg-red-900/30 rounded-full border border-red-200/50 dark:border-red-700/50 emergency-pulse"
                  >
                    <Ambulance className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-400">24/7 Emergency</span>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* OPD Info Section - Only for OPD Manager */}
        {currentRole === "OPD_MANAGER" && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-yellow-950/20">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-500 rounded-xl">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">OPD - Outpatient Department</h2>
                    <p className="text-muted-foreground text-sm">Gravity Hospital • OPD Wing</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 p-3 rounded-lg">
                    <MapPin className="h-4 w-4 text-orange-600" />
                    <div className="text-sm">
                      <p className="text-muted-foreground">Address</p>
                      <p className="font-medium text-xs">Gat No 167, Sahyog Nagar, Nigdi</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 p-3 rounded-lg">
                    <Phone className="h-4 w-4 text-orange-600" />
                    <div className="text-sm">
                      <p className="text-muted-foreground">Contact</p>
                      <p className="font-medium">+91 20 1234 5679</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 p-3 rounded-lg">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <div className="text-sm">
                      <p className="text-muted-foreground">Hours</p>
                      <p className="font-medium">Mon-Sat: 8AM-8PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Stats Grid with Motion Animations */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
          className="stats-grid"
        >
          {dashboardStats.map((stat, index) => (
            <motion.div
              key={index}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="hospital-stat-card rounded-xl"
            >
              <Card 
                className={`group overflow-visible border-0 shadow-md hover:shadow-xl transition-shadow duration-300 ${getStatCardGradient(stat.urgent, index)}`}
                data-testid={`card-stat-${index}`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <motion.div 
                    whileHover={{ scale: 1.15, rotate: 8 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className={`stat-icon-container p-2.5 rounded-xl ${getStatIconColors(index, stat.urgent)}`}
                  >
                    <stat.icon className="h-4 w-4" />
                  </motion.div>
                </CardHeader>
                <CardContent>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.1, type: "spring" }}
                    className="text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight" 
                    data-testid={`text-stat-value-${index}`}
                  >
                    {stat.value}
                  </motion.div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                      stat.change.startsWith('+') 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' 
                        : stat.change.startsWith('-') 
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' 
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {stat.change.startsWith('+') ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : stat.change.startsWith('-') ? (
                        <TrendingUp className="h-3 w-3 rotate-180" />
                      ) : (
                        <TrendingUp className="h-3 w-3" />
                      )}
                      {stat.change}
                    </span>
                    <span className="text-muted-foreground/70">from last week</span>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Critical Alerts Panel - ADMIN Only */}
        {currentRole === "ADMIN" && <CriticalAlertsPanel />}

        {/* Recent Activity - Full Width */}
        <Card className="glass-card border border-slate-200/60 dark:border-slate-700/60 shadow-xl stagger-item">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-lg shadow-cyan-500/30">
                <Activity className="h-5 w-5" />
              </div>
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-4 p-3 animate-pulse">
                    <div className="w-3 h-3 rounded-full bg-muted mt-2" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                    <div className="h-5 bg-muted rounded w-12" />
                  </div>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity, index) => 
                  renderActivityItem(activity, index, index === recentActivities.length - 1)
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent activity to display</p>
                <p className="text-sm">Activities will appear here as actions are performed in the system</p>
              </div>
            )}
            <div className="mt-6 pt-4 border-t border-border">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-muted-foreground"
                onClick={() => setShowAllActivities(true)}
                data-testid="button-view-all-activity"
              >
                <Activity className="h-4 w-4 mr-2" />
                View All Activity
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Hospital Footer - Only for OPD Manager */}
        {currentRole === "OPD_MANAGER" && (
          <footer className="bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-800/95 dark:to-slate-800 rounded-lg border mt-8">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2">
                  <Building2 className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-bold">Gravity Hospital</h2>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Healthcare Excellence</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Address</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Gat No, 167, Sahyog Nager,<br />
                    Triveni Nagar, Nigdi,<br />
                    Pimpri-Chinchwad,<br />
                    Maharashtra 411062
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Contact</h3>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Main: +91 20 1234 5678</p>
                    <p>Emergency: +91 20 1234 5680</p>
                    <p>OPD: +91 20 1234 5679</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Timings</h3>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>24/7 Emergency</p>
                    <p>OPD: Mon-Sat 8AM-8PM</p>
                    <p>Sun: 9AM-1PM</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Online</h3>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>info@gravityhospital.com</p>
                    <p>opd@gravityhospital.com</p>
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      <span>www.gravityhospital.com</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t mt-6 pt-4 text-center text-xs text-muted-foreground">
                <p>&copy; 2024 Gravity Hospital. All rights reserved.</p>
              </div>
            </div>
          </footer>
        )}
      </div>

      {/* All Activities Dialog */}
      <Dialog open={showAllActivities} onOpenChange={setShowAllActivities}>
        <DialogContent className="max-w-2xl max-h-[80vh]" data-testid="dialog-all-activities">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              All System Activity
            </DialogTitle>
            <DialogDescription>
              Complete history of all actions performed in the system
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {filteredActivityLogs.length > 0 ? (
              <div className="space-y-2">
                {filteredActivityLogs.map((activity, index) => (
                  <div 
                    key={activity.id} 
                    className="flex items-start gap-4 p-3 rounded-lg border bg-card"
                    data-testid={`all-activity-${index}`}
                  >
                    <div className={`w-3 h-3 rounded-full ${getActivityIndicatorColor(activity.activityType)} mt-2 shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none text-foreground truncate">
                        {activity.action}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        by <span className="font-medium">{activity.performedBy}</span>
                        {activity.performedByRole && (
                          <span className="text-xs ml-1">({activity.performedByRole})</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(activity.createdAt)}
                        {activity.entityType && (
                          <span className="ml-2 text-primary">• {activity.entityType}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedActivity(activity)}
                        className="text-xs"
                        data-testid={`button-all-activity-info-${index}`}
                      >
                        info
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No activity logs found</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Activity Details Dialog */}
      <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
        <DialogContent className="max-w-lg" data-testid="dialog-activity-details">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Activity Details
            </DialogTitle>
            <DialogDescription>
              Full information about this activity
            </DialogDescription>
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className={`w-4 h-4 rounded-full ${getActivityIndicatorColor(selectedActivity.activityType)} mt-1 shrink-0`} />
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{selectedActivity.action}</h4>
                  <Badge 
                    variant={getActivityBadgeVariant(selectedActivity.activityType)}
                    className="text-xs mt-2"
                  >
                    {selectedActivity.activityType}
                  </Badge>
                </div>
              </div>
              
              <div className="border-t pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Performed By</p>
                    <p className="font-medium text-foreground">{selectedActivity.performedBy}</p>
                  </div>
                  {selectedActivity.performedByRole && (
                    <div>
                      <p className="text-muted-foreground">Role</p>
                      <p className="font-medium text-foreground">{selectedActivity.performedByRole}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Time</p>
                    <p className="font-medium text-foreground">{formatTimeAgo(selectedActivity.createdAt)}</p>
                  </div>
                  {selectedActivity.entityType && (
                    <div>
                      <p className="text-muted-foreground">Entity Type</p>
                      <p className="font-medium text-foreground">{selectedActivity.entityType}</p>
                    </div>
                  )}
                  {selectedActivity.entityId && (
                    <div>
                      <p className="text-muted-foreground">Entity ID</p>
                      <p className="font-medium text-foreground text-xs break-all">{selectedActivity.entityId}</p>
                    </div>
                  )}
                </div>
                
                {selectedActivity.details && (
                  <div className="mt-4">
                    <p className="text-muted-foreground text-sm mb-2">Additional Details</p>
                    <div className="bg-muted/50 rounded-md p-3 text-sm">
                      <pre className="whitespace-pre-wrap text-foreground font-mono text-xs">
                        {typeof selectedActivity.details === 'object' 
                          ? JSON.stringify(selectedActivity.details, null, 2)
                          : selectedActivity.details}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setSelectedActivity(null)} data-testid="button-close-activity-details">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
