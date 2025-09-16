import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import AuthForms from "@/components/AuthForms";
import HMSSidebar from "@/components/HMSSidebar";
import HMSDashboard from "@/components/HMSDashboard";
import UserManagement from "@/components/UserManagement";
import PatientCard from "@/components/PatientCard";
import TenantSwitcher from "@/components/TenantSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import NotFound from "@/pages/not-found";

type UserRole = "ADMIN" | "DOCTOR" | "PATIENT" | "NURSE" | "OPD_MANAGER";

interface User {
  username: string;
  name: string;
  role: UserRole;
  tenantId: string;
  hospitalName: string;
}

interface Hospital {
  id: string;
  name: string;
  location: string;
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
}

function Router({ currentUser, currentPath }: { currentUser: User; currentPath: string }) {
  // Mock patients data
  const mockPatients = [
    {
      id: "1", name: "John Martinez", age: 45, gender: "M" as const,
      phone: "(555) 123-4567", address: "123 Main St, City, State",
      condition: "Hypertension, Type 2 Diabetes", status: "ADMITTED" as const,
      room: "A-205", admissionDate: "Dec 15, 2024", lastVisit: "Dec 14, 2024",
      urgency: "MEDIUM" as const
    },
    {
      id: "2", name: "Sarah Johnson", age: 67, gender: "F" as const,
      phone: "(555) 987-6543", address: "456 Oak Ave, City, State",
      condition: "Post-operative care", status: "EMERGENCY" as const,
      room: "E-101", admissionDate: "Dec 16, 2024", lastVisit: "Dec 16, 2024",
      urgency: "CRITICAL" as const
    },
    {
      id: "3", name: "Robert Chen", age: 32, gender: "M" as const,
      phone: "(555) 456-7890", address: "789 Pine St, City, State",
      condition: "Routine checkup", status: "OUTPATIENT" as const,
      lastVisit: "Dec 10, 2024", urgency: "LOW" as const
    }
  ];

  return (
    <Switch>
      <Route path="/">
        <HMSDashboard 
          currentRole={currentUser.role}
          userName={currentUser.name}
          hospitalName={currentUser.hospitalName}
        />
      </Route>
      <Route path="/dashboard">
        <HMSDashboard 
          currentRole={currentUser.role}
          userName={currentUser.name}
          hospitalName={currentUser.hospitalName}
        />
      </Route>
      <Route path="/users">
        {currentUser.role === "ADMIN" ? (
          <UserManagement 
            onCreateUser={(userData) => console.log('Create user:', userData)}
            onEditUser={(id, userData) => console.log('Edit user:', id, userData)}
            onDeleteUser={(id) => console.log('Delete user:', id)}
            onChangeRole={(id, role) => console.log('Change role:', id, role)}
          />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">Only administrators can access user management.</p>
          </div>
        )}
      </Route>
      <Route path="/patients">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Patient Management</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockPatients.map((patient) => (
              <PatientCard 
                key={patient.id}
                patient={patient}
                onViewDetails={(id) => console.log('View patient details:', id)}
                onUpdateStatus={(id, status) => console.log('Update patient status:', id, status)}
              />
            ))}
          </div>
        </div>
      </Route>
      <Route path="/appointments">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Appointments</h2>
          <p className="text-muted-foreground">Appointment management interface (Demo)</p>
        </div>
      </Route>
      <Route path="/settings">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Settings</h2>
          <p className="text-muted-foreground">System settings interface (Demo)</p>
        </div>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentHospital, setCurrentHospital] = useState<Hospital>({
    id: "1",
    name: "Galaxy Multi Specialty Hospital", 
    location: "sane chowk, Nair Colony, More Vasti, Chikhali, Pimpri-Chinchwad, Maharashtra 411062",
    status: "ACTIVE"
  });

  // Hospital data
  const hospitals: Hospital[] = [
    { id: "1", name: "Galaxy Multi Specialty Hospital", location: "sane chowk, Nair Colony, More Vasti, Chikhali, Pimpri-Chinchwad, Maharashtra 411062", status: "ACTIVE" },
    { id: "2", name: "St. Mary's Medical Center", location: "Westside", status: "ACTIVE" },
    { id: "3", name: "Regional Healthcare Network", location: "Northside", status: "MAINTENANCE" }
  ];

  const handleLogin = (username: string, role: UserRole, tenantId: string) => {
    const selectedHospital = hospitals.find(h => h.id === tenantId) || hospitals[0];
    setCurrentHospital(selectedHospital);
    setCurrentUser({
      username,
      name: getDisplayName(username, role),
      role,
      tenantId,
      hospitalName: selectedHospital.name
    });
  };

  const getDisplayName = (username: string, role: UserRole) => {
    // Mock display names based on role
    const names: Record<UserRole, string> = {
      ADMIN: "Dr. Michael Chen",
      DOCTOR: "Dr. Sarah Wilson", 
      NURSE: "Nurse Jennifer Adams",
      OPD_MANAGER: "Mary Johnson",
      PATIENT: "John Smith"
    };
    return names[role] || username;
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleHospitalChange = (hospital: Hospital) => {
    setCurrentHospital(hospital);
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        tenantId: hospital.id,
        hospitalName: hospital.name
      });
    }
  };

  // Custom sidebar width for HMS
  const sidebarStyle = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  if (!currentUser) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <AuthForms onLogin={handleLogin} />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <SidebarProvider style={sidebarStyle as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <HMSSidebar 
                currentRole={currentUser.role}
                currentUser={{
                  name: currentUser.name,
                  hospitalName: currentUser.hospitalName
                }}
                onNavigate={(path) => {
                  console.log('Navigating to:', path);
                  // In a real app, this would use router navigation
                  window.location.hash = path;
                }}
                onLogout={handleLogout}
              />
              <div className="flex flex-col flex-1">
                <header className="flex items-center justify-between p-4 border-b bg-background">
                  <div className="flex items-center space-x-4">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <TenantSwitcher 
                      currentHospital={currentHospital}
                      hospitals={hospitals}
                      onHospitalChange={handleHospitalChange}
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-muted-foreground">
                      Tenant ID: {currentUser.tenantId}
                    </span>
                    <ThemeToggle />
                  </div>
                </header>
                <main className="flex-1 overflow-auto p-6">
                  <Router currentUser={currentUser} currentPath="/" />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
