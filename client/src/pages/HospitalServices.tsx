import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequestWithUser, getQueryFnWithUser } from "@/lib/queryClient";
import { 
  Search, 
  Heart, 
  Baby, 
  Bone, 
  Brain, 
  Stethoscope, 
  Activity,
  Scissors,
  Radiation,
  Pill,
  TestTube,
  X,
  Building2,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface HospitalService {
  id: string;
  departmentId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  isActive: boolean;
}

interface HospitalServiceDepartment {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  iconKey: string;
  displayOrder: number;
  isActive: boolean;
  services: HospitalService[];
}

interface HospitalServicesProps {
  currentUserRole?: string;
  currentUserId?: string;
}

const iconMap: Record<string, any> = {
  FileText,
  Building2,
  Heart,
  Baby,
  Bone,
  Brain,
  Stethoscope,
  Activity,
  Scissors,
  Radiation,
  Pill,
  TestTube,
  X
};

export default function HospitalServices({ currentUserRole = "ADMIN", currentUserId }: HospitalServicesProps) {
  const { toast } = useToast();
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  const [departmentSearchQueries, setDepartmentSearchQueries] = useState<Record<string, string>>({});
  
  const [addServiceDialog, setAddServiceDialog] = useState(false);
  const [editServiceDialog, setEditServiceDialog] = useState(false);
  const [deleteServiceDialog, setDeleteServiceDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<HospitalServiceDepartment | null>(null);
  const [selectedService, setSelectedService] = useState<HospitalService | null>(null);
  const [newServiceName, setNewServiceName] = useState("");
  const [editServiceName, setEditServiceName] = useState("");

  const isAdmin = currentUserRole === "ADMIN";

  const { data: departments = [], isLoading, refetch } = useQuery<HospitalServiceDepartment[]>({
    queryKey: ["/api/hospital-service-departments"],
    queryFn: getQueryFnWithUser({ id: currentUserId || "", role: currentUserRole }, "/api/hospital-service-departments")
  });

  const createServiceMutation = useMutation({
    mutationFn: async (data: { departmentId: string; name: string }) => {
      return apiRequestWithUser("POST", "/api/hospital-services", { id: currentUserId || "", role: currentUserRole }, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hospital-service-departments"] });
      toast({ title: "Service Added", description: "New service has been added successfully." });
      setAddServiceDialog(false);
      setNewServiceName("");
      setSelectedDepartment(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add service.", variant: "destructive" });
    }
  });

  const updateServiceMutation = useMutation({
    mutationFn: async (data: { id: string; name: string }) => {
      return apiRequestWithUser("PATCH", `/api/hospital-services/${data.id}`, { id: currentUserId || "", role: currentUserRole }, { name: data.name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hospital-service-departments"] });
      toast({ title: "Service Updated", description: "Service has been updated successfully." });
      setEditServiceDialog(false);
      setEditServiceName("");
      setSelectedService(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update service.", variant: "destructive" });
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequestWithUser("DELETE", `/api/hospital-services/${id}`, { id: currentUserId || "", role: currentUserRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hospital-service-departments"] });
      toast({ title: "Service Deleted", description: "Service has been removed successfully." });
      setDeleteServiceDialog(false);
      setSelectedService(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete service.", variant: "destructive" });
    }
  });

  const filteredDepartments = useMemo(() => {
    if (!globalSearchQuery.trim()) return departments;
    const query = globalSearchQuery.toLowerCase();
    return departments.filter(dept =>
      dept.name.toLowerCase().includes(query) ||
      dept.description?.toLowerCase().includes(query) ||
      dept.services.some(s => s.name.toLowerCase().includes(query))
    );
  }, [departments, globalSearchQuery]);

  const toggleDepartment = (deptId: string) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId);
    } else {
      newExpanded.add(deptId);
    }
    setExpandedDepartments(newExpanded);
  };

  const getFilteredServices = (dept: HospitalServiceDepartment) => {
    const searchQuery = departmentSearchQueries[dept.id] || "";
    if (!searchQuery.trim()) return dept.services;
    const query = searchQuery.toLowerCase();
    return dept.services.filter(s => s.name.toLowerCase().includes(query));
  };

  const handleAddService = (dept: HospitalServiceDepartment) => {
    setSelectedDepartment(dept);
    setNewServiceName("");
    setAddServiceDialog(true);
  };

  const handleEditService = (service: HospitalService) => {
    setSelectedService(service);
    setEditServiceName(service.name);
    setEditServiceDialog(true);
  };

  const handleDeleteService = (service: HospitalService) => {
    setSelectedService(service);
    setDeleteServiceDialog(true);
  };

  const getIconComponent = (iconKey: string) => {
    return iconMap[iconKey] || Stethoscope;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading services...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent" data-testid="text-page-title">
                Hospital Services & Surgeries
              </h1>
              <p className="text-muted-foreground mt-1">
                Browse all available surgeries and services by department
              </p>
            </div>
            {isAdmin && (
              <Badge variant="secondary" className="text-sm">
                Admin Mode - Click on a department to manage services
              </Badge>
            )}
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search departments or services..."
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-services"
            />
          </div>
        </div>

        {filteredDepartments.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <Search className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {departments.length === 0 
                  ? "No departments have been configured yet. Admin can seed departments to get started."
                  : "No departments found matching your search"}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDepartments.map((dept) => {
              const IconComponent = getIconComponent(dept.iconKey);
              const isExpanded = expandedDepartments.has(dept.id);
              const filteredServices = getFilteredServices(dept);
              const deptSearchQuery = departmentSearchQueries[dept.id] || "";

              return (
                <Card 
                  key={dept.id} 
                  className="overflow-hidden"
                  data-testid={`card-department-${dept.slug}`}
                >
                  <CardHeader 
                    className="cursor-pointer hover-elevate transition-all"
                    onClick={() => toggleDepartment(dept.id)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold">
                            {dept.name}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {dept.description} - {dept.services.length} service{dept.services.length !== 1 ? 's' : ''}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); handleAddService(dept); }}
                            data-testid={`button-add-service-${dept.slug}`}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Service
                          </Button>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0 border-t">
                      <div className="py-4 space-y-4">
                        <div className="relative max-w-sm">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={`Search in ${dept.name}...`}
                            value={deptSearchQuery}
                            onChange={(e) => setDepartmentSearchQueries(prev => ({
                              ...prev,
                              [dept.id]: e.target.value
                            }))}
                            className="pl-10"
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`input-search-${dept.slug}`}
                          />
                        </div>

                        {filteredServices.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic py-4">
                            {dept.services.length === 0 
                              ? "No services added yet. Admin can add services to this department."
                              : "No services match your search"}
                          </p>
                        ) : (
                          <ScrollArea className="h-80">
                            <div className="space-y-2">
                              {filteredServices.map((service, idx) => (
                                <div 
                                  key={service.id} 
                                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover-elevate transition-all"
                                  data-testid={`service-item-${dept.slug}-${idx}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-muted-foreground w-8">
                                      {idx + 1}.
                                    </span>
                                    <span className="text-sm">{service.name}</span>
                                  </div>
                                  {isAdmin && (
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleEditService(service)}
                                        data-testid={`button-edit-service-${service.id}`}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleDeleteService(service)}
                                        data-testid={`button-delete-service-${service.id}`}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}

                        <div className="text-xs text-muted-foreground pt-2 border-t">
                          Showing {filteredServices.length} of {dept.services.length} services
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Department Summary</CardTitle>
            <CardDescription>
              {departments.length} departments with {departments.reduce((acc, d) => acc + d.services.length, 0)} total services
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Dialog open={addServiceDialog} onOpenChange={setAddServiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <DialogDescription>
              Add a new service to {selectedDepartment?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="service-name">Service Name</Label>
              <Input
                id="service-name"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="Enter service name"
                data-testid="input-new-service-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddServiceDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedDepartment && newServiceName.trim()) {
                  createServiceMutation.mutate({
                    departmentId: selectedDepartment.id,
                    name: newServiceName.trim()
                  });
                }
              }}
              disabled={!newServiceName.trim() || createServiceMutation.isPending}
              data-testid="button-confirm-add-service"
            >
              {createServiceMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Add Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editServiceDialog} onOpenChange={setEditServiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update the service name
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-service-name">Service Name</Label>
              <Input
                id="edit-service-name"
                value={editServiceName}
                onChange={(e) => setEditServiceName(e.target.value)}
                placeholder="Enter service name"
                data-testid="input-edit-service-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditServiceDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedService && editServiceName.trim()) {
                  updateServiceMutation.mutate({
                    id: selectedService.id,
                    name: editServiceName.trim()
                  });
                }
              }}
              disabled={!editServiceName.trim() || updateServiceMutation.isPending}
              data-testid="button-confirm-edit-service"
            >
              {updateServiceMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Update Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteServiceDialog} onOpenChange={setDeleteServiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedService?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteServiceDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (selectedService) {
                  deleteServiceMutation.mutate(selectedService.id);
                }
              }}
              disabled={deleteServiceMutation.isPending}
              data-testid="button-confirm-delete-service"
            >
              {deleteServiceMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
