import { useState, useMemo } from "react";
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
import { Progress } from "@/components/ui/progress";
import { 
  Building2, Users, Edit2, Search, Check, AlertCircle, Database, UserPlus, X, 
  BarChart3, TrendingUp, Activity
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
    queryKey: ["/api/department-nurse-assignments"],
    refetchInterval: 5000
  });

  const { data: nursePreferences = [] } = useQuery<any[]>({
    queryKey: ["/api/nurse-department-preferences"],
    refetchInterval: 5000
  });

  const nurses: NurseOption[] = nursePreferences.map(p => ({
    id: p.nurseId,
    name: p.nurseName
  }));

  const analytics = useMemo(() => {
    const totalDepartments = assignments.length;
    const fullyStaffed = assignments.filter(a => 
      a.primaryNurseId && a.secondaryNurseId && a.tertiaryNurseId
    ).length;
    const partiallyStaffed = assignments.filter(a => 
      (a.primaryNurseId || a.secondaryNurseId || a.tertiaryNurseId) &&
      !(a.primaryNurseId && a.secondaryNurseId && a.tertiaryNurseId)
    ).length;
    const unstaffed = assignments.filter(a => 
      !a.primaryNurseId && !a.secondaryNurseId && !a.tertiaryNurseId
    ).length;
    const totalNursesAssigned = assignments.reduce((sum, a) => {
      let count = 0;
      if (a.primaryNurseId) count++;
      if (a.secondaryNurseId) count++;
      if (a.tertiaryNurseId) count++;
      return sum + count;
    }, 0);
    const maxCapacity = totalDepartments * 3;
    const utilizationRate = maxCapacity > 0 ? Math.round((totalNursesAssigned / maxCapacity) * 100) : 0;

    return {
      totalDepartments,
      fullyStaffed,
      partiallyStaffed,
      unstaffed,
      totalNursesAssigned,
      maxCapacity,
      utilizationRate
    };
  }, [assignments]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/department-nurse-assignments", data);
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
      return apiRequest("POST", "/api/department-nurse-assignments/initialize");
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
        description: "Each nurse can only be assigned once per department",
        variant: "destructive"
      });
      return;
    }

    const normalizedData = {
      departmentName: formData.departmentName,
      primaryNurseId: formData.primaryNurseId || null,
      primaryNurseName: formData.primaryNurseId ? formData.primaryNurseName : null,
      secondaryNurseId: formData.secondaryNurseId || null,
      secondaryNurseName: formData.secondaryNurseId ? formData.secondaryNurseName : null,
      tertiaryNurseId: formData.tertiaryNurseId || null,
      tertiaryNurseName: formData.tertiaryNurseId ? formData.tertiaryNurseName : null
    };

    saveMutation.mutate(normalizedData as any);
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

  const getNurseCount = (assignment: DepartmentNurseAssignment) => {
    let count = 0;
    if (assignment.primaryNurseId) count++;
    if (assignment.secondaryNurseId) count++;
    if (assignment.tertiaryNurseId) count++;
    return count;
  };

  const getNursesList = (assignment: DepartmentNurseAssignment) => {
    const nurseNames: string[] = [];
    if (assignment.primaryNurseName) nurseNames.push(assignment.primaryNurseName);
    if (assignment.secondaryNurseName) nurseNames.push(assignment.secondaryNurseName);
    if (assignment.tertiaryNurseName) nurseNames.push(assignment.tertiaryNurseName);
    return nurseNames;
  };

  return (
    <div className="space-y-6">
      {/* Analytics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Departments</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{analytics.totalDepartments}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fully Staffed</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{analytics.fullyStaffed}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Partially Staffed</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{analytics.partiallyStaffed}</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/50">
                <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unstaffed</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{analytics.unstaffed}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Utilization Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="font-medium">Overall Staffing Utilization</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">{analytics.totalNursesAssigned}/{analytics.maxCapacity} nurses assigned</span>
            </div>
          </div>
          <Progress value={analytics.utilizationRate} className="h-3" />
          <p className="text-xs text-muted-foreground mt-1">{analytics.utilizationRate}% capacity utilized</p>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle>Nurse History</CardTitle>
                <CardDescription>
                  View nurse assignment history by department with real-time updates
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
                    <TableHead className="w-[200px]">Department</TableHead>
                    <TableHead>Nurses</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => {
                    const nursesList = getNursesList(assignment);
                    const nurseCount = getNurseCount(assignment);
                    return (
                      <TableRow key={assignment.id} data-testid={"row-dept-" + assignment.departmentName.replace(/\s+/g, '-').toLowerCase()}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{assignment.departmentName}</span>
                            <Badge 
                              variant={nurseCount === 3 ? "default" : nurseCount > 0 ? "secondary" : "outline"}
                              className={
                                nurseCount === 3 
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" 
                                  : nurseCount > 0 
                                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                                    : "text-muted-foreground"
                              }
                            >
                              {nurseCount}/3
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {nursesList.length === 0 ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <UserPlus className="h-4 w-4" />
                              <span className="text-sm">No nurses assigned</span>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {nursesList.map((name, idx) => (
                                <Badge 
                                  key={idx}
                                  className={
                                    idx === 0 
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                      : idx === 1
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                        : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                                  }
                                >
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(assignment)}
                            data-testid={"button-edit-" + assignment.departmentName.replace(/\s+/g, '-').toLowerCase()}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assign Nurses to {formData.departmentName}
            </DialogTitle>
            <DialogDescription>
              Add up to 3 nurses to this department. Changes are saved automatically and update in real-time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">1</Badge>
                First Nurse
              </Label>
              <div className="flex gap-2">
                <Select
                  value={formData.primaryNurseId}
                  onValueChange={(value) => handleNurseSelect("primary", value)}
                >
                  <SelectTrigger className="flex-1" data-testid="select-primary-nurse">
                    <SelectValue placeholder="Select nurse" />
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
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">2</Badge>
                Second Nurse
              </Label>
              <div className="flex gap-2">
                <Select
                  value={formData.secondaryNurseId}
                  onValueChange={(value) => handleNurseSelect("secondary", value)}
                >
                  <SelectTrigger className="flex-1" data-testid="select-secondary-nurse">
                    <SelectValue placeholder="Select nurse" />
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
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">3</Badge>
                Third Nurse
              </Label>
              <div className="flex gap-2">
                <Select
                  value={formData.tertiaryNurseId}
                  onValueChange={(value) => handleNurseSelect("tertiary", value)}
                >
                  <SelectTrigger className="flex-1" data-testid="select-tertiary-nurse">
                    <SelectValue placeholder="Select nurse" />
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
