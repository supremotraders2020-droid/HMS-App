import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import AuthForms from "@/components/AuthForms";
import HMSSidebar from "@/components/HMSSidebar";
import HMSDashboard from "@/components/HMSDashboard";
import PatientCard from "@/components/PatientCard";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import NotFound from "@/pages/not-found";
import UserManagement from "@/pages/UserManagement";
import HospitalSettings from "@/pages/HospitalSettings";
import SystemSettings from "@/pages/SystemSettings";
import OPDService from "@/pages/OPDService";
import InventoryService from "@/pages/InventoryService";
import PatientTrackingService from "@/pages/PatientTrackingService";
import ChatbotService from "@/pages/ChatbotService";
import PatientService from "@/pages/PatientService";
import BiometricService from "@/pages/BiometricService";
import NotificationService from "@/pages/NotificationService";
import PatientPortal from "@/pages/PatientPortal";
import DoctorPortal from "@/pages/DoctorPortal";
import EquipmentServicing from "@/pages/EquipmentServicing";
import ConsentForms from "@/pages/ConsentForms";
import OxygenTracker from "@/pages/OxygenTracker";
import BiowastePage from "@/pages/BiowastePage";
import AIAnalytics from "@/pages/AIAnalytics";
import InpatientAnalytics from "@/pages/InpatientAnalytics";
import SwabMonitoring from "@/pages/SwabMonitoring";
import DiseaseKnowledge from "@/pages/DiseaseKnowledge";
import FloatingChatButton from "@/components/FloatingChatButton";
import PrescriptionsPage from "@/pages/PrescriptionsPage";
import PatientMonitoringPage from "@/pages/PatientMonitoringPage";
import BedManagementPage from "@/pages/BedManagementPage";
import BloodBankPage from "@/pages/BloodBankPage";
import MedicalStoreManagement from "@/pages/MedicalStoreManagement";
import MedicalStorePortal from "@/pages/MedicalStorePortal";
import PathologyLabPortal from "@/pages/PathologyLabPortal";
import PatientBarcodePage from "@/pages/PatientBarcodePage";
import StaffManagement from "@/pages/StaffManagement";
import InsuranceManagement from "@/pages/InsuranceManagement";
import FaceRecognition from "@/pages/FaceRecognition";

type UserRole = "ADMIN" | "DOCTOR" | "PATIENT" | "NURSE" | "OPD_MANAGER" | "MEDICAL_STORE" | "PATHOLOGY_LAB";

