import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogTrigger,
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
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Loader2,
  MapPin,
  Clock,
  FileText,
  Receipt,
  Building2,
  Phone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MedicalStore, MedicalStoreUser, MedicalStoreAccessLog } from "@shared/schema";

type StoreType = "IN_HOUSE" | "THIRD_PARTY";
type StoreStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

interface NewStoreForm {
  storeName: string;
  storeCode: string;
  storeType: StoreType;
  address: string;
  phone: string;
  email: string;
  licenseNumber: string;
  gstNumber: string;
  operatingHours: string;
  contactPerson: string;
}

interface NewUserForm {
  username: string;
  password: string;
  name: string;
  email: string;
  staffRole: string;
  employeeId: string;
}

const initialStoreForm: NewStoreForm = {
  storeName: "",
  storeCode: "",
  storeType: "IN_HOUSE",
  address: "",
  phone: "",
  email: "",
  licenseNumber: "",
  gstNumber: "",
  operatingHours: "09:00 AM - 09:00 PM",
  contactPerson: "",
};

const initialUserForm: NewUserForm = {
  username: "",
  password: "",
  name: "",
  email: "",
  staffRole: "PHARMACIST",
  employeeId: "",
};

export default function MedicalStoreManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("stores");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);
  const [isEditStoreOpen, setIsEditStoreOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<MedicalStore | null>(null);
  const [newStore, setNewStore] = useState<NewStoreForm>(initialStoreForm);
  const [newUser, setNewUser] = useState<NewUserForm>(initialUserForm);

  const { data: stores = [], isLoading: storesLoading } = useQuery<MedicalStore[]>({
    queryKey: ["/api/medical-stores"],
  });

  const { data: accessLogs = [], isLoading: logsLoading } = useQuery<MedicalStoreAccessLog[]>({
    queryKey: ["/api/medical-stores/access-logs/all"],
  });

  const createStoreMutation = useMutation({
    mutationFn: async (storeData: NewStoreForm) => {
      const response = await apiRequest("POST", "/api/medical-stores", storeData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-stores"] });
      setNewStore(initialStoreForm);
      setIsAddStoreOpen(false);
      toast({
        title: "Success",
        description: "Medical store created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create medical store",
        variant: "destructive",
      });
    },
  });

  const updateStoreMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MedicalStore> }) => {
      const response = await apiRequest("PATCH", `/api/medical-stores/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-stores"] });
      setIsEditStoreOpen(false);
      setSelectedStore(null);
      toast({
        title: "Success",
        description: "Medical store updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update medical store",
        variant: "destructive",
      });
    },
  });

  const deleteStoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/medical-stores/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-stores"] });
      toast({
        title: "Success",
        description: "Medical store deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete medical store",
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async ({ storeId, userData }: { storeId: string; userData: NewUserForm }) => {
      const response = await apiRequest("POST", `/api/medical-stores/${storeId}/users`, userData);
      return response.json();
    },
    onSuccess: () => {
      setNewUser(initialUserForm);
      setIsAddUserOpen(false);
      toast({
        title: "Success",
        description: "Store user created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create store user",
        variant: "destructive",
      });
    },
  });

  const handleCreateStore = () => {
    if (!newStore.storeName || !newStore.licenseNumber) {
      toast({
        title: "Validation Error",
        description: "Store name and license number are required",
        variant: "destructive",
      });
      return;
    }
    createStoreMutation.mutate(newStore);
  };

  const handleUpdateStore = () => {
    if (!selectedStore) return;
    updateStoreMutation.mutate({ id: selectedStore.id, data: selectedStore });
  };

  const handleDeleteStore = (id: string) => {
    if (window.confirm("Are you sure you want to delete this store?")) {
      deleteStoreMutation.mutate(id);
    }
  };

  const handleCreateUser = () => {
    if (!selectedStore || !newUser.username || !newUser.password) {
      toast({
        title: "Validation Error",
        description: "Username and password are required",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate({ storeId: selectedStore.id, userData: newUser });
  };

  const filteredStores = stores.filter(store =>
    store.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.storeCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: StoreStatus) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "INACTIVE": return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      case "SUSPENDED": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: StoreType) => {
    return type === "IN_HOUSE" 
      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Medical Store Management</h1>
          <p className="text-muted-foreground">Manage hospital pharmacies and third-party medical stores</p>
        </div>
        <Button onClick={() => setIsAddStoreOpen(true)} data-testid="button-add-store">
          <Plus className="h-4 w-4 mr-2" />
          Add Medical Store
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Stores</p>
                <p className="text-2xl font-bold" data-testid="text-total-stores">{stores.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In-House</p>
                <p className="text-2xl font-bold" data-testid="text-inhouse-count">
                  {stores.filter(s => s.storeType === "IN_HOUSE").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Store className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Third Party</p>
                <p className="text-2xl font-bold" data-testid="text-thirdparty-count">
                  {stores.filter(s => s.storeType === "THIRD_PARTY").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Access Logs</p>
                <p className="text-2xl font-bold" data-testid="text-logs-count">{accessLogs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="stores" data-testid="tab-stores">
            <Store className="h-4 w-4 mr-2" />
            Stores
          </TabsTrigger>
          <TabsTrigger value="audit" data-testid="tab-audit">
            <FileText className="h-4 w-4 mr-2" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-stores"
              />
            </div>
          </div>

          {storesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredStores.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Medical Stores</h3>
                <p className="text-muted-foreground mb-4">Get started by adding your first medical store</p>
                <Button onClick={() => setIsAddStoreOpen(true)} data-testid="button-add-first-store">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medical Store
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredStores.map((store) => (
                <Card key={store.id} className="hover-elevate" data-testid={`card-store-${store.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{store.storeName}</CardTitle>
                        <CardDescription>{store.storeCode}</CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelectedStore(store);
                            setIsAddUserOpen(true);
                          }}
                          data-testid={`button-add-user-${store.id}`}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelectedStore(store);
                            setIsEditStoreOpen(true);
                          }}
                          data-testid={`button-edit-${store.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteStore(store.id)}
                          data-testid={`button-delete-${store.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Badge className={getTypeColor(store.storeType as StoreType)}>
                        {store.storeType === "IN_HOUSE" ? "In-House" : "Third Party"}
                      </Badge>
                      <Badge className={getStatusColor(store.status as StoreStatus)}>
                        {store.status}
                      </Badge>
                    </div>
                    {store.address && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{store.address}</span>
                      </div>
                    )}
                    {store.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{store.phone}</span>
                      </div>
                    )}
                    {store.operatingHours && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{store.operatingHours}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        License: {store.licenseNumber || "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        GST: {store.gstNumber || "N/A"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prescription Access Logs</CardTitle>
              <CardDescription>Track all prescription access and dispensing activities</CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : accessLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No access logs recorded yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Prescription</TableHead>
                      <TableHead>Patient</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessLogs.slice(0, 50).map((log) => (
                      <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                        <TableCell className="text-sm">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : "-"}
                        </TableCell>
                        <TableCell>{log.storeName || "-"}</TableCell>
                        <TableCell>{log.userName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.prescriptionNumber || "-"}
                        </TableCell>
                        <TableCell>{log.patientName || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddStoreOpen} onOpenChange={setIsAddStoreOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Medical Store</DialogTitle>
            <DialogDescription>Create a new pharmacy or medical store</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name *</Label>
              <Input
                id="storeName"
                value={newStore.storeName}
                onChange={(e) => setNewStore({ ...newStore, storeName: e.target.value })}
                placeholder="Enter store name"
                data-testid="input-store-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeCode">Store Code</Label>
              <Input
                id="storeCode"
                value={newStore.storeCode}
                onChange={(e) => setNewStore({ ...newStore, storeCode: e.target.value })}
                placeholder="Auto-generated if empty"
                data-testid="input-store-code"
              />
            </div>
            <div className="space-y-2">
              <Label>Store Type *</Label>
              <Select
                value={newStore.storeType}
                onValueChange={(value: StoreType) => setNewStore({ ...newStore, storeType: value })}
              >
                <SelectTrigger data-testid="select-store-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_HOUSE">In-House (Hospital Pharmacy)</SelectItem>
                  <SelectItem value="THIRD_PARTY">Third Party (External)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number *</Label>
              <Input
                id="licenseNumber"
                value={newStore.licenseNumber}
                onChange={(e) => setNewStore({ ...newStore, licenseNumber: e.target.value })}
                placeholder="Drug license number"
                data-testid="input-license"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input
                id="gstNumber"
                value={newStore.gstNumber}
                onChange={(e) => setNewStore({ ...newStore, gstNumber: e.target.value })}
                placeholder="GST registration number"
                data-testid="input-gst"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newStore.phone}
                onChange={(e) => setNewStore({ ...newStore, phone: e.target.value })}
                placeholder="+91 XXXXX XXXXX"
                data-testid="input-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newStore.email}
                onChange={(e) => setNewStore({ ...newStore, email: e.target.value })}
                placeholder="store@example.com"
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="operatingHours">Operating Hours</Label>
              <Input
                id="operatingHours"
                value={newStore.operatingHours}
                onChange={(e) => setNewStore({ ...newStore, operatingHours: e.target.value })}
                placeholder="09:00 AM - 09:00 PM"
                data-testid="input-hours"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newStore.address}
                onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                placeholder="Full store address"
                data-testid="input-address"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                value={newStore.contactPerson}
                onChange={(e) => setNewStore({ ...newStore, contactPerson: e.target.value })}
                placeholder="Store manager name"
                data-testid="input-contact"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddStoreOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateStore} 
              disabled={createStoreMutation.isPending}
              data-testid="button-submit-store"
            >
              {createStoreMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
              ) : (
                <>Create Store</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditStoreOpen} onOpenChange={setIsEditStoreOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Medical Store</DialogTitle>
            <DialogDescription>Update store details</DialogDescription>
          </DialogHeader>
          {selectedStore && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Store Name</Label>
                <Input
                  value={selectedStore.storeName}
                  onChange={(e) => setSelectedStore({ ...selectedStore, storeName: e.target.value })}
                  data-testid="input-edit-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selectedStore.status}
                  onValueChange={(value: StoreStatus) => setSelectedStore({ ...selectedStore, status: value })}
                >
                  <SelectTrigger data-testid="select-edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>License Number</Label>
                <Input
                  value={selectedStore.licenseNumber || ""}
                  onChange={(e) => setSelectedStore({ ...selectedStore, licenseNumber: e.target.value })}
                  data-testid="input-edit-license"
                />
              </div>
              <div className="space-y-2">
                <Label>GST Number</Label>
                <Input
                  value={selectedStore.gstNumber || ""}
                  onChange={(e) => setSelectedStore({ ...selectedStore, gstNumber: e.target.value })}
                  data-testid="input-edit-gst"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={selectedStore.phone || ""}
                  onChange={(e) => setSelectedStore({ ...selectedStore, phone: e.target.value })}
                  data-testid="input-edit-phone"
                />
              </div>
              <div className="space-y-2">
                <Label>Operating Hours</Label>
                <Input
                  value={selectedStore.operatingHours || ""}
                  onChange={(e) => setSelectedStore({ ...selectedStore, operatingHours: e.target.value })}
                  data-testid="input-edit-hours"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Address</Label>
                <Input
                  value={selectedStore.address || ""}
                  onChange={(e) => setSelectedStore({ ...selectedStore, address: e.target.value })}
                  data-testid="input-edit-address"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditStoreOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleUpdateStore} 
              disabled={updateStoreMutation.isPending}
              data-testid="button-update-store"
            >
              {updateStoreMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating...</>
              ) : (
                <>Update Store</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Store User</DialogTitle>
            <DialogDescription>
              {selectedStore && `Create a user account for ${selectedStore.storeName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="Login username"
                data-testid="input-user-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Create password"
                data-testid="input-user-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Staff full name"
                data-testid="input-user-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userEmail">Email</Label>
              <Input
                id="userEmail"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="staff@example.com"
                data-testid="input-user-email"
              />
            </div>
            <div className="space-y-2">
              <Label>Staff Role</Label>
              <Select
                value={newUser.staffRole}
                onValueChange={(value) => setNewUser({ ...newUser, staffRole: value })}
              >
                <SelectTrigger data-testid="select-user-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PHARMACIST">Pharmacist</SelectItem>
                  <SelectItem value="ASSISTANT">Assistant</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                value={newUser.employeeId}
                onChange={(e) => setNewUser({ ...newUser, employeeId: e.target.value })}
                placeholder="Staff employee ID"
                data-testid="input-user-employee-id"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateUser} 
              disabled={createUserMutation.isPending}
              data-testid="button-submit-user"
            >
              {createUserMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
              ) : (
                <>Create User</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
