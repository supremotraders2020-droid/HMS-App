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
  Stethoscope,
  UserCog,
  ClipboardList,
  Activity,
  Building2,
  LogOut,
  Package,
  MapPin,
  Fingerprint,
  MessageCircle,
  Bell,
  Wrench,
  FileCheck,
  Cylinder
} from "lucide-react";
import hospitalLogo from "@assets/LOGO_1_1765346562770.png";

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

    // Define all services with their access levels
    // OPD_MANAGER only sees: Dashboard, OPD Service, Patient Service
    const services = [
      { title: "OPD Service", url: "/opd-service", icon: ClipboardList, roles: ["ADMIN", "OPD_MANAGER", "DOCTOR", "NURSE"] },
      { title: "Patient Service", url: "/patient-service", icon: Users, roles: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER"] },
      { title: "Inventory Service", url: "/inventory-service", icon: Package, roles: ["ADMIN", "NURSE"] },
      { title: "Patient Tracking", url: "/patient-tracking", icon: MapPin, roles: ["ADMIN", "DOCTOR", "NURSE"] },
      { title: "Biometric Service", url: "/biometric-service", icon: Fingerprint, roles: ["ADMIN", "NURSE", "DOCTOR"] },
      { title: "Equipment Servicing", url: "/equipment-servicing", icon: Wrench, roles: ["ADMIN", "NURSE"] },
      { title: "Oxygen Tracker", url: "/oxygen-tracker", icon: Cylinder, roles: ["ADMIN", "NURSE"] },
      { title: "Chatbot Service", url: "/chatbot-service", icon: MessageCircle, roles: ["ADMIN", "DOCTOR", "PATIENT", "NURSE"] },
      { title: "Notification Service", url: "/notification-service", icon: Bell, roles: ["ADMIN", "DOCTOR", "NURSE", "PATIENT"] },
      { title: "Consents", url: "/consent-forms", icon: FileCheck, roles: ["ADMIN"] }
    ];

    // Filter services based on user role
    const accessibleServices = services.filter(service => service.roles.includes(role));

    const roleSpecificItems: Record<UserRole, any[]> = {
      ADMIN: [
        { title: "User Management", url: "/users", icon: UserCog },
        { title: "Hospital Settings", url: "/hospitals", icon: Building2 },
        { title: "System Settings", url: "/settings", icon: Settings }
      ],
      DOCTOR: [
        { title: "Appointments", url: "/appointments", icon: Calendar },
        { title: "Medical Records", url: "/records", icon: FileText },
        { title: "Prescriptions", url: "/prescriptions", icon: Stethoscope }
      ],
      NURSE: [
        { title: "Patient Care", url: "/patient-care", icon: Activity },
        { title: "Schedules", url: "/schedules", icon: Calendar },
        { title: "Vitals", url: "/vitals", icon: Stethoscope }
      ],
      OPD_MANAGER: [],
      PATIENT: [
        { title: "My Appointments", url: "/my-appointments", icon: Calendar },
        { title: "Medical History", url: "/my-history", icon: FileText },
        { title: "Test Results", url: "/test-results", icon: Activity }
      ]
    };

    return [...baseItems, ...accessibleServices, ...roleSpecificItems[role]];
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

  const getRoleGradient = (role: UserRole) => {
    switch (role) {
      case "ADMIN": return "from-violet-100 via-purple-50 to-fuchsia-50 dark:from-violet-900/40 dark:via-purple-800/30 dark:to-fuchsia-900/20";
      case "DOCTOR": return "from-cyan-100 via-blue-50 to-sky-50 dark:from-cyan-900/40 dark:via-blue-800/30 dark:to-sky-900/20";
      case "NURSE": return "from-emerald-100 via-green-50 to-teal-50 dark:from-emerald-900/40 dark:via-green-800/30 dark:to-teal-900/20";
      case "OPD_MANAGER": return "from-amber-100 via-orange-50 to-yellow-50 dark:from-amber-900/40 dark:via-orange-800/30 dark:to-yellow-900/20";
      case "PATIENT": return "from-teal-100 via-cyan-50 to-sky-50 dark:from-teal-900/40 dark:via-cyan-800/30 dark:to-sky-900/20";
      default: return "from-slate-100 via-gray-50 to-zinc-50 dark:from-slate-800/40 dark:via-gray-700/30 dark:to-zinc-800/20";
    }
  };

  const handleMenuClick = (url: string, external?: boolean, externalUrl?: string) => {
    console.log(`Navigating to: ${url}`);
    if (external && externalUrl) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
    } else {
      onNavigate?.(url);
    }
  };

  return (
    <Sidebar className="bg-gradient-sidebar border-r border-sidebar-border/50">
      <SidebarHeader className="py-4 px-3">
        <div className="relative">
          <img 
            src={hospitalLogo} 
            alt="Gravity Hospital" 
            className="w-full max-w-[210px] h-[56px] object-contain transition-transform duration-300 hover:scale-105"
            data-testid="img-sidebar-logo"
          />
        </div>
        {currentUser && (
          <div className={`mt-4 p-3 bg-gradient-to-br ${getRoleGradient(currentRole)} rounded-xl border border-white/40 dark:border-slate-700/40 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground" data-testid="text-username">
                  {currentUser.name}
                </p>
                <Badge 
                  variant={getRoleBadgeVariant(currentRole)} 
                  className="text-xs mt-1.5 shadow-sm"
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
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild data-testid="link-dashboard">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleMenuClick("/dashboard")}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    <span>Dashboard</span>
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Core Services</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {getMenuItems(currentRole).filter(item => 
                ['OPD Service', 'Patient Service', 'Patient Tracking', 'Biometric Service'].includes(item.title)
              ).map((item) => (
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

        {/* Support Services - Hidden for OPD_MANAGER */}
        {currentRole !== "OPD_MANAGER" && (
          <SidebarGroup>
            <SidebarGroupLabel>Support Services</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {getMenuItems(currentRole).filter(item => 
                  ['Inventory Service', 'Equipment Servicing', 'Oxygen Tracker', 'Chatbot Service', 'Notification Service'].includes(item.title)
                ).map((item) => (
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
        )}

        {/* Management - Hidden for OPD_MANAGER and NURSE */}
        {currentRole !== "OPD_MANAGER" && currentRole !== "NURSE" && (
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {getMenuItems(currentRole).filter(item => 
                  !['Dashboard', 'OPD Service', 'Patient Service', 'Inventory Service', 'Patient Tracking', 'Biometric Service', 'Equipment Servicing', 'Oxygen Tracker', 'Chatbot Service', 'Notification Service'].includes(item.title)
                ).map((item) => (
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
        )}

      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button
          variant="outline"
          className="w-full group bg-gradient-to-r from-rose-50/80 to-red-50/80 hover:from-rose-100 hover:to-red-100 dark:from-rose-950/30 dark:to-red-950/30 dark:hover:from-rose-900/40 dark:hover:to-red-900/40 border-rose-200/50 dark:border-rose-800/30 text-rose-700 dark:text-rose-400 transition-all duration-300 hover:shadow-md"
          onClick={onLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}