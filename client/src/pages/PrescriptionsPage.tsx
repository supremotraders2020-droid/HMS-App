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
    if (!selectedDoctor && currentUser.role === "OPD_MANAGER") {
      return;
    }
    setShowCreateModal(true);
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
            {currentUser.role === "OPD_MANAGER" && (
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
            
            <Button 
              onClick={handleCreatePrescription}
              disabled={currentUser.role === "OPD_MANAGER" && !selectedDoctor}
              data-testid="button-create-prescription"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Prescription
            </Button>
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
                        <Button variant="ghost" size="icon" data-testid={`button-print-${rx.id}`}>
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
