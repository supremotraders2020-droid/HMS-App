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
  LogOut,
  Package,
  MapPin,
  Fingerprint,
  Coffee,
  MessageCircle,
  Bell,
  Wrench
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

    // Define all services with their access levels
    const services = [
      { title: "OPD Service", url: "/opd-service", icon: ClipboardList, roles: ["ADMIN", "OPD_MANAGER", "DOCTOR", "NURSE"] },
      { title: "Patient Service", url: "/patient-service", icon: Users, roles: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER"] },
      { title: "Inventory Service", url: "/inventory-service", icon: Package, roles: ["ADMIN", "NURSE", "OPD_MANAGER"] },
      { title: "Patient Tracking", url: "/patient-tracking", icon: MapPin, roles: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER"] },
      { title: "Biometric Service", url: "/biometric-service", icon: Fingerprint, roles: ["ADMIN", "NURSE", "DOCTOR"] },
      { title: "Hospitality Service", url: "/hospitality-service", icon: Coffee, roles: ["ADMIN", "NURSE", "OPD_MANAGER"] },
      { title: "Equipment Servicing", url: "/equipment-servicing", icon: Wrench, roles: ["ADMIN", "NURSE", "OPD_MANAGER"] },
      { title: "Chatbot Service", url: "/chatbot-service", icon: MessageCircle, roles: ["ADMIN", "DOCTOR", "PATIENT", "NURSE"] },
      { title: "Notification Service", url: "/notification-service", icon: Bell, roles: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "PATIENT"] }
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
        { title: "Staff Schedule", url: "/staff", icon: Users },
        { title: "Reports", url: "/opd-reports", icon: FileText }
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

  const handleMenuClick = (url: string, external?: boolean, externalUrl?: string) => {
    console.log(`Navigating to: ${url}`);
    if (external && externalUrl) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
    } else {
      onNavigate?.(url);
    }
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
                      onClick={() => {
                        if (item.title === "OPD Service") {
                          handleMenuClick(item.url);
                        } else if (item.title === "Patient Service") {
                          handleMenuClick(item.url, true, "https://patient-care-central-kadamatulp.replit.app");
                        } else if (item.title === "Inventory Service") {
                          handleMenuClick(item.url);
                        } else if (item.title === "Patient Tracking") {
                          handleMenuClick(item.url);
                        } else if (item.title === "Biometric Service") {
                          handleMenuClick(item.url, true, "https://biometric-vault-kadamatulp.replit.app");
                        } else if (item.title === "Equipment Servicing") {
                          handleMenuClick(item.url, true, "https://care-connect-1-kadamatulp.replit.app");
                        } else if (item.title === "Chatbot Service") {
                          handleMenuClick(item.url, true, "https://chatbot-service-kadamatulp.replit.app");
                        } else if (item.title === "Notification Service") {
                          handleMenuClick(item.url, true, "https://medi-notify-hub-kadamatulp.replit.app");
                        } else {
                          handleMenuClick(item.url);
                        }
                      }}
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

        <SidebarGroup>
          <SidebarGroupLabel>Support Services</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {getMenuItems(currentRole).filter(item => 
                ['Inventory Service', 'Hospitality Service', 'Equipment Servicing', 'Chatbot Service', 'Notification Service'].includes(item.title)
              ).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        if (item.title === "OPD Service") {
                          handleMenuClick(item.url);
                        } else if (item.title === "Patient Service") {
                          handleMenuClick(item.url, true, "https://patient-care-central-kadamatulp.replit.app");
                        } else if (item.title === "Inventory Service") {
                          handleMenuClick(item.url);
                        } else if (item.title === "Patient Tracking") {
                          handleMenuClick(item.url);
                        } else if (item.title === "Biometric Service") {
                          handleMenuClick(item.url, true, "https://biometric-vault-kadamatulp.replit.app");
                        } else if (item.title === "Equipment Servicing") {
                          handleMenuClick(item.url, true, "https://care-connect-1-kadamatulp.replit.app");
                        } else if (item.title === "Chatbot Service") {
                          handleMenuClick(item.url, true, "https://chatbot-service-kadamatulp.replit.app");
                        } else if (item.title === "Notification Service") {
                          handleMenuClick(item.url, true, "https://medi-notify-hub-kadamatulp.replit.app");
                        } else {
                          handleMenuClick(item.url);
                        }
                      }}
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

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {getMenuItems(currentRole).filter(item => 
                !['Dashboard', 'OPD Service', 'Patient Service', 'Inventory Service', 'Patient Tracking', 'Biometric Service', 'Hospitality Service', 'Equipment Servicing', 'Chatbot Service', 'Notification Service'].includes(item.title)
              ).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        if (item.title === "OPD Service") {
                          handleMenuClick(item.url);
                        } else if (item.title === "Patient Service") {
                          handleMenuClick(item.url, true, "https://patient-care-central-kadamatulp.replit.app");
                        } else if (item.title === "Inventory Service") {
                          handleMenuClick(item.url);
                        } else if (item.title === "Patient Tracking") {
                          handleMenuClick(item.url);
                        } else if (item.title === "Biometric Service") {
                          handleMenuClick(item.url, true, "https://biometric-vault-kadamatulp.replit.app");
                        } else if (item.title === "Equipment Servicing") {
                          handleMenuClick(item.url, true, "https://care-connect-1-kadamatulp.replit.app");
                        } else if (item.title === "Chatbot Service") {
                          handleMenuClick(item.url, true, "https://chatbot-service-kadamatulp.replit.app");
                        } else if (item.title === "Notification Service") {
                          handleMenuClick(item.url, true, "https://medi-notify-hub-kadamatulp.replit.app");
                        } else {
                          handleMenuClick(item.url);
                        }
                      }}
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