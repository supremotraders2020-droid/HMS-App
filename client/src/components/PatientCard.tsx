import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  MapPin, 
  Phone, 
  AlertTriangle, 
  Clock,
  FileText,
  Activity
} from "lucide-react";

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "M" | "F" | "Other";
  phone: string;
  address: string;
  condition: string;
  status: "ADMITTED" | "OUTPATIENT" | "DISCHARGED" | "EMERGENCY";
  room?: string;
  admissionDate?: string;
  lastVisit: string;
  avatar?: string;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

interface PatientCardProps {
  patient: Patient;
  onViewDetails?: (patientId: string) => void;
  onUpdateStatus?: (patientId: string, status: string) => void;
  showActions?: boolean;
}

export default function PatientCard({ patient, onViewDetails, onUpdateStatus, showActions = true }: PatientCardProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "EMERGENCY": return "destructive";
      case "ADMITTED": return "default";
      case "OUTPATIENT": return "secondary";
      case "DISCHARGED": return "outline";
      default: return "secondary";
    }
  };

  const getUrgencyBadgeVariant = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL": return "destructive";
      case "HIGH": return "destructive";
      case "MEDIUM": return "default";
      case "LOW": return "secondary";
      default: return "outline";
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleViewDetails = () => {
    console.log(`Viewing details for patient: ${patient.name} (${patient.id})`);
    onViewDetails?.(patient.id);
  };

  const handleStatusUpdate = (newStatus: string) => {
    console.log(`Updating status for ${patient.name}: ${patient.status} → ${newStatus}`);
    onUpdateStatus?.(patient.id, newStatus);
  };

  return (
    <Card className={`transition-all hover-elevate ${patient.urgency === 'CRITICAL' ? 'border-destructive' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={patient.avatar} alt={patient.name} />
              <AvatarFallback>{getInitials(patient.name)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg" data-testid={`text-patient-name-${patient.id}`}>
                {patient.name}
              </CardTitle>
              <CardDescription>
                {patient.age} years • {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <Badge 
              variant={getStatusBadgeVariant(patient.status)}
              data-testid={`badge-status-${patient.id}`}
            >
              {patient.status}
            </Badge>
            <Badge 
              variant={getUrgencyBadgeVariant(patient.urgency)}
              className="text-xs"
              data-testid={`badge-urgency-${patient.id}`}
            >
              {patient.urgency === 'CRITICAL' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {patient.urgency}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Patient Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <FileText className="h-4 w-4 mr-2" />
            <span data-testid={`text-condition-${patient.id}`}>{patient.condition}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Phone className="h-4 w-4 mr-2" />
            <span data-testid={`text-phone-${patient.id}`}>{patient.phone}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="truncate" data-testid={`text-address-${patient.id}`}>{patient.address}</span>
          </div>
          {patient.room && (
            <div className="flex items-center text-muted-foreground">
              <Activity className="h-4 w-4 mr-2" />
              <span data-testid={`text-room-${patient.id}`}>Room {patient.room}</span>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>Last visit: {patient.lastVisit}</span>
          </div>
          {patient.admissionDate && (
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Admitted: {patient.admissionDate}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleViewDetails}
              data-testid={`button-view-details-${patient.id}`}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Details
            </Button>
            
            {patient.status !== "DISCHARGED" && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleStatusUpdate("DISCHARGED")}
                data-testid={`button-discharge-${patient.id}`}
              >
                Discharge
              </Button>
            )}
            
            {patient.status === "OUTPATIENT" && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleStatusUpdate("ADMITTED")}
                data-testid={`button-admit-${patient.id}`}
              >
                Admit
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}