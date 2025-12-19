import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, FileText, Search, Printer, Clock, CheckCircle, AlertCircle, FileCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import PrescriptionCreationModal from "@/components/PrescriptionCreationModal";
import type { Prescription, Doctor } from "@shared/schema";

interface User {
  id: string;
  username: string;
  name: string;
  role: "ADMIN" | "DOCTOR" | "PATIENT" | "NURSE" | "OPD_MANAGER";
  tenantId: string;
  hospitalName: string;
}

interface PrescriptionsPageProps {
  currentUser: User;
}

export default function PrescriptionsPage({ currentUser }: PrescriptionsPageProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  const { data: prescriptions = [], isLoading } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions"],
  });

  const filteredPrescriptions = prescriptions.filter(rx => {
    const matchesSearch = !searchQuery || 
      rx.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.prescriptionNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || rx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Draft</Badge>;
      case 'awaiting_signature':
        return <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600"><AlertCircle className="h-3 w-3" />Awaiting Signature</Badge>;
      case 'finalized':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />Finalized</Badge>;
      case 'void':
        return <Badge variant="destructive" className="gap-1">Void</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleCreatePrescription = () => {
    if (!selectedDoctor && (currentUser.role === "OPD_MANAGER" || currentUser.role === "ADMIN")) {
      return;
    }
    setShowCreateModal(true);
  };

  const handlePrintPrescription = (prescription: Prescription) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print prescriptions');
      return;
    }

    const medicationsHtml = prescription.medicines && Array.isArray(prescription.medicines) 
      ? (prescription.medicines as any[]).map((med: any, idx: number) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${idx + 1}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${med.medicineName || '-'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${med.dosageForm || ''} ${med.strength || ''}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${med.frequency || '-'} times/day</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${med.mealTiming || '-'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${med.duration || '-'} ${med.durationUnit || 'days'}</td>
        </tr>
      `).join('')
      : '<tr><td colspan="6" style="padding: 8px; text-align: center;">No medications</td></tr>';

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prescription - ${prescription.prescriptionNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { color: #0ea5e9; margin: 0; }
          .header p { margin: 5px 0; color: #666; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .info-box { background: #f8fafc; padding: 15px; border-radius: 8px; }
          .info-box h3 { margin: 0 0 10px; color: #334155; font-size: 14px; }
          .info-box p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #0ea5e9; color: white; padding: 10px; text-align: left; }
          .diagnosis { background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .footer { margin-top: 40px; text-align: right; }
          .signature { border-top: 1px solid #333; width: 200px; margin-left: auto; padding-top: 10px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Gravity Hospital</h1>
          <p>Gat No, 167, Sahyog Nager, Triveni Nagar, Nigdi, Pimpri-Chinchwad, Maharashtra 411062</p>
          <p>Phone: +91 20 1234 5678</p>
        </div>
        
        <h2 style="text-align: center; margin-bottom: 20px;">PRESCRIPTION</h2>
        <p style="text-align: right; color: #666;">Rx No: ${prescription.prescriptionNumber || '-'}</p>
        <p style="text-align: right; color: #666;">Date: ${prescription.createdAt ? new Date(prescription.createdAt).toLocaleDateString() : '-'}</p>
        
        <div class="info-grid">
          <div class="info-box">
            <h3>Patient Information</h3>
            <p><strong>Name:</strong> ${prescription.patientName || '-'}</p>
            <p><strong>Age/Gender:</strong> ${prescription.patientAge || '-'} / ${prescription.patientGender || '-'}</p>
          </div>
          <div class="info-box">
            <h3>Doctor Information</h3>
            <p><strong>Name:</strong> Dr. ${prescription.doctorName || '-'}</p>
            <p><strong>Registration:</strong> ${prescription.doctorRegistrationNo || '-'}</p>
          </div>
        </div>
        
        <div class="diagnosis">
          <strong>Diagnosis:</strong> ${prescription.diagnosis || '-'}
        </div>
        
        <h3>Medications</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Medicine</th>
              <th>Dosage</th>
              <th>Frequency</th>
              <th>Timing</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            ${medicationsHtml}
          </tbody>
        </table>
        
        ${prescription.instructions ? `<p><strong>Instructions:</strong> ${prescription.instructions}</p>` : ''}
        ${prescription.followUpDate ? `<p><strong>Follow-up Date:</strong> ${new Date(prescription.followUpDate).toLocaleDateString()}</p>` : ''}
        
        <div class="footer">
          <div class="signature">
            <p><strong>Dr. ${prescription.doctorName || '-'}</strong></p>
            <p style="font-size: 12px; color: #666;">${prescription.doctorRegistrationNo || ''}</p>
          </div>
        </div>
        
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const getSelectedDoctorInfo = () => {
    if (currentUser.role === "DOCTOR") {
      return { id: currentUser.id, name: currentUser.name };
    }
    const doctor = doctors.find(d => d.id === selectedDoctor);
    return doctor ? { id: doctor.id, name: doctor.name } : null;
  };

  const doctorInfo = getSelectedDoctorInfo();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Prescription Management
          </h1>
          <p className="text-muted-foreground">
            Create and manage patient prescriptions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Prescriptions</CardTitle>
            <CardDescription>
              {currentUser.role === "OPD_MANAGER" 
                ? "Select a doctor and create prescription drafts for review" 
                : "Create and finalize prescriptions"}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-3">
            {(currentUser.role === "OPD_MANAGER" || currentUser.role === "ADMIN") && (
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger className="w-[200px]" data-testid="select-doctor">
                  <SelectValue placeholder="Select Doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map(doctor => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      Dr. {doctor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {(currentUser.role === "OPD_MANAGER" || currentUser.role === "ADMIN") && !selectedDoctor ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button 
                      disabled
                      data-testid="button-create-prescription"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Prescription
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Please select a doctor first</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button 
                onClick={handleCreatePrescription}
                data-testid="button-create-prescription"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Prescription
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by patient or prescription number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-prescriptions"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="awaiting_signature">Awaiting Signature</SelectItem>
                <SelectItem value="finalized">Finalized</SelectItem>
                <SelectItem value="void">Void</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading prescriptions...</div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No prescriptions found</p>
              <p className="text-sm">Create a new prescription to get started</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rx Number</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrescriptions.map((rx) => (
                    <TableRow key={rx.id} data-testid={`row-prescription-${rx.id}`}>
                      <TableCell className="font-mono text-sm">{rx.prescriptionNumber || '-'}</TableCell>
                      <TableCell className="font-medium">{rx.patientName || '-'}</TableCell>
                      <TableCell>{rx.doctorName || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{rx.diagnosis || '-'}</TableCell>
                      <TableCell>{getStatusBadge(rx.status || 'draft')}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {rx.createdAt ? new Date(rx.createdAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handlePrintPrescription(rx)}
                          title="Print Prescription"
                          data-testid={`button-print-${rx.id}`}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {showCreateModal && doctorInfo && (
        <PrescriptionCreationModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          doctorId={doctorInfo.id}
          doctorName={doctorInfo.name}
          userRole={currentUser.role as 'ADMIN' | 'DOCTOR' | 'OPD_MANAGER'}
          userName={currentUser.name}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/prescriptions'] });
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}
