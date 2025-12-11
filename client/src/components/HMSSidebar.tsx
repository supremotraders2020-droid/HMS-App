import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  AlertCircle,
  Info,
  CheckCircle2,
  Clock
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import hospitalLogo from "@assets/LOGO_1_1765346562770.png";

interface UserNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string | Date;
  priority?: string;
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
  // Fetch user notifications
  const { data: notifications = [] } = useQuery<UserNotification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const recentNotifications = notifications.slice(0, 5);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "alert":
      case "urgent":
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      case "success":
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case "reminder":
        return <Clock className="h-3 w-3 text-amber-500" />;
      default:
        return <Info className="h-3 w-3 text-blue-500" />;
    }
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

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
      { title: "Biowaste Management", url: "/biowaste-management", icon: Trash2, roles: ["ADMIN"] },
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
        {/* Notifications Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bell className="h-3 w-3" />
              Notifications
            </span>
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="text-[10px] px-1.5 py-0 h-4 min-w-[18px] flex items-center justify-center"
                data-testid="badge-unread-count"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="bg-gradient-to-br from-slate-50/80 to-slate-100/60 dark:from-slate-800/50 dark:to-slate-900/40 rounded-xl border border-slate-200/50 dark:border-slate-700/30 p-2 max-h-[180px] overflow-hidden">
              {recentNotifications.length === 0 ? (
                <div className="text-center py-3 text-muted-foreground text-xs">
                  <Bell className="h-5 w-5 mx-auto mb-1 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <ScrollArea className="h-[140px]">
                  <div className="space-y-1.5">
                    {recentNotifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`p-2 rounded-lg text-xs transition-all duration-200 cursor-pointer hover:bg-white/50 dark:hover:bg-slate-700/50 ${
                          !notification.isRead 
                            ? "bg-blue-50/80 dark:bg-blue-900/20 border-l-2 border-l-blue-500" 
                            : "bg-white/30 dark:bg-slate-800/30"
                        }`}
                        onClick={() => handleMenuClick("/notification-service")}
                        data-testid={`notification-${notification.id}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                              {notification.title}
                            </p>
                            <p className="text-muted-foreground truncate text-[10px] mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-muted-foreground/60 text-[10px] mt-1">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
              {notifications.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 text-xs h-7 text-primary hover:text-primary/80"
                  onClick={() => handleMenuClick("/notification-service")}
                  data-testid="button-view-all-notifications"
                >
                  View all notifications
                </Button>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

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
                ['OPD Service', 'Patient Service', 'Patient Tracking', 'Biometric Service'].includes(item.title)
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
                  !['Dashboard', 'OPD Service', 'Patient Service', 'Inventory Service', 'Patient Tracking', 'Biometric Service', 'Equipment Servicing', 'Oxygen Tracker', 'Chatbot Service', 'Notification Service'].includes(item.title)
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