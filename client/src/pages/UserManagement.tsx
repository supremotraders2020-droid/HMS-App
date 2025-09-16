import { useState } from "react";
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
  Settings, 
  Search,
  Edit,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type UserRole = "ADMIN" | "DOCTOR" | "PATIENT" | "NURSE" | "OPD_MANAGER";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: "ACTIVE" | "INACTIVE";
  joinDate: string;
}

export default function UserManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "ALL">("ALL");
  
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    role: "" as UserRole,
    department: "",
    password: "",
    confirmPassword: ""
  });

  // Mock data for demonstration
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([
    {
      id: "1",
      name: "Dr. Sarah Johnson",
      email: "sarah.johnson@galaxy-hospital.com",
      role: "DOCTOR",
      department: "Cardiology",
      status: "ACTIVE",
      joinDate: "2023-01-15"
    },
    {
      id: "2",
      name: "Nurse Mary Williams",
      email: "mary.williams@galaxy-hospital.com",
      role: "NURSE",
      department: "Emergency",
      status: "ACTIVE",
      joinDate: "2023-03-20"
    },
    {
      id: "3",
      name: "John Smith",
      email: "john.smith@galaxy-hospital.com",
      role: "OPD_MANAGER",
      department: "Outpatient",
      status: "ACTIVE",
      joinDate: "2023-02-10"
    }
  ]);

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.email || !newStaff.role || !newStaff.department) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (newStaff.password !== newStaff.confirmPassword) {
      toast({
        title: "Error", 
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    const newStaffMember: StaffMember = {
      id: Date.now().toString(),
      name: newStaff.name,
      email: newStaff.email,
      role: newStaff.role,
      department: newStaff.department,
      status: "ACTIVE",
      joinDate: new Date().toISOString().split('T')[0]
    };

    setStaffMembers([...staffMembers, newStaffMember]);
    setNewStaff({
      name: "",
      email: "",
      role: "" as UserRole,
      department: "",
      password: "",
      confirmPassword: ""
    });
    setIsAddDialogOpen(false);
    
    toast({
      title: "Success",
      description: `${newStaff.role.replace("_", " ")} added successfully`,
    });
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "ADMIN": return "destructive";
      case "DOCTOR": return "default";
      case "NURSE": return "secondary";
      case "OPD_MANAGER": return "outline";
      default: return "outline";
    }
  };

  const filteredStaff = staffMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "ALL" || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">User Management</h1>
          <p className="text-muted-foreground">Manage hospital staff and workforce</p>
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
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    value={newStaff.department}
                    onChange={(e) => setNewStaff({...newStaff, department: e.target.value})}
                    placeholder="e.g., Cardiology"
                    data-testid="input-staff-department"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                    placeholder="Enter password"
                    data-testid="input-staff-password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={newStaff.confirmPassword}
                    onChange={(e) => setNewStaff({...newStaff, confirmPassword: e.target.value})}
                    placeholder="Confirm password"
                    data-testid="input-staff-confirm-password"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleAddStaff} 
                  className="flex-1"
                  data-testid="button-submit-staff"
                >
                  Add Staff Member
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-staff">{staffMembers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doctors</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-doctors-count">
              {staffMembers.filter(s => s.role === "DOCTOR").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nurses</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-nurses-count">
              {staffMembers.filter(s => s.role === "NURSE").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-staff">
              {staffMembers.filter(s => s.status === "ACTIVE").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Directory</CardTitle>
          <CardDescription>Search and filter hospital staff members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
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
              </SelectContent>
            </Select>
          </div>

          {/* Staff List */}
          <div className="space-y-3">
            {filteredStaff.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover-elevate">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium" data-testid={`text-staff-name-${member.id}`}>
                        {member.name}
                      </p>
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.role.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.department} • Joined {member.joinDate}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={member.status === "ACTIVE" ? "default" : "secondary"}>
                    {member.status}
                  </Badge>
                  <Button variant="ghost" size="sm" data-testid={`button-edit-${member.id}`}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" data-testid={`button-delete-${member.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}