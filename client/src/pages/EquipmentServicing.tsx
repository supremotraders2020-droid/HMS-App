import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Wrench,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  Building2,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Equipment, ServiceHistory, EmergencyContact } from "@shared/schema";

export default function EquipmentServicing() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: equipment = [], isLoading: equipmentLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const { data: serviceHistory = [], isLoading: historyLoading } = useQuery<ServiceHistory[]>({
    queryKey: ["/api/service-history"],
  });

  const { data: emergencyContacts = [], isLoading: contactsLoading } = useQuery<EmergencyContact[]>({
    queryKey: ["/api/emergency-contacts"],
  });

  const filteredEquipment = equipment.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "up-to-date":
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Up to Date</Badge>;
      case "due-soon":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600"><Clock className="w-3 h-3 mr-1" /> Due Soon</Badge>;
      case "overdue":
        return <Badge className="bg-red-500 hover:bg-red-600"><AlertTriangle className="w-3 h-3 mr-1" /> Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const overdueCount = equipment.filter(e => e.status === "overdue").length;
  const dueSoonCount = equipment.filter(e => e.status === "due-soon").length;
  const upToDateCount = equipment.filter(e => e.status === "up-to-date").length;

  if (equipmentLoading || historyLoading || contactsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Wrench className="w-8 h-8 text-primary" />
            Equipment Servicing
          </h1>
          <p className="text-muted-foreground">Manage hospital equipment maintenance and service schedules</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500" data-testid="text-overdue-count">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500" data-testid="text-duesoon-count">{dueSoonCount}</div>
            <p className="text-xs text-muted-foreground">Schedule service</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Up to Date</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500" data-testid="text-uptodate-count">{upToDateCount}</div>
            <p className="text-xs text-muted-foreground">Maintenance current</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="equipment" className="space-y-4">
        <TabsList>
          <TabsTrigger value="equipment" data-testid="tab-equipment">Equipment List</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">Service History</TabsTrigger>
          <TabsTrigger value="contacts" data-testid="tab-contacts">Emergency Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search equipment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                    data-testid="input-search"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Last Service</TableHead>
                    <TableHead>Next Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Company</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEquipment.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No equipment found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEquipment.map((item) => (
                      <TableRow key={item.id} data-testid={`row-equipment-${item.id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">{item.model}</div>
                          </div>
                        </TableCell>
                        <TableCell>{item.serialNumber}</TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell>{item.lastServiceDate || "N/A"}</TableCell>
                        <TableCell>{item.nextDueDate}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{item.companyName || "N/A"}</div>
                            {item.contactNumber && (
                              <div className="text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {item.contactNumber}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service History</CardTitle>
              <CardDescription>Complete maintenance and service records</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No service history found
                      </TableCell>
                    </TableRow>
                  ) : (
                    serviceHistory.map((record) => {
                      const equipmentItem = equipment.find(e => e.id === record.equipmentId);
                      return (
                        <TableRow key={record.id} data-testid={`row-history-${record.id}`}>
                          <TableCell>{record.serviceDate}</TableCell>
                          <TableCell>{equipmentItem?.name || "Unknown"}</TableCell>
                          <TableCell>{record.technician}</TableCell>
                          <TableCell>{record.description}</TableCell>
                          <TableCell>{record.cost}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contacts</CardTitle>
              <CardDescription>Quick access to service providers and emergency contacts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {emergencyContacts.length === 0 ? (
                  <div className="col-span-full text-center text-muted-foreground py-8">
                    No emergency contacts found
                  </div>
                ) : (
                  emergencyContacts.map((contact) => (
                    <Card key={contact.id} data-testid={`card-contact-${contact.id}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Building2 className="w-5 h-5 text-primary mt-1" />
                          <div className="flex-1">
                            <div className="font-medium">{contact.name}</div>
                            <div className="text-sm text-muted-foreground">{contact.serviceType}</div>
                            <div className="flex items-center gap-1 mt-2 text-primary">
                              <Phone className="w-4 h-4" />
                              <span>{contact.phoneNumber}</span>
                            </div>
                            {contact.isPrimary && (
                              <Badge variant="secondary" className="mt-2">Primary Contact</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
