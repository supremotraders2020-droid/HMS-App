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
  FileText
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
        { title: "System Uptime", value: "99.9%", change: "+0.1%", icon: Activity, urgent: false },
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
        { title: "Vitals Due", value: "8", change: "-3", icon: Activity, urgent: false },
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
        { title: "Prescriptions", value: "2", change: "0", icon: Activity, urgent: false },
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

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">
          Welcome back, {userName}
        </h1>
        <p className="text-muted-foreground">
          {hospitalName} • {currentRole.replace("_", " ")} Dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat, index) => (
          <Card key={index} data-testid={`card-stat-${index}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.urgent ? 'text-destructive' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`text-stat-value-${index}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.change.startsWith('+') ? 'text-green-600' : stat.change.startsWith('-') ? 'text-red-600' : 'text-muted-foreground'}>
                  {stat.change}
                </span> from last week
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for your role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {currentRole === "DOCTOR" && (
              <>
                <Button className="w-full justify-start" variant="outline" data-testid="button-new-consultation">
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Start New Consultation
                </Button>
                <Button className="w-full justify-start" variant="outline" data-testid="button-view-appointments">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Today's Appointments
                </Button>
                <Button className="w-full justify-start" variant="outline" data-testid="button-patient-search">
                  <Users className="h-4 w-4 mr-2" />
                  Search Patients
                </Button>
              </>
            )}
            {currentRole === "NURSE" && (
              <>
                <Button className="w-full justify-start" variant="outline" data-testid="button-record-vitals">
                  <Activity className="h-4 w-4 mr-2" />
                  Record Vitals
                </Button>
                <Button className="w-full justify-start" variant="outline" data-testid="button-medication-schedule">
                  <Clock className="h-4 w-4 mr-2" />
                  Medication Schedule
                </Button>
                <Button className="w-full justify-start" variant="outline" data-testid="button-patient-rounds">
                  <Users className="h-4 w-4 mr-2" />
                  Start Patient Rounds
                </Button>
              </>
            )}
            {currentRole === "ADMIN" && (
              <>
                <Button className="w-full justify-start" variant="outline" data-testid="button-user-management">
                  <Users className="h-4 w-4 mr-2" />
                  User Management
                </Button>
                <Button className="w-full justify-start" variant="outline" data-testid="button-system-reports">
                  <FileText className="h-4 w-4 mr-2" />
                  System Reports
                </Button>
                <Button className="w-full justify-start" variant="outline" data-testid="button-backup-system">
                  <Activity className="h-4 w-4 mr-2" />
                  System Backup
                </Button>
              </>
            )}
            {currentRole === "OPD_MANAGER" && (
              <>
                <Button className="w-full justify-start" variant="outline" data-testid="button-manage-queue">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Queue
                </Button>
                <Button className="w-full justify-start" variant="outline" data-testid="button-staff-schedule">
                  <Calendar className="h-4 w-4 mr-2" />
                  Staff Schedule
                </Button>
                <Button className="w-full justify-start" variant="outline" data-testid="button-daily-reports">
                  <FileText className="h-4 w-4 mr-2" />
                  Daily Reports
                </Button>
              </>
            )}
            {currentRole === "PATIENT" && (
              <>
                <Button className="w-full justify-start" variant="outline" data-testid="button-book-appointment">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Appointment
                </Button>
                <Button className="w-full justify-start" variant="outline" data-testid="button-view-records">
                  <FileText className="h-4 w-4 mr-2" />
                  View Medical Records
                </Button>
                <Button className="w-full justify-start" variant="outline" data-testid="button-test-results">
                  <Activity className="h-4 w-4 mr-2" />
                  Test Results
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4" data-testid={`activity-${index}`}>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.action}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      by {activity.user} • {activity.time}
                    </p>
                  </div>
                  <Badge variant={getActivityBadgeVariant(activity.type)}>
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}