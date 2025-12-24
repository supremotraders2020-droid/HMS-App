import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Store,
  Search,
  FileText,
  Receipt,
  Pill,
  User,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Package,
  CreditCard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Prescription, PrescriptionDispensing, MedicalStore, MedicalStoreBill } from "@shared/schema";

interface MedicalStorePortalProps {
  currentUserId: string;
}

export default function MedicalStorePortal({ currentUserId }: MedicalStorePortalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Prescription[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isDispensingOpen, setIsDispensingOpen] = useState(false);
  const [storeInfo, setStoreInfo] = useState<{ store: MedicalStore; storeUser: any } | null>(null);

  const { data: myStoreData } = useQuery<{ store: MedicalStore; storeUser: any }>({
    queryKey: ["/api/medical-stores/my-store", currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/medical-stores/my-store/${currentUserId}`);
      if (!response.ok) throw new Error("Failed to fetch store info");
      return response.json();
    },
  });

  useEffect(() => {
    if (myStoreData) {
      setStoreInfo(myStoreData);
    }
  }, [myStoreData]);

  const { data: dispensingRecords = [], isLoading: dispensingLoading } = useQuery<PrescriptionDispensing[]>({
    queryKey: ["/api/medical-stores", storeInfo?.store?.id, "dispensing"],
    queryFn: async () => {
      if (!storeInfo?.store?.id) return [];
      const response = await fetch(`/api/medical-stores/${storeInfo.store.id}/dispensing`);
      if (!response.ok) throw new Error("Failed to fetch dispensing records");
      return response.json();
    },
    enabled: !!storeInfo?.store?.id,
  });

  const { data: bills = [], isLoading: billsLoading } = useQuery<MedicalStoreBill[]>({
    queryKey: ["/api/medical-stores", storeInfo?.store?.id, "bills"],
    queryFn: async () => {
      if (!storeInfo?.store?.id) return [];
      const response = await fetch(`/api/medical-stores/${storeInfo.store.id}/bills`);
      if (!response.ok) throw new Error("Failed to fetch bills");
      return response.json();
    },
    enabled: !!storeInfo?.store?.id,
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter Search Term",
        description: "Please enter a patient name or prescription number",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/medical-stores/prescriptions/search?query=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);

        if (storeInfo?.store) {
          await apiRequest("POST", "/api/medical-stores/access-logs", {
            storeId: storeInfo.store.id,
            storeName: storeInfo.store.storeName,
            userId: currentUserId,
            userName: storeInfo.storeUser?.staffRole || "Staff",
            actionType: "PRESCRIPTION_SEARCH",
            details: `Searched for: ${searchQuery}`,
          });
        }
      } else {
        toast({
          title: "Search Failed",
          description: "Could not search prescriptions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Error",
        description: "Failed to search prescriptions",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const createDispensingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/medical-stores/dispensing", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-stores", storeInfo?.store?.id, "dispensing"] });
      setIsDispensingOpen(false);
      setSelectedPrescription(null);
      toast({
        title: "Success",
        description: "Prescription dispensed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to dispense prescription",
        variant: "destructive",
      });
    },
  });

  const createBillMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/medical-stores/bills", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-stores", storeInfo?.store?.id, "bills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medical-stores", storeInfo?.store?.id, "dispensing"] });
      toast({
        title: "Bill Created",
        description: "Invoice generated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create bill",
        variant: "destructive",
      });
    },
  });

  const handleDispense = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setIsDispensingOpen(true);
  };

  const confirmDispensing = () => {
    if (!selectedPrescription || !storeInfo?.store) return;

    createDispensingMutation.mutate({
      prescriptionId: selectedPrescription.id,
      storeId: storeInfo.store.id,
      storeName: storeInfo.store.storeName,
      dispensedBy: currentUserId,
      dispensedByName: storeInfo.storeUser?.staffRole || "Pharmacist",
    });

    apiRequest("POST", "/api/medical-stores/access-logs", {
      storeId: storeInfo.store.id,
      storeName: storeInfo.store.storeName,
      userId: currentUserId,
      userName: storeInfo.storeUser?.staffRole || "Staff",
      actionType: "PRESCRIPTION_DISPENSED",
      prescriptionId: selectedPrescription.id,
      prescriptionNumber: selectedPrescription.prescriptionNumber,
      patientId: selectedPrescription.patientId,
      patientName: selectedPrescription.patientName,
    });
  };

  const handleCreateBill = (dispensing: PrescriptionDispensing) => {
    if (!storeInfo?.store) return;

    const subtotal = 500;
    const gstRate = 18;
    const gstAmount = (subtotal * gstRate) / 100;
    const totalAmount = subtotal + gstAmount;

    createBillMutation.mutate({
      dispensingId: dispensing.id,
      storeId: storeInfo.store.id,
      subtotal: String(subtotal),
      gstRate: String(gstRate),
      gstAmount: String(gstAmount),
      discount: "0",
      totalAmount: String(totalAmount),
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      billedBy: currentUserId,
      billedByName: storeInfo.storeUser?.staffRole || "Pharmacist",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "PARTIALLY_DISPENSED":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"><AlertCircle className="h-3 w-3 mr-1" />Partial</Badge>;
      case "FULLY_DISPENSED":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="h-3 w-3 mr-1" />Dispensed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!storeInfo) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading store information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Medical Store Portal</h1>
          <p className="text-muted-foreground">{storeInfo.store.storeName}</p>
        </div>
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" data-testid="badge-store-status">
          <Store className="h-4 w-4 mr-1" />
          {storeInfo.store.storeType === "IN_HOUSE" ? "Hospital Pharmacy" : "Third Party Store"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prescriptions</p>
                <p className="text-2xl font-bold" data-testid="text-prescription-count">{dispensingRecords.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dispensed</p>
                <p className="text-2xl font-bold" data-testid="text-dispensed-count">
                  {dispensingRecords.filter(d => d.dispensingStatus === "FULLY_DISPENSED").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold" data-testid="text-pending-count">
                  {dispensingRecords.filter(d => d.dispensingStatus === "PENDING").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Receipt className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bills Today</p>
                <p className="text-2xl font-bold" data-testid="text-bills-count">{bills.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="search" data-testid="tab-search">
            <Search className="h-4 w-4 mr-2" />
            Search Prescription
          </TabsTrigger>
          <TabsTrigger value="dispensing" data-testid="tab-dispensing">
            <Pill className="h-4 w-4 mr-2" />
            Dispensing
          </TabsTrigger>
          <TabsTrigger value="bills" data-testid="tab-bills">
            <Receipt className="h-4 w-4 mr-2" />
            Bills
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Prescriptions</CardTitle>
              <CardDescription>Find prescriptions by patient name, ID, or prescription number</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter patient name or prescription number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10"
                    data-testid="input-search-prescription"
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching} data-testid="button-search">
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <Separator />
                  <h3 className="font-semibold">Search Results ({searchResults.length})</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {searchResults.map((prescription) => (
                      <Card key={prescription.id} className="hover-elevate" data-testid={`card-prescription-${prescription.id}`}>
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold">{prescription.patientName}</p>
                                <p className="text-sm text-muted-foreground font-mono">{prescription.prescriptionNumber}</p>
                              </div>
                              <Badge variant="outline">{prescription.prescriptionStatus}</Badge>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Doctor:</span>
                                <p>{prescription.doctorName}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Date:</span>
                                <p>{prescription.createdAt ? new Date(prescription.createdAt).toLocaleDateString() : "-"}</p>
                              </div>
                            </div>
                            {prescription.diagnosis && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Diagnosis:</span>
                                <p>{prescription.diagnosis}</p>
                              </div>
                            )}
                            <Button 
                              className="w-full" 
                              onClick={() => handleDispense(prescription)}
                              data-testid={`button-dispense-${prescription.id}`}
                            >
                              <Pill className="h-4 w-4 mr-2" />
                              Dispense Medicines
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.length === 0 && searchQuery && !isSearching && (
                <div className="text-center py-8 text-muted-foreground">
                  No prescriptions found for "{searchQuery}"
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dispensing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dispensing Records</CardTitle>
              <CardDescription>Track prescription dispensing status</CardDescription>
            </CardHeader>
            <CardContent>
              {dispensingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : dispensingRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No dispensing records yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dispensing #</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Prescription</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dispensingRecords.map((record) => (
                      <TableRow key={record.id} data-testid={`row-dispensing-${record.id}`}>
                        <TableCell className="font-mono text-sm">{record.dispensingNumber}</TableCell>
                        <TableCell>{record.patientName}</TableCell>
                        <TableCell className="font-mono text-sm">{record.prescriptionNumber}</TableCell>
                        <TableCell>{getStatusBadge(record.dispensingStatus)}</TableCell>
                        <TableCell>{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>
                          {record.dispensingStatus !== "FULLY_DISPENSED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCreateBill(record)}
                              disabled={createBillMutation.isPending}
                              data-testid={`button-bill-${record.id}`}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Create Bill
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Bills</CardTitle>
              <CardDescription>View all generated invoices</CardDescription>
            </CardHeader>
            <CardContent>
              {billsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : bills.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No bills generated yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill #</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Prescription</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.map((bill) => (
                      <TableRow key={bill.id} data-testid={`row-bill-${bill.id}`}>
                        <TableCell className="font-mono text-sm">{bill.billNumber}</TableCell>
                        <TableCell>{bill.patientName}</TableCell>
                        <TableCell className="font-mono text-sm">{bill.prescriptionNumber}</TableCell>
                        <TableCell className="font-semibold">Rs. {bill.totalAmount}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{bill.paymentMethod}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={bill.paymentStatus === "PAID" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"}>
                            {bill.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDispensingOpen} onOpenChange={setIsDispensingOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dispense Prescription</DialogTitle>
            <DialogDescription>
              Confirm dispensing of medicines for this prescription
            </DialogDescription>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Patient</Label>
                  <p className="font-medium">{selectedPrescription.patientName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Prescription #</Label>
                  <p className="font-mono">{selectedPrescription.prescriptionNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Doctor</Label>
                  <p>{selectedPrescription.doctorName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p>{selectedPrescription.createdAt ? new Date(selectedPrescription.createdAt).toLocaleDateString() : "-"}</p>
                </div>
              </div>
              {selectedPrescription.diagnosis && (
                <div>
                  <Label className="text-muted-foreground">Diagnosis</Label>
                  <p>{selectedPrescription.diagnosis}</p>
                </div>
              )}
              <Separator />
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  By confirming, you acknowledge that the prescribed medicines are being dispensed as per the doctor's prescription.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDispensingOpen(false)}>Cancel</Button>
            <Button 
              onClick={confirmDispensing} 
              disabled={createDispensingMutation.isPending}
              data-testid="button-confirm-dispense"
            >
              {createDispensingMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
              ) : (
                <><CheckCircle className="h-4 w-4 mr-2" />Confirm Dispensing</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
