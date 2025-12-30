import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFnWithUser } from "@/lib/queryClient";
import type { LabTestCatalog, InsertLabTestOrder, ServicePatient } from "@shared/schema";
import {
  FlaskConical,
  Search,
  Plus,
  Trash2,
  Send,
  User,
  AlertCircle,
  CheckCircle,
  ShoppingCart,
  Filter,
  X,
  Loader2,
} from "lucide-react";

interface LabTestOrderingProps {
  currentUserId: string;
  currentUserName: string;
  currentUserRole?: string;
}

interface CartItem {
  test: LabTestCatalog;
  priority: "NORMAL" | "URGENT" | "CRITICAL";
  notes: string;
}

export default function LabTestOrdering({ currentUserId, currentUserName, currentUserRole = "DOCTOR" }: LabTestOrderingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [suggestedTest, setSuggestedTest] = useState("");

  const userContext = { id: currentUserId, role: currentUserRole };

  const { data: labTests = [], isLoading: testsLoading } = useQuery<LabTestCatalog[]>({
    queryKey: ["/api/lab-tests"],
  });

  const { data: patients = [], isLoading: patientsLoading, error: patientsError } = useQuery<ServicePatient[]>({
    queryKey: ["/api/service-patients", currentUserId, currentUserRole],
    queryFn: getQueryFnWithUser<ServicePatient[]>(userContext, "/api/service-patients"),
    retry: false,
  });

  const categories = useMemo(() => {
    const cats = new Set(labTests.map(t => t.testCategory).filter(Boolean));
    return Array.from(cats).sort();
  }, [labTests]);

  const filteredTests = useMemo(() => {
    return labTests.filter(test => {
      if (!test.isActive) return false;
      const matchesSearch = 
        test.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.testCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (test.description?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === "all" || test.testCategory === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [labTests, searchTerm, categoryFilter]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  interface BatchOrderResponse {
    totalRequested: number;
    successCount: number;
    failedCount: number;
    orders: any[];
    errors: { index: number; error: string }[];
  }

  const createBatchOrderMutation = useMutation({
    mutationFn: async (orders: Omit<InsertLabTestOrder, "orderNumber">[]) => {
      const response = await apiRequest("POST", "/api/lab-test-orders/batch", { orders });
      return response.json() as Promise<BatchOrderResponse>;
    },
    onSuccess: (data) => {
      toast({
        title: "Tests Ordered Successfully",
        description: `${data.successCount} test(s) ordered for ${selectedPatient?.firstName} ${selectedPatient?.lastName}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/lab-test-orders"] });
      setCart([]);
      setClinicalNotes("");
      setSuggestedTest("");
      setShowOrderDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place test orders - no tests were created",
        variant: "destructive",
      });
      // Cart remains intact so user can retry
    },
  });

  const addToCart = (test: LabTestCatalog) => {
    if (cart.some(item => item.test.id === test.id)) {
      toast({
        title: "Already in Cart",
        description: `${test.testName} is already in your order cart`,
        variant: "destructive",
      });
      return;
    }
    setCart([...cart, { test, priority: "NORMAL", notes: "" }]);
    toast({
      title: "Added to Cart",
      description: test.testName,
    });
  };

  const removeFromCart = (testId: string) => {
    setCart(cart.filter(item => item.test.id !== testId));
  };

  const updateCartItem = (testId: string, updates: Partial<CartItem>) => {
    setCart(cart.map(item => 
      item.test.id === testId ? { ...item, ...updates } : item
    ));
  };

  const handleSubmitOrders = async () => {
    if (!selectedPatientId || cart.length === 0 || !selectedPatient) {
      toast({
        title: "Cannot Submit Order",
        description: "Please select a patient and add tests to the cart",
        variant: "destructive",
      });
      return;
    }

    const patientName = `${selectedPatient.firstName} ${selectedPatient.lastName}`;
    const orders = cart.map(item => ({
      patientId: selectedPatientId,
      patientName,
      patientUhid: selectedPatient.id,
      patientAge: selectedPatient.dateOfBirth ? calculateAge(selectedPatient.dateOfBirth) : undefined,
      patientGender: selectedPatient.gender,
      doctorId: currentUserId,
      doctorName: currentUserName,
      testId: item.test.id,
      testName: item.test.testName,
      testCode: item.test.testCode ?? undefined,
      priority: item.priority,
      clinicalNotes: item.notes || clinicalNotes,
      suggestedTest: suggestedTest || undefined,
      orderedAt: new Date().toISOString(),
    }));

    createBatchOrderMutation.mutate(orders);
  };

  const calculateAge = (dob: string): string => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} years`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "destructive";
      case "URGENT": return "secondary";
      default: return "outline";
    }
  };

  const totalPrice = cart.reduce((sum, item) => sum + parseFloat(item.test.price || "0"), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="text-page-title">
            <FlaskConical className="h-8 w-8 text-primary" />
            Order Lab Tests
          </h1>
          <p className="text-muted-foreground mt-1">
            Search and order pathology tests for patients
          </p>
        </div>
        <Button
          size="lg"
          disabled={cart.length === 0 || !selectedPatientId}
          onClick={() => setShowOrderDialog(true)}
          data-testid="button-review-order"
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          Review Order ({cart.length})
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Select Patient
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patientsError ? (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                  <p className="text-sm font-medium text-destructive">Failed to load patients</p>
                  <p className="text-xs text-muted-foreground mt-1">{(patientsError as Error).message}</p>
                </div>
              ) : (
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId} disabled={patientsLoading}>
                  <SelectTrigger data-testid="select-patient">
                    {patientsLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading patients...
                      </span>
                    ) : (
                      <SelectValue placeholder="Select a patient..." />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                        {patient.phone && ` (${patient.phone})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedPatient && (
                <div className="mt-3 p-3 bg-muted rounded-lg grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    <span className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</span>
                  </div>
                  {selectedPatient.gender && (
                    <div>
                      <span className="text-muted-foreground">Gender:</span>{" "}
                      <span className="font-medium">{selectedPatient.gender}</span>
                    </div>
                  )}
                  {selectedPatient.phone && (
                    <div>
                      <span className="text-muted-foreground">Phone:</span>{" "}
                      <span className="font-medium">{selectedPatient.phone}</span>
                    </div>
                  )}
                  {selectedPatient.dateOfBirth && (
                    <div>
                      <span className="text-muted-foreground">Age:</span>{" "}
                      <span className="font-medium">{calculateAge(selectedPatient.dateOfBirth)}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Test Catalog
              </CardTitle>
              <CardDescription>
                {filteredTests.length} of {labTests.length} tests available
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by test name, code, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-tests"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[200px]" data-testid="select-category">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[400px]">
                {testsLoading ? (
                  <div className="space-y-3 p-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    ))}
                  </div>
                ) : filteredTests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tests found matching your search</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Test Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Sample</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTests.slice(0, 100).map((test) => (
                        <TableRow key={test.id} data-testid={`row-test-${test.id}`}>
                          <TableCell className="font-mono text-xs">{test.testCode}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{test.testName}</div>
                              {test.turnaroundTime && (
                                <div className="text-xs text-muted-foreground">TAT: {test.turnaroundTime}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{test.testCategory}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{test.sampleType}</TableCell>
                          <TableCell className="text-right font-medium">
                            {parseFloat(test.price || "0") > 0 ? `₹${test.price}` : "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={cart.some(item => item.test.id === test.id) ? "secondary" : "default"}
                              disabled={cart.some(item => item.test.id === test.id)}
                              onClick={() => addToCart(test)}
                              data-testid={`button-add-${test.id}`}
                            >
                              {cart.some(item => item.test.id === test.id) ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {filteredTests.length > 100 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Showing first 100 results. Refine your search to see more.
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Order Cart
              </CardTitle>
              <CardDescription>
                {cart.length} test(s) selected
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No tests added yet</p>
                  <p className="text-xs mt-1">Search and add tests from the catalog</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.test.id} className="p-3 border rounded-lg space-y-2" data-testid={`cart-item-${item.test.id}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-sm">{item.test.testName}</div>
                            <div className="text-xs text-muted-foreground">{item.test.testCode}</div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => removeFromCart(item.test.id)}
                            data-testid={`button-remove-${item.test.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Priority:</Label>
                          <Select
                            value={item.priority}
                            onValueChange={(value: "NORMAL" | "URGENT" | "CRITICAL") => 
                              updateCartItem(item.test.id, { priority: value })
                            }
                          >
                            <SelectTrigger className="h-7 text-xs" data-testid={`select-priority-${item.test.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NORMAL">Normal</SelectItem>
                              <SelectItem value="URGENT">Urgent</SelectItem>
                              <SelectItem value="CRITICAL">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {cart.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-muted-foreground">Estimated Total:</span>
                    <span className="text-xl font-bold">₹{totalPrice.toFixed(2)}</span>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!selectedPatientId}
                    onClick={() => setShowOrderDialog(true)}
                    data-testid="button-place-order"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Place Order
                  </Button>
                  {!selectedPatientId && (
                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Please select a patient first
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Confirm Lab Test Order
            </DialogTitle>
            <DialogDescription>
              Review and confirm the test order for {selectedPatient?.firstName} {selectedPatient?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Patient Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>{" "}
                  {selectedPatient?.firstName} {selectedPatient?.lastName}
                </div>
                <div>
                  <span className="text-muted-foreground">Age:</span>{" "}
                  {selectedPatient?.dateOfBirth ? calculateAge(selectedPatient.dateOfBirth) : "N/A"}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Tests to Order ({cart.length})</h4>
              <div className="border rounded-lg divide-y max-h-[200px] overflow-auto">
                {cart.map((item) => (
                  <div key={item.test.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{item.test.testName}</div>
                      <div className="text-xs text-muted-foreground">{item.test.testCode} | {item.test.sampleType}</div>
                    </div>
                    <Badge variant={getPriorityColor(item.priority) as any}>{item.priority}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinicalNotes">Clinical Notes (Optional)</Label>
              <Textarea
                id="clinicalNotes"
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Enter any clinical notes or instructions for the lab..."
                rows={3}
                data-testid="input-clinical-notes"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suggestedTest">Suggested Test (Optional)</Label>
              <Textarea
                id="suggestedTest"
                value={suggestedTest}
                onChange={(e) => setSuggestedTest(e.target.value)}
                placeholder="e.g., ECG, Lipid Profile, HbA1c, Thyroid Panel, CBC, Blood Sugar..."
                rows={3}
                data-testid="input-suggested-test"
              />
            </div>

            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <span className="font-medium">Total Estimated Cost:</span>
              <span className="text-2xl font-bold">₹{totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitOrders}
              disabled={createBatchOrderMutation.isPending}
              data-testid="button-confirm-order"
            >
              {createBatchOrderMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
