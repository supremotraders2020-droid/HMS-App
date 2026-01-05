import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { 
  Users, Building, Plus, Edit2, Trash2, Search, 
  Check, AlertCircle, Stethoscope, Database, MapPin, UserCheck, DoorOpen, X
} from "lucide-react";

type NurseDepartmentPreference = {
  id: string;
  nurseId: string;
  nurseName: string;
  primaryDepartment: string;
  secondaryDepartment: string;
  tertiaryDepartment: string;
  isAvailable: boolean;
  assignedRoom: string | null;
  assignedDoctor: string | null;
  assignedPosition: string | null;
  createdAt: string;
  updatedAt: string;
};

type NurseUser = {
  id: string;
  username: string;
  fullName: string;
  role: string;
};

type NurseData = { nurseId: string; nurseName: string };

export default function NurseDepartmentPreferences() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignmentDetailsOpen, setAssignmentDetailsOpen] = useState(false);
  const [selectedPreference, setSelectedPreference] = useState<NurseDepartmentPreference | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<NurseDepartmentPreference | null>(null);
  const [formData, setFormData] = useState({
    nurseId: "",
    nurseName: "",
    primaryDepartment: "",
    secondaryDepartment: "",
    tertiaryDepartment: ""
  });

  const { data: departments = [] } = useQuery<string[]>({
    queryKey: ["/api/nurse-department-preferences/departments"]
  });

  const { data: preferences = [], isLoading } = useQuery<NurseDepartmentPreference[]>({
    queryKey: ["/api/nurse-department-preferences"]
  });

  // Fetch all nurses from the database with auto-generated IDs
  const { data: allNurses = [] } = useQuery<NurseData[]>({
    queryKey: ["/api/nurse-department-preferences/all-nurses"]
  });

  const handleNurseIdChange = (nurseId: string) => {
    const nurse = allNurses.find(n => n.nurseId === nurseId);
    setFormData({ 
      ...formData, 
      nurseId: nurseId,
      nurseName: nurse?.nurseName || ""
    });
  };

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/nurse-department-preferences", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Department preferences saved successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/nurse-department-preferences"] });
      setEditDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save preferences",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (nurseId: string) => {
      return apiRequest("DELETE", `/api/nurse-department-preferences/${nurseId}`);
    },
    onSuccess: () => {
      toast({
        title: "Deleted",
        description: "Preferences removed successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/nurse-department-preferences"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete preferences",
        variant: "destructive"
      });
    }
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ nurseId, isAvailable }: { nurseId: string; isAvailable: boolean }) => {
      return apiRequest("PATCH", `/api/nurse-department-preferences/${nurseId}/availability`, { isAvailable });
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Nurse availability updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/nurse-department-preferences"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update availability",
        variant: "destructive"
      });
    }
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/nurse-department-preferences/seed");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "24 nurses seeded with department preferences"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/nurse-department-preferences"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to seed data",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      nurseId: "",
      nurseName: "",
      primaryDepartment: "",
      secondaryDepartment: "",
      tertiaryDepartment: ""
    });
    setSelectedPreference(null);
  };

  const openEditDialog = (pref?: NurseDepartmentPreference) => {
    if (pref) {
      setSelectedPreference(pref);
      setFormData({
        nurseId: pref.nurseId,
        nurseName: pref.nurseName,
        primaryDepartment: pref.primaryDepartment,
        secondaryDepartment: pref.secondaryDepartment,
        tertiaryDepartment: pref.tertiaryDepartment
      });
    } else {
      resetForm();
    }
    setEditDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.nurseId || !formData.nurseName || !formData.primaryDepartment || !formData.secondaryDepartment || !formData.tertiaryDepartment) {
      toast({
        title: "Validation Error",
        description: "All fields are required",
        variant: "destructive"
      });
      return;
    }

    const selectedDepts = [formData.primaryDepartment, formData.secondaryDepartment, formData.tertiaryDepartment];
    const uniqueDepts = new Set(selectedDepts);
    if (uniqueDepts.size !== 3) {
      toast({
        title: "Validation Error",
        description: "All three department preferences must be unique",
        variant: "destructive"
      });
      return;
    }

    saveMutation.mutate(formData);
  };

  const filteredPreferences = preferences.filter(p => 
    p.nurseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nurseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.primaryDepartment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAvailableDepartments = (excludeDepts: string[]) => {
    return departments.filter(dept => !excludeDepts.includes(dept));
  };

  const getDepartmentBadgeColor = (index: number) => {
    switch (index) {
      case 0: return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case 1: return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case 2: return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                <Stethoscope className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <CardTitle>Nurse Department Preferences</CardTitle>
                <CardDescription>
                  Manage nurse department assignments - each nurse must select 3 unique departments (Primary, Secondary, Tertiary)
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              {preferences.length === 0 && (
                <Button
                  variant="outline"
                  onClick={() => seedMutation.mutate()}
                  disabled={seedMutation.isPending}
                  data-testid="button-seed-nurses"
                >
                  <Database className="h-4 w-4 mr-2" />
                  {seedMutation.isPending ? "Seeding..." : "Seed 24 Nurses"}
                </Button>
              )}
              <Button onClick={() => openEditDialog()} data-testid="button-add-preference">
                <Plus className="h-4 w-4 mr-2" />
                Add Preference
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-nurses"
              />
            </div>
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {filteredPreferences.length} Nurses
            </Badge>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredPreferences.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No nurse preferences found</p>
              <p className="text-sm">Click "Add Preference" to add nurse department assignments</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nurse ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Primary Department</TableHead>
                    <TableHead>Secondary Department</TableHead>
                    <TableHead>Tertiary Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPreferences.map((pref) => (
                    <TableRow key={pref.id} data-testid={`row-nurse-${pref.nurseId}`}>
                      <TableCell className="font-mono text-sm">{pref.nurseId}</TableCell>
                      <TableCell className="font-medium">{pref.nurseName}</TableCell>
                      <TableCell>
                        <Badge className={getDepartmentBadgeColor(0)}>
                          {pref.primaryDepartment}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getDepartmentBadgeColor(1)}>
                          {pref.secondaryDepartment}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getDepartmentBadgeColor(2)}>
                          {pref.tertiaryDepartment}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`cursor-pointer transition-colors ${
                            pref.isAvailable 
                              ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50" 
                              : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                          }`}
                          onClick={() => {
                            if (pref.isAvailable) {
                              setSelectedAssignment(pref);
                              setAssignmentDetailsOpen(true);
                            } else {
                              toggleAvailabilityMutation.mutate({ nurseId: pref.nurseId, isAvailable: true });
                            }
                          }}
                          data-testid={`badge-status-${pref.nurseId}`}
                        >
                          {pref.isAvailable ? "Assigned" : "Not Assigned"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(pref)}
                            data-testid={`button-edit-${pref.nurseId}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate(pref.nurseId)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${pref.nurseId}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {selectedPreference ? "Edit Department Preferences" : "Add Department Preferences"}
            </DialogTitle>
            <DialogDescription>
              Select 3 unique departments for this nurse. Each department must be different.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nurseId">Nurse ID</Label>
                <Select
                  value={formData.nurseId}
                  onValueChange={handleNurseIdChange}
                  disabled={!!selectedPreference}
                >
                  <SelectTrigger data-testid="select-nurse-id">
                    <SelectValue placeholder="Select Nurse ID" />
                  </SelectTrigger>
                  <SelectContent>
                    {allNurses.map((nurse) => (
                      <SelectItem key={nurse.nurseId} value={nurse.nurseId}>
                        {nurse.nurseId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nurseName">Nurse Name</Label>
                <Select
                  value={formData.nurseName}
                  onValueChange={(value) => {
                    const nurse = allNurses.find(n => n.nurseName === value);
                    setFormData({ 
                      ...formData, 
                      nurseName: value,
                      nurseId: nurse?.nurseId || formData.nurseId
                    });
                  }}
                  disabled={!!selectedPreference}
                >
                  <SelectTrigger data-testid="select-nurse-name">
                    <SelectValue placeholder="Select Nurse Name" />
                  </SelectTrigger>
                  <SelectContent>
                    {allNurses.map((nurse) => (
                      <SelectItem key={nurse.nurseId} value={nurse.nurseName}>
                        {nurse.nurseName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryDepartment" className="flex items-center gap-2">
                <Badge className={getDepartmentBadgeColor(0)}>1st</Badge>
                Primary Department
              </Label>
              <Select
                value={formData.primaryDepartment}
                onValueChange={(value) => setFormData({ ...formData, primaryDepartment: value })}
              >
                <SelectTrigger data-testid="select-primary-dept">
                  <SelectValue placeholder="Select primary department" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableDepartments([formData.secondaryDepartment, formData.tertiaryDepartment]).map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryDepartment" className="flex items-center gap-2">
                <Badge className={getDepartmentBadgeColor(1)}>2nd</Badge>
                Secondary Department
              </Label>
              <Select
                value={formData.secondaryDepartment}
                onValueChange={(value) => setFormData({ ...formData, secondaryDepartment: value })}
              >
                <SelectTrigger data-testid="select-secondary-dept">
                  <SelectValue placeholder="Select secondary department" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableDepartments([formData.primaryDepartment, formData.tertiaryDepartment]).map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tertiaryDepartment" className="flex items-center gap-2">
                <Badge className={getDepartmentBadgeColor(2)}>3rd</Badge>
                Tertiary Department
              </Label>
              <Select
                value={formData.tertiaryDepartment}
                onValueChange={(value) => setFormData({ ...formData, tertiaryDepartment: value })}
              >
                <SelectTrigger data-testid="select-tertiary-dept">
                  <SelectValue placeholder="Select tertiary department" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableDepartments([formData.primaryDepartment, formData.secondaryDepartment]).map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.primaryDepartment && formData.secondaryDepartment && formData.tertiaryDepartment && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">All departments selected</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-preference">
              {saveMutation.isPending ? "Saving..." : "Save Preferences"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignmentDetailsOpen} onOpenChange={setAssignmentDetailsOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              Assignment Details
            </DialogTitle>
            <DialogDescription>
              View current assignment information for {selectedAssignment?.nurseName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAssignment && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Nurse</p>
                  <p className="font-medium">{selectedAssignment.nurseName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedAssignment.nurseId}</p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{selectedAssignment.primaryDepartment}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Position</p>
                    <Badge className={getDepartmentBadgeColor(
                      selectedAssignment.assignedPosition === "Primary" ? 0 :
                      selectedAssignment.assignedPosition === "Secondary" ? 1 : 2
                    )}>
                      {selectedAssignment.assignedPosition || "Primary"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DoorOpen className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Assigned Room</p>
                    <p className="font-medium font-mono">
                      {selectedAssignment.assignedRoom || "Not Assigned"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Stethoscope className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Assigned Doctor</p>
                    <p className="font-medium">
                      {selectedAssignment.assignedDoctor || "Not Assigned"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">Currently Active Assignment</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button 
              variant="outline" 
              onClick={() => setAssignmentDetailsOpen(false)}
              className="flex-1"
              data-testid="button-keep-assigned"
            >
              <Check className="h-4 w-4 mr-2" />
              Keep Assigned
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (selectedAssignment) {
                  toggleAvailabilityMutation.mutate({ 
                    nurseId: selectedAssignment.nurseId, 
                    isAvailable: false 
                  });
                  setAssignmentDetailsOpen(false);
                  setSelectedAssignment(null);
                }
              }}
              className="flex-1"
              data-testid="button-unassign"
            >
              <X className="h-4 w-4 mr-2" />
              Unassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
