import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { 
  Home, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  Hospital, 
  Stethoscope,
  UserCog,
  ClipboardList,
  Activity,
  Building2,
  LogOut
} from "lucide-react";

type UserRole = "ADMIN" | "DOCTOR" | "PATIENT" | "NURSE" | "OPD_MANAGER";

interface HMSSidebarProps {
  currentRole: UserRole;
  currentUser?: {
    name: string;
    hospitalName: string;
  };
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
}

export default function HMSSidebar({ currentRole, currentUser, onNavigate, onLogout }: HMSSidebarProps) {
  // Role-based menu items
  const getMenuItems = (role: UserRole) => {
    const baseItems = [
      { title: "Dashboard", url: "/dashboard", icon: Home }
    ];

    const roleSpecificItems: Record<UserRole, any[]> = {
      ADMIN: [
        { title: "User Management", url: "/users", icon: UserCog },
        { title: "Hospital Settings", url: "/hospitals", icon: Building2 },
        { title: "System Settings", url: "/settings", icon: Settings },
        { title: "Audit Logs", url: "/audit", icon: FileText }
      ],
      DOCTOR: [
        { title: "Patients", url: "/patients", icon: Users },
        { title: "Appointments", url: "/appointments", icon: Calendar },
        { title: "Medical Records", url: "/records", icon: FileText },
        { title: "Prescriptions", url: "/prescriptions", icon: ClipboardList }
      ],
      NURSE: [
        { title: "Patient Care", url: "/patient-care", icon: Activity },
        { title: "Schedules", url: "/schedules", icon: Calendar },
        { title: "Vitals", url: "/vitals", icon: Stethoscope },
        { title: "Reports", url: "/reports", icon: FileText }
      ],
      OPD_MANAGER: [
        { title: "OPD Queue", url: "/opd-queue", icon: ClipboardList },
        { title: "Appointments", url: "/appointments", icon: Calendar },
        { title: "Staff Schedule", url: "/staff", icon: Users },
        { title: "Reports", url: "/opd-reports", icon: FileText }
      ],
      PATIENT: [
        { title: "My Appointments", url: "/my-appointments", icon: Calendar },
        { title: "Medical History", url: "/my-history", icon: FileText },
        { title: "Test Results", url: "/test-results", icon: Activity },
        { title: "Prescriptions", url: "/my-prescriptions", icon: ClipboardList }
      ]
    };

    return [...baseItems, ...roleSpecificItems[role]];
  };

  const menuItems = getMenuItems(currentRole);

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "ADMIN": return "destructive";
      case "DOCTOR": return "default";
      case "NURSE": return "secondary";
      case "OPD_MANAGER": return "outline";
      case "PATIENT": return "secondary";
      default: return "outline";
    }
  };

  const handleMenuClick = (url: string) => {
    console.log(`Navigating to: ${url}`);
    onNavigate?.(url);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-2">
          <Hospital className="h-6 w-6 text-primary" />
          <div className="flex flex-col">
            <span className="text-lg font-semibold">HMS Core</span>
            <span className="text-xs text-muted-foreground">
              {currentUser?.hospitalName || "Hospital System"}
            </span>
          </div>
        </div>
        {currentUser && (
          <div className="mt-4 p-3 bg-card rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" data-testid="text-username">
                  {currentUser.name}
                </p>
                <Badge 
                  variant={getRoleBadgeVariant(currentRole)} 
                  className="text-xs mt-1"
                  data-testid="badge-role"
                >
                  {currentRole.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleMenuClick(item.url)}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      <span>{item.title}</span>
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {currentRole === "ADMIN" && (
          <SidebarGroup>
            <SidebarGroupLabel>System</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleMenuClick("/system-health")}
                      data-testid="link-system-health"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      <span>System Health</span>
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={onLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}