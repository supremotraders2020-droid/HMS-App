import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IntegerInput } from "@/components/validated-inputs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  Phone, 
  Mail, 
  Clock, 
  Users, 
  Save,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { HospitalSettings } from "@shared/schema";

export default function HospitalSettingsPage() {
  const { toast } = useToast();
  
  const { data: settings, isLoading } = useQuery<HospitalSettings>({
    queryKey: ["/api/hospital-settings"],
  });

  const [hospitalInfo, setHospitalInfo] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    establishedYear: "",
    licenseNumber: "",
    registrationNumber: ""
  });

  const [operationalSettings, setOperationalSettings] = useState({
    emergencyHours: "",
    opdHours: "",
    visitingHours: "",
    maxPatientsPerDay: "",
    appointmentSlotDuration: "",
    emergencyWaitTime: ""
  });

  const [facilityInfo, setFacilityInfo] = useState({
    totalBeds: "",
    icuBeds: "",
    emergencyBeds: "",
    operationTheaters: "",
    departments: [] as string[]
  });

  useEffect(() => {
    if (settings) {
      setHospitalInfo({
        name: settings.name || "",
        address: settings.address || "",
        phone: settings.phone || "",
        email: settings.email || "",
        website: settings.website || "",
        establishedYear: settings.establishedYear || "",
        licenseNumber: settings.licenseNumber || "",
        registrationNumber: settings.registrationNumber || ""
      });
      setOperationalSettings({
        emergencyHours: settings.emergencyHours || "",
        opdHours: settings.opdHours || "",
        visitingHours: settings.visitingHours || "",
        maxPatientsPerDay: settings.maxPatientsPerDay || "",
        appointmentSlotDuration: settings.appointmentSlotDuration || "",
        emergencyWaitTime: settings.emergencyWaitTime || ""
      });
      setFacilityInfo({
        totalBeds: settings.totalBeds || "",
        icuBeds: settings.icuBeds || "",
        emergencyBeds: settings.emergencyBeds || "",
        operationTheaters: settings.operationTheaters || "",
        departments: settings.departments || []
      });
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<HospitalSettings>) => {
      if (!settings?.id) throw new Error("Settings not loaded");
      const res = await apiRequest("PATCH", `/api/hospital-settings/${settings.id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hospital-settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive"
      });
    }
  });

  const handleSaveHospitalInfo = () => {
    updateSettingsMutation.mutate({
      name: hospitalInfo.name,
      address: hospitalInfo.address,
      phone: hospitalInfo.phone,
      email: hospitalInfo.email,
      website: hospitalInfo.website,
      establishedYear: hospitalInfo.establishedYear,
      licenseNumber: hospitalInfo.licenseNumber,
      registrationNumber: hospitalInfo.registrationNumber
    }, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Hospital information saved to database",
        });
      }
    });
  };

  const handleSaveOperationalSettings = () => {
    updateSettingsMutation.mutate({
      emergencyHours: operationalSettings.emergencyHours,
      opdHours: operationalSettings.opdHours,
      visitingHours: operationalSettings.visitingHours,
      maxPatientsPerDay: operationalSettings.maxPatientsPerDay,
      appointmentSlotDuration: operationalSettings.appointmentSlotDuration,
      emergencyWaitTime: operationalSettings.emergencyWaitTime
    }, {
      onSuccess: () => {
        toast({
          title: "Success", 
          description: "Operational settings saved to database",
        });
      }
    });
  };

  const handleSaveFacilityInfo = () => {
    updateSettingsMutation.mutate({
      totalBeds: facilityInfo.totalBeds,
      icuBeds: facilityInfo.icuBeds,
      emergencyBeds: facilityInfo.emergencyBeds,
      operationTheaters: facilityInfo.operationTheaters,
      departments: facilityInfo.departments
    }, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Facility information saved to database", 
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Hospital Settings</h1>
          <p className="text-muted-foreground">Manage hospital information and configuration (saved to database)</p>
        </div>
      </div>

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

          <Button 
            onClick={handleSaveHospitalInfo} 
            disabled={updateSettingsMutation.isPending}
            data-testid="button-save-hospital-info"
          >
            {updateSettingsMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Hospital Information
          </Button>
        </CardContent>
      </Card>

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
              <IntegerInput
                id="maxPatients"
                min={1}
                value={operationalSettings.maxPatientsPerDay}
                onValueChange={(value) => setOperationalSettings({...operationalSettings, maxPatientsPerDay: value})}
                data-testid="input-max-patients"
              />
            </div>
            <div>
              <Label htmlFor="appointmentSlot">Appointment Slot (minutes)</Label>
              <IntegerInput
                id="appointmentSlot"
                min={5}
                value={operationalSettings.appointmentSlotDuration}
                onValueChange={(value) => setOperationalSettings({...operationalSettings, appointmentSlotDuration: value})}
                data-testid="input-appointment-slot"
              />
            </div>
            <div>
              <Label htmlFor="emergencyWait">Emergency Wait Time (minutes)</Label>
              <IntegerInput
                id="emergencyWait"
                min={1}
                value={operationalSettings.emergencyWaitTime}
                onValueChange={(value) => setOperationalSettings({...operationalSettings, emergencyWaitTime: value})}
                data-testid="input-emergency-wait"
              />
            </div>
          </div>

          <Button 
            onClick={handleSaveOperationalSettings} 
            disabled={updateSettingsMutation.isPending}
            data-testid="button-save-operational"
          >
            {updateSettingsMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Operational Settings
          </Button>
        </CardContent>
      </Card>

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
              <IntegerInput
                id="totalBeds"
                min={0}
                value={facilityInfo.totalBeds}
                onValueChange={(value) => setFacilityInfo({...facilityInfo, totalBeds: value})}
                data-testid="input-total-beds"
              />
            </div>
            <div>
              <Label htmlFor="icuBeds">ICU Beds</Label>
              <IntegerInput
                id="icuBeds"
                min={0}
                value={facilityInfo.icuBeds}
                onValueChange={(value) => setFacilityInfo({...facilityInfo, icuBeds: value})}
                data-testid="input-icu-beds"
              />
            </div>
            <div>
              <Label htmlFor="emergencyBeds">Emergency Beds</Label>
              <IntegerInput
                id="emergencyBeds"
                min={0}
                value={facilityInfo.emergencyBeds}
                onValueChange={(value) => setFacilityInfo({...facilityInfo, emergencyBeds: value})}
                data-testid="input-emergency-beds"
              />
            </div>
            <div>
              <Label htmlFor="operationTheaters">Operation Theaters</Label>
              <IntegerInput
                id="operationTheaters"
                min={0}
                value={facilityInfo.operationTheaters}
                onValueChange={(value) => setFacilityInfo({...facilityInfo, operationTheaters: value})}
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

          <Button 
            onClick={handleSaveFacilityInfo} 
            disabled={updateSettingsMutation.isPending}
            data-testid="button-save-facility"
          >
            {updateSettingsMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Facility Information
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
