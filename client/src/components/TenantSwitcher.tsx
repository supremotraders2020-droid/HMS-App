import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Building2, Check, ChevronDown } from "lucide-react";

interface Hospital {
  id: string;
  name: string;
  location: string;
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
  patientCount?: number;
}

interface TenantSwitcherProps {
  currentHospital?: Hospital;
  hospitals?: Hospital[];
  onHospitalChange?: (hospital: Hospital) => void;
}

export default function TenantSwitcher({ 
  currentHospital, 
  hospitals = [], 
  onHospitalChange 
}: TenantSwitcherProps) {
  const [open, setOpen] = useState(false);

  // Mock hospitals if none provided
  const mockHospitals: Hospital[] = [
    {
      id: "1",
      name: "City General Hospital",
      location: "Downtown",
      status: "ACTIVE",
      patientCount: 1234
    },
    {
      id: "2", 
      name: "St. Mary's Medical Center",
      location: "Westside",
      status: "ACTIVE",
      patientCount: 892
    },
    {
      id: "3",
      name: "Regional Healthcare Network",
      location: "Northside", 
      status: "MAINTENANCE",
      patientCount: 567
    },
    {
      id: "4",
      name: "Children's Hospital",
      location: "Eastside",
      status: "ACTIVE",
      patientCount: 345
    }
  ];

  const displayHospitals = hospitals.length > 0 ? hospitals : mockHospitals;
  const currentDisplay = currentHospital || displayHospitals[0];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "ACTIVE": return "default";
      case "MAINTENANCE": return "secondary";
      case "INACTIVE": return "destructive";
      default: return "outline";
    }
  };

  const handleHospitalSelect = (hospital: Hospital) => {
    console.log(`Switching to hospital: ${hospital.name} (${hospital.id})`);
    onHospitalChange?.(hospital);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          role="combobox"
          aria-expanded={open}
          className="justify-between min-w-[240px]"
          data-testid="button-tenant-switcher"
        >
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <div className="flex flex-col items-start">
              <span className="font-medium" data-testid="text-current-hospital">
                {currentDisplay.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {currentDisplay.location}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={getStatusVariant(currentDisplay.status)}
              className="text-xs"
              data-testid="badge-hospital-status"
            >
              {currentDisplay.status}
            </Badge>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="p-4">
          <h4 className="font-medium text-sm mb-3">Switch Hospital Context</h4>
          <div className="space-y-2">
            {displayHospitals.map((hospital) => (
              <div
                key={hospital.id}
                className={`
                  flex items-center justify-between p-3 rounded-lg cursor-pointer hover-elevate
                  ${currentDisplay.id === hospital.id ? 'bg-accent' : ''}
                `}
                onClick={() => handleHospitalSelect(hospital)}
                data-testid={`option-hospital-${hospital.id}`}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {hospital.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {hospital.location}
                      {hospital.patientCount && ` • ${hospital.patientCount} patients`}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={getStatusVariant(hospital.status)}
                    className="text-xs"
                  >
                    {hospital.status}
                  </Badge>
                  {currentDisplay.id === hospital.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              Tenant ID: {currentDisplay.id}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              All API requests will include X-Tenant-ID header
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}