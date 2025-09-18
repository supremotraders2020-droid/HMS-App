import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  ClipboardCheck,
  Zap,
  BarChart3
} from "lucide-react";

type UserRole = "ADMIN" | "DOCTOR" | "PATIENT" | "NURSE" | "OPD_MANAGER";

interface HMSDashboardProps {
  currentRole: UserRole;
  userName: string;
  hospitalName: string;
}

export default function HMSDashboard({ currentRole, userName, hospitalName }: HMSDashboardProps) {
  // Mock data for different roles
  const getDashboardData = (role: UserRole) => {
    const commonStats = [
      { title: "Active Patients", value: "1,234", change: "+12%", icon: Users, urgent: false },
      { title: "Today's Appointments", value: "89", change: "+5%", icon: Calendar, urgent: false }
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

  const recentActivities = [
    { time: "2 hours ago", action: "New patient registration", user: "Dr. Smith", type: "info" },
    { time: "4 hours ago", action: "Emergency admission", user: "Nurse Johnson", type: "urgent" },
    { time: "6 hours ago", action: "Discharge completed", user: "Dr. Brown", type: "success" },
    { time: "8 hours ago", action: "Lab results updated", user: "Lab Tech", type: "info" }
  ];

  const getActivityBadgeVariant = (type: string) => {
    switch (type) {
      case "urgent": return "destructive";
      case "success": return "default";
      case "info": return "secondary";
      default: return "outline";
    }
  };

  const getActivityIndicatorColor = (type: string) => {
    switch (type) {
      case "urgent": return "bg-red-500";
      case "success": return "bg-green-500";
      case "info": return "bg-blue-500";
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

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {/* Enhanced Quick Actions */}
          <Card className="lg:col-span-1 xl:col-span-1 bg-gradient-to-br from-white via-blue-50/30 to-white dark:from-slate-800 dark:via-slate-800/95 dark:to-slate-700/50 border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks for your role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentRole === "DOCTOR" && (
                <>
                  <Button 
                    className="w-full justify-start bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700 border-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 dark:text-blue-300 dark:border-blue-800" 
                    variant="outline" 
                    data-testid="button-new-consultation"
                  >
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Start New Consultation
                  </Button>
                  <Button 
                    className="w-full justify-start bg-gradient-to-r from-green-50 to-green-100/50 text-green-700 border-green-200 dark:from-green-900/20 dark:to-green-800/20 dark:text-green-300 dark:border-green-800" 
                    variant="outline" 
                    data-testid="button-view-appointments"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    View Today's Appointments
                  </Button>
                  <Button 
                    className="w-full justify-start bg-gradient-to-r from-purple-50 to-purple-100/50 text-purple-700 border-purple-200 dark:from-purple-900/20 dark:to-purple-800/20 dark:text-purple-300 dark:border-purple-800" 
                    variant="outline" 
                    data-testid="button-patient-search"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Search Patients
                  </Button>
                </>
              )}
              {currentRole === "NURSE" && (
                <>
                  <Button 
                    className="w-full justify-start bg-gradient-to-r from-pink-50 to-pink-100/50 text-pink-700 border-pink-200 dark:from-pink-900/20 dark:to-pink-800/20 dark:text-pink-300 dark:border-pink-800" 
                    variant="outline" 
                    data-testid="button-record-vitals"
                  >
                    <HeartPulse className="h-4 w-4 mr-2" />
                    Record Vitals
                  </Button>
                  <Button 
                    className="w-full justify-start bg-gradient-to-r from-orange-50 to-orange-100/50 text-orange-700 border-orange-200 dark:from-orange-900/20 dark:to-orange-800/20 dark:text-orange-300 dark:border-orange-800" 
                    variant="outline" 
                    data-testid="button-medication-schedule"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Medication Schedule
                  </Button>
                  <Button 
                    className="w-full justify-start bg-gradient-to-r from-teal-50 to-teal-100/50 text-teal-700 border-teal-200 dark:from-teal-900/20 dark:to-teal-800/20 dark:text-teal-300 dark:border-teal-800" 
                    variant="outline" 
                    data-testid="button-patient-rounds"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Start Patient Rounds
                  </Button>
                </>
              )}
              {currentRole === "ADMIN" && (
                <>
                  <Button 
                    className="w-full justify-start bg-gradient-to-r from-indigo-50 to-indigo-100/50 text-indigo-700 border-indigo-200 dark:from-indigo-900/20 dark:to-indigo-800/20 dark:text-indigo-300 dark:border-indigo-800" 
                    variant="outline" 
                    data-testid="button-user-management"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    User Management
                  </Button>
                  <Button 
                    className="w-full justify-start bg-gradient-to-r from-violet-50 to-violet-100/50 text-violet-700 border-violet-200 dark:from-violet-900/20 dark:to-violet-800/20 dark:text-violet-300 dark:border-violet-800" 
                    variant="outline" 
                    data-testid="button-system-reports"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    System Reports
                  </Button>
                  <Button 
                    className="w-full justify-start bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-700 border-emerald-200 dark:from-emerald-900/20 dark:to-emerald-800/20 dark:text-emerald-300 dark:border-emerald-800" 
                    variant="outline" 
                    data-testid="button-backup-system"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    System Backup
                  </Button>
                </>
              )}
              {currentRole === "OPD_MANAGER" && (
                <>
                  <Button 
                    className="w-full justify-start bg-gradient-to-r from-amber-50 to-amber-100/50 text-amber-700 border-amber-200 dark:from-amber-900/20 dark:to-amber-800/20 dark:text-amber-300 dark:border-amber-800" 
                    variant="outline" 
                    data-testid="button-manage-queue"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Queue
                  </Button>
                  <Button 
                    className="w-full justify-start bg-gradient-to-r from-cyan-50 to-cyan-100/50 text-cyan-700 border-cyan-200 dark:from-cyan-900/20 dark:to-cyan-800/20 dark:text-cyan-300 dark:border-cyan-800" 
                    variant="outline" 
                    data-testid="button-staff-schedule"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Staff Schedule
                  </Button>
                  <Button 
                    className="w-full justify-start bg-gradient-to-r from-rose-50 to-rose-100/50 text-rose-700 border-rose-200 dark:from-rose-900/20 dark:to-rose-800/20 dark:text-rose-300 dark:border-rose-800" 
                    variant="outline" 
                    data-testid="button-daily-reports"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Daily Reports
                  </Button>
                </>
              )}
              {currentRole === "PATIENT" && (
                <>
                  <Button 
                    className="w-full justify-start bg-gradient-to-r from-sky-50 to-sky-100/50 text-sky-700 border-sky-200 dark:from-sky-900/20 dark:to-sky-800/20 dark:text-sky-300 dark:border-sky-800" 
                    variant="outline" 
                    data-testid="button-book-appointment"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Appointment
                  </Button>
                  <Button 
                    className="w-full justify-start bg-gradient-to-r from-lime-50 to-lime-100/50 text-lime-700 border-lime-200 dark:from-lime-900/20 dark:to-lime-800/20 dark:text-lime-300 dark:border-lime-800" 
                    variant="outline" 
                    data-testid="button-view-records"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Medical Records
                  </Button>
                  <Button 
                    className="w-full justify-start bg-gradient-to-r from-fuchsia-50 to-fuchsia-100/50 text-fuchsia-700 border-fuchsia-200 dark:from-fuchsia-900/20 dark:to-fuchsia-800/20 dark:text-fuchsia-300 dark:border-fuchsia-800" 
                    variant="outline" 
                    data-testid="button-test-results"
                  >
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Test Results
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Recent Activity */}
          <Card className="lg:col-span-1 xl:col-span-2 bg-gradient-to-br from-white via-slate-50/30 to-white dark:from-slate-800 dark:via-slate-800/95 dark:to-slate-700/50 border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-4 p-3 rounded-lg hover-elevate transition-all duration-200" 
                    data-testid={`activity-${index}`}
                  >
                    <div className="relative">
                      <div className={`w-3 h-3 rounded-full ${getActivityIndicatorColor(activity.type)} mt-2`} />
                      {index !== recentActivities.length - 1 && (
                        <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-px h-8 bg-border" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none text-foreground">
                        {activity.action}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        by <span className="font-medium text-foreground">{activity.user}</span> • {activity.time}
                      </p>
                    </div>
                    <Badge 
                      variant={getActivityBadgeVariant(activity.type)}
                      className="text-xs"
                    >
                      {activity.type}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-border">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-muted-foreground"
                  data-testid="button-view-all-activity"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  View All Activity
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}