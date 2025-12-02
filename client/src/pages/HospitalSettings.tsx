import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Users, 
  Calendar,
  Save,
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function HospitalSettings() {
  const { toast } = useToast();
  
  const [hospitalInfo, setHospitalInfo] = useState({
    name: "Gravity Hospital",
    address: "sane chowk, Nair Colony, More Vasti, Chikhali, Pimpri-Chinchwad, Maharashtra 411062",
    phone: "+91 20 2745 8900",
    email: "info@gravityhospital.in",
    website: "www.gravityhospital.in",
    establishedYear: "2015",
    licenseNumber: "MH-PUNE-2015-001234",
    registrationNumber: "REG-MH-15-001234"
  });

  const [operationalSettings, setOperationalSettings] = useState({
    emergencyHours: "24/7",
    opdHours: "08:00 - 20:00",
    visitingHours: "10:00 - 12:00, 16:00 - 18:00",
    maxPatientsPerDay: "200",
    appointmentSlotDuration: "30",
    emergencyWaitTime: "15"
  });

  const [facilityInfo, setFacilityInfo] = useState({
    totalBeds: "150",
    icuBeds: "20",
    emergencyBeds: "15",
    operationTheaters: "8",
    departments: [
      "Cardiology", "Neurology", "Orthopedics", "Pediatrics", 
      "Emergency Medicine", "General Surgery", "Radiology", "Pathology"
    ]
  });

  const handleSaveHospitalInfo = () => {
    toast({
      title: "Success",
      description: "Hospital information updated successfully",
    });
  };

  const handleSaveOperationalSettings = () => {
    toast({
      title: "Success", 
      description: "Operational settings updated successfully",
    });
  };

  const handleSaveFacilityInfo = () => {
    toast({
      title: "Success",
      description: "Facility information updated successfully", 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Hospital Settings</h1>
          <p className="text-muted-foreground">Manage hospital information and configuration</p>
        </div>
      </div>

      {/* Hospital Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Hospital Information
          </CardTitle>
          <CardDescription>Basic hospital details and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hospitalName">Hospital Name</Label>
              <Input
                id="hospitalName"
                value={hospitalInfo.name}
                onChange={(e) => setHospitalInfo({...hospitalInfo, name: e.target.value})}
                data-testid="input-hospital-name"
              />
            </div>
            <div>
              <Label htmlFor="establishedYear">Established Year</Label>
              <Input
                id="establishedYear"
                value={hospitalInfo.establishedYear}
                onChange={(e) => setHospitalInfo({...hospitalInfo, establishedYear: e.target.value})}
                data-testid="input-established-year"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={hospitalInfo.address}
              onChange={(e) => setHospitalInfo({...hospitalInfo, address: e.target.value})}
              className="min-h-20"
              data-testid="input-hospital-address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={hospitalInfo.phone}
                  onChange={(e) => setHospitalInfo({...hospitalInfo, phone: e.target.value})}
                  className="pl-10"
                  data-testid="input-hospital-phone"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={hospitalInfo.email}
                  onChange={(e) => setHospitalInfo({...hospitalInfo, email: e.target.value})}
                  className="pl-10"
                  data-testid="input-hospital-email"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={hospitalInfo.website}
                onChange={(e) => setHospitalInfo({...hospitalInfo, website: e.target.value})}
                data-testid="input-hospital-website"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                value={hospitalInfo.licenseNumber}
                onChange={(e) => setHospitalInfo({...hospitalInfo, licenseNumber: e.target.value})}
                data-testid="input-license-number"
              />
            </div>
            <div>
              <Label htmlFor="registrationNumber">Registration Number</Label>
              <Input
                id="registrationNumber"
                value={hospitalInfo.registrationNumber}
                onChange={(e) => setHospitalInfo({...hospitalInfo, registrationNumber: e.target.value})}
                data-testid="input-registration-number"
              />
            </div>
          </div>

          <Button onClick={handleSaveHospitalInfo} data-testid="button-save-hospital-info">
            <Save className="h-4 w-4 mr-2" />
            Save Hospital Information
          </Button>
        </CardContent>
      </Card>

      {/* Operational Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Operational Settings
          </CardTitle>
          <CardDescription>Configure hospital hours and operational parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="emergencyHours">Emergency Hours</Label>
              <Input
                id="emergencyHours"
                value={operationalSettings.emergencyHours}
                onChange={(e) => setOperationalSettings({...operationalSettings, emergencyHours: e.target.value})}
                data-testid="input-emergency-hours"
              />
            </div>
            <div>
              <Label htmlFor="opdHours">OPD Hours</Label>
              <Input
                id="opdHours"
                value={operationalSettings.opdHours}
                onChange={(e) => setOperationalSettings({...operationalSettings, opdHours: e.target.value})}
                data-testid="input-opd-hours"
              />
            </div>
            <div>
              <Label htmlFor="visitingHours">Visiting Hours</Label>
              <Input
                id="visitingHours"
                value={operationalSettings.visitingHours}
                onChange={(e) => setOperationalSettings({...operationalSettings, visitingHours: e.target.value})}
                data-testid="input-visiting-hours"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="maxPatients">Max Patients Per Day</Label>
              <Input
                id="maxPatients"
                type="number"
                value={operationalSettings.maxPatientsPerDay}
                onChange={(e) => setOperationalSettings({...operationalSettings, maxPatientsPerDay: e.target.value})}
                data-testid="input-max-patients"
              />
            </div>
            <div>
              <Label htmlFor="appointmentSlot">Appointment Slot (minutes)</Label>
              <Input
                id="appointmentSlot"
                type="number"
                value={operationalSettings.appointmentSlotDuration}
                onChange={(e) => setOperationalSettings({...operationalSettings, appointmentSlotDuration: e.target.value})}
                data-testid="input-appointment-slot"
              />
            </div>
            <div>
              <Label htmlFor="emergencyWait">Emergency Wait Time (minutes)</Label>
              <Input
                id="emergencyWait"
                type="number"
                value={operationalSettings.emergencyWaitTime}
                onChange={(e) => setOperationalSettings({...operationalSettings, emergencyWaitTime: e.target.value})}
                data-testid="input-emergency-wait"
              />
            </div>
          </div>

          <Button onClick={handleSaveOperationalSettings} data-testid="button-save-operational">
            <Save className="h-4 w-4 mr-2" />
            Save Operational Settings
          </Button>
        </CardContent>
      </Card>

      {/* Facility Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Facility Information
          </CardTitle>
          <CardDescription>Manage facility capacity and departments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="totalBeds">Total Beds</Label>
              <Input
                id="totalBeds"
                type="number"
                value={facilityInfo.totalBeds}
                onChange={(e) => setFacilityInfo({...facilityInfo, totalBeds: e.target.value})}
                data-testid="input-total-beds"
              />
            </div>
            <div>
              <Label htmlFor="icuBeds">ICU Beds</Label>
              <Input
                id="icuBeds"
                type="number"
                value={facilityInfo.icuBeds}
                onChange={(e) => setFacilityInfo({...facilityInfo, icuBeds: e.target.value})}
                data-testid="input-icu-beds"
              />
            </div>
            <div>
              <Label htmlFor="emergencyBeds">Emergency Beds</Label>
              <Input
                id="emergencyBeds"
                type="number"
                value={facilityInfo.emergencyBeds}
                onChange={(e) => setFacilityInfo({...facilityInfo, emergencyBeds: e.target.value})}
                data-testid="input-emergency-beds"
              />
            </div>
            <div>
              <Label htmlFor="operationTheaters">Operation Theaters</Label>
              <Input
                id="operationTheaters"
                type="number"
                value={facilityInfo.operationTheaters}
                onChange={(e) => setFacilityInfo({...facilityInfo, operationTheaters: e.target.value})}
                data-testid="input-operation-theaters"
              />
            </div>
          </div>

          <div>
            <Label>Departments</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {facilityInfo.departments.map((dept, index) => (
                <Badge key={index} variant="secondary" data-testid={`badge-department-${index}`}>
                  {dept}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Contact system administrator to add or remove departments
            </p>
          </div>

          <Button onClick={handleSaveFacilityInfo} data-testid="button-save-facility">
            <Save className="h-4 w-4 mr-2" />
            Save Facility Information
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}