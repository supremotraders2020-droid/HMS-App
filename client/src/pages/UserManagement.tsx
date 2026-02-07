import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  UserPlus, 
  Users, 
  Stethoscope, 
  UserCheck, 
  Search,
  Edit,
  Trash2,
  Loader2,
  Copy,
  CheckCircle2,
  Key,
  Eye,
  EyeOff,
  Save,
  Heart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { HospitalTeamMember } from "@shared/schema";

interface PatientUser {
  id: string;
  username: string;
  plainPassword: string | null;
  name: string;
  email: string;
  dateOfBirth: string;
  status: string;
  createdAt: string;
  lastLogin: string | null;
}

type UserRole = "ADMIN" | "DOCTOR" | "PATIENT" | "NURSE" | "OPD_MANAGER" | "MEDICAL_STORE" | "PATHOLOGY_LAB" | "TECHNICIAN";

const roleToTitle: Record<UserRole, string> = {
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  OPD_MANAGER: "OPD Manager",
  ADMIN: "Administrator",
  PATIENT: "Patient",
  MEDICAL_STORE: "Medical Store Staff",
  PATHOLOGY_LAB: "Lab Technician",
  TECHNICIAN: "Technician"
};

const titleToRole = (title: string): UserRole => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("doctor") || lowerTitle.includes("dr.")) return "DOCTOR";
  if (lowerTitle.includes("nurse")) return "NURSE";
  if (lowerTitle.includes("opd") || lowerTitle.includes("manager")) return "OPD_MANAGER";
  if (lowerTitle.includes("admin")) return "ADMIN";
  if (lowerTitle.includes("pathology") || lowerTitle.includes("lab technician")) return "PATHOLOGY_LAB";
  if (lowerTitle.includes("medical") || lowerTitle.includes("store") || lowerTitle.includes("pharmacy")) return "MEDICAL_STORE";
  if (lowerTitle.includes("technician") || lowerTitle.includes("mri") || lowerTitle.includes("ct") || lowerTitle.includes("radiology") || lowerTitle.includes("sonography")) return "TECHNICIAN";
  return "OPD_MANAGER";
};

