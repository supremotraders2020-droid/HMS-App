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

const MODULES = [
  "BILLING",
  "STOCK",
  "SURGERY",
  "MEDICINE",
  "INSURANCE",
  "CLAIMS",
  "PACKAGES",
  "USERS",
  "REPORTS",
] as const;

const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "DOCTOR",
  "NURSE",
  "OPD_MANAGER",
  "PATIENT",
  "MEDICAL_STORE",
  "PATHOLOGY_LAB",
] as const;

export default function SuperAdminPortal() {
  const [activeSection, setActiveSection] = useState<SuperAdminSection>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const sections = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "users", label: "User Roles & Permissions", icon: Users },
    { id: "billing", label: "Billing Finalization", icon: Receipt },
    { id: "stock", label: "Stock & Pharmacy", icon: Pill },
    { id: "surgery", label: "Surgery Packages", icon: Stethoscope },
    { id: "medicines", label: "Medicine Database", icon: Syringe },
    { id: "insurance", label: "Insurance Providers", icon: Building2 },
    { id: "claims", label: "Claims Management", icon: ClipboardList },
    { id: "packages", label: "Hospital Packages", icon: Package },
    { id: "audit", label: "Audit Logs", icon: History },
    { id: "settings", label: "System Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <Crown className="h-8 w-8 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  Super Admin Portal
                  <Badge className="bg-yellow-500 text-black">Enterprise</Badge>
                </h1>
                <p className="text-purple-200 text-sm">
                  Complete hospital system control & administration
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-green-400 text-green-400">
                <ShieldCheck className="h-3 w-3 mr-1" />
                HIPAA Compliant
              </Badge>
              <Badge variant="outline" className="border-blue-400 text-blue-400">
                <Shield className="h-3 w-3 mr-1" />
                NABH Certified
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-3">
            <Card className="sticky top-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Control Panel
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id as SuperAdminSection)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                      data-testid={`nav-${section.id}`}
                    >
                      <section.icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{section.label}</span>
                      {activeSection === section.id && (
                        <ChevronRight className="h-4 w-4 ml-auto" />
                      )}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            {activeSection === "dashboard" && <DashboardSection />}
            {activeSection === "users" && <UsersSection />}
            {activeSection === "billing" && <BillingSection />}
            {activeSection === "stock" && <StockSection />}
            {activeSection === "surgery" && <SurgerySection />}
            {activeSection === "medicines" && <MedicinesSection />}
            {activeSection === "insurance" && <InsuranceSection />}
            {activeSection === "claims" && <ClaimsSection />}
            {activeSection === "packages" && <PackagesSection />}
            {activeSection === "audit" && <AuditSection />}
            {activeSection === "settings" && <SettingsSection />}
          </div>
        </div>
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

function UsersSection() {
  const { toast } = useToast();
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("ADMIN");
  const [showPermissions, setShowPermissions] = useState(false);

  const { data: users, isLoading } = useQuery<User[]>({ queryKey: ["/api/super-admin/users"] });
  const { data: permissions } = useQuery<RolePermission[]>({ queryKey: ["/api/super-admin/permissions"] });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Roles & Permissions</h2>
          <p className="text-slate-600 dark:text-slate-400">Manage user accounts and access control</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPermissions(true)}>
            <Shield className="h-4 w-4 mr-2" />
            Permission Matrix
          </Button>
          <Button onClick={() => setShowAddUser(true)}>
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
            <CardTitle>All Users</CardTitle>
            <div className="flex items-center gap-2">
              <Input placeholder="Search users..." className="w-64" />
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "SUPER_ADMIN" ? "default" : "secondary"}>
                        {user.role?.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.email || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-600">
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Role Permission Matrix</DialogTitle>
            <DialogDescription>Configure fine-grained permissions for each role</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>View</TableHead>
                  <TableHead>Create</TableHead>
                  <TableHead>Edit</TableHead>
                  <TableHead>Delete</TableHead>
                  <TableHead>Approve</TableHead>
                  <TableHead>Lock</TableHead>
                  <TableHead>Unlock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MODULES.map((module) => (
                  <TableRow key={module}>
                    <TableCell className="font-medium">{module}</TableCell>
                    <TableCell><Switch defaultChecked /></TableCell>
                    <TableCell><Switch defaultChecked /></TableCell>
                    <TableCell><Switch defaultChecked /></TableCell>
                    <TableCell><Switch /></TableCell>
                    <TableCell><Switch /></TableCell>
                    <TableCell><Switch /></TableCell>
                    <TableCell><Switch /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowPermissions(false)}>Cancel</Button>
            <Button>Save Permissions</Button>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Stock & Pharmacy Control</h2>
          <p className="text-slate-600 dark:text-slate-400">Manage inventory, pricing, GST, and batch tracking</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Stock Batch
        </Button>
      </div>

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Surgery Costing & Packages</h2>
          <p className="text-slate-600 dark:text-slate-400">Define surgery-wise costing with OT, surgeon, anesthesia fees</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Package
        </Button>
      </div>

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Medicine Database Management</h2>
          <p className="text-slate-600 dark:text-slate-400">Manage medicine catalog with salt, brand, dosage, and form</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Medicine
        </Button>
      </div>

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Insurance Providers & Policies</h2>
          <p className="text-slate-600 dark:text-slate-400">Manage insurers, TPAs, coverage limits, and rules</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hospital Packages & Pricing</h2>
          <p className="text-slate-600 dark:text-slate-400">Create OPD/IPD packages and dynamic pricing models</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Package
        </Button>
      </div>

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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">System Settings</h2>
        <p className="text-slate-600 dark:text-slate-400">Configure global system preferences and security</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-slate-500">Require 2FA for all Super Admin actions</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Session Timeout</p>
                <p className="text-sm text-slate-500">Auto-logout after inactivity</p>
              </div>
              <Select defaultValue="30">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">IP Whitelist</p>
                <p className="text-sm text-slate-500">Restrict Super Admin access by IP</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Financial Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-Lock Finalized Bills</p>
                <p className="text-sm text-slate-500">Automatically lock bills after finalization</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Require Approval for Discounts</p>
                <p className="text-sm text-slate-500">Discounts above threshold need approval</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Discount Approval Threshold</p>
                <p className="text-sm text-slate-500">Percentage above which approval is needed</p>
              </div>
              <Input type="number" defaultValue="10" className="w-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Audit Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Log All User Actions</p>
                <p className="text-sm text-slate-500">Track every user action in the system</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Log Retention Period</p>
                <p className="text-sm text-slate-500">How long to keep audit logs</p>
              </div>
              <Select defaultValue="365">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="730">2 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">NABH Compliance Mode</p>
                <p className="text-sm text-slate-500">Enforce NABH requirements</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">HIPAA Compliance Mode</p>
                <p className="text-sm text-slate-500">Enforce HIPAA data protection</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Data Encryption</p>
                <p className="text-sm text-slate-500">Encrypt sensitive financial data</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
