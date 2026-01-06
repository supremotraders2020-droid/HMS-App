import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { IntegerInput, NumericInput, NameInput } from "@/components/validated-inputs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Shield,
  Users,
  FileText,
  Package,
  Pill,
  Building2,
  ClipboardList,
  Lock,
  Unlock,
  History,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Download,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Activity,
  ShieldCheck,
  Crown,
  Loader2,
  ChevronRight,
  BarChart3,
  FileCheck,
  Stethoscope,
  Syringe,
  Receipt,
  HeartPulse,
  KeyRound,
  Copy,
  Bell,
  Database,
  Save,
} from "lucide-react";
import type {
  User,
  AuditLog,
  BillingRecord,
  StockBatch,
  SurgeryPackage,
  HospitalPackage,
  RolePermission,
  MedicineCatalog,
  OverrideRequest,
} from "@shared/schema";

interface SuperAdminInsuranceProvider {
  id: string;
  providerCode: string;
  providerName: string;
  providerType: string;
  status: string;
  coverageLimitDefault: string | null;
  coPayPercentage: string | null;
  settlementDays: number | null;
}

interface SuperAdminInsuranceClaim {
  id: string;
  claimNumber: string;
  patientName: string;
  providerName: string | null;
  claimedAmount: string;
  approvedAmount: string | null;
  status: string | null;
  isLocked: boolean;
}

type SuperAdminSection = 
  | "dashboard"
  | "users"
  | "billing"
  | "stock"
  | "surgery"
  | "medicines"
  | "insurance"
  | "claims"
  | "packages"
  | "audit"
  | "settings";

import { 
  HMS_MODULES, 
  HMS_ROLES, 
  HMS_ACTIONS,
  MODULE_LABELS, 
  ACTION_LABELS,
  ROLE_LABELS,
  DEFAULT_PERMISSIONS,
  type HMSModule,
  type HMSRole,
  type HMSAction
} from "@shared/permissions";

const MODULES = HMS_MODULES;
const ROLES = HMS_ROLES;

interface SuperAdminPortalProps {
  section?: SuperAdminSection;
}

export default function SuperAdminPortal({ section = "dashboard" }: SuperAdminPortalProps) {
  const { toast } = useToast();

  const sectionTitles: Record<SuperAdminSection, { title: string; description: string }> = {
    dashboard: { title: "Dashboard", description: "System-wide statistics and pending actions" },
    users: { title: "User Roles & Permissions", description: "Manage user accounts and access control" },
    billing: { title: "Billing Finalization", description: "Review, approve, and lock OPD/IPD bills" },
    stock: { title: "Stock & Pharmacy Control", description: "Manage inventory, pricing, GST, and batch tracking" },
    surgery: { title: "Surgery Costing & Packages", description: "Define surgery-wise costing with fees" },
    medicines: { title: "Medicine Database", description: "Manage medicine catalog with salt, brand, dosage" },
    insurance: { title: "Insurance Providers", description: "Manage insurers, TPAs, coverage limits" },
    claims: { title: "Claims Management", description: "Process and track insurance claims" },
    packages: { title: "Hospital Packages", description: "Create OPD/IPD packages and pricing models" },
    audit: { title: "Audit Logs", description: "Immutable audit trail of all critical actions" },
    settings: { title: "System Settings", description: "Configure hospital system parameters" },
  };

  const currentSection = sectionTitles[section] || sectionTitles.dashboard;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-purple-50/30 dark:from-slate-900 dark:via-rose-950/20 dark:to-purple-950/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-900 via-purple-800 to-indigo-900 text-white shadow-lg">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20">
                <Crown className="h-7 w-7 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  {currentSection.title}
                </h1>
                <p className="text-purple-200 text-sm">
                  {currentSection.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-green-400 text-green-400 bg-green-500/10">
                <ShieldCheck className="h-3 w-3 mr-1" />
                HIPAA Compliant
              </Badge>
              <Badge variant="outline" className="border-blue-400 text-blue-400 bg-blue-500/10">
                <Shield className="h-3 w-3 mr-1" />
                NABH Certified
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width */}
      <div className="p-6">
        {section === "dashboard" && <DashboardSection />}
        {section === "users" && <UsersSection />}
        {section === "billing" && <BillingSection />}
        {section === "stock" && <StockSection />}
        {section === "surgery" && <SurgerySection />}
        {section === "medicines" && <MedicinesSection />}
        {section === "insurance" && <InsuranceSection />}
        {section === "claims" && <ClaimsSection />}
        {section === "packages" && <PackagesSection />}
        {section === "audit" && <AuditSection />}
        {section === "settings" && <SettingsSection />}
      </div>
    </div>
  );
}

