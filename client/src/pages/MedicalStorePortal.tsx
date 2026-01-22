import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IntegerInput, NumericInput } from "@/components/validated-inputs";
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
  UserCircle,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Package,
  CreditCard,
  Eye,
  Download,
  Printer,
  Stethoscope,
  Activity,
  ClipboardList,
  Bell,
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  Users,
  Scissors,
  HeartPulse,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Prescription, PrescriptionDispensing, MedicalStore, MedicalStoreBill, MedicalStoreInventory } from "@shared/schema";

interface MedicalStorePortalProps {
  currentUserId: string;
}

interface PrescriptionNotification {
  id: string;
  prescriptionNumber?: string;
  patientName: string;
  patientAge?: string;
  patientGender?: string;
  doctorName: string;
  diagnosis: string;
  medicines: string[];
  medicineDetails?: string;
  instructions?: string;
  prescriptionDate: string;
  signedByName?: string;
  receivedAt: Date;
}

interface InventoryFormData {
  medicineName: string;
  genericName: string;
  brandName: string;
  strength: string;
  dosageForm: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitPrice: string;
  mrp: string;
  gstPercentage: string;
  isAvailable: boolean;
}

function MedicineInventoryTab({ storeId }: { storeId: string }) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MedicalStoreInventory | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<InventoryFormData>({
    medicineName: "",
    genericName: "",
    brandName: "",
    strength: "",
    dosageForm: "Tablet",
    batchNumber: "",
    expiryDate: "",
    quantity: 0,
    unitPrice: "",
    mrp: "",
    gstPercentage: "12",
    isAvailable: true
  });

  const { data: inventory = [], isLoading } = useQuery<MedicalStoreInventory[]>({
    queryKey: ["/api/medical-stores", storeId, "inventory"],
    queryFn: async () => {
      if (!storeId) return [];
      const response = await fetch(`/api/medical-stores/${storeId}/inventory`);
      if (!response.ok) throw new Error("Failed to fetch inventory");
      return response.json();
    },
    enabled: !!storeId
  });

  const addMutation = useMutation({
    mutationFn: async (data: InventoryFormData) => {
      return apiRequest("POST", `/api/medical-stores/${storeId}/inventory`, {
        ...data,
        quantity: Number(data.quantity)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-stores", storeId, "inventory"] });
      toast({ title: "Success", description: "Medicine added to inventory" });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add medicine", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InventoryFormData> }) => {
      return apiRequest("PATCH", `/api/medical-stores/inventory/${id}`, {
        ...data,
        quantity: data.quantity !== undefined ? Number(data.quantity) : undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-stores", storeId, "inventory"] });
      toast({ title: "Success", description: "Medicine updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update medicine", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/medical-stores/inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-stores", storeId, "inventory"] });
      toast({ title: "Success", description: "Medicine removed from inventory" });
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete medicine", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      medicineName: "",
      genericName: "",
      brandName: "",
      strength: "",
      dosageForm: "Tablet",
      batchNumber: "",
      expiryDate: "",
      quantity: 0,
      unitPrice: "",
      mrp: "",
      gstPercentage: "12",
      isAvailable: true
    });
  };

  const handleEdit = (item: MedicalStoreInventory) => {
    setSelectedItem(item);
    setFormData({
      medicineName: item.medicineName || "",
      genericName: item.genericName || "",
      brandName: item.brandName || "",
      strength: item.strength || "",
      dosageForm: item.dosageForm || "Tablet",
      batchNumber: item.batchNumber || "",
      expiryDate: item.expiryDate || "",
      quantity: item.quantity || 0,
      unitPrice: item.unitPrice || "",
      mrp: item.mrp || "",
      gstPercentage: item.gstPercentage || "12",
      isAvailable: item.isAvailable ?? true
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (item: MedicalStoreInventory) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const filteredInventory = inventory.filter(item =>
    item.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.genericName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.brandName?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const lowStockItems = inventory.filter(item => item.quantity < 10);
  const expiringSoonItems = inventory.filter(item => {
    if (!item.expiryDate) return false;
    const expiry = new Date(item.expiryDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiry <= threeMonthsFromNow;
  });

  const dosageForms = ["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Ointment", "Drops", "Powder", "Suspension", "Gel", "Inhaler", "Patch"];

  if (!storeId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Store information not available
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {(lowStockItems.length > 0 || expiringSoonItems.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lowStockItems.length > 0 && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                  <AlertTriangle className="h-4 w-4" />
                  Low Stock Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{lowStockItems.length} item(s) have stock below 10 units</p>
              </CardContent>
            </Card>
          )}
          {expiringSoonItems.length > 0 && (
            <Card className="border-red-500/50 bg-red-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  Expiry Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{expiringSoonItems.length} item(s) expiring within 3 months</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Medicine Inventory
              </CardTitle>
              <CardDescription>Manage your store's medicine stock</CardDescription>
            </div>
            <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} data-testid="button-add-medicine">
              <Plus className="h-4 w-4 mr-2" />
              Add Medicine
            </Button>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-inventory"
              />
            </div>
            <Badge variant="secondary">{inventory.length} items</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No medicines found matching your search" : "No medicines in inventory. Add your first medicine to get started."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine Name</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Strength</TableHead>
                    <TableHead>Form</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">MRP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => {
                    const isLowStock = item.quantity < 10;
                    const isExpiringSoon = item.expiryDate && new Date(item.expiryDate) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                    return (
                      <TableRow key={item.id} data-testid={`inventory-row-${item.id}`}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{item.medicineName}</span>
                            {item.genericName && (
                              <p className="text-xs text-muted-foreground">{item.genericName}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.brandName || "-"}</TableCell>
                        <TableCell>{item.strength || "-"}</TableCell>
                        <TableCell>{item.dosageForm || "-"}</TableCell>
                        <TableCell className="font-mono text-sm">{item.batchNumber || "-"}</TableCell>
                        <TableCell>
                          {item.expiryDate ? (
                            <span className={isExpiringSoon ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                              {item.expiryDate}
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={isLowStock ? "text-yellow-600 dark:text-yellow-400 font-medium" : ""}>
                            {item.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.mrp ? `Rs. ${item.mrp}` : "-"}
                        </TableCell>
                        <TableCell>
                          {item.isAvailable ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Available</Badge>
                          ) : (
                            <Badge variant="secondary">Unavailable</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(item)}
                              data-testid={`button-edit-${item.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(item)}
                              data-testid={`button-delete-${item.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Medicine to Inventory</DialogTitle>
            <DialogDescription>Enter the medicine details to add to your store inventory</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="medicineName">Medicine Name *</Label>
              <Input
                id="medicineName"
                value={formData.medicineName}
                onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                placeholder="e.g., Paracetamol"
                data-testid="input-medicine-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genericName">Generic Name</Label>
              <Input
                id="genericName"
                value={formData.genericName}
                onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                placeholder="e.g., Acetaminophen"
                data-testid="input-generic-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name</Label>
              <Input
                id="brandName"
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                placeholder="e.g., Crocin"
                data-testid="input-brand-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strength">Strength</Label>
              <Input
                id="strength"
                value={formData.strength}
                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                placeholder="e.g., 500mg"
                data-testid="input-strength"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dosageForm">Dosage Form</Label>
              <Select value={formData.dosageForm} onValueChange={(v) => setFormData({ ...formData, dosageForm: v })}>
                <SelectTrigger data-testid="select-dosage-form">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dosageForms.map(form => (
                    <SelectItem key={form} value={form}>{form}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch Number</Label>
              <Input
                id="batchNumber"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                placeholder="e.g., BATCH-2025-001"
                data-testid="input-batch-number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="month"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                data-testid="input-expiry-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <IntegerInput
                id="quantity"
                min={0}
                value={formData.quantity.toString()}
                onValueChange={(value) => setFormData({ ...formData, quantity: parseInt(value) || 0 })}
                data-testid="input-quantity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price (Rs.) *</Label>
              <NumericInput
                id="unitPrice"
                value={formData.unitPrice}
                onValueChange={(value) => setFormData({ ...formData, unitPrice: value })}
                placeholder="0.00"
                allowDecimal={true}
                data-testid="input-unit-price"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mrp">MRP (Rs.)</Label>
              <NumericInput
                id="mrp"
                value={formData.mrp}
                onValueChange={(value) => setFormData({ ...formData, mrp: value })}
                placeholder="0.00"
                allowDecimal={true}
                data-testid="input-mrp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstPercentage">GST %</Label>
              <Select value={formData.gstPercentage} onValueChange={(v) => setFormData({ ...formData, gstPercentage: v })}>
                <SelectTrigger data-testid="select-gst">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="12">12%</SelectItem>
                  <SelectItem value="18">18%</SelectItem>
                  <SelectItem value="28">28%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isAvailable"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="h-4 w-4"
                data-testid="checkbox-available"
              />
              <Label htmlFor="isAvailable">Available for sale</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => addMutation.mutate(formData)}
              disabled={!formData.medicineName || !formData.unitPrice || addMutation.isPending}
              data-testid="button-save-medicine"
            >
              {addMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Medicine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Medicine</DialogTitle>
            <DialogDescription>Update the medicine details</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-medicineName">Medicine Name *</Label>
              <Input
                id="edit-medicineName"
                value={formData.medicineName}
                onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                data-testid="input-edit-medicine-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-genericName">Generic Name</Label>
              <Input
                id="edit-genericName"
                value={formData.genericName}
                onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                data-testid="input-edit-generic-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-brandName">Brand Name</Label>
              <Input
                id="edit-brandName"
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                data-testid="input-edit-brand-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-strength">Strength</Label>
              <Input
                id="edit-strength"
                value={formData.strength}
                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                data-testid="input-edit-strength"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dosageForm">Dosage Form</Label>
              <Select value={formData.dosageForm} onValueChange={(v) => setFormData({ ...formData, dosageForm: v })}>
                <SelectTrigger data-testid="select-edit-dosage-form">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dosageForms.map(form => (
                    <SelectItem key={form} value={form}>{form}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-batchNumber">Batch Number</Label>
              <Input
                id="edit-batchNumber"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                data-testid="input-edit-batch-number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-expiryDate">Expiry Date</Label>
              <Input
                id="edit-expiryDate"
                type="month"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                data-testid="input-edit-expiry-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Quantity *</Label>
              <IntegerInput
                id="edit-quantity"
                min={0}
                value={formData.quantity.toString()}
                onValueChange={(value) => setFormData({ ...formData, quantity: parseInt(value) || 0 })}
                data-testid="input-edit-quantity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-unitPrice">Unit Price (Rs.) *</Label>
              <Input
                id="edit-unitPrice"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                data-testid="input-edit-unit-price"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-mrp">MRP (Rs.)</Label>
              <Input
                id="edit-mrp"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                data-testid="input-edit-mrp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-gstPercentage">GST %</Label>
              <Select value={formData.gstPercentage} onValueChange={(v) => setFormData({ ...formData, gstPercentage: v })}>
                <SelectTrigger data-testid="select-edit-gst">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="12">12%</SelectItem>
                  <SelectItem value="18">18%</SelectItem>
                  <SelectItem value="28">28%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="edit-isAvailable"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="h-4 w-4"
                data-testid="checkbox-edit-available"
              />
              <Label htmlFor="edit-isAvailable">Available for sale</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => selectedItem && updateMutation.mutate({ id: selectedItem.id, data: formData })}
              disabled={!formData.medicineName || !formData.unitPrice || updateMutation.isPending}
              data-testid="button-update-medicine"
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Update Medicine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Medicine</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this medicine from inventory? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="py-4">
              <p className="font-medium">{selectedItem.medicineName}</p>
              {selectedItem.brandName && <p className="text-sm text-muted-foreground">Brand: {selectedItem.brandName}</p>}
              <p className="text-sm text-muted-foreground">Quantity: {selectedItem.quantity}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => selectedItem && deleteMutation.mutate(selectedItem.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MedicalStorePortal({ currentUserId }: MedicalStorePortalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("notifications");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Prescription[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isDispensingOpen, setIsDispensingOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewPrescription, setViewPrescription] = useState<Prescription | null>(null);
  const [storeInfo, setStoreInfo] = useState<{ store: MedicalStore; storeUser: any } | null>(null);
  const [incomingPrescriptions, setIncomingPrescriptions] = useState<PrescriptionNotification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());

  // Fetch stored notifications from backend on mount (last 3 hours only)
  useEffect(() => {
    const fetchStoredNotifications = async () => {
      try {
        const response = await fetch(`/api/user-notifications/${currentUserId}`);
        if (!response.ok) return;
        
        const notifications = await response.json();
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
        
        // Filter prescription notifications from last 3 hours and parse metadata
        const readIds = new Set<string>();
        const prescriptionNotifications = notifications
          .filter((notif: any) => {
            if (notif.type !== 'prescription') return false;
            const createdAt = new Date(notif.createdAt);
            return createdAt >= threeHoursAgo;
          })
          .map((notif: any) => {
            try {
              const metadata = JSON.parse(notif.metadata || '{}');
              if (metadata.notificationType !== 'new_prescription_for_dispensing') return null;
              
              const prescriptionId = metadata.prescriptionId || notif.relatedEntityId;
              
              // Track if notification is already read
              if (notif.isRead) {
                readIds.add(prescriptionId);
              }
              
              return {
                id: prescriptionId,
                prescriptionNumber: metadata.prescriptionNumber,
                patientName: metadata.patientName || 'Unknown',
                patientAge: metadata.patientAge,
                patientGender: metadata.patientGender,
                doctorName: metadata.doctorName || 'Unknown',
                diagnosis: metadata.diagnosis || '',
                medicines: metadata.medicines || [],
                medicineDetails: metadata.medicineDetails,
                instructions: metadata.instructions,
                prescriptionDate: metadata.prescriptionDate || notif.createdAt,
                signedByName: metadata.signedByName,
                receivedAt: new Date(notif.createdAt)
              } as PrescriptionNotification;
            } catch {
              return null;
            }
          })
          .filter((n: PrescriptionNotification | null): n is PrescriptionNotification => n !== null);

        setIncomingPrescriptions(prescriptionNotifications);
        setReadNotificationIds(readIds);
      } catch (error) {
        console.error("Failed to fetch stored notifications:", error);
      }
    };

    fetchStoredNotifications();
  }, [currentUserId]);

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

  // WebSocket connection for real-time prescription notifications
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/notifications?userId=${currentUserId}&userRole=MEDICAL_STORE`;
    
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("Medical Store WebSocket connected");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("Medical Store WebSocket message received:", data);
            
            // Handle incoming prescription notifications
            if (data.type === "medical_store_notification" && data.event === "new_prescription") {
              console.log("New prescription notification received:", data.prescription);
              const prescription = data.prescription;
              const newNotification: PrescriptionNotification = {
                id: prescription.id,
                prescriptionNumber: prescription.prescriptionNumber,
                patientName: prescription.patientName,
                patientAge: prescription.patientAge,
                patientGender: prescription.patientGender,
                doctorName: prescription.doctorName,
                diagnosis: prescription.diagnosis,
                medicines: prescription.medicines || [],
                medicineDetails: prescription.medicineDetails,
                instructions: prescription.instructions,
                prescriptionDate: prescription.prescriptionDate,
                signedByName: prescription.signedByName,
                receivedAt: new Date()
              };

              // Add only if not already exists (avoid duplicates)
              setIncomingPrescriptions(prev => {
                const exists = prev.some(p => p.id === newNotification.id);
                if (exists) return prev;
                return [newNotification, ...prev];
              });
              setActiveTab("notifications");

              // Show toast notification
              toast({
                title: "New Prescription Received",
                description: `Dr. ${prescription.doctorName} has finalized a prescription for ${prescription.patientName}`,
              });

              // Play notification sound if available
              try {
                const audio = new Audio('/notification.mp3');
                audio.volume = 0.5;
                audio.play().catch(() => {});
              } catch {}
            }

            // Handle stored notification updates
            if (data.type === "notification" && data.notification?.type === "prescription") {
              // Refresh any prescription-related queries
              queryClient.invalidateQueries({ queryKey: ["/api/medical-stores"] });
            }
          } catch (err) {
            console.error("WebSocket message parse error:", err);
          }
        };

        ws.onclose = () => {
          console.log("Medical Store WebSocket disconnected");
          // Attempt to reconnect after 5 seconds
          reconnectTimeout = setTimeout(connect, 5000);
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        };
      } catch (error) {
        console.error("Failed to connect WebSocket:", error);
      }
    };

    connect();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [currentUserId, toast]);

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

  const { data: doctors = [] } = useQuery<any[]>({
    queryKey: ["/api/doctors"],
  });

  const { data: hospitalServices = [] } = useQuery<any[]>({
    queryKey: ["/api/hospital-services"],
  });

  const { data: hospitalDepartments = [] } = useQuery<any[]>({
    queryKey: ["/api/hospital-service-departments"],
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
          apiRequest("POST", "/api/medical-stores/access-logs", {
            storeId: storeInfo.store.id,
            storeName: storeInfo.store.storeName,
            userId: currentUserId,
            userName: storeInfo.storeUser?.staffRole || "Staff",
            actionType: "PRESCRIPTION_SEARCH",
            action: "PRESCRIPTION_SEARCH",
            details: `Searched for: ${searchQuery}`,
          }).catch(() => {});
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

  const handleViewPrescription = (prescription: Prescription) => {
    setViewPrescription(prescription);
    setIsViewOpen(true);
  };

  const handleDownloadPrescription = (prescription: Prescription) => {
    const content = generatePrescriptionContent(prescription);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Prescription_${prescription.prescriptionNumber || prescription.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded",
      description: "Prescription downloaded successfully",
    });
  };

  const handlePrintPrescription = (prescription: Prescription) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const medicinesTable = prescription.medicines?.length ? `
        <table>
          <thead>
            <tr>
              <th style="width:40px;">S.No</th>
              <th>Medicine Name</th>
              <th style="width:100px;">Dosage</th>
              <th style="width:100px;">Frequency</th>
              <th style="width:80px;">Duration</th>
            </tr>
          </thead>
          <tbody>
            ${prescription.medicines.map((med: any, idx: number) => {
              const medStr = typeof med === 'string' ? med : '';
              return `<tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td>${medStr || '-'}</td>
                <td style="text-align:center;">-</td>
                <td style="text-align:center;">-</td>
                <td style="text-align:center;">-</td>
              </tr>`;
            }).join('')}
          </tbody>
          <tfoot>
            <tr style="background:#f0f0f0;font-weight:bold;">
              <td colspan="5" style="text-align:right;">Total Medicines: ${prescription.medicines.length}</td>
            </tr>
          </tfoot>
        </table>
      ` : '<p style="color:#666;">No medicines prescribed</p>';

      printWindow.document.write(`
        <html>
          <head>
            <title>Prescription - ${prescription.prescriptionNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; font-size: 12px; }
              .hospital-header { text-align: center; border-bottom: 2px solid #6B3FA0; padding-bottom: 15px; margin-bottom: 20px; }
              .hospital-header h1 { margin: 0 0 5px; color: #6B3FA0; font-size: 20px; }
              .hospital-header p { margin: 2px 0; color: #666; font-size: 11px; }
              h3 { background: #e5e5e5; padding: 6px 10px; margin: 15px 0 10px; border-left: 3px solid #6B3FA0; font-size: 13px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
              th, td { border: 1px solid #333; padding: 6px 8px; }
              th { background: #f0f0f0; font-weight: bold; }
              .label-cell { font-weight: bold; background: #f9f9f9; width: 25%; }
              .value-cell { width: 25%; }
              .signature-section { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 15px; }
              @media print { body { padding: 10px; } }
            </style>
          </head>
          <body>
            <div class="hospital-header">
              <h1>Gravity Hospital & Research Centre</h1>
              <p>Gat No. 167, Sahyog Nagar, Triveni Nagar, Pimpri-Chinchwad, Maharashtra 411062</p>
              <p>Phone: +91-20-27654321 | Email: info@gravityhospital.com</p>
            </div>
            
            <h2 style="text-align:center;margin-bottom:15px;">PRESCRIPTION</h2>
            
            <h3>Patient Information</h3>
            <table>
              <tr>
                <td class="label-cell">Patient Name:</td>
                <td class="value-cell">${prescription.patientName || '-'}</td>
                <td class="label-cell">Prescription #:</td>
                <td class="value-cell">${prescription.prescriptionNumber || '-'}</td>
              </tr>
              <tr>
                <td class="label-cell">Age / Gender:</td>
                <td class="value-cell">${prescription.patientAge || '-'} / ${prescription.patientGender || '-'}</td>
                <td class="label-cell">Date:</td>
                <td class="value-cell">${prescription.prescriptionDate || '-'}</td>
              </tr>
            </table>
            
            <h3>Doctor Information</h3>
            <table>
              <tr>
                <td class="label-cell">Doctor Name:</td>
                <td class="value-cell">Dr. ${prescription.doctorName || '-'}</td>
                <td class="label-cell">Registration No:</td>
                <td class="value-cell">${prescription.doctorRegistrationNo || '-'}</td>
              </tr>
            </table>
            
            ${prescription.chiefComplaints ? `<h3>Chief Complaints</h3><table><tr><td>${prescription.chiefComplaints}</td></tr></table>` : ''}
            
            <h3>Diagnosis</h3>
            <table>
              <tr>
                <td class="label-cell" style="width:20%;">Diagnosis:</td>
                <td>${prescription.diagnosis || '-'}</td>
              </tr>
              ${prescription.provisionalDiagnosis ? `<tr><td class="label-cell">Provisional:</td><td>${prescription.provisionalDiagnosis}</td></tr>` : ''}
            </table>
            
            ${prescription.vitals ? `<h3>Vitals</h3><table><tr><td>${prescription.vitals}</td></tr></table>` : ''}
            
            <h3>Medicines</h3>
            ${medicinesTable}
            
            ${prescription.instructions ? `<h3>Instructions</h3><table><tr><td>${prescription.instructions}</td></tr></table>` : ''}
            ${prescription.dietAdvice ? `<h3>Diet Advice</h3><table><tr><td>${prescription.dietAdvice}</td></tr></table>` : ''}
            ${prescription.activityAdvice ? `<h3>Activity Advice</h3><table><tr><td>${prescription.activityAdvice}</td></tr></table>` : ''}
            ${prescription.investigations ? `<h3>Investigations</h3><table><tr><td>${prescription.investigations}</td></tr></table>` : ''}
            ${prescription.followUpDate ? `<h3>Follow Up</h3><table><tr><td class="label-cell" style="width:15%;">Follow Up Date:</td><td>${prescription.followUpDate}</td></tr></table>` : ''}
            
            <div class="signature-section">
              <table>
                <tr>
                  <td class="label-cell">Doctor Signature:</td>
                  <td class="value-cell">Dr. ${prescription.doctorName || ''}</td>
                  <td class="label-cell">Date:</td>
                  <td class="value-cell">${prescription.prescriptionDate || ''}</td>
                </tr>
                ${prescription.signedByName ? `<tr><td class="label-cell">Signed by:</td><td colspan="3">${prescription.signedByName}</td></tr>` : ''}
              </table>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generatePrescriptionContent = (prescription: Prescription): string => {
    let content = `
GRAVITY HOSPITAL - PRESCRIPTION
================================

Prescription #: ${prescription.prescriptionNumber || '-'}
Date: ${prescription.prescriptionDate}

PATIENT INFORMATION
-------------------
Name: ${prescription.patientName}
Age: ${prescription.patientAge || '-'}
Gender: ${prescription.patientGender || '-'}

DOCTOR INFORMATION
------------------
Name: Dr. ${prescription.doctorName}
Registration No: ${prescription.doctorRegistrationNo || '-'}

`;

    if (prescription.chiefComplaints) {
      content += `CHIEF COMPLAINTS
----------------
${prescription.chiefComplaints}

`;
    }

    content += `DIAGNOSIS
---------
${prescription.diagnosis}
${prescription.provisionalDiagnosis ? `Provisional: ${prescription.provisionalDiagnosis}` : ''}

`;

    if (prescription.vitals) {
      content += `VITALS
------
${prescription.vitals}

`;
    }

    content += `MEDICINES
---------
${prescription.medicines?.map((med, i) => `${i + 1}. ${med}`).join('\n') || 'No medicines prescribed'}

`;

    if (prescription.instructions) {
      content += `INSTRUCTIONS
------------
${prescription.instructions}

`;
    }

    if (prescription.dietAdvice) {
      content += `DIET ADVICE
-----------
${prescription.dietAdvice}

`;
    }

    if (prescription.activityAdvice) {
      content += `ACTIVITY ADVICE
---------------
${prescription.activityAdvice}

`;
    }

    if (prescription.investigations) {
      content += `INVESTIGATIONS
--------------
${prescription.investigations}

`;
    }

    if (prescription.followUpDate) {
      content += `FOLLOW UP
---------
${prescription.followUpDate}

`;
    }

    content += `
================================
Dr. ${prescription.doctorName}
${prescription.signedByName ? `Signed by: ${prescription.signedByName}` : ''}
`;

    return content;
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
      action: "PRESCRIPTION_DISPENSED",
      prescriptionId: selectedPrescription.id,
      prescriptionNumber: selectedPrescription.prescriptionNumber,
      patientId: selectedPrescription.patientId,
      patientName: selectedPrescription.patientName,
    }).catch(() => {});
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

  const dismissNotification = (id: string) => {
    setIncomingPrescriptions(prev => prev.filter(n => n.id !== id));
  };

  const markNotificationAsRead = async (prescriptionId: string) => {
    // Mark as read locally
    setReadNotificationIds(prev => new Set(prev).add(prescriptionId));
    
    // Mark as read on backend - find notification by prescription id in metadata
    try {
      await apiRequest("PATCH", `/api/user-notifications/${currentUserId}/read-all`);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleViewIncomingPrescription = async (notification: PrescriptionNotification) => {
    // Mark as read when clicked
    markNotificationAsRead(notification.id);
    
    try {
      const response = await fetch(`/api/prescriptions/${notification.id}`);
      if (response.ok) {
        const prescription = await response.json();
        setViewPrescription(prescription);
        setIsViewOpen(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load prescription details",
        variant: "destructive",
      });
    }
  };

  const handleDispenseIncomingPrescription = async (notification: PrescriptionNotification) => {
    // Mark as read when clicked
    markNotificationAsRead(notification.id);
    
    try {
      const response = await fetch(`/api/prescriptions/${notification.id}`);
      if (response.ok) {
        const prescription = await response.json();
        setSelectedPrescription(prescription);
        setIsDispensingOpen(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load prescription details",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap relative z-20">
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
          <TabsTrigger value="notifications" data-testid="tab-notifications" className="relative">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            {incomingPrescriptions.filter(n => !readNotificationIds.has(n.id)).length > 0 && (
              <span className="ml-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {incomingPrescriptions.filter(n => !readNotificationIds.has(n.id)).length}
              </span>
            )}
          </TabsTrigger>
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
          <TabsTrigger value="hospital" data-testid="tab-hospital">
            <Building2 className="h-4 w-4 mr-2" />
            Hospital Details
          </TabsTrigger>
          <TabsTrigger value="opd" data-testid="tab-opd">
            <Users className="h-4 w-4 mr-2" />
            OPD Details
          </TabsTrigger>
          <TabsTrigger value="services" data-testid="tab-services">
            <HeartPulse className="h-4 w-4 mr-2" />
            Surgery & Services
          </TabsTrigger>
          <TabsTrigger value="inventory" data-testid="tab-inventory">
            <Package className="h-4 w-4 mr-2" />
            Medicine Inventory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Real-time Prescription Notifications
              </CardTitle>
              <CardDescription>
                New prescriptions from doctors appear here instantly when finalized
              </CardDescription>
            </CardHeader>
            <CardContent>
              {incomingPrescriptions.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No New Prescriptions</h3>
                  <p className="text-muted-foreground">
                    When doctors finalize prescriptions, they will appear here in real-time
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {incomingPrescriptions.map((notification) => (
                    <Card key={notification.id} className="border-l-4 border-l-primary" data-testid={`notification-card-${notification.id}`}>
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-lg">{notification.patientName}</span>
                                {notification.patientAge && notification.patientGender && (
                                  <Badge variant="outline">
                                    {notification.patientAge}y / {notification.patientGender}
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="font-mono">
                                  {notification.prescriptionNumber}
                                </Badge>
                                {notification.signedByName && (
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Signed by {notification.signedByName}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <UserCircle className="h-4 w-4" />
                                <span>Dr. {notification.doctorName}</span>
                                <span>-</span>
                                <Calendar className="h-4 w-4" />
                                <span>{notification.prescriptionDate}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewIncomingPrescription(notification)}
                                data-testid={`button-view-notification-${notification.id}`}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDispenseIncomingPrescription(notification)}
                                data-testid={`button-dispense-notification-${notification.id}`}
                              >
                                <Pill className="h-4 w-4 mr-1" />
                                Dispense
                              </Button>
                            </div>
                          </div>

                          <Separator />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                Diagnosis
                              </h4>
                              <p className="text-sm bg-muted p-2 rounded">{notification.diagnosis || "Not specified"}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-primary" />
                                Instructions
                              </h4>
                              <p className="text-sm bg-muted p-2 rounded">{notification.instructions || "No special instructions"}</p>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <Pill className="h-4 w-4 text-primary" />
                              Medicines ({notification.medicines.length})
                            </h4>
                            <div className="bg-muted rounded p-3">
                              {notification.medicines.length > 0 ? (
                                <div className="grid gap-2">
                                  {notification.medicines.map((medicine, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-background rounded">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs bg-primary/10 px-2 py-1 rounded">{index + 1}</span>
                                        <span className="font-medium">{medicine}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : notification.medicineDetails ? (
                                <p className="text-sm whitespace-pre-wrap">{notification.medicineDetails}</p>
                              ) : (
                                <p className="text-sm text-muted-foreground">No medicines listed</p>
                              )}
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Received: {notification.receivedAt.toLocaleString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                              <div className="flex items-center gap-1">
                                <Badge variant="outline">{prescription.prescriptionStatus}</Badge>
                              </div>
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
                            <div className="flex items-center gap-2">
                              <Button 
                                size="icon"
                                variant="outline"
                                onClick={() => handleViewPrescription(prescription)}
                                data-testid={`button-view-${prescription.id}`}
                                title="View Prescription"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="icon"
                                variant="outline"
                                onClick={() => handleDownloadPrescription(prescription)}
                                data-testid={`button-download-${prescription.id}`}
                                title="Download Prescription"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="icon"
                                variant="outline"
                                onClick={() => handlePrintPrescription(prescription)}
                                data-testid={`button-print-${prescription.id}`}
                                title="Print Prescription"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
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

        <TabsContent value="hospital" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Gravity Hospital - Details
              </CardTitle>
              <CardDescription>Hospital information and contact details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-muted-foreground">
                        Plot No. 123, Gravity Healthcare Complex<br />
                        Karve Nagar, Near City Mall<br />
                        Pune, Maharashtra - 411052
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="font-medium">Contact Numbers</p>
                      <p className="text-muted-foreground">
                        Reception: +91 20 2545 6789<br />
                        Emergency: +91 20 2545 9999<br />
                        Ambulance: 108 / +91 98765 43210
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-muted-foreground">
                        info@gravityhospital.in<br />
                        appointments@gravityhospital.in
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="font-medium">Website</p>
                      <p className="text-muted-foreground">www.gravityhospital.in</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="font-medium">Working Hours</p>
                      <p className="text-muted-foreground">
                        OPD: 8:00 AM - 8:00 PM (Mon-Sat)<br />
                        Emergency: 24 Hours / 7 Days<br />
                        Pharmacy: 8:00 AM - 10:00 PM
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Activity className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="font-medium">Facilities</p>
                      <p className="text-muted-foreground">
                        100+ Beds | 24x7 ICU | Operation Theaters<br />
                        Pathology Lab | Radiology | Pharmacy<br />
                        Ambulance Service | Cafeteria | Parking
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Stethoscope className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="font-medium">Accreditations</p>
                      <p className="text-muted-foreground">
                        NABH Accredited<br />
                        ISO 9001:2015 Certified<br />
                        NABL Certified Lab
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opd" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                OPD Doctors & Consultation
              </CardTitle>
              <CardDescription>Available doctors and their specializations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {doctors.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No doctors available
                  </div>
                ) : (
                  doctors.map((doctor: any) => (
                    <Card key={doctor.id} className="border" data-testid={`doctor-card-${doctor.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-bold">{doctor.avatarInitials || doctor.name?.substring(0, 2).toUpperCase()}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{doctor.name}</p>
                            <Badge variant="secondary" className="mt-1">{doctor.specialty}</Badge>
                            <p className="text-sm text-muted-foreground mt-2">{doctor.qualification}</p>
                            <p className="text-sm text-muted-foreground">{doctor.experience} years experience</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">
                                <Clock className="h-3 w-3 mr-1" />
                                {doctor.availableDays || "Mon-Sat"}
                              </Badge>
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                Rs. {doctor.consultationFee || "500"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
              <Separator className="my-6" />
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">OPD Timings</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Morning</p>
                    <p className="text-muted-foreground">8:00 AM - 12:00 PM</p>
                  </div>
                  <div>
                    <p className="font-medium">Afternoon</p>
                    <p className="text-muted-foreground">12:00 PM - 4:00 PM</p>
                  </div>
                  <div>
                    <p className="font-medium">Evening</p>
                    <p className="text-muted-foreground">4:00 PM - 8:00 PM</p>
                  </div>
                  <div>
                    <p className="font-medium">Emergency</p>
                    <p className="text-muted-foreground">24 Hours</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-primary" />
                Surgery & Hospital Services
              </CardTitle>
              <CardDescription>Complete list of medical services and procedures</CardDescription>
            </CardHeader>
            <CardContent>
              {hospitalDepartments.length === 0 && hospitalServices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No services available
                </div>
              ) : (
                <div className="space-y-6">
                  {hospitalDepartments.map((dept: any) => {
                    const deptServices = hospitalServices.filter((s: any) => s.departmentId === dept.id);
                    if (deptServices.length === 0) return null;
                    return (
                      <div key={dept.id} className="border rounded-lg p-4" data-testid={`dept-card-${dept.id}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <Scissors className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-lg">{dept.name}</h3>
                          <Badge variant="secondary">{deptServices.length} services</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {deptServices.slice(0, 9).map((service: any) => (
                            <div key={service.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm" data-testid={`service-item-${service.id}`}>
                              <span>{service.name}</span>
                              {service.price && (
                                <Badge variant="outline" className="ml-2">Rs. {service.price}</Badge>
                              )}
                            </div>
                          ))}
                          {deptServices.length > 9 && (
                            <div className="p-2 text-center text-muted-foreground text-sm">
                              +{deptServices.length - 9} more services
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {hospitalServices.filter((s: any) => !s.departmentId).length > 0 && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">General Services</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {hospitalServices.filter((s: any) => !s.departmentId).slice(0, 12).map((service: any) => (
                          <div key={service.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                            <span>{service.name}</span>
                            {service.price && (
                              <Badge variant="outline" className="ml-2">Rs. {service.price}</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <MedicineInventoryTab storeId={storeInfo?.store?.id || ""} />
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

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Prescription Details
            </DialogTitle>
            <DialogDescription>
              Full prescription information from the doctor
            </DialogDescription>
          </DialogHeader>
          {viewPrescription && (
            <div className="space-y-6">
              <div className="bg-primary/5 p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">Gravity Hospital</h3>
                  <Badge variant="outline">{viewPrescription.prescriptionStatus}</Badge>
                </div>
                <p className="text-sm text-muted-foreground font-mono">
                  Prescription #: {viewPrescription.prescriptionNumber}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Patient Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{viewPrescription.patientName}</span></div>
                    <div><span className="text-muted-foreground">Age:</span> {viewPrescription.patientAge || '-'}</div>
                    <div><span className="text-muted-foreground">Gender:</span> {viewPrescription.patientGender || '-'}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Doctor Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">Dr. {viewPrescription.doctorName}</span></div>
                    <div><span className="text-muted-foreground">Reg. No:</span> {viewPrescription.doctorRegistrationNo || '-'}</div>
                    <div><span className="text-muted-foreground">Date:</span> {viewPrescription.prescriptionDate}</div>
                  </CardContent>
                </Card>
              </div>

              {viewPrescription.chiefComplaints && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Chief Complaints
                  </h4>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{viewPrescription.chiefComplaints}</p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Diagnosis
                </h4>
                <p className="text-sm bg-muted/50 p-3 rounded-lg">
                  {viewPrescription.diagnosis}
                  {viewPrescription.provisionalDiagnosis && (
                    <span className="block mt-2 text-muted-foreground italic">
                      Provisional: {viewPrescription.provisionalDiagnosis}
                    </span>
                  )}
                </p>
              </div>

              {viewPrescription.vitals && (
                <div className="space-y-2">
                  <h4 className="font-medium">Vitals</h4>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{viewPrescription.vitals}</p>
                </div>
              )}

              {viewPrescription.knownAllergies && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600 dark:text-red-400">Known Allergies</h4>
                  <p className="text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-900">{viewPrescription.knownAllergies}</p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Prescribed Medicines
                </h4>
                <div className="space-y-2">
                  {viewPrescription.medicines?.length > 0 ? (
                    viewPrescription.medicines.map((med, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Badge variant="outline" className="shrink-0">{index + 1}</Badge>
                        <span className="text-sm">{med}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No medicines prescribed</p>
                  )}
                </div>
              </div>

              {viewPrescription.instructions && (
                <div className="space-y-2">
                  <h4 className="font-medium">Instructions</h4>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{viewPrescription.instructions}</p>
                </div>
              )}

              {viewPrescription.dietAdvice && (
                <div className="space-y-2">
                  <h4 className="font-medium">Diet Advice</h4>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{viewPrescription.dietAdvice}</p>
                </div>
              )}

              {viewPrescription.activityAdvice && (
                <div className="space-y-2">
                  <h4 className="font-medium">Activity Advice</h4>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{viewPrescription.activityAdvice}</p>
                </div>
              )}

              {viewPrescription.investigations && (
                <div className="space-y-2">
                  <h4 className="font-medium">Investigations</h4>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{viewPrescription.investigations}</p>
                </div>
              )}

              {viewPrescription.followUpDate && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Follow Up Date
                  </h4>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{viewPrescription.followUpDate}</p>
                </div>
              )}

              {viewPrescription.signedByName && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Digitally signed by: <span className="font-medium">{viewPrescription.signedByName}</span>
                  </p>
                  {viewPrescription.signedAt && (
                    <p className="text-xs text-muted-foreground">
                      on {new Date(viewPrescription.signedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => viewPrescription && handleDownloadPrescription(viewPrescription)}
              data-testid="button-dialog-download"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={() => viewPrescription && handlePrintPrescription(viewPrescription)}
              data-testid="button-dialog-print"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={() => setIsViewOpen(false)} data-testid="button-close-view">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