export default function UserManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{username: string; password: string; name: string; role: string} | null>(null);
  const [showCredentialsPassword, setShowCredentialsPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "ALL">("ALL");
  
  const DEPARTMENTS = [
    { value: "cardiology", label: "Cardiology" },
    { value: "neurology", label: "Neurology" },
    { value: "orthopedics", label: "Orthopedics" },
    { value: "pediatrics", label: "Pediatrics" },
    { value: "dermatology", label: "Dermatology" },
    { value: "general", label: "General Medicine" },
    { value: "emergency", label: "Emergency" },
    { value: "icu", label: "ICU" },
    { value: "surgery", label: "Surgery" },
    { value: "obstetrics", label: "Obstetrics & Gynecology" },
  ];

  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    phone: "",
    role: "" as UserRole,
    department: "",
    username: "",
    password: ""
  });

  const [editStaff, setEditStaff] = useState<{
    id: string;
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    department: string;
    specialization: string;
    status: string;
    username: string;
    plainPassword?: string | null;
    newPassword?: string;
  } | null>(null);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientPasswordVisibility, setPatientPasswordVisibility] = useState<Record<string, boolean>>({});
  const [editingPatient, setEditingPatient] = useState<{id: string; username: string; password: string; name: string; email: string} | null>(null);
  const [isEditPatientDialogOpen, setIsEditPatientDialogOpen] = useState(false);
  const [showEditPatientPassword, setShowEditPatientPassword] = useState(false);

  const { data: staffMembers = [], isLoading } = useQuery<HospitalTeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const { data: patientUsers = [], isLoading: isLoadingPatients } = useQuery<PatientUser[]>({
    queryKey: ["/api/admin/patient-users"],
  });

  const updatePatientMutation = useMutation({
    mutationFn: async (data: { id: string; username?: string; password?: string; name?: string; email?: string }) => {
      const { id, ...updates } = data;
      const response = await apiRequest("PATCH", `/api/admin/patient-users/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/patient-users"] });
      setEditingPatient(null);
      setIsEditPatientDialogOpen(false);
      toast({
        title: "Success",
        description: "Patient credentials updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update patient",
        variant: "destructive"
      });
    }
  });

  const addStaffMutation = useMutation({
    mutationFn: async (staffData: {
      name: string;
      title: string;
      email: string;
      phone: string;
      username: string;
      password: string;
      department: string;
    }) => {
      const response = await apiRequest("POST", "/api/team-members", staffData);
      return { ...await response.json(), credentials: { username: staffData.username, password: staffData.password, name: staffData.name, role: staffData.title } };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      setCreatedCredentials(data.credentials);
      setNewStaff({
        name: "",
        email: "",
        phone: "",
        role: "" as UserRole,
        department: "",
        username: "",
        password: ""
      });
      setIsAddDialogOpen(false);
      setShowCredentialsPassword(false);
      setIsCredentialsDialogOpen(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add staff member",
        variant: "destructive"
      });
    }
  });

  const updateStaffMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<HospitalTeamMember> }) => {
      const response = await apiRequest("PATCH", `/api/team-members/${data.id}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      setEditStaff(null);
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Staff member updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update staff member",
        variant: "destructive"
      });
    }
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/team-members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      toast({
        title: "Success",
        description: "Staff member removed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove staff member",
        variant: "destructive"
      });
    }
  });

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.email || !newStaff.role || !newStaff.username || !newStaff.password || !newStaff.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Require department for Doctor and Nurse roles
    if ((newStaff.role === "DOCTOR" || newStaff.role === "NURSE") && !newStaff.department) {
      toast({
        title: "Error",
        description: "Please select a department for this role",
        variant: "destructive"
      });
      return;
    }

    if (newStaff.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    addStaffMutation.mutate({
      name: newStaff.name.trim(),
      title: roleToTitle[newStaff.role] || newStaff.role,
      email: newStaff.email.trim(),
      phone: newStaff.phone.trim(),
      username: newStaff.username.trim(),
      password: newStaff.password,
      department: newStaff.department || "general"
    });
  };

  const handleEditClick = (member: HospitalTeamMember) => {
    setEditStaff({
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: titleToRole(member.title),
      department: member.department,
      specialization: member.specialization || "",
      status: member.status,
      username: (member as any).username || "",
      plainPassword: (member as any).plainPassword || null,
      newPassword: undefined
    });
    setShowEditPassword(false);
    setIsEditDialogOpen(true);
  };

  const handleUpdateStaff = () => {
    if (!editStaff) return;
    
    if (!editStaff.name || !editStaff.email || !editStaff.role || !editStaff.department || !editStaff.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    updateStaffMutation.mutate({
      id: editStaff.id,
      updates: {
        name: editStaff.name,
        title: roleToTitle[editStaff.role],
        department: editStaff.department,
        specialization: editStaff.specialization || editStaff.department,
        email: editStaff.email,
        phone: editStaff.phone,
        status: editStaff.status,
        newPassword: editStaff.newPassword
      }
    });
  };

  const handleDeleteStaff = (id: string) => {
    if (confirm("Are you sure you want to remove this staff member?")) {
      deleteStaffMutation.mutate(id);
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "ADMIN": return "destructive";
      case "DOCTOR": return "default";
      case "NURSE": return "secondary";
      case "OPD_MANAGER": return "outline";
      case "PATHOLOGY_LAB": return "default";
      case "MEDICAL_STORE": return "secondary";
      case "TECHNICIAN": return "default";
      default: return "outline";
    }
  };

  const filteredStaff = staffMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const memberRole = titleToRole(member.title);
    const matchesRole = filterRole === "ALL" || memberRole === filterRole;
    return matchesSearch && matchesRole;
  });

  const filteredPatients = patientUsers.filter(patient => {
    const matchesSearch = (patient.name || "").toLowerCase().includes(patientSearch.toLowerCase()) ||
                         (patient.username || "").toLowerCase().includes(patientSearch.toLowerCase()) ||
                         (patient.email || "").toLowerCase().includes(patientSearch.toLowerCase());
    return matchesSearch;
  });

  const togglePatientPasswordVisibility = (id: string) => {
    setPatientPasswordVisibility(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEditPatient = (patient: PatientUser) => {
    setEditingPatient({
      id: patient.id,
      username: patient.username,
      password: "",
      name: patient.name,
      email: patient.email,
    });
    setShowEditPatientPassword(false);
    setIsEditPatientDialogOpen(true);
  };

  const handleUpdatePatient = () => {
    if (!editingPatient) return;
    const updates: any = { id: editingPatient.id };
    if (editingPatient.username) updates.username = editingPatient.username;
    if (editingPatient.password) updates.password = editingPatient.password;
    if (editingPatient.name) updates.name = editingPatient.name;
    if (editingPatient.email) updates.email = editingPatient.email;
    updatePatientMutation.mutate(updates);
  };

  const doctorCount = staffMembers.filter(s => titleToRole(s.title) === "DOCTOR").length;
  const nurseCount = staffMembers.filter(s => titleToRole(s.title) === "NURSE").length;
  const activeCount = staffMembers.filter(s => s.status === "available").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading staff members...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold" data-testid="text-page-title">User Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Manage hospital staff and workforce</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-staff">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>
                Add a new doctor, nurse, or other hospital workforce member
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                    placeholder="Enter full name"
                    data-testid="input-staff-name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                    placeholder="Enter email"
                    data-testid="input-staff-email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                    placeholder="+91 98765 43210"
                    data-testid="input-staff-phone"
                  />
                </div>
                <div>
                  <Label>Role *</Label>
                  <Select value={newStaff.role} onValueChange={(value) => setNewStaff({...newStaff, role: value as UserRole})}>
                    <SelectTrigger data-testid="select-staff-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOCTOR">Doctor</SelectItem>
                      <SelectItem value="NURSE">Nurse</SelectItem>
                      <SelectItem value="OPD_MANAGER">OPD Manager</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="PATHOLOGY_LAB">Pathology Lab</SelectItem>
                      <SelectItem value="MEDICAL_STORE">Medical Store</SelectItem>
                      <SelectItem value="TECHNICIAN">Technician</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Department dropdown - shown for Doctor, Nurse, and Technician roles */}
              {(newStaff.role === "DOCTOR" || newStaff.role === "NURSE" || newStaff.role === "TECHNICIAN") && (
                <div>
                  <Label>Department *</Label>
                  <Select value={newStaff.department} onValueChange={(value) => setNewStaff({...newStaff, department: value})}>
                    <SelectTrigger data-testid="select-staff-department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={newStaff.username}
                    onChange={(e) => setNewStaff({...newStaff, username: e.target.value})}
                    placeholder="Enter username"
                    data-testid="input-staff-username"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                    placeholder="Min 6 characters"
                    data-testid="input-staff-password"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleAddStaff} 
                  className="flex-1"
                  disabled={addStaffMutation.isPending}
                  data-testid="button-submit-staff"
                >
                  {addStaffMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Staff Member"
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                  data-testid="button-cancel-staff"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff member information
            </DialogDescription>
          </DialogHeader>
          
          {editStaff && (
            <div className="space-y-4">
              {editStaff.username && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-blue-800 dark:text-blue-200">Login Credentials</span>
                  </div>
                  
                  <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded px-3 py-2 border">
                    <div>
                      <Label className="text-xs text-muted-foreground">User ID</Label>
                      <p className="font-mono font-bold text-lg">{editStaff.username}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(editStaff.username);
                        toast({ title: "Copied!", description: "User ID copied to clipboard" });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded px-3 py-2 border">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Password</Label>
                      {editStaff.newPassword ? (
                        <p className="font-mono font-bold text-lg tracking-widest">
                          {showEditPassword ? editStaff.newPassword : "•".repeat(editStaff.newPassword.length)}
                        </p>
                      ) : editStaff.plainPassword ? (
                        <p className="font-mono font-bold text-lg tracking-widest">
                          {showEditPassword ? editStaff.plainPassword : "•".repeat(editStaff.plainPassword.length)}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Click "Set Password" to create a new password</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {(editStaff.plainPassword || editStaff.newPassword) && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setShowEditPassword(!showEditPassword)}
                          >
                            {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              const pwd = editStaff.newPassword || editStaff.plainPassword;
                              if (pwd) {
                                navigator.clipboard.writeText(pwd);
                                toast({ title: "Copied!", description: "Password copied to clipboard" });
                              }
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {!editStaff.plainPassword && !editStaff.newPassword && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const newPass = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
                            setEditStaff({...editStaff, newPassword: newPass});
                            setShowEditPassword(true);
                          }}
                        >
                          Set Password
                        </Button>
                      )}
                    </div>
                  </div>
                  {editStaff.newPassword && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      New password will be saved when you click "Update Staff Member"
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Full Name *</Label>
                  <Input
                    id="edit-name"
                    value={editStaff.name}
                    onChange={(e) => setEditStaff({...editStaff, name: e.target.value})}
                    placeholder="Enter full name"
                    data-testid="input-edit-name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editStaff.email}
                    onChange={(e) => setEditStaff({...editStaff, email: e.target.value})}
                    placeholder="Enter email"
                    data-testid="input-edit-email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-phone">Phone *</Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    value={editStaff.phone}
                    onChange={(e) => setEditStaff({...editStaff, phone: e.target.value})}
                    placeholder="+91 98765 43210"
                    data-testid="input-edit-phone"
                  />
                </div>
                <div>
                  <Label>Role *</Label>
                  <Select value={editStaff.role} onValueChange={(value) => setEditStaff({...editStaff, role: value as UserRole})}>
                    <SelectTrigger data-testid="select-edit-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOCTOR">Doctor</SelectItem>
                      <SelectItem value="NURSE">Nurse</SelectItem>
                      <SelectItem value="OPD_MANAGER">OPD Manager</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="PATHOLOGY_LAB">Pathology Lab</SelectItem>
                      <SelectItem value="MEDICAL_STORE">Medical Store</SelectItem>
                      <SelectItem value="TECHNICIAN">Technician</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-department">Department *</Label>
                  <Input
                    id="edit-department"
                    value={editStaff.department}
                    onChange={(e) => setEditStaff({...editStaff, department: e.target.value})}
                    placeholder="e.g., Cardiology"
                    data-testid="input-edit-department"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-specialization">Specialization</Label>
                  <Input
                    id="edit-specialization"
                    value={editStaff.specialization}
                    onChange={(e) => setEditStaff({...editStaff, specialization: e.target.value})}
                    placeholder="e.g., Heart Surgery"
                    data-testid="input-edit-specialization"
                  />
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={editStaff.status} onValueChange={(value) => setEditStaff({...editStaff, status: value})}>
                  <SelectTrigger data-testid="select-edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleUpdateStaff} 
                  className="flex-1"
                  disabled={updateStaffMutation.isPending}
                  data-testid="button-update-staff"
                >
                  {updateStaffMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Staff Member"
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditStaff(null);
                    setIsEditDialogOpen(false);
                  }}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              User Created Successfully
            </DialogTitle>
            <DialogDescription>
              Save these login credentials. The password cannot be retrieved later.
            </DialogDescription>
          </DialogHeader>
          
          {createdCredentials && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Key className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-800 dark:text-green-200">Login Credentials</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <p className="font-medium">{createdCredentials.name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Role</Label>
                    <p className="font-medium">{createdCredentials.role}</p>
                  </div>
                  <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded px-3 py-2 border">
                    <div>
                      <Label className="text-xs text-muted-foreground">User ID</Label>
                      <p className="font-mono font-bold text-lg">{createdCredentials.username}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(createdCredentials.username);
                        toast({ title: "Copied!", description: "User ID copied to clipboard" });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded px-3 py-2 border">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Password</Label>
                      <p className="font-mono font-bold text-lg tracking-widest">
                        {showCredentialsPassword ? createdCredentials.password : "•".repeat(createdCredentials.password.length)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setShowCredentialsPassword(!showCredentialsPassword)}
                      >
                        {showCredentialsPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          navigator.clipboard.writeText(createdCredentials.password);
                          toast({ title: "Copied!", description: "Password copied to clipboard" });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
                <p className="text-amber-800 dark:text-amber-200">
                  <strong>Important:</strong> Please save or share these credentials now. The password is encrypted and cannot be retrieved later.
                </p>
              </div>
              
              <Button 
                onClick={() => {
                  setIsCredentialsDialogOpen(false);
                  setCreatedCredentials(null);
                }}
                className="w-full"
              >
                Done - I have saved the credentials
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
            <div className="text-xl sm:text-2xl font-bold" data-testid="text-total-staff">{staffMembers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Doctors</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
            <div className="text-xl sm:text-2xl font-bold" data-testid="text-doctors-count">
              {doctorCount}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Nurses</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
            <div className="text-xl sm:text-2xl font-bold" data-testid="text-nurses-count">
              {nurseCount}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Active Staff</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
            <div className="text-xl sm:text-2xl font-bold" data-testid="text-active-staff">
              {activeCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Directory</CardTitle>
          <CardDescription>Search and filter hospital staff members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-staff"
              />
            </div>
            <Select value={filterRole} onValueChange={(value) => setFilterRole(value as UserRole | "ALL")}>
              <SelectTrigger className="w-40" data-testid="select-filter-role">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="DOCTOR">Doctors</SelectItem>
                <SelectItem value="NURSE">Nurses</SelectItem>
                <SelectItem value="OPD_MANAGER">OPD Managers</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
                <SelectItem value="PATHOLOGY_LAB">Pathology Lab</SelectItem>
                <SelectItem value="MEDICAL_STORE">Medical Store</SelectItem>
                <SelectItem value="TECHNICIAN">Technicians</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredStaff.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || filterRole !== "ALL" 
                  ? "No staff members match your search criteria"
                  : "No staff members yet. Add your first staff member above."}
              </div>
            ) : (
              filteredStaff.map((member) => {
                const role = titleToRole(member.title);
                return (
                  <div key={member.id} className="flex flex-wrap items-center justify-between gap-2 p-4 border rounded-lg hover-elevate">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium" data-testid={`text-staff-name-${member.id}`}>
                            {member.name}
                          </p>
                          <Badge variant={getRoleBadgeVariant(role)}>
                            {member.title}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.department} • {member.phone}
                        </p>
                        {(member as any).username && (
                          <p className="text-xs font-mono bg-primary/10 px-2 py-0.5 rounded inline-block mt-1">
                            <Key className="h-3 w-3 inline mr-1" />
                            User ID: <strong>{(member as any).username}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={member.status === "available" ? "default" : "secondary"}>
                        {member.status === "available" ? "ACTIVE" : member.status?.toUpperCase()}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditClick(member)}
                        data-testid={`button-edit-${member.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteStaff(member.id)}
                        disabled={deleteStaffMutation.isPending}
                        data-testid={`button-delete-${member.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditPatientDialogOpen} onOpenChange={setIsEditPatientDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Patient Credentials</DialogTitle>
            <DialogDescription>
              Update patient login credentials
            </DialogDescription>
          </DialogHeader>
          
          {editingPatient && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="patient-name">Name</Label>
                <Input
                  id="patient-name"
                  value={editingPatient.name}
                  onChange={(e) => setEditingPatient({...editingPatient, name: e.target.value})}
                  placeholder="Patient name"
                />
              </div>
              <div>
                <Label htmlFor="patient-email">Email</Label>
                <Input
                  id="patient-email"
                  type="email"
                  value={editingPatient.email}
                  onChange={(e) => setEditingPatient({...editingPatient, email: e.target.value})}
                  placeholder="Patient email"
                />
              </div>
              <div>
                <Label htmlFor="patient-username">User ID (Username)</Label>
                <Input
                  id="patient-username"
                  value={editingPatient.username}
                  onChange={(e) => setEditingPatient({...editingPatient, username: e.target.value})}
                  placeholder="Username"
                />
              </div>
              <div>
                <Label htmlFor="patient-password">New Password</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="patient-password"
                      type={showEditPatientPassword ? "text" : "password"}
                      value={editingPatient.password}
                      onChange={(e) => setEditingPatient({...editingPatient, password: e.target.value})}
                      placeholder="Leave empty to keep current"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowEditPatientPassword(!showEditPatientPassword)}
                  >
                    {showEditPatientPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Leave empty to keep the current password</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleUpdatePatient}
                  className="flex-1"
                  disabled={updatePatientMutation.isPending}
                >
                  {updatePatientMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Patient
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingPatient(null);
                    setIsEditPatientDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Patient Accounts ({patientUsers.length})
              </CardTitle>
              <CardDescription>All registered patient login credentials</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, username, or email..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoadingPatients ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading patients...</span>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {patientSearch ? "No patients match your search" : "No patient accounts found"}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2 text-xs font-medium text-muted-foreground border-b">
                <span>Patient</span>
                <span className="w-32 text-center">User ID</span>
                <span className="w-40 text-center">Password</span>
                <span className="w-20 text-center">Status</span>
                <span className="w-16 text-center">Actions</span>
              </div>
              {filteredPatients.map((patient) => (
                <div key={patient.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-center p-3 border rounded-md hover-elevate">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{patient.name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground truncate">{patient.email || "No email"}</p>
                  </div>
                  <div className="w-32 text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <span className="font-mono text-sm font-bold">{patient.username}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(patient.username);
                          toast({ title: "Copied!", description: "User ID copied" });
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="w-40 text-center">
                    {patient.plainPassword ? (
                      <div className="flex items-center gap-1 justify-center">
                        <span className="font-mono text-sm">
                          {patientPasswordVisibility[patient.id] ? patient.plainPassword : "••••••••"}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePatientPasswordVisibility(patient.id)}
                        >
                          {patientPasswordVisibility[patient.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(patient.plainPassword!);
                            toast({ title: "Copied!", description: "Password copied" });
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Not stored</span>
                    )}
                  </div>
                  <div className="w-20 text-center">
                    <Badge variant={patient.status === "active" ? "default" : "secondary"}>
                      {patient.status?.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="w-16 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditPatient(patient)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
