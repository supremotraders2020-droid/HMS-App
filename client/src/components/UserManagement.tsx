import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  Shield, 
  Users,
  Filter
} from "lucide-react";

type UserRole = "ADMIN" | "DOCTOR" | "PATIENT" | "NURSE" | "OPD_MANAGER";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  lastLogin: string;
  department?: string;
  avatar?: string;
}

interface UserManagementProps {
  users?: User[];
  onCreateUser?: (userData: Partial<User>) => void;
  onEditUser?: (userId: string, userData: Partial<User>) => void;
  onDeleteUser?: (userId: string) => void;
  onChangeRole?: (userId: string, newRole: UserRole) => void;
}

export default function UserManagement({ 
  users = [], 
  onCreateUser,
  onEditUser,
  onDeleteUser,
  onChangeRole 
}: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | "ALL">("ALL");
  const [isCreating, setIsCreating] = useState(false);

  // Mock users if none provided
  const mockUsers: User[] = [
    {
      id: "1",
      name: "Dr. Sarah Wilson",
      email: "sarah.wilson@hospital.com",
      role: "DOCTOR",
      status: "ACTIVE",
      lastLogin: "2 hours ago",
      department: "Cardiology"
    },
    {
      id: "2", 
      name: "Nurse Jennifer Adams",
      email: "jennifer.adams@hospital.com",
      role: "NURSE",
      status: "ACTIVE",
      lastLogin: "30 minutes ago",
      department: "Emergency"
    },
    {
      id: "3",
      name: "John Smith",
      email: "john.smith@hospital.com", 
      role: "PATIENT",
      status: "ACTIVE",
      lastLogin: "1 day ago"
    },
    {
      id: "4",
      name: "Dr. Michael Chen",
      email: "michael.chen@hospital.com",
      role: "ADMIN",
      status: "ACTIVE", 
      lastLogin: "5 minutes ago",
      department: "Administration"
    },
    {
      id: "5",
      name: "Mary Johnson",
      email: "mary.johnson@hospital.com",
      role: "OPD_MANAGER",
      status: "INACTIVE",
      lastLogin: "3 days ago",
      department: "Outpatient"
    }
  ];

  const displayUsers = users.length > 0 ? users : mockUsers;

  const filteredUsers = displayUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "ALL" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleVariant = (role: UserRole) => {
    switch (role) {
      case "ADMIN": return "destructive";
      case "DOCTOR": return "default";
      case "NURSE": return "secondary";
      case "OPD_MANAGER": return "outline";
      case "PATIENT": return "secondary";
      default: return "outline";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "ACTIVE": return "default";
      case "INACTIVE": return "secondary";
      case "SUSPENDED": return "destructive";
      default: return "outline";
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleCreateUser = () => {
    console.log("Creating new user");
    setIsCreating(true);
    onCreateUser?.({
      name: "New User",
      email: "newuser@hospital.com",
      role: "PATIENT",
      status: "ACTIVE"
    });
  };

  const handleEditUser = (userId: string) => {
    console.log(`Editing user: ${userId}`);
    onEditUser?.(userId, {});
  };

  const handleDeleteUser = (userId: string) => {
    console.log(`Deleting user: ${userId}`);
    onDeleteUser?.(userId);
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    console.log(`Changing role for ${userId} to ${newRole}`);
    onChangeRole?.(userId, newRole);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">User Management</h2>
          <p className="text-muted-foreground">Manage system users and their roles</p>
        </div>
        <Button onClick={handleCreateUser} data-testid="button-create-user">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-users"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="role-filter">Filter by Role</Label>
              <Select value={selectedRole} onValueChange={(value: UserRole | "ALL") => setSelectedRole(value)}>
                <SelectTrigger data-testid="select-role-filter">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                  <SelectItem value="DOCTOR">Doctor</SelectItem>
                  <SelectItem value="NURSE">Nurse</SelectItem>
                  <SelectItem value="OPD_MANAGER">OPD Manager</SelectItem>
                  <SelectItem value="PATIENT">Patient</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} data-testid={`card-user-${user.id}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="font-semibold" data-testid={`text-user-name-${user.id}`}>
                      {user.name}
                    </h3>
                    <p className="text-sm text-muted-foreground" data-testid={`text-user-email-${user.id}`}>
                      {user.email}
                    </p>
                    {user.department && (
                      <p className="text-xs text-muted-foreground">
                        {user.department}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Last login: {user.lastLogin}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex flex-col space-y-2">
                    <Badge variant={getRoleVariant(user.role)} data-testid={`badge-role-${user.id}`}>
                      <Shield className="h-3 w-3 mr-1" />
                      {user.role.replace("_", " ")}
                    </Badge>
                    <Badge variant={getStatusVariant(user.status)} data-testid={`badge-status-${user.id}`}>
                      {user.status}
                    </Badge>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditUser(user.id)}
                      data-testid={`button-edit-${user.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      data-testid={`button-delete-${user.id}`}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground mb-4">
              No users match your current filters. Try adjusting your search criteria.
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedRole("ALL");
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}