interface User {
  id: string;
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
        {currentUser.role === "MEDICAL_STORE" ? (
          <MedicalStorePortal currentUserId={currentUser.id} />
        ) : (
          <HMSDashboard 
            currentRole={currentUser.role}
            userName={currentUser.name}
            hospitalName={currentUser.hospitalName}
            userId={currentUser.id}
          />
        )}
      </Route>
      <Route path="/dashboard">
        {currentUser.role === "MEDICAL_STORE" ? (
          <MedicalStorePortal currentUserId={currentUser.id} />
        ) : (
          <HMSDashboard 
            currentRole={currentUser.role}
            userName={currentUser.name}
            hospitalName={currentUser.hospitalName}
            userId={currentUser.id}
          />
        )}
      </Route>
      <Route path="/users">
        {currentUser.role === "ADMIN" ? (
          <UserManagement />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">Only administrators can access user management.</p>
          </div>
        )}
      </Route>
      <Route path="/hospitals">
        {currentUser.role === "ADMIN" ? (
          <HospitalSettings />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">Only administrators can access hospital settings.</p>
          </div>
        )}
      </Route>
      <Route path="/settings">
        {currentUser.role === "ADMIN" ? (
          <SystemSettings />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">Only administrators can access system settings.</p>
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

      {/* Service Routes */}
      <Route path="/opd-service">
        <OPDService />
      </Route>
      <Route path="/patient-service">
        <PatientService currentRole={currentUser.role} currentUserId={currentUser.id} />
      </Route>
      <Route path="/inventory-service">
        <InventoryService />
      </Route>
      <Route path="/patient-tracking">
        <PatientTrackingService />
      </Route>
      <Route path="/biometric-service">
        <BiometricService />
      </Route>
      <Route path="/chatbot-service">
        <ChatbotService />
      </Route>
      <Route path="/notification-service">
        <NotificationService currentRole={currentUser.role} currentUserId={currentUser.id} />
      </Route>
      <Route path="/equipment-servicing">
        <EquipmentServicing />
      </Route>
      <Route path="/oxygen-tracker">
        {(currentUser.role === "ADMIN" || currentUser.role === "NURSE") ? (
          <OxygenTracker />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">Only administrators and nurses can access oxygen tracking.</p>
          </div>
        )}
      </Route>
      <Route path="/consent-forms">
        {currentUser.role === "ADMIN" ? (
          <ConsentForms currentUser={currentUser} />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">Only administrators can access consent forms.</p>
          </div>
        )}
      </Route>
      <Route path="/biowaste-management">
        {currentUser.role === "ADMIN" ? (
          <BiowastePage />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">Only administrators can access biomedical waste management.</p>
          </div>
        )}
      </Route>
      <Route path="/swab-monitoring">
        {currentUser.role === "ADMIN" ? (
          <SwabMonitoring />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">Only administrators can access swab monitoring.</p>
          </div>
        )}
      </Route>
      <Route path="/disease-knowledge">
        {["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER"].includes(currentUser.role) ? (
          <DiseaseKnowledge />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">Please access disease knowledge from your patient portal.</p>
          </div>
        )}
      </Route>
      <Route path="/ai-analytics">
        {currentUser.role === "ADMIN" ? (
          <AIAnalytics />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">Only administrators can access AI Analytics.</p>
          </div>
        )}
      </Route>
      <Route path="/bed-management">
        {currentUser.role === "ADMIN" ? (
          <BedManagementPage />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">Only administrators can access bed management.</p>
          </div>
        )}
      </Route>
      <Route path="/blood-bank">
        {currentUser.role === "ADMIN" ? (
          <BloodBankPage />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">Only administrators can access the Blood Bank module.</p>
          </div>
        )}
      </Route>
      <Route path="/medical-stores">
        {currentUser.role === "ADMIN" ? (
          <MedicalStoreManagement />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">Only administrators can access Medical Store Management.</p>
          </div>
        )}
      </Route>
      <Route path="/medical-store-portal">
        {currentUser.role === "MEDICAL_STORE" ? (
          <MedicalStorePortal currentUserId={currentUser.id} />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">Only medical store staff can access this portal.</p>
          </div>
        )}
      </Route>
      <Route path="/pathology-lab-portal">
        {["PATHOLOGY_LAB", "ADMIN"].includes(currentUser.role) ? (
          <PathologyLabPortal currentUserId={currentUser.id} currentUserName={currentUser.name} />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">Only pathology lab staff and administrators can access this portal.</p>
          </div>
        )}
      </Route>
      <Route path="/patient-analytics">
        {currentUser.role === "ADMIN" ? (
          <InpatientAnalytics />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">Only administrators can access Patient Analytics.</p>
          </div>
        )}
      </Route>

      {/* Prescriptions Route - for OPD Manager and Doctor */}
      <Route path="/prescriptions">
        {["ADMIN", "DOCTOR", "OPD_MANAGER"].includes(currentUser.role) ? (
          <PrescriptionsPage 
            currentUser={currentUser}
          />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">Only doctors and OPD managers can access prescriptions.</p>
          </div>
        )}
      </Route>

      {/* Patient Monitoring Route - for Admin, Doctor, Nurse */}
      <Route path="/patient-monitoring">
        {["ADMIN", "DOCTOR", "NURSE"].includes(currentUser.role) ? (
          <PatientMonitoringPage />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">Only medical staff can access Patient Monitoring.</p>
          </div>
        )}
      </Route>

      {/* Patient Barcode Scanner Route - for Admin, Doctor, Nurse only */}
      <Route path="/patient-barcode">
        {["ADMIN", "DOCTOR", "NURSE"].includes(currentUser.role) ? (
          <PatientBarcodePage currentRole={currentUser.role} />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">Only Doctors, Nurses, and Administrators can scan patient barcodes.</p>
          </div>
        )}
      </Route>

      {/* Other Routes */}
      <Route path="/appointments">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Appointments</h2>
          <p className="text-muted-foreground">Appointment management interface (Demo)</p>
        </div>
      </Route>
      <Route path="/staff-management">
        {["ADMIN", "OPD_MANAGER"].includes(currentUser.role) ? (
          <StaffManagement />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">Staff management is accessible to administrators and OPD managers only.</p>
          </div>
        )}
      </Route>
      <Route path="/insurance-management">
        {["ADMIN"].includes(currentUser.role) ? (
          <InsuranceManagement />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">Insurance management is accessible to administrators only.</p>
          </div>
        )}
      </Route>
      <Route path="/face-recognition">
        {["ADMIN", "NURSE", "OPD_MANAGER"].includes(currentUser.role) ? (
          <FaceRecognition />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">Face recognition is accessible to administrators, nurses and OPD managers only.</p>
          </div>
        )}
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

function AppContent() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentHospital, setCurrentHospital] = useState<Hospital>({
    id: "1",
    name: "Gravity Hospital", 
    location: "Gat No, 167, Sahyog Nager, Triveni Nagar, Nigdi, Pimpri-Chinchwad, Maharashtra 411062",
    status: "ACTIVE"
  });
  const [location, setLocation] = useLocation();

  // Hospital data (Gravity Hospital only)
  const hospitals: Hospital[] = [
    { id: "1", name: "Gravity Hospital", location: "Gat No, 167, Sahyog Nager, Triveni Nagar, Chowk, Pimpri-Chinchwad, Maharashtra 411062", status: "ACTIVE" }
  ];

  const [loginError, setLoginError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async (userData: { 
    username: string; 
    password: string; 
    role: UserRole;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
  }) => {
    setLoginError(null);
    setIsRegistering(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Registration successful - auto login with the new user
        const galaxyHospital = hospitals[0];
        setCurrentUser({
          id: data.id,
          username: data.username,
          name: data.name || `${userData.firstName} ${userData.lastName}`,
          role: data.role,
          tenantId: galaxyHospital.id,
          hospitalName: galaxyHospital.name
        });
      } else {
        setLoginError(data.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setLoginError("Unable to connect to server. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLogin = async (username: string, password: string, role: UserRole) => {
    const galaxyHospital = hospitals[0]; // Gravity Hospital
    setCurrentHospital(galaxyHospital);
    setLoginError(null);
    
    // Try to authenticate with password validation
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });
      
      if (response.ok) {
        const user = await response.json();
        setCurrentUser({
          id: user.id,
          username: user.username,
          name: user.name || getDisplayName(username, role),
          role: user.role || role,
          tenantId: galaxyHospital.id,
          hospitalName: galaxyHospital.name
        });
        return;
      } else {
        const errorData = await response.json();
        setLoginError(errorData.error || "Login failed");
        return;
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Unable to connect to server. Please try again.");
    }
  };

  const getDisplayName = (username: string, role: UserRole) => {
    // Mock display names based on role
    const names: Record<UserRole, string> = {
      ADMIN: "Dr. Michael Chen",
      DOCTOR: "Dr. Sarah Wilson", 
      NURSE: "Nurse Jennifer Adams",
      OPD_MANAGER: "Mary Johnson",
      PATIENT: "John Smith",
      MEDICAL_STORE: "Pharmacy Staff",
      PATHOLOGY_LAB: "Lab Technician"
    };
    return names[role] || username;
  };

  const handleLogout = () => {
    setCurrentUser(null);
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
            <AuthForms onLogin={handleLogin} onRegister={handleRegister} loginError={loginError} />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  // Patient Portal - separate interface for patients
  if (currentUser.role === "PATIENT") {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <PatientPortal 
              patientId={currentUser.id}
              patientName={currentUser.name}
              username={currentUser.username}
              onLogout={handleLogout}
            />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  // Doctor Portal - separate interface for doctors
  if (currentUser.role === "DOCTOR") {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <DoctorPortal 
              doctorId={currentUser.id}
              doctorName={currentUser.name.replace("Dr. ", "")}
              hospitalName={currentUser.hospitalName}
              onLogout={handleLogout}
            />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  // Staff Portal - for ADMIN, NURSE, OPD_MANAGER
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
                  setLocation(path);
                }}
                onLogout={handleLogout}
              />
              <div className="flex flex-col flex-1">
                <header className="flex items-center justify-between p-4 border-b glass-panel sticky top-0 z-40">
                  <div className="flex items-center space-x-4">
                    <SidebarTrigger data-testid="button-sidebar-toggle" className="glass-button" />
                    <div className="flex flex-col">
                      <span className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Gravity Hospital</span>
                      <span className="text-xs text-muted-foreground">HMS Core System</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <ThemeSwitcher />
                  </div>
                </header>
                <main className="flex-1 overflow-auto p-6">
                  <Router currentUser={currentUser} currentPath="/" />
                </main>
              </div>
              <FloatingChatButton onNavigate={(path) => setLocation(path)} />
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default AppContent;
