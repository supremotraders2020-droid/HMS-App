import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, UserPlus, LogIn } from "lucide-react";

type UserRole = "ADMIN" | "DOCTOR" | "PATIENT" | "NURSE" | "OPD_MANAGER";

interface AuthFormsProps {
  onLogin?: (username: string, password: string, role: UserRole) => void;
  onRegister?: (userData: any) => void;
  loginError?: string | null;
}

export default function AuthForms({ onLogin, onRegister, loginError }: AuthFormsProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "" as UserRole,
    firstName: "",
    lastName: ""
  });

  const roles: { value: UserRole; label: string; description: string }[] = [
    { value: "ADMIN", label: "Administrator", description: "Full system access" },
    { value: "DOCTOR", label: "Doctor", description: "Patient care & diagnosis" },
    { value: "NURSE", label: "Nurse", description: "Patient care & monitoring" },
    { value: "OPD_MANAGER", label: "OPD Manager", description: "Outpatient department" },
    { value: "PATIENT", label: "Patient", description: "Personal health records" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin && onLogin) {
      onLogin(formData.username, formData.password, formData.role);
    } else if (!isLogin && onRegister) {
      onRegister(formData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            <Stethoscope className="h-8 w-8 text-primary mr-2" />
            <span className="text-2xl font-semibold">HMS Core</span>
          </div>
          <CardTitle className="text-2xl">{isLogin ? "Sign In" : "Create Account"}</CardTitle>
          <CardDescription>
            {isLogin 
              ? "Enter your credentials to access the hospital system" 
              : "Register for a new account in the hospital system"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loginError && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm" data-testid="login-error">
              {loginError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" data-testid="label-firstName">First Name</Label>
                  <Input
                    id="firstName"
                    data-testid="input-firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" data-testid="label-lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    data-testid="input-lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" data-testid="label-username">Username</Label>
              <Input
                id="username"
                data-testid="input-username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                required
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="email" data-testid="label-email">Email</Label>
                <Input
                  id="email"
                  data-testid="input-email"
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" data-testid="label-password">Password</Label>
              <Input
                id="password"
                data-testid="input-password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
              />
            </div>


            <div className="space-y-2">
              <Label htmlFor="role" data-testid="label-role">Role</Label>
              <Select value={formData.role} onValueChange={(value: UserRole) => handleInputChange("role", value)}>
                <SelectTrigger data-testid="select-role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{role.label}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {role.description}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              data-testid={isLogin ? "button-login" : "button-register"}
            >
              {isLogin ? (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          <div className="text-center">
            <Button
              variant="ghost"
              data-testid="button-toggle-mode"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm"
            >
              {isLogin ? "Need an account? Register here" : "Already have an account? Sign in"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}