function DashboardSection() {
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/super-admin/users"] });
  const { data: billingRecords } = useQuery<BillingRecord[]>({ queryKey: ["/api/super-admin/billing-records"] });
  const { data: auditLogs } = useQuery<AuditLog[]>({ queryKey: ["/api/super-admin/audit-logs"] });
  const { data: overrideRequests } = useQuery<OverrideRequest[]>({ queryKey: ["/api/super-admin/override-requests"] });

  const stats = [
    { label: "Total Users", value: users?.length || 0, icon: Users, color: "blue" },
    { label: "Pending Bills", value: billingRecords?.filter(b => b.status === "pending_approval").length || 0, icon: Receipt, color: "amber" },
    { label: "Pending Overrides", value: overrideRequests?.filter(o => o.status === "pending").length || 0, icon: AlertTriangle, color: "red" },
    { label: "Audit Events Today", value: auditLogs?.filter(a => {
      const today = new Date().toDateString();
      return new Date(a.createdAt!).toDateString() === today;
    }).length || 0, icon: History, color: "purple" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h2>
        <p className="text-slate-600 dark:text-slate-400">System-wide statistics and pending actions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
              <Users className="h-6 w-6" />
              <span>Add User</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
              <Lock className="h-6 w-6" />
              <span>Lock Records</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
              <FileCheck className="h-6 w-6" />
              <span>Approve Bills</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
              <Download className="h-6 w-6" />
              <span>Export Logs</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Audit Activity</CardTitle>
          <CardDescription>Latest system events</CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogs && auditLogs.length > 0 ? (
            <div className="space-y-3">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      log.severity === "critical" ? "bg-red-100 text-red-600" :
                      log.severity === "warning" ? "bg-amber-100 text-amber-600" :
                      "bg-blue-100 text-blue-600"
                    }`}>
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{log.action} - {log.entityType}</p>
                      <p className="text-xs text-slate-500">{log.userName} ({log.userRole})</p>
                    </div>
                  </div>
                  <Badge variant={log.severity === "critical" ? "destructive" : "secondary"}>
                    {log.module}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">No recent audit activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface CreatedUserCredentials {
  username: string;
  password: string;
  name: string;
  role: string;
}

interface PermissionMatrixState {
  [module: string]: {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canApprove: boolean;
    canLock: boolean;
    canUnlock: boolean;
    canExport: boolean;
  };
}

function UsersSection() {
  const { toast } = useToast();
  const [showAddUser, setShowAddUser] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<CreatedUserCredentials | null>(null);
  const [resetPasswordCredentials, setResetPasswordCredentials] = useState<{ username: string; password: string } | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("ADMIN");
  const [showPermissions, setShowPermissions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Permission matrix state
  const [permissionRole, setPermissionRole] = useState<HMSRole>("ADMIN");
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrixState>({});
  
  // Form state for new user
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");

  const { data: users, isLoading, refetch } = useQuery<User[]>({ queryKey: ["/api/super-admin/users"] });
  const { data: permissions, refetch: refetchPermissions } = useQuery<RolePermission[]>({ queryKey: ["/api/super-admin/permissions"] });
  
  // Initialize permission matrix when role changes or permissions load
  const initializePermissionMatrix = (role: HMSRole, perms: RolePermission[]) => {
    const matrix: PermissionMatrixState = {};
    
    HMS_MODULES.forEach(module => {
      const existingPerm = perms?.find(p => p.role === role && p.module === module);
      const defaults = DEFAULT_PERMISSIONS[role]?.[module] || {};
      
      matrix[module] = {
        canView: existingPerm?.canView ?? defaults.view ?? false,
        canCreate: existingPerm?.canCreate ?? defaults.create ?? false,
        canEdit: existingPerm?.canEdit ?? defaults.edit ?? false,
        canDelete: existingPerm?.canDelete ?? defaults.delete ?? false,
        canApprove: existingPerm?.canApprove ?? defaults.approve ?? false,
        canLock: existingPerm?.canLock ?? defaults.lock ?? false,
        canUnlock: existingPerm?.canUnlock ?? defaults.unlock ?? false,
        canExport: existingPerm?.canExport ?? defaults.export ?? false,
      };
    });
    
    setPermissionMatrix(matrix);
  };
  
  const handleOpenPermissionMatrix = () => {
    initializePermissionMatrix(permissionRole, permissions || []);
    setShowPermissions(true);
  };
  
  const handlePermissionRoleChange = (role: HMSRole) => {
    setPermissionRole(role);
    initializePermissionMatrix(role, permissions || []);
  };
  
  const togglePermission = (module: string, action: keyof PermissionMatrixState[string]) => {
    setPermissionMatrix(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module]?.[action]
      }
    }));
  };
  
  // Save permissions mutation
  const savePermissionsMutation = useMutation({
    mutationFn: async () => {
      const permList = Object.entries(permissionMatrix).map(([module, perms]) => ({
        module,
        ...perms
      }));
      
      const response = await apiRequest("POST", "/api/super-admin/permissions/bulk", {
        role: permissionRole,
        permissions: permList
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Permissions Saved", description: `Permissions for ${ROLE_LABELS[permissionRole]} have been updated` });
      refetchPermissions();
      setShowPermissions(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to save permissions", variant: "destructive" });
    }
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: { name: string; email: string; role: string }) => {
      const response = await apiRequest("POST", "/api/super-admin/users", userData);
      return response.json();
    },
    onSuccess: (data) => {
      setCreatedCredentials({
        username: data.username,
        password: data.generatedPassword,
        name: data.name,
        role: data.role
      });
      setShowAddUser(false);
      setShowCredentials(true);
      setNewUserName("");
      setNewUserEmail("");
      setSelectedRole("ADMIN");
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/users"] });
      toast({ title: "User Created", description: "New user account has been created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create user", variant: "destructive" });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/super-admin/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/users"] });
      toast({ title: "User Deleted", description: "User account has been deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to delete user", variant: "destructive" });
    }
  });

  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/super-admin/users/${userId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/users"] });
      toast({ title: "Status Updated", description: "User status has been updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update status", variant: "destructive" });
    }
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", `/api/super-admin/users/${userId}/reset-password`);
      return response.json();
    },
    onSuccess: (data: { username: string; newPassword: string }) => {
      setResetPasswordCredentials({ username: data.username, password: data.newPassword });
      setShowResetPassword(true);
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/users"] });
      toast({ title: "Password Reset", description: "New password has been generated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to reset password", variant: "destructive" });
    }
  });

  const handleCreateUser = () => {
    if (!newUserName.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }
    createUserMutation.mutate({ name: newUserName, email: newUserEmail, role: selectedRole });
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard` });
  };

  // Filter users by search query
  const filteredUsers = users?.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Roles & Permissions</h2>
          <p className="text-slate-600 dark:text-slate-400">Manage user accounts and access control</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleOpenPermissionMatrix} data-testid="button-permission-matrix">
            <Shield className="h-4 w-4 mr-2" />
            Permission Matrix
          </Button>
          <Button onClick={() => setShowAddUser(true)} data-testid="button-add-user">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {ROLES.map((role) => {
          const count = users?.filter(u => u.role === role).length || 0;
          return (
            <Card key={role} className="cursor-pointer hover:border-purple-500 transition-colors">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant={role === "SUPER_ADMIN" ? "default" : "secondary"}>
                      {role.replace("_", " ")}
                    </Badge>
                    <p className="text-2xl font-bold mt-2">{count}</p>
                  </div>
                  <Users className="h-8 w-8 text-slate-300" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Users ({filteredUsers.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Input 
                placeholder="Search users..." 
                className="w-64" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-users"
              />
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Reset Password</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "SUPER_ADMIN" ? "default" : "secondary"}>
                        {user.role?.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.email || "-"}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetPasswordMutation.mutate(user.id)}
                        disabled={resetPasswordMutation.isPending || user.role === "SUPER_ADMIN"}
                        data-testid={`button-reset-password-${user.id}`}
                      >
                        <KeyRound className="h-4 w-4 mr-1" />
                        Reset
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={user.status === "active" ? "text-green-600 border-green-600" : "text-red-600 border-red-600"}
                      >
                        {user.status || "active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => updateStatusMutation.mutate({ 
                            userId: user.id, 
                            status: user.status === "active" ? "inactive" : "active" 
                          })}
                          data-testid={`button-toggle-status-${user.id}`}
                        >
                          {user.status === "active" ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-600"
                          onClick={() => handleDeleteUser(user)}
                          disabled={user.role === "SUPER_ADMIN"}
                          data-testid={`button-delete-user-${user.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Permission Matrix Dialog */}
      <Dialog open={showPermissions} onOpenChange={setShowPermissions}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role Permission Matrix
            </DialogTitle>
            <DialogDescription>Configure fine-grained permissions for each role. Changes are logged for audit purposes.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium">Select Role:</Label>
              <Select value={permissionRole} onValueChange={(v) => handlePermissionRoleChange(v as HMSRole)}>
                <SelectTrigger className="w-48" data-testid="select-permission-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HMS_ROLES.filter(r => r !== "SUPER_ADMIN").map((role) => (
                    <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {permissionRole === "SUPER_ADMIN" && (
                <Badge variant="secondary">Super Admin has all permissions</Badge>
              )}
            </div>
            
            <ScrollArea className="h-[50vh] border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-48 font-semibold">Module</TableHead>
                    <TableHead className="text-center w-20">View</TableHead>
                    <TableHead className="text-center w-20">Create</TableHead>
                    <TableHead className="text-center w-20">Edit</TableHead>
                    <TableHead className="text-center w-20">Delete</TableHead>
                    <TableHead className="text-center w-20">Approve</TableHead>
                    <TableHead className="text-center w-20">Lock</TableHead>
                    <TableHead className="text-center w-20">Unlock</TableHead>
                    <TableHead className="text-center w-20">Export</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {HMS_MODULES.map((module) => (
                    <TableRow key={module} data-testid={`permission-row-${module}`}>
                      <TableCell className="font-medium">{MODULE_LABELS[module]}</TableCell>
                      <TableCell className="text-center">
                        <Switch 
                          checked={permissionMatrix[module]?.canView ?? false}
                          onCheckedChange={() => togglePermission(module, "canView")}
                          data-testid={`switch-${module}-view`}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch 
                          checked={permissionMatrix[module]?.canCreate ?? false}
                          onCheckedChange={() => togglePermission(module, "canCreate")}
                          data-testid={`switch-${module}-create`}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch 
                          checked={permissionMatrix[module]?.canEdit ?? false}
                          onCheckedChange={() => togglePermission(module, "canEdit")}
                          data-testid={`switch-${module}-edit`}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch 
                          checked={permissionMatrix[module]?.canDelete ?? false}
                          onCheckedChange={() => togglePermission(module, "canDelete")}
                          data-testid={`switch-${module}-delete`}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch 
                          checked={permissionMatrix[module]?.canApprove ?? false}
                          onCheckedChange={() => togglePermission(module, "canApprove")}
                          data-testid={`switch-${module}-approve`}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch 
                          checked={permissionMatrix[module]?.canLock ?? false}
                          onCheckedChange={() => togglePermission(module, "canLock")}
                          data-testid={`switch-${module}-lock`}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch 
                          checked={permissionMatrix[module]?.canUnlock ?? false}
                          onCheckedChange={() => togglePermission(module, "canUnlock")}
                          data-testid={`switch-${module}-unlock`}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch 
                          checked={permissionMatrix[module]?.canExport ?? false}
                          onCheckedChange={() => togglePermission(module, "canExport")}
                          data-testid={`switch-${module}-export`}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowPermissions(false)}>Cancel</Button>
            <Button 
              onClick={() => savePermissionsMutation.mutate()}
              disabled={savePermissionsMutation.isPending}
              data-testid="button-save-permissions"
            >
              {savePermissionsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Permissions"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog - Auto-generates credentials */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. Username and password will be automatically generated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input 
                id="name" 
                placeholder="Enter full name" 
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                data-testid="input-new-user-name" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Enter email address" 
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                data-testid="input-new-user-email" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger data-testid="select-new-user-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>{role.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Username and password will be auto-generated and displayed after creation. 
                Make sure to save these credentials as the password cannot be retrieved later.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateUser} 
              disabled={createUserMutation.isPending}
              data-testid="button-create-user"
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generated Credentials Dialog */}
      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              User Created Successfully
            </DialogTitle>
            <DialogDescription>
              Save these credentials securely. The password cannot be retrieved later.
            </DialogDescription>
          </DialogHeader>
          {createdCredentials && (
            <div className="space-y-4">
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Name</p>
                    <p className="font-medium">{createdCredentials.name}</p>
                  </div>
                  <Badge>{createdCredentials.role.replace("_", " ")}</Badge>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-slate-500">Username</p>
                  <div className="flex items-center justify-between">
                    <code className="font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
                      {createdCredentials.username}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(createdCredentials.username, "Username")}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Password</p>
                  <div className="flex items-center justify-between">
                    <code className="font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
                      {createdCredentials.password}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(createdCredentials.password, "Password")}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
                <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Save these credentials now. They will not be shown again.
                </p>
              </div>
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button onClick={() => {
              setShowCredentials(false);
              setCreatedCredentials(null);
            }}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-blue-600" />
              Password Reset Successfully
            </DialogTitle>
            <DialogDescription>
              Save the new password securely. It cannot be retrieved later.
            </DialogDescription>
          </DialogHeader>
          {resetPasswordCredentials && (
            <div className="space-y-4">
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-sm text-slate-500">Username</p>
                  <div className="flex items-center justify-between">
                    <code className="font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
                      {resetPasswordCredentials.username}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(resetPasswordCredentials.username, "Username")}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-slate-500">New Password</p>
                  <div className="flex items-center justify-between">
                    <code className="font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
                      {resetPasswordCredentials.password}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(resetPasswordCredentials.password, "Password")}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
                <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Save this password now. It will not be shown again.
                </p>
              </div>
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button onClick={() => {
              setShowResetPassword(false);
              setResetPasswordCredentials(null);
            }}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm User Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {userToDelete && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <p className="font-medium">{userToDelete.name || userToDelete.username}</p>
              <p className="text-sm text-slate-500">Username: {userToDelete.username}</p>
              <p className="text-sm text-slate-500">Role: {userToDelete.role?.replace("_", " ")}</p>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteUserMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BillingSection() {
  const { data: bills, isLoading } = useQuery<BillingRecord[]>({ queryKey: ["/api/super-admin/billing-records"] });
  const { toast } = useToast();

  const [filterStatus, setFilterStatus] = useState("all");

  const filteredBills = bills?.filter(bill => 
    filterStatus === "all" || bill.status === filterStatus
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Billing Finalization</h2>
          <p className="text-slate-600 dark:text-slate-400">Review, approve, and lock OPD/IPD bills</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Bill
        </Button>
      </div>

      {/* Filter Tabs */}
      <Tabs defaultValue="all" onValueChange={setFilterStatus}>
        <TabsList>
          <TabsTrigger value="all">All Bills</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="pending_approval">Pending Approval</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="finalized">Finalized</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Bills Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredBills.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill No.</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Locked</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-mono">{bill.billNumber}</TableCell>
                    <TableCell>
                      <Badge variant={bill.billType === "IPD" ? "default" : "secondary"}>
                        {bill.billType}
                      </Badge>
                    </TableCell>
                    <TableCell>{bill.patientName}</TableCell>
                    <TableCell className="font-semibold">₹{bill.totalAmount}</TableCell>
                    <TableCell>
                      <Badge variant={
                        bill.status === "finalized" ? "default" :
                        bill.status === "approved" ? "secondary" :
                        bill.status === "pending_approval" ? "outline" : "secondary"
                      }>
                        {bill.status?.replace("_", " ").toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {bill.isLocked ? (
                        <Lock className="h-4 w-4 text-red-500" />
                      ) : (
                        <Unlock className="h-4 w-4 text-green-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {bill.status === "pending_approval" && (
                          <Button variant="ghost" size="sm" className="text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        {!bill.isLocked && bill.status === "approved" && (
                          <Button variant="ghost" size="sm" className="text-purple-600">
                            <Lock className="h-4 w-4 mr-1" />
                            Finalize
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No billing records found</p>
              <Button className="mt-4">Create First Bill</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StockSection() {
  const { data: batches, isLoading } = useQuery<StockBatch[]>({ queryKey: ["/api/super-admin/stock-batches"] });
  const [showAddBatch, setShowAddBatch] = useState(false);
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Stock & Pharmacy Control</h2>
          <p className="text-slate-600 dark:text-slate-400">Manage inventory, pricing, GST, and batch tracking</p>
        </div>
        <Button onClick={() => setShowAddBatch(true)} data-testid="button-add-batch">
          <Plus className="h-4 w-4 mr-2" />
          Add Stock Batch
        </Button>
      </div>

      {/* Add Stock Batch Dialog */}
      <Dialog open={showAddBatch} onOpenChange={setShowAddBatch}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Stock Batch</DialogTitle>
            <DialogDescription>Add new medicine batch to inventory</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="medicineName">Medicine Name</Label>
              <Input id="medicineName" placeholder="Enter medicine name" data-testid="input-medicine-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch Number</Label>
              <Input id="batchNumber" placeholder="e.g., BTH-2024-001" data-testid="input-batch-number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <IntegerInput id="quantity" placeholder="0" min={0} data-testid="input-quantity" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mrp">MRP (₹)</Label>
              <NumericInput id="mrp" placeholder="0.00" allowDecimal={true} data-testid="input-mrp" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price (₹)</Label>
              <NumericInput id="purchasePrice" placeholder="0.00" allowDecimal={true} data-testid="input-purchase-price" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstPercentage">GST %</Label>
              <Select>
                <SelectTrigger data-testid="select-gst">
                  <SelectValue placeholder="Select GST" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="12">12%</SelectItem>
                  <SelectItem value="18">18%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input id="expiryDate" type="date" data-testid="input-expiry-date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input id="manufacturer" placeholder="Enter manufacturer" data-testid="input-manufacturer" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowAddBatch(false)}>Cancel</Button>
            <Button onClick={() => {
              toast({ title: "Batch Added", description: "Stock batch has been added successfully" });
              setShowAddBatch(false);
            }} data-testid="button-save-batch">Add Batch</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-500">Total Batches</p>
            <p className="text-2xl font-bold">{batches?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-500">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {batches?.filter(b => b.status === "active").length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-500">Expiring Soon</p>
            <p className="text-2xl font-bold text-amber-600">
              {batches?.filter(b => {
                const expiry = new Date(b.expiryDate);
                const thirtyDays = new Date();
                thirtyDays.setDate(thirtyDays.getDate() + 30);
                return expiry <= thirtyDays && b.status === "active";
              }).length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-500">Expired</p>
            <p className="text-2xl font-bold text-red-600">
              {batches?.filter(b => b.status === "expired").length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Batches</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : batches && batches.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Batch No.</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>MRP</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.medicineName}</TableCell>
                    <TableCell className="font-mono">{batch.batchNumber}</TableCell>
                    <TableCell>{batch.availableQuantity} / {batch.quantity}</TableCell>
                    <TableCell>₹{batch.mrp}</TableCell>
                    <TableCell>{batch.gstPercentage}%</TableCell>
                    <TableCell>{batch.expiryDate}</TableCell>
                    <TableCell>
                      <Badge variant={
                        batch.status === "active" ? "default" :
                        batch.status === "expired" ? "destructive" : "secondary"
                      }>
                        {batch.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Pill className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No stock batches found</p>
              <Button className="mt-4">Add First Batch</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SurgerySection() {
  const { data: packages, isLoading } = useQuery<SurgeryPackage[]>({ queryKey: ["/api/super-admin/surgery-packages"] });
  const [showCreatePackage, setShowCreatePackage] = useState(false);
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Surgery Costing & Packages</h2>
          <p className="text-slate-600 dark:text-slate-400">Define surgery-wise costing with OT, surgeon, anesthesia fees</p>
        </div>
        <Button onClick={() => setShowCreatePackage(true)} data-testid="button-create-surgery-package">
          <Plus className="h-4 w-4 mr-2" />
          Create Package
        </Button>
      </div>

      {/* Create Surgery Package Dialog */}
      <Dialog open={showCreatePackage} onOpenChange={setShowCreatePackage}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Surgery Package</DialogTitle>
            <DialogDescription>Define pricing for surgery with all components</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="packageName">Package Name</Label>
              <Input id="packageName" placeholder="e.g., Knee Replacement Package" data-testid="input-package-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surgeryType">Surgery Type</Label>
              <Select>
                <SelectTrigger data-testid="select-surgery-type">
                  <SelectValue placeholder="Select surgery type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orthopedic">Orthopedic</SelectItem>
                  <SelectItem value="cardiac">Cardiac</SelectItem>
                  <SelectItem value="neuro">Neurosurgery</SelectItem>
                  <SelectItem value="general">General Surgery</SelectItem>
                  <SelectItem value="gynec">Gynecology</SelectItem>
                  <SelectItem value="ent">ENT</SelectItem>
                  <SelectItem value="urology">Urology</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="otCharges">OT Charges (₹)</Label>
                <NumericInput id="otCharges" placeholder="0" allowDecimal={true} data-testid="input-ot-charges" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surgeonFees">Surgeon Fees (₹)</Label>
                <NumericInput id="surgeonFees" placeholder="0" allowDecimal={true} data-testid="input-surgeon-fees" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="anesthesiaFees">Anesthesia Fees (₹)</Label>
                <NumericInput id="anesthesiaFees" placeholder="0" allowDecimal={true} data-testid="input-anesthesia-fees" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nursingCharges">Nursing Charges (₹)</Label>
                <NumericInput id="nursingCharges" placeholder="0" allowDecimal={true} data-testid="input-nursing-charges" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="packagePrice">Total Package Price (₹)</Label>
              <NumericInput id="packagePrice" placeholder="0" allowDecimal={true} data-testid="input-package-price" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Package inclusions and details..." data-testid="input-description" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowCreatePackage(false)}>Cancel</Button>
            <Button onClick={() => {
              toast({ title: "Package Created", description: "Surgery package has been created successfully" });
              setShowCreatePackage(false);
            }} data-testid="button-save-surgery-package">Create Package</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Packages Grid */}
      <div className="grid grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : packages && packages.length > 0 ? (
          packages.map((pkg) => (
            <Card key={pkg.id} className={pkg.isLocked ? "border-red-200" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant={pkg.status === "active" ? "default" : "secondary"}>
                    {pkg.status}
                  </Badge>
                  {pkg.isLocked && <Lock className="h-4 w-4 text-red-500" />}
                </div>
                <CardTitle className="text-lg">{pkg.packageName}</CardTitle>
                <CardDescription>{pkg.surgeryType}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">OT Charges:</span>
                    <span>₹{pkg.otCharges}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Surgeon Fees:</span>
                    <span>₹{pkg.surgeonFees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Anesthesia:</span>
                    <span>₹{pkg.anesthesiaFees}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>Package Price:</span>
                    <span className="text-green-600">₹{pkg.packagePrice}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" disabled={pkg.isLocked ?? false}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-3">
            <CardContent className="text-center py-12">
              <Stethoscope className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No surgery packages defined</p>
              <Button className="mt-4">Create First Package</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function MedicinesSection() {
  const { data: medicines, isLoading } = useQuery<MedicineCatalog[]>({ queryKey: ["/api/super-admin/medicine-catalog"] });
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Medicine Database Management</h2>
          <p className="text-slate-600 dark:text-slate-400">Manage medicine catalog with salt, brand, dosage, and form</p>
        </div>
        <Button onClick={() => setShowAddMedicine(true)} data-testid="button-add-medicine">
          <Plus className="h-4 w-4 mr-2" />
          Add Medicine
        </Button>
      </div>

      {/* Add Medicine Dialog */}
      <Dialog open={showAddMedicine} onOpenChange={setShowAddMedicine}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Medicine to Catalog</DialogTitle>
            <DialogDescription>Add new medicine with salt composition and pricing</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="brandName">Brand Name</Label>
              <Input id="brandName" placeholder="e.g., Crocin Advance" data-testid="input-brand-name" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="genericName">Generic Name</Label>
              <Input id="genericName" placeholder="e.g., Paracetamol" data-testid="input-generic-name" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="saltComposition">Salt Composition</Label>
              <Input id="saltComposition" placeholder="e.g., Paracetamol 500mg" data-testid="input-salt-composition" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dosageForm">Dosage Form</Label>
              <Select>
                <SelectTrigger data-testid="select-dosage-form">
                  <SelectValue placeholder="Select form" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tablet">Tablet</SelectItem>
                  <SelectItem value="capsule">Capsule</SelectItem>
                  <SelectItem value="syrup">Syrup</SelectItem>
                  <SelectItem value="injection">Injection</SelectItem>
                  <SelectItem value="cream">Cream/Ointment</SelectItem>
                  <SelectItem value="drops">Drops</SelectItem>
                  <SelectItem value="inhaler">Inhaler</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="strength">Strength</Label>
              <Input id="strength" placeholder="e.g., 500mg" data-testid="input-strength" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mrpMedicine">MRP (₹)</Label>
              <NumericInput id="mrpMedicine" placeholder="0.00" allowDecimal={true} data-testid="input-mrp-medicine" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input id="manufacturer" placeholder="e.g., GSK" data-testid="input-manufacturer" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="schedule">Schedule</Label>
              <Select>
                <SelectTrigger data-testid="select-schedule">
                  <SelectValue placeholder="Select schedule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="otc">OTC (Over the Counter)</SelectItem>
                  <SelectItem value="h">Schedule H</SelectItem>
                  <SelectItem value="h1">Schedule H1</SelectItem>
                  <SelectItem value="x">Schedule X (Narcotic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowAddMedicine(false)}>Cancel</Button>
            <Button onClick={() => {
              toast({ title: "Medicine Added", description: "Medicine has been added to catalog" });
              setShowAddMedicine(false);
            }} data-testid="button-save-medicine">Add Medicine</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Medicine Catalog</CardTitle>
            <Input placeholder="Search medicines..." className="w-64" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : medicines && medicines.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand Name</TableHead>
                  <TableHead>Generic Name</TableHead>
                  <TableHead>Salt</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>Strength</TableHead>
                  <TableHead>MRP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicines.map((med) => (
                  <TableRow key={med.id}>
                    <TableCell className="font-medium">{med.brandName}</TableCell>
                    <TableCell>{med.genericName}</TableCell>
                    <TableCell className="text-sm text-slate-500">{med.saltComposition}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{med.dosageForm}</Badge>
                    </TableCell>
                    <TableCell>{med.strength}</TableCell>
                    <TableCell>₹{med.mrp}</TableCell>
                    <TableCell>
                      <Badge variant={med.status === "active" ? "default" : "destructive"}>
                        {med.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" disabled={med.isLocked ?? false}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Syringe className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No medicines in catalog</p>
              <Button className="mt-4">Add First Medicine</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InsuranceSection() {
  const { data: providers, isLoading } = useQuery<SuperAdminInsuranceProvider[]>({ queryKey: ["/api/super-admin/insurance-providers"] });
  const [showAddProvider, setShowAddProvider] = useState(false);
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Insurance Providers & Policies</h2>
          <p className="text-slate-600 dark:text-slate-400">Manage insurers, TPAs, coverage limits, and rules</p>
        </div>
        <Button onClick={() => setShowAddProvider(true)} data-testid="button-add-provider">
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      {/* Add Provider Dialog */}
      <Dialog open={showAddProvider} onOpenChange={setShowAddProvider}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Insurance Provider</DialogTitle>
            <DialogDescription>Add new insurance company or TPA integration</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="providerName">Provider Name</Label>
              <Input id="providerName" placeholder="e.g., Star Health Insurance" data-testid="input-provider-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="providerCode">Provider Code</Label>
              <Input id="providerCode" placeholder="e.g., STAR-001" data-testid="input-provider-code" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="providerType">Provider Type</Label>
              <Select>
                <SelectTrigger data-testid="select-provider-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="insurance_company">Insurance Company</SelectItem>
                  <SelectItem value="tpa">TPA</SelectItem>
                  <SelectItem value="government">Government Scheme</SelectItem>
                  <SelectItem value="corporate">Corporate Tie-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverageLimit">Default Coverage (₹)</Label>
              <NumericInput id="coverageLimit" placeholder="500000" allowDecimal={true} data-testid="input-coverage-limit" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coPayPercentage">Co-Pay %</Label>
              <IntegerInput id="coPayPercentage" placeholder="10" min={0} max={100} data-testid="input-copay" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settlementDays">Settlement Days</Label>
              <IntegerInput id="settlementDays" placeholder="30" min={1} data-testid="input-settlement-days" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input id="contactEmail" type="email" placeholder="claims@insurance.com" data-testid="input-contact-email" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input id="contactPhone" placeholder="+91 XXXXX XXXXX" data-testid="input-contact-phone" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowAddProvider(false)}>Cancel</Button>
            <Button onClick={() => {
              toast({ title: "Provider Added", description: "Insurance provider has been added successfully" });
              setShowAddProvider(false);
            }} data-testid="button-save-provider">Add Provider</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : providers && providers.length > 0 ? (
          providers.map((provider) => (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge>{provider.providerType?.replace("_", " ")}</Badge>
                  <Badge variant={provider.status === "active" ? "default" : "destructive"}>
                    {provider.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{provider.providerName}</CardTitle>
                <CardDescription>{provider.providerCode}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Default Coverage:</span>
                    <span>₹{provider.coverageLimitDefault || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Co-Pay:</span>
                    <span>{provider.coPayPercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Settlement Days:</span>
                    <span>{provider.settlementDays} days</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-3">
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No insurance providers configured</p>
              <Button className="mt-4">Add First Provider</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ClaimsSection() {
  const { data: claims, isLoading } = useQuery<SuperAdminInsuranceClaim[]>({ queryKey: ["/api/super-admin/claims"] });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Claims Rules & Settlement</h2>
          <p className="text-slate-600 dark:text-slate-400">Track claim status, approvals, and settlements</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : claims && claims.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim No.</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Claimed</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Locked</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-mono">{claim.claimNumber}</TableCell>
                    <TableCell>{claim.patientName}</TableCell>
                    <TableCell>{claim.providerName}</TableCell>
                    <TableCell>₹{claim.claimedAmount}</TableCell>
                    <TableCell className="text-green-600">₹{claim.approvedAmount || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={
                        claim.status === "settled" ? "default" :
                        claim.status === "approved" ? "secondary" :
                        claim.status === "rejected" ? "destructive" : "outline"
                      }>
                        {claim.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {claim.isLocked ? <Lock className="h-4 w-4 text-red-500" /> : <Unlock className="h-4 w-4 text-green-500" />}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No claims found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PackagesSection() {
  const { data: packages, isLoading } = useQuery<HospitalPackage[]>({ queryKey: ["/api/super-admin/hospital-packages"] });
  const [showCreatePackage, setShowCreatePackage] = useState(false);
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hospital Packages & Pricing</h2>
          <p className="text-slate-600 dark:text-slate-400">Create OPD/IPD packages and dynamic pricing models</p>
        </div>
        <Button onClick={() => setShowCreatePackage(true)} data-testid="button-create-hospital-package">
          <Plus className="h-4 w-4 mr-2" />
          Create Package
        </Button>
      </div>

      {/* Create Hospital Package Dialog */}
      <Dialog open={showCreatePackage} onOpenChange={setShowCreatePackage}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Hospital Package</DialogTitle>
            <DialogDescription>Define OPD/IPD package with pricing and inclusions</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="hospitalPackageName">Package Name</Label>
              <Input id="hospitalPackageName" placeholder="e.g., Master Health Checkup" data-testid="input-hospital-package-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="packageCode">Package Code</Label>
              <Input id="packageCode" placeholder="e.g., MHC-001" data-testid="input-package-code" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="packageType">Package Type</Label>
              <Select>
                <SelectTrigger data-testid="select-package-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opd">OPD Package</SelectItem>
                  <SelectItem value="ipd">IPD Package</SelectItem>
                  <SelectItem value="health_checkup">Health Checkup</SelectItem>
                  <SelectItem value="corporate">Corporate Package</SelectItem>
                  <SelectItem value="daycare">Daycare Package</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="basePrice">Base Price (₹)</Label>
              <NumericInput id="basePrice" placeholder="0" allowDecimal={true} data-testid="input-base-price" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountPercentage">Discount %</Label>
              <IntegerInput id="discountPercentage" placeholder="0" min={0} max={100} data-testid="input-discount" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="finalPrice">Final Price (₹)</Label>
              <NumericInput id="finalPrice" placeholder="0" allowDecimal={true} data-testid="input-final-price" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="inclusions">Inclusions</Label>
              <Textarea id="inclusions" placeholder="List all services included in this package..." rows={3} data-testid="input-inclusions" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="validityDays">Validity (Days)</Label>
              <IntegerInput id="validityDays" placeholder="365" min={1} data-testid="input-validity" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowCreatePackage(false)}>Cancel</Button>
            <Button onClick={() => {
              toast({ title: "Package Created", description: "Hospital package has been created successfully" });
              setShowCreatePackage(false);
            }} data-testid="button-save-hospital-package">Create Package</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Packages</TabsTrigger>
          <TabsTrigger value="opd">OPD</TabsTrigger>
          <TabsTrigger value="ipd">IPD</TabsTrigger>
          <TabsTrigger value="health_checkup">Health Checkup</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : packages && packages.length > 0 ? (
          packages.map((pkg) => (
            <Card key={pkg.id} className={pkg.isLocked ? "border-red-200" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{pkg.packageType}</Badge>
                  {pkg.isLocked && <Lock className="h-4 w-4 text-red-500" />}
                </div>
                <CardTitle className="text-lg">{pkg.packageName}</CardTitle>
                <CardDescription>{pkg.packageCode}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Base Price:</span>
                    <span>₹{pkg.basePrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Discount:</span>
                    <span>{pkg.discountPercentage}%</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Final Price:</span>
                    <span className="text-green-600">₹{pkg.finalPrice}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-3">
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No packages configured</p>
              <Button className="mt-4">Create First Package</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function AuditSection() {
  const { data: logs, isLoading } = useQuery<AuditLog[]>({ queryKey: ["/api/super-admin/audit-logs"] });
  const [filterModule, setFilterModule] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");

  const filteredLogs = logs?.filter(log => 
    (filterModule === "all" || log.module === filterModule) &&
    (filterSeverity === "all" || log.severity === filterSeverity)
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Audit Logs & Financial Locking</h2>
          <p className="text-slate-600 dark:text-slate-400">Immutable audit trail of all critical actions</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>Module:</Label>
            <Select value={filterModule} onValueChange={setFilterModule}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {MODULES.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label>Severity:</Label>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      {new Date(log.createdAt!).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell>{log.module}</TableCell>
                    <TableCell>{log.entityType}</TableCell>
                    <TableCell>{log.userName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.userRole}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        log.severity === "critical" ? "destructive" :
                        log.severity === "warning" ? "outline" : "secondary"
                      }>
                        {log.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No audit logs found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsSection() {
  const { toast } = useToast();
  
  const [systemConfig, setSystemConfig] = useState({
    maintenanceMode: false,
    autoBackup: true,
    sessionTimeout: "30",
    maxLoginAttempts: "5",
    passwordExpiry: "90",
    dataRetention: "365"
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    systemAlerts: true,
    appointmentReminders: true,
    emergencyAlerts: true,
    maintenanceNotifications: false
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    ipWhitelist: "",
    encryptionLevel: "256",
    auditLogging: true,
    passwordComplexity: "high",
    nabh: true,
    hipaa: true
  });

  const [backupSettings, setBackupSettings] = useState({
    autoBackupEnabled: true,
    backupFrequency: "daily",
    retentionPeriod: "30",
    lastBackup: "2025-09-15 23:30:00",
    backupLocation: "Internal Storage"
  });

  const [financialControls, setFinancialControls] = useState({
    autoLockBills: true,
    requireDiscountApproval: true,
    discountThreshold: "10"
  });

  const handleSystemConfigSave = () => {
    toast({
      title: "Success",
      description: "System configuration updated successfully",
    });
  };

  const handleNotificationSave = () => {
    toast({
      title: "Success",
      description: "Notification settings updated successfully",
    });
  };

  const handleSecuritySave = () => {
    toast({
      title: "Success",
      description: "Security settings updated successfully",
    });
  };

  const handleBackupSave = () => {
    toast({
      title: "Success",
      description: "Backup settings updated successfully",
    });
  };

  const handleManualBackup = () => {
    toast({
      title: "Backup Started",
      description: "Manual backup has been initiated",
    });
  };

  const handleSystemRestart = () => {
    toast({
      title: "System Restart",
      description: "System restart has been scheduled",
      variant: "destructive"
    });
  };

  const handleClearCache = () => {
    toast({
      title: "Cache Cleared",
      description: "System cache has been cleared successfully",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">System Settings</h2>
        <p className="text-slate-600 dark:text-slate-400">Configure global system preferences and security</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Configuration
          </CardTitle>
          <CardDescription>General system settings and operational parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">Enable to restrict system access during maintenance</p>
            </div>
            <Switch
              checked={systemConfig.maintenanceMode}
              onCheckedChange={(checked) => setSystemConfig({...systemConfig, maintenanceMode: checked})}
              data-testid="switch-sa-maintenance-mode"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Backup</Label>
              <p className="text-sm text-muted-foreground">Automatically backup system data</p>
            </div>
            <Switch
              checked={systemConfig.autoBackup}
              onCheckedChange={(checked) => setSystemConfig({...systemConfig, autoBackup: checked})}
              data-testid="switch-sa-auto-backup"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="sa-sessionTimeout">Session Timeout (minutes)</Label>
              <IntegerInput
                id="sa-sessionTimeout"
                min={1}
                value={systemConfig.sessionTimeout}
                onValueChange={(value) => setSystemConfig({...systemConfig, sessionTimeout: value})}
                data-testid="input-sa-session-timeout"
              />
            </div>
            <div>
              <Label htmlFor="sa-maxLoginAttempts">Max Login Attempts</Label>
              <IntegerInput
                id="sa-maxLoginAttempts"
                min={1}
                value={systemConfig.maxLoginAttempts}
                onValueChange={(value) => setSystemConfig({...systemConfig, maxLoginAttempts: value})}
                data-testid="input-sa-max-login-attempts"
              />
            </div>
            <div>
              <Label htmlFor="sa-passwordExpiry">Password Expiry (days)</Label>
              <IntegerInput
                id="sa-passwordExpiry"
                min={1}
                value={systemConfig.passwordExpiry}
                onValueChange={(value) => setSystemConfig({...systemConfig, passwordExpiry: value})}
                data-testid="input-sa-password-expiry"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="sa-dataRetention">Data Retention Period (days)</Label>
            <IntegerInput
              id="sa-dataRetention"
              min={1}
              value={systemConfig.dataRetention}
              onValueChange={(value) => setSystemConfig({...systemConfig, dataRetention: value})}
              className="w-full md:w-48"
              data-testid="input-sa-data-retention"
            />
          </div>

          <Button onClick={handleSystemConfigSave} data-testid="button-sa-save-system-config">
            <Save className="h-4 w-4 mr-2" />
            Save System Configuration
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>Configure security protocols and access controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
              </div>
              <Switch
                checked={securitySettings.twoFactorAuth}
                onCheckedChange={(checked) => setSecuritySettings({...securitySettings, twoFactorAuth: checked})}
                data-testid="switch-sa-two-factor"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Audit Logging</Label>
                <p className="text-sm text-muted-foreground">Log all system activities and changes</p>
              </div>
              <Switch
                checked={securitySettings.auditLogging}
                onCheckedChange={(checked) => setSecuritySettings({...securitySettings, auditLogging: checked})}
                data-testid="switch-sa-audit-logging"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Password Complexity</Label>
                <Select 
                  value={securitySettings.passwordComplexity} 
                  onValueChange={(value) => setSecuritySettings({...securitySettings, passwordComplexity: value})}
                >
                  <SelectTrigger data-testid="select-sa-password-complexity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Encryption Level</Label>
                <Select 
                  value={securitySettings.encryptionLevel} 
                  onValueChange={(value) => setSecuritySettings({...securitySettings, encryptionLevel: value})}
                >
                  <SelectTrigger data-testid="select-sa-encryption-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="128">128-bit</SelectItem>
                    <SelectItem value="256">256-bit</SelectItem>
                    <SelectItem value="512">512-bit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="sa-ipWhitelist">IP Whitelist (comma-separated)</Label>
              <Input
                id="sa-ipWhitelist"
                value={securitySettings.ipWhitelist}
                onChange={(e) => setSecuritySettings({...securitySettings, ipWhitelist: e.target.value})}
                placeholder="192.168.1.1, 10.0.0.1"
                data-testid="input-sa-ip-whitelist"
              />
            </div>

            <Button onClick={handleSecuritySave} data-testid="button-sa-save-security">
              <Save className="h-4 w-4 mr-2" />
              Save Security Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Financial Controls
            </CardTitle>
            <CardDescription>Configure billing and discount controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-Lock Finalized Bills</p>
                <p className="text-sm text-muted-foreground">Automatically lock bills after finalization</p>
              </div>
              <Switch 
                checked={financialControls.autoLockBills}
                onCheckedChange={(checked) => setFinancialControls({...financialControls, autoLockBills: checked})}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Require Approval for Discounts</p>
                <p className="text-sm text-muted-foreground">Discounts above threshold need approval</p>
              </div>
              <Switch 
                checked={financialControls.requireDiscountApproval}
                onCheckedChange={(checked) => setFinancialControls({...financialControls, requireDiscountApproval: checked})}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Discount Approval Threshold (%)</p>
                <p className="text-sm text-muted-foreground">Percentage above which approval is needed</p>
              </div>
              <IntegerInput 
                value={financialControls.discountThreshold}
                onValueChange={(value) => setFinancialControls({...financialControls, discountThreshold: value})}
                className="w-20" 
                min={0} 
                max={100} 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>Configure system-wide notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Send notifications via email</p>
              </div>
              <Switch
                checked={notificationSettings.emailNotifications}
                onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
                data-testid="switch-sa-email-notifications"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Send critical alerts via SMS</p>
              </div>
              <Switch
                checked={notificationSettings.smsNotifications}
                onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, smsNotifications: checked})}
                data-testid="switch-sa-sms-notifications"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>System Alerts</Label>
                <p className="text-sm text-muted-foreground">Notify about system issues and updates</p>
              </div>
              <Switch
                checked={notificationSettings.systemAlerts}
                onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, systemAlerts: checked})}
                data-testid="switch-sa-system-alerts"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Appointment Reminders</Label>
                <p className="text-sm text-muted-foreground">Send automatic appointment reminders</p>
              </div>
              <Switch
                checked={notificationSettings.appointmentReminders}
                onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, appointmentReminders: checked})}
                data-testid="switch-sa-appointment-reminders"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Emergency Alerts</Label>
                <p className="text-sm text-muted-foreground">Critical emergency notifications</p>
              </div>
              <Switch
                checked={notificationSettings.emergencyAlerts}
                onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emergencyAlerts: checked})}
                data-testid="switch-sa-emergency-alerts"
              />
            </div>

            <Button onClick={handleNotificationSave} data-testid="button-sa-save-notifications">
              <Save className="h-4 w-4 mr-2" />
              Save Notification Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Compliance
            </CardTitle>
            <CardDescription>Configure compliance requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">NABH Compliance Mode</p>
                <p className="text-sm text-muted-foreground">Enforce NABH requirements</p>
              </div>
              <Switch 
                checked={securitySettings.nabh}
                onCheckedChange={(checked) => setSecuritySettings({...securitySettings, nabh: checked})}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">HIPAA Compliance Mode</p>
                <p className="text-sm text-muted-foreground">Enforce HIPAA data protection</p>
              </div>
              <Switch 
                checked={securitySettings.hipaa}
                onCheckedChange={(checked) => setSecuritySettings({...securitySettings, hipaa: checked})}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup & Maintenance
          </CardTitle>
          <CardDescription>System backup and maintenance operations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Backup Frequency</Label>
              <Select 
                value={backupSettings.backupFrequency} 
                onValueChange={(value) => setBackupSettings({...backupSettings, backupFrequency: value})}
              >
                <SelectTrigger data-testid="select-sa-backup-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sa-retentionPeriod">Retention Period (days)</Label>
              <IntegerInput
                id="sa-retentionPeriod"
                min={1}
                value={backupSettings.retentionPeriod}
                onValueChange={(value) => setBackupSettings({...backupSettings, retentionPeriod: value})}
                data-testid="input-sa-retention-period"
              />
            </div>
            <div>
              <Label>Last Backup</Label>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" data-testid="badge-sa-last-backup">
                  {backupSettings.lastBackup}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button onClick={handleManualBackup} data-testid="button-sa-manual-backup">
              <Download className="h-4 w-4 mr-2" />
              Manual Backup
            </Button>
            <Button onClick={handleBackupSave} variant="outline" data-testid="button-sa-save-backup">
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-4">
            <Button onClick={handleSystemRestart} variant="destructive" data-testid="button-sa-system-restart">
              <RefreshCw className="h-4 w-4 mr-2" />
              Restart System
            </Button>
            <Button onClick={handleClearCache} variant="outline" data-testid="button-sa-clear-cache">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
