import { useState } from "react";
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
  Building2
} from "lucide-react";
import type { ActivityLog, Appointment, ServicePatient } from "@shared/schema";

type UserRole = "ADMIN" | "DOCTOR" | "PATIENT" | "NURSE" | "OPD_MANAGER";

interface HMSDashboardProps {
  currentRole: UserRole;
  userName: string;
  hospitalName: string;
  userId: string;
}

export default function HMSDashboard({ currentRole, userName, hospitalName, userId }: HMSDashboardProps) {
  const [showAllActivities, setShowAllActivities] = useState(false);

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
    // NURSE: only show activity related to their assigned patients
    // Hide consent-related activity (only ADMIN should see consent activity)
    if (currentRole === "NURSE") {
      // Hide consent-related activities from NURSE
      if (activity.entityType === "consent" || 
          activity.action.toLowerCase().includes("consent")) {
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
      if (activity.entityType === "consent" || 
          activity.action.toLowerCase().includes("consent")) {
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

  // Dashboard data with real appointment counts
  const getDashboardData = (role: UserRole) => {
    const commonStats = [
      { title: "Active Patients", value: appointments.length.toString(), change: "+12%", icon: Users, urgent: false },
      { title: "Today's Appointments", value: todayAppointments.length.toString(), change: "Live", icon: Calendar, urgent: false }
    ];

    const roleSpecificStats: Record<UserRole, any[]> = {
      ADMIN: [
        ...commonStats,
        { title: "System Uptime", value: "99.9%", change: "+0.1%", icon: Shield, urgent: false },
        { title: "Critical Alerts", value: "3", change: "-2", icon: AlertTriangle, urgent: true }
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
      case "ADMIN": return "from-violet-500/25 to-purple-600/15";
      case "DOCTOR": return "from-cyan-500/25 to-blue-600/15";
      case "NURSE": return "from-emerald-500/25 to-green-600/15";
      case "OPD_MANAGER": return "from-amber-500/25 to-orange-600/15";
      case "PATIENT": return "from-teal-500/25 to-cyan-600/15";
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
      <Badge 
        variant={getActivityBadgeVariant(activity.activityType)}
        className="text-xs"
      >
        {activity.activityType}
      </Badge>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50/40 via-white to-teal-50/30 dark:from-slate-900 dark:via-slate-900/98 dark:to-cyan-950/20">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Welcome Header with Enhanced Styling */}
        <div className="relative animate-fade-in-up">
          <div className={`absolute inset-0 bg-gradient-to-r ${getRoleColor(currentRole)} rounded-xl opacity-40 blur-sm`} />
          <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-white/60 dark:border-slate-700/60 rounded-xl p-6 md:p-8 shadow-xl shadow-primary/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${getRoleColor(currentRole)} shadow-lg transition-transform duration-300 hover:scale-110`}>
                    {currentRole === "DOCTOR" && <Stethoscope className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />}
                    {currentRole === "NURSE" && <HeartPulse className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />}
                    {currentRole === "ADMIN" && <Shield className="h-6 w-6 text-violet-600 dark:text-violet-400" />}
                    {currentRole === "OPD_MANAGER" && <BarChart3 className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
                    {currentRole === "PATIENT" && <UserCheck className="h-6 w-6 text-teal-600 dark:text-teal-400" />}
                  </div>
                  Welcome back, {userName}
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  {hospitalName} • {currentRole.replace("_", " ")} Dashboard
                </p>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50/80 dark:bg-emerald-900/30 rounded-full border border-emerald-200/50 dark:border-emerald-700/50">
                <div className="relative flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  System Online
                </div>
              </div>
            </div>
          </div>
        </div>

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

        {/* Enhanced Stats Grid with Loading State */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat, index) => (
            <Card 
              key={index} 
              className={`group overflow-visible border shadow-md hover:shadow-xl transition-all duration-500 ease-out hover:-translate-y-1 glass-card ${getStatCardGradient(stat.urgent, index)} stagger-item`}
              data-testid={`card-stat-${index}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${getStatIconColors(index, stat.urgent)}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight" data-testid={`text-stat-value-${index}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
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
          ))}
        </div>

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
                    <Badge 
                      variant={getActivityBadgeVariant(activity.activityType)}
                      className="text-xs shrink-0"
                    >
                      {activity.activityType}
                    </Badge>
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
    </div>
  );
}
