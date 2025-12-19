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
  Cylinder,
  Trash2,
  Brain,
  FlaskConical,
  BookOpen,
  BedDouble,
  Droplet
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import hospitalLogo from "@assets/LOGO_1_1765346562770.png";

interface Notification {
  id: string;
  isRead?: boolean;
  status?: string;
}

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
  // Fetch notifications to get unread count
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const unreadCount = notifications.filter(n => !n.isRead && n.status !== "sent").length;

  // Role-based menu items
  const getMenuItems = (role: UserRole) => {
    const baseItems = [
      { title: "Dashboard", url: "/dashboard", icon: Home }
    ];

    // Define all services with their access levels
    // OPD_MANAGER only sees: Dashboard, OPD Service, Patient Service
    const services = [
      { title: "OPD Service", url: "/opd-service", icon: ClipboardList, roles: ["ADMIN", "OPD_MANAGER", "DOCTOR"] },
      { title: "Patient Service", url: "/patient-service", icon: Users, roles: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER"] },
      { title: "Inventory Service", url: "/inventory-service", icon: Package, roles: ["ADMIN", "NURSE"] },
      { title: "Patient Tracking", url: "/patient-tracking", icon: MapPin, roles: ["ADMIN", "DOCTOR", "NURSE"] },
      { title: "Biometric Service", url: "/biometric-service", icon: Fingerprint, roles: ["ADMIN", "NURSE", "DOCTOR"] },
      { title: "Equipment Servicing", url: "/equipment-servicing", icon: Wrench, roles: ["ADMIN"] },
      { title: "Bed Management", url: "/bed-management", icon: BedDouble, roles: ["ADMIN"] },
      { title: "Blood Bank", url: "/blood-bank", icon: Droplet, roles: ["ADMIN"] },
      { title: "Oxygen Tracker", url: "/oxygen-tracker", icon: Cylinder, roles: ["ADMIN", "NURSE"] },
      { title: "Biowaste Management", url: "/biowaste-management", icon: Trash2, roles: ["ADMIN"] },
      { title: "Swab Monitoring", url: "/swab-monitoring", icon: FlaskConical, roles: ["ADMIN"] },
      { title: "Disease Knowledge", url: "/disease-knowledge", icon: BookOpen, roles: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER"] },
      { title: "Patient Monitoring", url: "/patient-monitoring", icon: Stethoscope, roles: ["ADMIN", "DOCTOR", "NURSE"] },
      { title: "AI Analytics", url: "/ai-analytics", icon: Brain, roles: ["ADMIN"] },
      { title: "Patient Analytics", url: "/patient-analytics", icon: Activity, roles: ["ADMIN"] },
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
      OPD_MANAGER: [
        { title: "Prescriptions", url: "/prescriptions", icon: Stethoscope }
      ],
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
    <Sidebar className="glass-sidebar">
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
        {/* Notifications Section - Hidden from ADMIN and NURSE roles */}
        {currentRole !== "NURSE" && currentRole !== "ADMIN" && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">Notifications</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild data-testid="link-notifications">
                    <Button
                      variant="ghost"
                      className="w-full justify-start group relative overflow-visible bg-gradient-to-r from-rose-50/80 to-pink-50/60 hover:from-rose-100 hover:to-pink-100 dark:from-rose-900/30 dark:to-pink-900/20 dark:hover:from-rose-800/40 dark:hover:to-pink-800/30 border border-rose-200/50 dark:border-rose-700/30 rounded-xl transition-all duration-300 hover:shadow-md hover:shadow-rose-500/10 hover:-translate-y-0.5"
                      onClick={() => handleMenuClick("/notification-service")}
                    >
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 text-white mr-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm relative">
                        <Bell className="h-3.5 w-3.5" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5 border border-white dark:border-slate-800">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </div>
                      <span className="font-medium">Notifications</span>
                      {unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="ml-auto text-[10px] px-1.5 py-0 h-4"
                          data-testid="badge-unread-count"
                        >
                          {unreadCount} new
                        </Badge>
                      )}
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild data-testid="link-dashboard">
                  <Button
                    variant="ghost"
                    className="w-full justify-start group relative overflow-visible bg-gradient-to-r from-cyan-50/80 to-teal-50/60 hover:from-cyan-100 hover:to-teal-100 dark:from-cyan-900/30 dark:to-teal-900/20 dark:hover:from-cyan-800/40 dark:hover:to-teal-800/30 border border-cyan-200/50 dark:border-cyan-700/30 rounded-xl transition-all duration-300 hover:shadow-md hover:shadow-cyan-500/10 hover:-translate-y-0.5"
                    onClick={() => handleMenuClick("/dashboard")}
                  >
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 text-white mr-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                      <Home className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-medium">Dashboard</span>
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">Core Services</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {getMenuItems(currentRole).filter(item => 
                ['OPD Service', 'Patient Service', 'Patient Tracking', 'Patient Monitoring', 'Biometric Service', 'Prescriptions'].includes(item.title)
              ).map((item, index) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start group relative overflow-visible hover:bg-gradient-to-r hover:from-emerald-50/80 hover:to-teal-50/60 dark:hover:from-emerald-900/30 dark:hover:to-teal-900/20 rounded-xl transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5 hover:border-emerald-200/50 dark:hover:border-emerald-700/30"
                      onClick={() => handleMenuClick(item.url)}
                    >
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-800/50 dark:to-teal-800/40 text-emerald-600 dark:text-emerald-400 mr-3 transition-all duration-300 group-hover:from-emerald-500 group-hover:to-teal-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md group-hover:shadow-emerald-500/20">
                        <item.icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium transition-colors duration-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{item.title}</span>
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
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">Support Services</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {getMenuItems(currentRole).filter(item => 
                  ['Inventory Service', 'Equipment Servicing', 'Oxygen Tracker', 'Chatbot Service', 'Notification Service'].includes(item.title)
                ).map((item, index) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start group relative overflow-visible hover:bg-gradient-to-r hover:from-violet-50/80 hover:to-purple-50/60 dark:hover:from-violet-900/30 dark:hover:to-purple-900/20 rounded-xl transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5 hover:border-violet-200/50 dark:hover:border-violet-700/30"
                        onClick={() => handleMenuClick(item.url)}
                      >
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-800/50 dark:to-purple-800/40 text-violet-600 dark:text-violet-400 mr-3 transition-all duration-300 group-hover:from-violet-500 group-hover:to-purple-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md group-hover:shadow-violet-500/20">
                          <item.icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-medium transition-colors duration-200 group-hover:text-violet-700 dark:group-hover:text-violet-400">{item.title}</span>
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
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {getMenuItems(currentRole).filter(item => 
                  !['Dashboard', 'OPD Service', 'Patient Service', 'Inventory Service', 'Patient Tracking', 'Biometric Service', 'Patient Monitoring', 'Prescriptions', 'Equipment Servicing', 'Oxygen Tracker', 'Chatbot Service', 'Notification Service'].includes(item.title)
                ).map((item, index) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start group relative overflow-visible hover:bg-gradient-to-r hover:from-amber-50/80 hover:to-orange-50/60 dark:hover:from-amber-900/30 dark:hover:to-orange-900/20 rounded-xl transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5 hover:border-amber-200/50 dark:hover:border-amber-700/30"
                        onClick={() => handleMenuClick(item.url)}
                      >
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-800/50 dark:to-orange-800/40 text-amber-600 dark:text-amber-400 mr-3 transition-all duration-300 group-hover:from-amber-500 group-hover:to-orange-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md group-hover:shadow-amber-500/20">
                          <item.icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-medium transition-colors duration-200 group-hover:text-amber-700 dark:group-hover:text-amber-400">{item.title}</span>
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