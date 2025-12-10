import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  BarChart3
} from "lucide-react";
import type { ActivityLog, Appointment } from "@shared/schema";

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

  // Get today's appointments count
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(apt => apt.appointmentDate === today);

  // Get recent activities (limit 5 for dashboard)
  const recentActivities = activityLogs.slice(0, 5);

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
      case "ADMIN": return "from-purple-500/20 to-purple-600/10";
      case "DOCTOR": return "from-blue-500/20 to-blue-600/10";
      case "NURSE": return "from-green-500/20 to-green-600/10";
      case "OPD_MANAGER": return "from-orange-500/20 to-orange-600/10";
      case "PATIENT": return "from-teal-500/20 to-teal-600/10";
      default: return "from-gray-500/20 to-gray-600/10";
    }
  };

  const getStatCardGradient = (urgent: boolean) => {
    if (urgent) {
      return "bg-gradient-to-br from-red-50/80 via-white to-red-50/30 dark:from-red-950/20 dark:via-red-900/10 dark:to-red-950/5";
    }
    return "bg-gradient-to-br from-blue-50/60 via-white to-blue-50/30 dark:from-blue-950/20 dark:via-blue-900/10 dark:to-blue-950/5";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-800/50">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Welcome Header with Enhanced Styling */}
        <div className="relative">
          <div className={`absolute inset-0 bg-gradient-to-r ${getRoleColor(currentRole)} rounded-lg opacity-30`} />
          <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-lg p-6 md:p-8 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-semibold text-foreground flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${getRoleColor(currentRole)}`}>
                    {currentRole === "DOCTOR" && <Stethoscope className="h-6 w-6" />}
                    {currentRole === "NURSE" && <HeartPulse className="h-6 w-6" />}
                    {currentRole === "ADMIN" && <Shield className="h-6 w-6" />}
                    {currentRole === "OPD_MANAGER" && <BarChart3 className="h-6 w-6" />}
                    {currentRole === "PATIENT" && <UserCheck className="h-6 w-6" />}
                  </div>
                  Welcome back, {userName}
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  {hospitalName} • {currentRole.replace("_", " ")} Dashboard
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  System Online
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat, index) => (
            <Card 
              key={index} 
              className={`hover-elevate transition-all duration-300 border-0 shadow-sm hover:shadow-lg ${getStatCardGradient(stat.urgent)}`}
              data-testid={`card-stat-${index}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.urgent 
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold text-foreground mb-1" data-testid={`text-stat-value-${index}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {stat.change.startsWith('+') ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : stat.change.startsWith('-') ? (
                    <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
                  ) : (
                    <TrendingUp className="h-3 w-3 text-gray-400" />
                  )}
                  <span className={
                    stat.change.startsWith('+') 
                      ? 'text-green-600 font-medium' 
                      : stat.change.startsWith('-') 
                      ? 'text-red-600 font-medium' 
                      : 'text-muted-foreground'
                  }>
                    {stat.change}
                  </span>
                  from last week
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity - Full Width */}
        <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white dark:from-slate-800 dark:via-slate-800/95 dark:to-slate-700/50 border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
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
            {activityLogs.length > 0 ? (
              <div className="space-y-2">
                {activityLogs.map((activity, index) => (
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
