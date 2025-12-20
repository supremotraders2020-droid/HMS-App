import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { Notification, HospitalTeamMember, ServicePatient, HealthTip, UserNotification } from "@shared/schema";
import { 
  Bell, 
  Send, 
  Clock, 
  FileEdit,
  AlertTriangle,
  CheckCircle,
  Mail,
  MessageSquare,
  Smartphone,
  Users,
  Plus,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  Activity,
  Phone,
  Building2,
  UserCog,
  Trash2,
  Edit2,
  X,
  Sparkles,
  RefreshCw,
  Sun,
  Cloud,
  Leaf,
  Heart
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

const NOTIFICATION_CATEGORIES = [
  { value: "health_tips", label: "Health Tips", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "hospital_updates", label: "Hospital Updates", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "emergency", label: "Emergency", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  { value: "opd_announcements", label: "OPD Announcements", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  { value: "appointment", label: "Appointment", color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200" },
  { value: "disease_alerts", label: "Disease Alerts", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  { value: "general", label: "General", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  { value: "critical", label: "Critical", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
];

const DEPARTMENTS = [
  { value: "emergency_medicine", label: "Emergency Medicine" },
  { value: "cardiology", label: "Cardiology" },
  { value: "neurology", label: "Neurology" },
  { value: "pediatrics", label: "Pediatrics" },
  { value: "orthopedics", label: "Orthopedics" },
  { value: "general_surgery", label: "General Surgery" },
  { value: "radiology", label: "Radiology" },
  { value: "pathology", label: "Pathology" },
  { value: "administration", label: "Administration" },
];

function getCategoryBadgeClass(category: string) {
  return NOTIFICATION_CATEGORIES.find(c => c.value === category)?.color || "bg-gray-100 text-gray-800";
}

function getPriorityBadgeClass(priority: string) {
  return PRIORITY_OPTIONS.find(p => p.value === priority)?.color || "bg-gray-100 text-gray-700";
}

function getStatusBadgeClass(status: string) {
  switch(status) {
    case "sent": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    case "scheduled": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
    case "draft": return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    case "failed": return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    default: return "bg-gray-100 text-gray-700";
  }
}

function getChannelIcon(channel: string) {
  switch(channel) {
    case "push": return <Bell className="h-4 w-4" />;
    case "email": return <Mail className="h-4 w-4" />;
    case "sms": return <MessageSquare className="h-4 w-4" />;
    case "whatsapp": return <SiWhatsapp className="h-4 w-4" />;
    default: return <Bell className="h-4 w-4" />;
  }
}

type UserRole = "ADMIN" | "DOCTOR" | "PATIENT" | "NURSE" | "OPD_MANAGER";

interface NotificationServiceProps {
  currentRole?: UserRole;
  currentUserId?: string;
}

export default function NotificationService({ currentRole = "ADMIN", currentUserId }: NotificationServiceProps) {
  // Nurses and OPD Managers don't have dashboard - default to notifications tab
  const isLimitedView = currentRole === "NURSE" || currentRole === "OPD_MANAGER";
  const [activeTab, setActiveTab] = useState(isLimitedView ? "notifications" : "dashboard");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const { toast } = useToast();

  // Form state for creating notifications
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    category: "general",
    priority: "medium",
    channels: ["push"] as string[],
    attachedLink: "",
  });

  // Queries
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  // User-specific notifications (for OPD Managers, Doctors, etc.)
  const { data: userNotifications = [], isLoading: userNotificationsLoading } = useQuery<UserNotification[]>({
    queryKey: ["/api/user-notifications", currentUserId],
    enabled: !!currentUserId,
  });

  const { data: teamMembers = [], isLoading: teamLoading } = useQuery<HospitalTeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  // For NURSE: fetch assigned patients to filter patient-related notifications
  const { data: assignedPatients = [] } = useQuery<ServicePatient[]>({
    queryKey: ["/api/patients/service"],
    enabled: currentRole === "NURSE",
  });

  // Get patient names for NURSE filtering
  const nursePatientNames = currentRole === "NURSE" && currentUserId
    ? assignedPatients
        .filter(p => p.assignedNurseId === currentUserId)
        .map(p => `${p.firstName} ${p.lastName}`.toLowerCase())
    : [];

  const { data: stats } = useQuery<{
    totalSent: number;
    pendingCount: number;
    byChannel: Record<string, number>;
    byCategory: Record<string, number>;
  }>({
    queryKey: ["/api/notifications/stats/summary"],
  });

  // Health Tips query
  const { data: healthTips = [], isLoading: healthTipsLoading, refetch: refetchHealthTips } = useQuery<HealthTip[]>({
    queryKey: ["/api/health-tips"],
  });

  // Generate health tip mutation
  const generateHealthTipMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/health-tips/generate");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-tips"] });
      toast({ title: "Success", description: "Health tip generated and sent to all patients" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate health tip", variant: "destructive" });
    }
  });

  // Mutations
  const createNotificationMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/notifications", {
        ...data,
        status: "draft",
        createdBy: "Current User",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/stats/summary"] });
      toast({ title: "Success", description: "Notification created successfully" });
      setShowCreateForm(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create notification", variant: "destructive" });
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/notifications/${id}/send`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/stats/summary"] });
      toast({ title: "Success", description: "Notification sent successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send notification", variant: "destructive" });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/stats/summary"] });
      toast({ title: "Success", description: "Notification deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete notification", variant: "destructive" });
    },
  });

  const updateOnCallMutation = useMutation({
    mutationFn: async ({ id, isOnCall }: { id: string; isOnCall: boolean }) => {
      return apiRequest("PATCH", `/api/team-members/${id}/on-call`, { isOnCall });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      toast({ title: "Success", description: "On-call status updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update on-call status", variant: "destructive" });
    },
  });

  function resetForm() {
    setFormData({
      title: "",
      message: "",
      category: "general",
      priority: "medium",
      channels: ["push"],
      attachedLink: "",
    });
  }

  function handleChannelToggle(channel: string) {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title || !formData.message || formData.channels.length === 0) {
      toast({ title: "Validation Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    createNotificationMutation.mutate(formData);
  }

  // Transform user notifications to display format
  const transformedUserNotifications = userNotifications.map(un => ({
    id: un.id,
    title: un.title,
    message: un.message,
    category: un.type === 'appointment' ? 'appointment' : un.type === 'opd_update' ? 'opd_announcements' : 'general',
    priority: 'medium' as const,
    status: un.isRead ? 'read' : 'unread',
    channels: ['push'] as string[],
    createdAt: un.createdAt,
    createdBy: 'System',
    sentAt: un.createdAt,
    metadata: un.metadata,
    isUserNotification: true,
  }));

  // Filter broadcast notifications
  const filteredBroadcastNotifications = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || n.status === statusFilter;
    const matchesCategory = !categoryFilter || n.category === categoryFilter;
    
    // For NURSE: only show notifications that mention their assigned patients
    // or are general hospital announcements (emergency, hospital_updates)
    const matchesNursePatients = currentRole !== "NURSE" || 
      n.category === "emergency" || 
      n.category === "hospital_updates" ||
      nursePatientNames.some(patientName => 
        n.title.toLowerCase().includes(patientName) || 
        n.message.toLowerCase().includes(patientName)
      );
    
    return matchesSearch && matchesStatus && matchesCategory && matchesNursePatients;
  });

  // Filter user-specific notifications
  const filteredUserNotifications = transformedUserNotifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || categoryFilter === 'all' || n.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Combine all notifications for display (user notifications first, then broadcast)
  const filteredNotifications = [...filteredUserNotifications, ...filteredBroadcastNotifications];

  // Filter team members
  const filteredTeamMembers = teamMembers.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = !departmentFilter || m.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  // Stats calculations
  const sentCount = notifications.filter(n => n.status === "sent").length;
  const scheduledCount = notifications.filter(n => n.status === "scheduled").length;
  const draftCount = notifications.filter(n => n.status === "draft").length;
  const onCallCount = teamMembers.filter(m => m.isOnCall).length;

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Notification Service</h1>
          <p className="text-muted-foreground">
            {isLimitedView 
              ? "View hospital notifications and announcements" 
              : "Multi-channel hospital communication and team management"}
          </p>
        </div>
        {!isLimitedView && (
          <Button onClick={() => setShowCreateForm(true)} data-testid="button-create-notification">
            <Plus className="h-4 w-4 mr-2" />
            Create Notification
          </Button>
        )}
      </div>

      {/* For limited view (Nurse/OPD), show notifications directly without tabs */}
      {isLimitedView ? (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-notifications"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-category-filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {NOTIFICATION_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {notificationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  {searchQuery || categoryFilter
                    ? "No notifications match your filters."
                    : "No notifications yet."}
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map(notification => (
                <Card key={notification.id} className="hover-elevate">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{notification.title}</span>
                          <Badge className={getPriorityBadgeClass(notification.priority)}>{notification.priority}</Badge>
                          <Badge className={getCategoryBadgeClass(notification.category)}>
                            {NOTIFICATION_CATEGORIES.find(c => c.value === notification.category)?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            {notification.channels.map(channel => (
                              <span key={channel} className="inline-flex items-center gap-1">
                                {getChannelIcon(channel)}
                              </span>
                            ))}
                          </div>
                          <Separator orientation="vertical" className="h-4" />
                          <span>
                            {notification.createdAt && format(new Date(notification.createdAt), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      ) : (
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="dashboard" className="gap-2" data-testid="tab-dashboard">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2" data-testid="tab-notifications">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="health-tips" className="gap-2" data-testid="tab-health-tips">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Health Tips</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2" data-testid="tab-team">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Team Directory</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-sent">{stats?.totalSent || sentCount}</div>
                <p className="text-xs text-muted-foreground">Notifications delivered</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-scheduled">{scheduledCount}</div>
                <p className="text-xs text-muted-foreground">Pending delivery</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Draft</CardTitle>
                <FileEdit className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-drafts">{draftCount}</div>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">On-Call Staff</CardTitle>
                <UserCog className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-on-call">{onCallCount}</div>
                <p className="text-xs text-muted-foreground">Available now</p>
              </CardContent>
            </Card>
          </div>

          {/* Channel Analytics */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Channel Distribution
                </CardTitle>
                <CardDescription>Notifications by delivery channel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { channel: "push", label: "Push Notifications", icon: <Bell className="h-4 w-4" /> },
                  { channel: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
                  { channel: "sms", label: "SMS", icon: <MessageSquare className="h-4 w-4" /> },
                  { channel: "whatsapp", label: "WhatsApp", icon: <SiWhatsapp className="h-4 w-4" /> },
                ].map(item => {
                  const count = stats?.byChannel?.[item.channel] || 0;
                  const total = (stats?.totalSent || 1);
                  const percentage = Math.round((count / total) * 100) || 0;
                  return (
                    <div key={item.channel} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {item.icon}
                          <span className="text-sm">{item.label}</span>
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Category Breakdown
                </CardTitle>
                <CardDescription>Notifications by type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {NOTIFICATION_CATEGORIES.map(cat => {
                  const count = stats?.byCategory?.[cat.value] || 0;
                  return (
                    <div key={cat.value} className="flex items-center justify-between">
                      <Badge className={cat.color}>{cat.label}</Badge>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>Latest notification activity</CardDescription>
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No notifications yet. Create your first notification to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.slice(0, 5).map(notification => (
                    <div key={notification.id} className="flex items-start justify-between gap-4 p-3 rounded-lg border">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{notification.title}</span>
                          <Badge className={getStatusBadgeClass(notification.status)}>{notification.status}</Badge>
                          <Badge className={getCategoryBadgeClass(notification.category)}>
                            {NOTIFICATION_CATEGORIES.find(c => c.value === notification.category)?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {notification.channels.map(channel => (
                            <span key={channel} className="text-muted-foreground">{getChannelIcon(channel)}</span>
                          ))}
                          <span className="text-xs text-muted-foreground">
                            {notification.createdAt && format(new Date(notification.createdAt), "MMM d, yyyy HH:mm")}
                          </span>
                        </div>
                      </div>
                      {notification.status === "draft" && (
                        <Button
                          size="sm"
                          onClick={() => sendNotificationMutation.mutate(notification.id)}
                          disabled={sendNotificationMutation.isPending}
                          data-testid={`button-send-${notification.id}`}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-notifications"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]" data-testid="select-status-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-category-filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {NOTIFICATION_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {notificationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  {searchQuery || statusFilter || categoryFilter
                    ? "No notifications match your filters."
                    : "No notifications yet. Create your first notification to get started."}
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map(notification => (
                <Card key={notification.id} className="hover-elevate">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{notification.title}</span>
                          <Badge className={getStatusBadgeClass(notification.status)}>{notification.status}</Badge>
                          <Badge className={getPriorityBadgeClass(notification.priority)}>{notification.priority}</Badge>
                          <Badge className={getCategoryBadgeClass(notification.category)}>
                            {NOTIFICATION_CATEGORIES.find(c => c.value === notification.category)?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            {notification.channels.map(channel => (
                              <span key={channel} className="inline-flex items-center gap-1">
                                {getChannelIcon(channel)}
                              </span>
                            ))}
                          </div>
                          <Separator orientation="vertical" className="h-4" />
                          <span>
                            Created: {notification.createdAt && format(new Date(notification.createdAt), "MMM d, yyyy")}
                          </span>
                          {notification.sentAt && (
                            <>
                              <Separator orientation="vertical" className="h-4" />
                              <span className="text-green-600 dark:text-green-400">
                                Sent: {format(new Date(notification.sentAt), "MMM d, yyyy HH:mm")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {notification.status === "draft" && (
                          <Button
                            size="sm"
                            onClick={() => sendNotificationMutation.mutate(notification.id)}
                            disabled={sendNotificationMutation.isPending}
                            data-testid={`button-send-notification-${notification.id}`}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Send
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteNotificationMutation.mutate(notification.id)}
                          disabled={deleteNotificationMutation.isPending}
                          data-testid={`button-delete-notification-${notification.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="health-tips" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-green-500" />
                AI Health Tips Sent to Patients
              </h2>
              <p className="text-sm text-muted-foreground">Health tips automatically generated at 9 AM and 9 PM IST</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchHealthTips()}
                disabled={healthTipsLoading}
                data-testid="button-refresh-tips"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${healthTipsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => generateHealthTipMutation.mutate()}
                disabled={generateHealthTipMutation.isPending}
                data-testid="button-generate-tip"
              >
                <Plus className="h-4 w-4 mr-2" />
                {generateHealthTipMutation.isPending ? "Generating..." : "Generate Now"}
              </Button>
            </div>
          </div>

          {healthTipsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : healthTips.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No health tips generated yet.</p>
                <p className="text-sm mt-2">Tips are automatically generated at 9 AM and 9 PM, or click "Generate Now" to create one immediately.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {healthTips.map((tip) => (
                <Card key={tip.id} className="hover-elevate">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                        {tip.category === "weather" ? <Cloud className="h-5 w-5 text-green-600 dark:text-green-400" /> :
                         tip.category === "seasonal" ? <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" /> :
                         tip.category === "diet" ? <Heart className="h-5 w-5 text-green-600 dark:text-green-400" /> :
                         <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{tip.title}</span>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {tip.category || "general"}
                          </Badge>
                          <Badge variant="outline">
                            {tip.scheduledFor || "9AM"}
                          </Badge>
                          {tip.season && (
                            <Badge variant="secondary">
                              {tip.season}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{tip.content}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {tip.weatherContext && (
                            <span className="flex items-center gap-1">
                              <Sun className="h-4 w-4" />
                              {tip.weatherContext}
                            </span>
                          )}
                          <Separator orientation="vertical" className="h-4" />
                          <span>
                            {tip.generatedAt && format(new Date(tip.generatedAt), "MMM d, yyyy HH:mm")}
                          </span>
                          <Badge className={tip.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                            {tip.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-team"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-department-filter">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map(dept => (
                  <SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* On-Call Summary */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                On-Call Staff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {teamMembers.filter(m => m.isOnCall).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No staff members currently on-call</p>
                ) : (
                  teamMembers.filter(m => m.isOnCall).map(member => (
                    <Badge key={member.id} variant="outline" className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span>{member.name}</span>
                        <span className="text-xs text-muted-foreground">({DEPARTMENTS.find(d => d.value === member.department)?.label})</span>
                      </div>
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team Directory */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teamLoading ? (
              <div className="col-span-full flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : filteredTeamMembers.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center text-muted-foreground">
                  {searchQuery || departmentFilter
                    ? "No team members match your filters."
                    : "No team members in the directory yet."}
                </CardContent>
              </Card>
            ) : (
              filteredTeamMembers.map(member => (
                <Card key={member.id} className="hover-elevate">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{member.name}</span>
                          {member.isOnCall && (
                            <div className="h-2 w-2 rounded-full bg-green-500" title="On Call" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {DEPARTMENTS.find(d => d.value === member.department)?.label}
                        </Badge>
                        {member.specialization && (
                          <p className="text-xs text-muted-foreground">{member.specialization}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {member.phone}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge className={
                            member.status === "available" 
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" 
                              : member.status === "busy"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          }>
                            {member.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant={member.isOnCall ? "default" : "outline"}
                            onClick={() => updateOnCallMutation.mutate({ id: member.id, isOnCall: !member.isOnCall })}
                            disabled={updateOnCallMutation.isPending}
                            data-testid={`button-toggle-oncall-${member.id}`}
                          >
                            {member.isOnCall ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                On-Call
                              </>
                            ) : (
                              "Set On-Call"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
      )}

      {/* Create Notification Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" data-testid="modal-create-notification">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Create Notification</CardTitle>
                <CardDescription>Create a new hospital-wide notification</CardDescription>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setShowCreateForm(false)} data-testid="button-close-modal">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Notification title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    data-testid="input-notification-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Write your notification message..."
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    data-testid="input-notification-message"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger data-testid="select-notification-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NOTIFICATION_CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger data-testid="select-notification-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Delivery Channels *</Label>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { value: "push", label: "Push", icon: <Bell className="h-4 w-4" /> },
                      { value: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
                      { value: "sms", label: "SMS", icon: <MessageSquare className="h-4 w-4" /> },
                      { value: "whatsapp", label: "WhatsApp", icon: <SiWhatsapp className="h-4 w-4" /> },
                    ].map(channel => (
                      <label
                        key={channel.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={formData.channels.includes(channel.value)}
                          onCheckedChange={() => handleChannelToggle(channel.value)}
                          data-testid={`checkbox-channel-${channel.value}`}
                        />
                        <span className="flex items-center gap-1.5">
                          {channel.icon}
                          {channel.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link">Attached Link (optional)</Label>
                  <Input
                    id="link"
                    type="url"
                    placeholder="https://..."
                    value={formData.attachedLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, attachedLink: e.target.value }))}
                    data-testid="input-notification-link"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)} data-testid="button-cancel-notification">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createNotificationMutation.isPending} data-testid="button-submit-notification">
                    {createNotificationMutation.isPending ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Create Notification
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
