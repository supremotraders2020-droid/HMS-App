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
  Ambulance,
  CheckCircle,
  Eye,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ActivityLog, Appointment, ServicePatient, CriticalAlert } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { ContactsSpeedDial } from "@/components/ContactsSpeedDial";

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

  const handleAcknowledge = async (alertId: string) => {
    try {
      await apiRequest("PATCH", `/api/critical-alerts/${alertId}/acknowledge`, {});
      queryClient.invalidateQueries({ queryKey: ['/api/critical-alerts'] });
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await apiRequest("PATCH", `/api/critical-alerts/${alertId}/resolve`, { resolutionNotes: "Resolved by admin" });
      queryClient.invalidateQueries({ queryKey: ['/api/critical-alerts'] });
    } catch (error) {
      console.error("Failed to resolve alert:", error);
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-red-200/50 dark:border-red-800/50 bg-gradient-to-br from-red-50/50 to-rose-50/30 dark:from-red-950/20 dark:to-rose-950/10">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (activeAlerts.length === 0) {
    return (
      <Card className="border border-emerald-200/50 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50/50 to-green-50/30 dark:from-emerald-950/20 dark:to-green-950/10">
        <CardContent className="py-5">
          <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">All Clear - No Critical Alerts</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-red-300/50 dark:border-red-700/50 bg-gradient-to-br from-red-50/80 to-rose-50/50 dark:from-red-950/30 dark:to-rose-950/20 overflow-hidden">
      <CardHeader className="pb-3 border-b border-red-200/50 dark:border-red-800/50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400 text-base">
            <div className="relative">
              <AlertTriangle className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full animate-ping" />
            </div>
            Critical Alerts
            <Badge variant="destructive" className="ml-1 text-xs">{activeAlerts.length}</Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3 max-h-64 overflow-y-auto">
        {activeAlerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white/80 dark:bg-slate-800/80 rounded-lg border border-red-200/50 dark:border-red-800/50"
            data-testid={`critical-alert-${alert.id}`}
          >
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="destructive" className="text-[10px] uppercase">{alert.severity}</Badge>
                <Badge variant="outline" className="text-[10px]">{alert.alertType.replace(/_/g, ' ')}</Badge>
              </div>
              <p className="font-medium text-sm text-slate-900 dark:text-white truncate">{alert.alertTitle}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{alert.alertMessage}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAcknowledge(alert.id)}
                data-testid={`button-acknowledge-${alert.id}`}
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                Ack
              </Button>
              <Button
                size="sm"
                onClick={() => handleResolve(alert.id)}
                className="bg-emerald-600 text-white"
                data-testid={`button-resolve-${alert.id}`}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                Resolve
              </Button>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function HMSDashboard({ currentRole, userName, hospitalName, userId }: HMSDashboardProps) {
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);
  const { toast } = useToast();

  useNotifications({ 
    userId, 
    userRole: currentRole,
    enabled: !!userId 
  });

  const { data: activityLogs = [], isLoading: activitiesLoading } = useQuery<ActivityLog[]>({
    queryKey: ['/api/activity-logs'],
    refetchInterval: 30000,
  });

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
  });

  const { data: activePatientData } = useQuery<{ count: number }>({
    queryKey: ['/api/tracking/patients/active-count'],
  });

  const { data: criticalAlertsData = [] } = useQuery<CriticalAlert[]>({
    queryKey: ['/api/critical-alerts'],
    refetchInterval: 10000,
  });
  const activeCriticalAlerts = criticalAlertsData.filter(alert => alert.status === 'active');

  const { data: assignedPatients = [] } = useQuery<ServicePatient[]>({
    queryKey: currentRole === "NURSE" && userId 
      ? ["/api/patients/assigned", userId]
      : ["/api/patients/service"],
    enabled: currentRole === "NURSE",
  });

  const nursePatientNames = currentRole === "NURSE"
    ? assignedPatients.map(p => `${p.firstName} ${p.lastName}`.toLowerCase())
    : [];

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(apt => apt.appointmentDate === today);

  const filteredActivityLogs = activityLogs.filter(activity => {
    const isConsentActivity = activity.entityType?.toLowerCase().includes("consent") || 
                              activity.action.toLowerCase().includes("consent");
    
    if (currentRole === "NURSE") {
      if (isConsentActivity) return false;
      if (activity.entityType === "patient") {
        return nursePatientNames.some(name => 
          activity.action.toLowerCase().includes(name)
        );
      }
      return true;
    }
    
    // PATHOLOGY_LAB only sees lab-related activities
    if (currentRole === "PATHOLOGY_LAB") {
      const actionLower = activity.action.toLowerCase();
      const entityLower = activity.entityType?.toLowerCase() || "";
      const isLabActivity = 
        entityLower.includes("lab") ||
        entityLower.includes("pathology") ||
        entityLower.includes("test") ||
        entityLower.includes("sample") ||
        entityLower.includes("report") ||
        actionLower.includes("lab") ||
        actionLower.includes("pathology") ||
        actionLower.includes("test order") ||
        actionLower.includes("sample") ||
        actionLower.includes("report upload");
      return isLabActivity;
    }
    
    if (currentRole !== "ADMIN" && isConsentActivity) return false;
    return true;
  });

  const recentActivities = filteredActivityLogs.slice(0, 5);

  const formatTimeAgo = (date: Date | string | null) => {
    if (!date) return "Just now";
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const activePatientCount = activePatientData?.count ?? 0;
  const criticalAlertCount = activeCriticalAlerts.length;

  const getDashboardData = (role: UserRole) => {
    const commonStats = [
      { title: "Active Patients", value: activePatientCount.toString(), change: "+12%", icon: Users, color: "cyan" },
      { title: "Today's Appointments", value: todayAppointments.length.toString(), change: "Live", icon: Calendar, color: "violet" }
    ];

    const roleSpecificStats: Record<UserRole, { title: string; value: string; change: string; icon: typeof Users; color: string; urgent?: boolean }[]> = {
      SUPER_ADMIN: [
        { title: "Total Users", value: "156", change: "+12", icon: Users, color: "cyan" },
        { title: "System Health", value: "99.9%", change: "+0.1%", icon: Shield, color: "emerald" },
        { title: "Pending Approvals", value: "8", change: "+3", icon: Clock, color: "amber" },
        { title: "Audit Events", value: "1,234", change: "+45", icon: Activity, color: "violet" }
      ],
      ADMIN: [
        ...commonStats,
        { title: "System Uptime", value: "99.9%", change: "+0.1%", icon: Shield, color: "emerald" },
        { title: "Critical Alerts", value: criticalAlertCount.toString(), change: criticalAlertCount > 0 ? "Active" : "None", icon: AlertTriangle, color: "red", urgent: criticalAlertCount > 0 }
      ],
      DOCTOR: [
        { title: "My Patients", value: "42", change: "+3", icon: Users, color: "cyan" },
        { title: "Consultations", value: "12", change: "+2", icon: Stethoscope, color: "violet" },
        { title: "Pending Reports", value: "7", change: "-1", icon: FileText, color: "amber" },
        { title: "Emergency", value: "2", change: "+1", icon: AlertTriangle, color: "red", urgent: true }
      ],
      NURSE: [
        { title: "Assigned Patients", value: "28", change: "+1", icon: Users, color: "cyan" },
        { title: "Vitals Due", value: "8", change: "-3", icon: HeartPulse, color: "rose" },
        { title: "Medication Due", value: "15", change: "+2", icon: Clock, color: "amber" },
        { title: "Critical Patients", value: "3", change: "0", icon: AlertTriangle, color: "red", urgent: true }
      ],
      OPD_MANAGER: [
        { title: "Queue Length", value: "25", change: "-5", icon: Users, color: "cyan" },
        { title: "Avg Wait", value: "22m", change: "-8m", icon: Clock, color: "amber" },
        { title: "Completed", value: "67", change: "+12", icon: TrendingUp, color: "emerald" },
        { title: "Delayed", value: "4", change: "+2", icon: AlertTriangle, color: "red", urgent: true }
      ],
      PATIENT: [
        { title: "Appointments", value: "2", change: "+1", icon: Calendar, color: "violet" },
        { title: "Test Results", value: "3", change: "+1", icon: FileText, color: "cyan" },
        { title: "Prescriptions", value: "2", change: "0", icon: HeartPulse, color: "emerald" },
        { title: "Follow-ups", value: "1", change: "+1", icon: Clock, color: "amber" }
      ],
      MEDICAL_STORE: [
        { title: "Pending Orders", value: "15", change: "+3", icon: FileText, color: "violet" },
        { title: "Low Stock", value: "5", change: "+2", icon: AlertTriangle, color: "red", urgent: true },
        { title: "Dispensed", value: "28", change: "+5", icon: TrendingUp, color: "emerald" },
        { title: "Revenue", value: "Rs.12.5K", change: "+8%", icon: BarChart3, color: "cyan" }
      ],
      PATHOLOGY_LAB: [
        { title: "Pending Tests", value: "12", change: "+2", icon: FileText, color: "violet" },
        { title: "Reports Done", value: "34", change: "+5", icon: TrendingUp, color: "emerald" },
        { title: "Critical Results", value: "2", change: "+1", icon: AlertTriangle, color: "red", urgent: true },
        { title: "Samples", value: "18", change: "+3", icon: Activity, color: "cyan" }
      ],
      TECHNICIAN: [
        { title: "Pending Scans", value: "8", change: "+2", icon: FileText, color: "violet" },
        { title: "Uploaded", value: "15", change: "+3", icon: TrendingUp, color: "emerald" },
        { title: "Procedures", value: "12", change: "+4", icon: Activity, color: "cyan" },
        { title: "Urgent", value: "3", change: "+1", icon: AlertTriangle, color: "red", urgent: true }
      ]
    };

    return roleSpecificStats[role];
  };

  const dashboardStats = getDashboardData(currentRole);

  const getColorClasses = (color: string, urgent?: boolean) => {
    if (urgent) {
      return {
        bg: "bg-gradient-to-br from-red-50 to-rose-100/50 dark:from-red-950/40 dark:to-rose-950/20",
        border: "border-red-200/60 dark:border-red-800/40",
        icon: "bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-red-500/25",
        text: "text-red-600 dark:text-red-400"
      };
    }
    const colorMap: Record<string, { bg: string; border: string; icon: string; text: string }> = {
      cyan: {
        bg: "bg-gradient-to-br from-cyan-50 to-teal-100/50 dark:from-cyan-950/40 dark:to-teal-950/20",
        border: "border-cyan-200/60 dark:border-cyan-800/40",
        icon: "bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-cyan-500/25",
        text: "text-cyan-600 dark:text-cyan-400"
      },
      violet: {
        bg: "bg-gradient-to-br from-violet-50 to-purple-100/50 dark:from-violet-950/40 dark:to-purple-950/20",
        border: "border-violet-200/60 dark:border-violet-800/40",
        icon: "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-violet-500/25",
        text: "text-violet-600 dark:text-violet-400"
      },
      emerald: {
        bg: "bg-gradient-to-br from-emerald-50 to-green-100/50 dark:from-emerald-950/40 dark:to-green-950/20",
        border: "border-emerald-200/60 dark:border-emerald-800/40",
        icon: "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-emerald-500/25",
        text: "text-emerald-600 dark:text-emerald-400"
      },
      amber: {
        bg: "bg-gradient-to-br from-amber-50 to-orange-100/50 dark:from-amber-950/40 dark:to-orange-950/20",
        border: "border-amber-200/60 dark:border-amber-800/40",
        icon: "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/25",
        text: "text-amber-600 dark:text-amber-400"
      },
      rose: {
        bg: "bg-gradient-to-br from-rose-50 to-pink-100/50 dark:from-rose-950/40 dark:to-pink-950/20",
        border: "border-rose-200/60 dark:border-rose-800/40",
        icon: "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/25",
        text: "text-rose-600 dark:text-rose-400"
      },
      red: {
        bg: "bg-gradient-to-br from-red-50 to-rose-100/50 dark:from-red-950/40 dark:to-rose-950/20",
        border: "border-red-200/60 dark:border-red-800/40",
        icon: "bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-red-500/25",
        text: "text-red-600 dark:text-red-400"
      }
    };
    return colorMap[color] || colorMap.cyan;
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "DOCTOR": return <Stethoscope className="h-5 w-5" />;
      case "NURSE": return <HeartPulse className="h-5 w-5" />;
      case "ADMIN": return <Shield className="h-5 w-5" />;
      case "OPD_MANAGER": return <BarChart3 className="h-5 w-5" />;
      case "PATIENT": return <UserCheck className="h-5 w-5" />;
      case "SUPER_ADMIN": return <Shield className="h-5 w-5" />;
      default: return <Users className="h-5 w-5" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "DOCTOR": return "from-cyan-500 to-blue-600";
      case "NURSE": return "from-emerald-500 to-teal-600";
      case "ADMIN": return "from-violet-500 to-purple-600";
      case "OPD_MANAGER": return "from-amber-500 to-orange-600";
      case "PATIENT": return "from-teal-500 to-cyan-600";
      case "SUPER_ADMIN": return "from-rose-500 to-red-600";
      default: return "from-slate-500 to-gray-600";
    }
  };

  const getActivityIndicatorColor = (type: string) => {
    switch (type) {
      case "urgent": return "bg-red-500";
      case "success": return "bg-emerald-500";
      case "info": return "bg-blue-500";
      case "warning": return "bg-amber-500";
      default: return "bg-slate-400";
    }
  };

  const getActivityBadgeVariant = (type: string) => {
    switch (type) {
      case "urgent": return "destructive";
      case "success": return "default";
      case "info": return "secondary";
      case "warning": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="h-full overflow-y-auto">
        <div className="container mx-auto px-4 py-6 md:px-6 lg:px-8 space-y-6 max-w-7xl">
          
          {/* Welcome Header - Compact & Modern */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
            <div className="relative p-5 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.05, rotate: 3 }}
                    className={`p-3 rounded-xl bg-gradient-to-br ${getRoleColor(currentRole)} text-white shadow-lg`}
                  >
                    {getRoleIcon(currentRole)}
                  </motion.div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Welcome, {userName}
                      <Sparkles className="h-4 w-4 text-amber-500" />
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {hospitalName} <span className="text-slate-300 dark:text-slate-600 mx-1">|</span> {currentRole.replace("_", " ")}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      queryClient.invalidateQueries();
                      toast({ title: "Refreshed", description: "Data has been refreshed" });
                    }}
                    className="h-8"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Refresh
                  </Button>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Online</span>
                  </div>
                  {currentRole === "ADMIN" && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-950/40 rounded-full border border-red-200/50 dark:border-red-800/50">
                      <Ambulance className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                      <span className="text-xs font-medium text-red-700 dark:text-red-400">24/7 Emergency</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Hospital Speed Dial */}
          {(currentRole === "ADMIN" || currentRole === "DOCTOR" || currentRole === "NURSE" || currentRole === "OPD_MANAGER") && (
            <ContactsSpeedDial currentRole={currentRole} />
          )}

          {/* Stats Grid - Clean & Modern */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
          >
            {dashboardStats.map((stat, index) => {
              const colors = getColorClasses(stat.color, stat.urgent);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  whileHover={{ y: -2 }}
                >
                  <Card 
                    className={`relative overflow-hidden border ${colors.border} ${colors.bg} shadow-sm hover:shadow-md transition-all duration-300`}
                    data-testid={`card-stat-${index}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mb-1">
                            {stat.title}
                          </p>
                          <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight" data-testid={`text-stat-value-${index}`}>
                            {stat.value}
                          </p>
                          <div className="flex items-center gap-1 mt-2">
                            <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                              stat.change.startsWith('+') 
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' 
                                : stat.change.startsWith('-') 
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' 
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {stat.change.startsWith('+') && <ArrowUpRight className="h-2.5 w-2.5" />}
                              {stat.change}
                            </span>
                          </div>
                        </div>
                        <div className={`p-2 rounded-lg ${colors.icon} shadow-lg shrink-0`}>
                          <stat.icon className="h-4 w-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Critical Alerts Panel - ADMIN Only */}
          {currentRole === "ADMIN" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <CriticalAlertsPanel />
            </motion.div>
          )}

          {/* Recent Activity - Clean Card (Hidden for PATHOLOGY_LAB) */}
          {currentRole !== "PATHOLOGY_LAB" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-lg shadow-cyan-500/25">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                        <CardDescription className="text-xs">Latest system updates</CardDescription>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowAllActivities(true)}
                      className="text-xs text-slate-500"
                      data-testid="button-view-all-activity"
                    >
                      View All
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {activitiesLoading ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 animate-pulse">
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentActivities.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {recentActivities.map((activity, index) => (
                        <div 
                          key={activity.id} 
                          className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedActivity(activity)}
                          data-testid={`activity-${index}`}
                        >
                          <div className={`w-2.5 h-2.5 rounded-full ${getActivityIndicatorColor(activity.activityType)} shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                              {activity.action}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {activity.performedBy} <span className="text-slate-300 dark:text-slate-600 mx-1">|</span> {formatTimeAgo(activity.createdAt)}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-500">
                      <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          {/* Bottom spacer for scroll */}
          <div className="h-4" />
        </div>
      </div>

      {/* All Activities Dialog */}
      <Dialog open={showAllActivities} onOpenChange={setShowAllActivities}>
        <DialogContent className="max-w-2xl max-h-[85vh]" data-testid="dialog-all-activities">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Activity History
            </DialogTitle>
            <DialogDescription>Complete log of system activities</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {filteredActivityLogs.length > 0 ? (
              <div className="space-y-2 py-2">
                {filteredActivityLogs.map((activity, index) => (
                  <div 
                    key={activity.id} 
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedActivity(activity)}
                    data-testid={`all-activity-${index}`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${getActivityIndicatorColor(activity.activityType)} mt-1.5 shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{activity.action}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        by {activity.performedBy}
                        {activity.performedByRole && <span className="ml-1 opacity-70">({activity.performedByRole})</span>}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatTimeAgo(activity.createdAt)}
                        {activity.entityType && <span className="ml-2 text-primary">| {activity.entityType}</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>No activity logs found</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Activity Details Dialog */}
      <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
        <DialogContent className="max-w-md" data-testid="dialog-activity-details">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Activity Details
            </DialogTitle>
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className={`w-3 h-3 rounded-full ${getActivityIndicatorColor(selectedActivity.activityType)} mt-1.5 shrink-0`} />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{selectedActivity.action}</p>
                  <Badge 
                    variant={getActivityBadgeVariant(selectedActivity.activityType)}
                    className="text-xs mt-2"
                  >
                    {selectedActivity.activityType}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
                <div>
                  <p className="text-muted-foreground text-xs">Performed By</p>
                  <p className="font-medium">{selectedActivity.performedBy}</p>
                </div>
                {selectedActivity.performedByRole && (
                  <div>
                    <p className="text-muted-foreground text-xs">Role</p>
                    <p className="font-medium">{selectedActivity.performedByRole}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs">Time</p>
                  <p className="font-medium">{formatTimeAgo(selectedActivity.createdAt)}</p>
                </div>
                {selectedActivity.entityType && (
                  <div>
                    <p className="text-muted-foreground text-xs">Entity</p>
                    <p className="font-medium">{selectedActivity.entityType}</p>
                  </div>
                )}
              </div>
              
              {selectedActivity.details && (
                <div className="pt-4 border-t">
                  <p className="text-muted-foreground text-xs mb-2">Additional Details</p>
                  <div className="bg-muted/50 rounded-md p-3 text-xs font-mono overflow-x-auto">
                    <pre className="whitespace-pre-wrap">
                      {typeof selectedActivity.details === 'object' 
                        ? JSON.stringify(selectedActivity.details, null, 2)
                        : selectedActivity.details}
                    </pre>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedActivity(null)} data-testid="button-close-activity-details">
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
