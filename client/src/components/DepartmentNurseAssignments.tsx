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
import { 
  Building2, Users, Edit2, Search, Check, AlertCircle, Database, UserPlus, X
} from "lucide-react";

type DepartmentNurseAssignment = {
  id: string;
  departmentName: string;
  primaryNurseId: string | null;
  primaryNurseName: string | null;
  secondaryNurseId: string | null;
  secondaryNurseName: string | null;
  tertiaryNurseId: string | null;
  tertiaryNurseName: string | null;
  createdAt: string;
  updatedAt: string;
};

type NurseOption = {
  id: string;
  name: string;
};

export default function DepartmentNurseAssignments() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentNurseAssignment | null>(null);
  const [formData, setFormData] = useState({
    departmentName: "",
    primaryNurseId: "",
    primaryNurseName: "",
    secondaryNurseId: "",
    secondaryNurseName: "",
    tertiaryNurseId: "",
    tertiaryNurseName: ""
  });

  const { data: assignments = [], isLoading } = useQuery<DepartmentNurseAssignment[]>({
    queryKey: ["/api/department-nurse-assignments"]
  });

  const { data: nursePreferences = [] } = useQuery<any[]>({
    queryKey: ["/api/nurse-department-preferences"]
  });

  const nurses: NurseOption[] = nursePreferences.map(p => ({
    id: p.nurseId,
    name: p.nurseName
  }));

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("/api/department-nurse-assignments", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Nurse assignments saved successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/department-nurse-assignments"] });
      setEditDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save assignments",
        variant: "destructive"
      });
    }
  });

  const initializeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/department-nurse-assignments/initialize", {
        method: "POST"
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "All 24 departments initialized for nurse assignments"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/department-nurse-assignments"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize departments",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      departmentName: "",
      primaryNurseId: "",
      primaryNurseName: "",
      secondaryNurseId: "",
      secondaryNurseName: "",
      tertiaryNurseId: "",
      tertiaryNurseName: ""
    });
    setSelectedDepartment(null);
  };

  const openEditDialog = (assignment: DepartmentNurseAssignment) => {
    setSelectedDepartment(assignment);
    setFormData({
      departmentName: assignment.departmentName,
      primaryNurseId: assignment.primaryNurseId || "",
      primaryNurseName: assignment.primaryNurseName || "",
      secondaryNurseId: assignment.secondaryNurseId || "",
      secondaryNurseName: assignment.secondaryNurseName || "",
      tertiaryNurseId: assignment.tertiaryNurseId || "",
      tertiaryNurseName: assignment.tertiaryNurseName || ""
    });
    setEditDialogOpen(true);
  };

  const handleNurseSelect = (priority: "primary" | "secondary" | "tertiary", nurseId: string) => {
    const nurse = nurses.find(n => n.id === nurseId);
    if (priority === "primary") {
      setFormData({ ...formData, primaryNurseId: nurseId, primaryNurseName: nurse?.name || "" });
    } else if (priority === "secondary") {
      setFormData({ ...formData, secondaryNurseId: nurseId, secondaryNurseName: nurse?.name || "" });
    } else {
      setFormData({ ...formData, tertiaryNurseId: nurseId, tertiaryNurseName: nurse?.name || "" });
    }
  };

  const clearNurse = (priority: "primary" | "secondary" | "tertiary") => {
    if (priority === "primary") {
      setFormData({ ...formData, primaryNurseId: "", primaryNurseName: "" });
    } else if (priority === "secondary") {
      setFormData({ ...formData, secondaryNurseId: "", secondaryNurseName: "" });
    } else {
      setFormData({ ...formData, tertiaryNurseId: "", tertiaryNurseName: "" });
    }
  };

  const handleSave = () => {
    if (!formData.departmentName) {
      toast({
        title: "Validation Error",
        description: "Department name is required",
        variant: "destructive"
      });
      return;
    }

    const selectedNurseIds = [formData.primaryNurseId, formData.secondaryNurseId, formData.tertiaryNurseId].filter(Boolean);
    const uniqueNurseIds = new Set(selectedNurseIds);
    if (uniqueNurseIds.size !== selectedNurseIds.length) {
      toast({
        title: "Validation Error",
        description: "Each nurse can only occupy one priority per department",
        variant: "destructive"
      });
      return;
    }

    saveMutation.mutate(formData);
  };

  const filteredAssignments = assignments.filter(a => 
    a.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.primaryNurseName && a.primaryNurseName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (a.secondaryNurseName && a.secondaryNurseName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (a.tertiaryNurseName && a.tertiaryNurseName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getAvailableNurses = (excludeIds: string[]) => {
    return nurses.filter(n => !excludeIds.includes(n.id));
  };

  const getAssignmentCount = (assignment: DepartmentNurseAssignment) => {
    let count = 0;
    if (assignment.primaryNurseId) count++;
    if (assignment.secondaryNurseId) count++;
    if (assignment.tertiaryNurseId) count++;
    return count;
  };

  const getNurseBadge = (name: string | null, priority: number) => {
    if (!name) {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <UserPlus className="h-3 w-3 mr-1" />
          Unassigned
        </Badge>
      );
    }
    const colors = [
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
    ];
    return (
      <Badge className={colors[priority]}>
        {name}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle>Department Nurse Assignments</CardTitle>
                <CardDescription>
                  Assign up to 3 nurses per department (Primary, Secondary, Tertiary)
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              {assignments.length === 0 && (
                <Button
                  variant="outline"
                  onClick={() => initializeMutation.mutate()}
                  disabled={initializeMutation.isPending}
                  data-testid="button-initialize-departments"
                >
                  <Database className="h-4 w-4 mr-2" />
                  {initializeMutation.isPending ? "Initializing..." : "Initialize 24 Departments"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by department or nurse name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-departments"
              />
            </div>
            <Badge variant="secondary" className="gap-1">
              <Building2 className="h-3 w-3" />
              {filteredAssignments.length} Departments
            </Badge>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No departments found</p>
              <p className="text-sm">Click "Initialize 24 Departments" to set up department nurse assignments</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Primary Nurse</TableHead>
                    <TableHead>Secondary Nurse</TableHead>
                    <TableHead>Tertiary Nurse</TableHead>
                    <TableHead className="text-center">Assigned</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id} data-testid={`row-dept-${assignment.departmentName.replace(/\s+/g, '-').toLowerCase()}`}>
                      <TableCell className="font-medium">{assignment.departmentName}</TableCell>
                      <TableCell>{getNurseBadge(assignment.primaryNurseName, 0)}</TableCell>
                      <TableCell>{getNurseBadge(assignment.secondaryNurseName, 1)}</TableCell>
                      <TableCell>{getNurseBadge(assignment.tertiaryNurseName, 2)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getAssignmentCount(assignment) === 3 ? "default" : "secondary"}>
                          {getAssignmentCount(assignment)}/3
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditDialog(assignment)}
                          data-testid={`button-edit-${assignment.departmentName.replace(/\s+/g, '-').toLowerCase()}`}
                        >
                          <Edit2 className="h-4 w-4" />
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assign Nurses to {formData.departmentName}
            </DialogTitle>
            <DialogDescription>
              Assign up to 3 nurses with different priorities. Each nurse can only hold one priority.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">1st</Badge>
                Primary Nurse
              </Label>
              <div className="flex gap-2">
                <Select
                  value={formData.primaryNurseId}
                  onValueChange={(value) => handleNurseSelect("primary", value)}
                >
                  <SelectTrigger className="flex-1" data-testid="select-primary-nurse">
                    <SelectValue placeholder="Select primary nurse" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableNurses([formData.secondaryNurseId, formData.tertiaryNurseId]).map((nurse) => (
                      <SelectItem key={nurse.id} value={nurse.id}>
                        {nurse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.primaryNurseId && (
                  <Button size="icon" variant="ghost" onClick={() => clearNurse("primary")} data-testid="button-clear-primary">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">2nd</Badge>
                Secondary Nurse
              </Label>
              <div className="flex gap-2">
                <Select
                  value={formData.secondaryNurseId}
                  onValueChange={(value) => handleNurseSelect("secondary", value)}
                >
                  <SelectTrigger className="flex-1" data-testid="select-secondary-nurse">
                    <SelectValue placeholder="Select secondary nurse" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableNurses([formData.primaryNurseId, formData.tertiaryNurseId]).map((nurse) => (
                      <SelectItem key={nurse.id} value={nurse.id}>
                        {nurse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.secondaryNurseId && (
                  <Button size="icon" variant="ghost" onClick={() => clearNurse("secondary")} data-testid="button-clear-secondary">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">3rd</Badge>
                Tertiary Nurse
              </Label>
              <div className="flex gap-2">
                <Select
                  value={formData.tertiaryNurseId}
                  onValueChange={(value) => handleNurseSelect("tertiary", value)}
                >
                  <SelectTrigger className="flex-1" data-testid="select-tertiary-nurse">
                    <SelectValue placeholder="Select tertiary nurse" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableNurses([formData.primaryNurseId, formData.secondaryNurseId]).map((nurse) => (
                      <SelectItem key={nurse.id} value={nurse.id}>
                        {nurse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.tertiaryNurseId && (
                  <Button size="icon" variant="ghost" onClick={() => clearNurse("tertiary")} data-testid="button-clear-tertiary">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {(formData.primaryNurseId || formData.secondaryNurseId || formData.tertiaryNurseId) && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {[formData.primaryNurseId, formData.secondaryNurseId, formData.tertiaryNurseId].filter(Boolean).length}/3 nurses assigned
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-assignment">
              {saveMutation.isPending ? "Saving..." : "Save Assignments"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
