import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  MapPin, 
  Phone, 
  Clock, 
  Plus,
  Search,
  ArrowUpDown,
  AlertTriangle,
  TrendingDown,
  Warehouse,
  FileText,
  Users,
  ArrowDown,
  ArrowUp,
  Trash2,
  Edit,
  X
} from "lucide-react";
import type { InventoryItem, InventoryTransaction, StaffMember, InventoryPatient } from "@shared/schema";

type TabType = "dashboard" | "items" | "transactions" | "issue" | "reports";

type ReportTimeFilter = "all" | "today" | "week" | "month" | "quarter" | "year";

export default function InventoryService() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [showEditItemDialog, setShowEditItemDialog] = useState(false);
  const [showDeleteItemDialog, setShowDeleteItemDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [addItemMode, setAddItemMode] = useState<"existing" | "new">("existing");
  const [reportTimeFilter, setReportTimeFilter] = useState<ReportTimeFilter>("all");
  const { toast } = useToast();

  const { data: items = [], isLoading: itemsLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory/items"],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<InventoryTransaction[]>({
    queryKey: ["/api/inventory/transactions"],
  });

  const { data: staff = [] } = useQuery<StaffMember[]>({
    queryKey: ["/api/inventory/staff"],
  });

  const { data: patients = [] } = useQuery<InventoryPatient[]>({
    queryKey: ["/api/inventory/patients"],
  });

  const { data: lowStockItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory/items/low-stock"],
  });

  const { data: reports } = useQuery<any>({
    queryKey: ["/api/inventory/reports"],
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: { type: string; itemId: string; quantity: number; staffId?: string; patientId?: string; notes?: string }) => {
      return await apiRequest("POST", "/api/inventory/transactions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Transaction Recorded",
        description: "Inventory transaction has been processed successfully.",
      });
      setActiveTab("transactions");
    },
    onError: (error: Error) => {
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to process transaction. Please try again.",
        variant: "destructive",
      });
    },
  });

  const invalidateInventoryQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/inventory/items"] });
    queryClient.invalidateQueries({ queryKey: ["/api/inventory/items/low-stock"] });
    queryClient.invalidateQueries({ queryKey: ["/api/inventory/reports"] });
    queryClient.invalidateQueries({ queryKey: ["/api/inventory/transactions"] });
  };

  const addStockMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InventoryItem> }) => {
      return await apiRequest("PATCH", `/api/inventory/items/${id}`, data);
    },
    onSuccess: () => {
      invalidateInventoryQueries();
      toast({
        title: "Stock Added",
        description: "Inventory stock has been updated successfully.",
      });
      setShowAddItemDialog(false);
      setAddItemMode("existing");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Stock",
        description: error.message || "Could not update inventory stock.",
        variant: "destructive",
      });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: { name: string; category: string; currentStock: number; lowStockThreshold: number; unit: string; cost: string }) => {
      return await apiRequest("POST", "/api/inventory/items", data);
    },
    onSuccess: () => {
      invalidateInventoryQueries();
      toast({
        title: "Item Created",
        description: "New inventory item has been added successfully.",
      });
      setShowAddItemDialog(false);
      setAddItemMode("existing");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Item",
        description: error.message || "Could not create inventory item.",
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InventoryItem> }) => {
      return await apiRequest("PATCH", `/api/inventory/items/${id}`, data);
    },
    onSuccess: () => {
      invalidateInventoryQueries();
      toast({
        title: "Item Updated",
        description: "Inventory item has been updated successfully.",
      });
      setShowEditItemDialog(false);
      setSelectedItem(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Item",
        description: error.message || "Could not update inventory item.",
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/inventory/items/${id}`);
    },
    onSuccess: () => {
      invalidateInventoryQueries();
      toast({
        title: "Item Deleted",
        description: "Inventory item has been removed successfully.",
      });
      setShowDeleteItemDialog(false);
      setSelectedItem(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Delete Item",
        description: error.message || "Could not delete inventory item.",
        variant: "destructive",
      });
    },
  });

  const categories = Array.from(new Set(items.map(item => item.category)));

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredReportTransactions = transactions.filter(tx => {
    if (reportTimeFilter === "all") return true;
    if (!tx.createdAt) return true;
    
    const txDate = new Date(tx.createdAt);
    const now = new Date();
    
    switch (reportTimeFilter) {
      case "today": {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return txDate >= startOfDay;
      }
      case "week": {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return txDate >= startOfWeek;
      }
      case "month": {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return txDate >= startOfMonth;
      }
      case "quarter": {
        const quarter = Math.floor(now.getMonth() / 3);
        const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
        return txDate >= startOfQuarter;
      }
      case "year": {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return txDate >= startOfYear;
      }
      default:
        return true;
    }
  });

  const getStockBadge = (current: number, min: number) => {
    if (current === 0) {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Out of Stock</Badge>;
    }
    if (current <= min) {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Low Stock</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">In Stock</Badge>;
  };

  const getTransactionBadge = (type: string) => {
    const styles: Record<string, string> = {
      ISSUE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      RETURN: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      DISPOSE: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
      ADD: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    };
    return styles[type] || styles.ADD;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "ISSUE": return <ArrowDown className="h-4 w-4 text-red-500" />;
      case "RETURN": return <ArrowUp className="h-4 w-4 text-green-500" />;
      case "DISPOSE": return <Trash2 className="h-4 w-4 text-gray-500" />;
      case "ADD": return <Plus className="h-4 w-4 text-emerald-500" />;
      default: return <Plus className="h-4 w-4 text-emerald-500" />;
    }
  };

  const getTransactionText = (type: string) => {
    switch (type) {
      case "ISSUE": return "Issued";
      case "RETURN": return "Returned";
      case "DISPOSE": return "Disposed";
      case "ADD": return "Added";
      default: return "Added";
    }
  };

  const handleTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createTransactionMutation.mutate({
      type: formData.get("type") as string,
      itemId: formData.get("itemId") as string,
      quantity: parseInt(formData.get("quantity") as string),
      staffId: formData.get("staffId") as string || undefined,
      patientId: formData.get("patientId") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    });
  };

  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const quantityToAdd = parseInt(formData.get("quantity") as string) || 0;
    
    if (addItemMode === "existing") {
      const itemId = formData.get("itemId") as string;
      const existingItem = items.find(item => item.id === itemId);
      if (!existingItem) {
        toast({
          title: "Error",
          description: "Please select an item from the list.",
          variant: "destructive",
        });
        return;
      }
      
      const newStock = existingItem.currentStock + quantityToAdd;
      addStockMutation.mutate({
        id: itemId,
        data: {
          currentStock: newStock,
        },
      });
    } else {
      const name = formData.get("name") as string;
      const category = formData.get("category") as string;
      const cost = formData.get("cost") as string || "0";
      const lowStockThreshold = parseInt(formData.get("lowStockThreshold") as string) || 10;
      
      if (!name || !category || !cost || cost === "0") {
        toast({
          title: "Error",
          description: "Please fill in all required fields including cost.",
          variant: "destructive",
        });
        return;
      }
      
      createItemMutation.mutate({
        name,
        category,
        currentStock: quantityToAdd,
        lowStockThreshold,
        unit: "units",
        cost,
      });
    }
  };

  const handleEditItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;
    const formData = new FormData(e.currentTarget);
    updateItemMutation.mutate({
      id: selectedItem.id,
      data: {
        name: formData.get("name") as string,
        category: formData.get("category") as string,
        currentStock: parseInt(formData.get("quantity") as string) || 0,
        lowStockThreshold: parseInt(formData.get("lowStockThreshold") as string) || 10,
        unit: formData.get("unit") as string || "units",
        cost: formData.get("cost") as string || "0",
      },
    });
  };

  const handleDeleteItem = () => {
    if (!selectedItem) return;
    deleteItemMutation.mutate(selectedItem.id);
  };

  const openEditDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowEditItemDialog(true);
  };

  const openDeleteDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowDeleteItemDialog(true);
  };

  const tabs = [
    { id: "dashboard" as TabType, label: "Dashboard", icon: Warehouse },
    { id: "items" as TabType, label: "Inventory Items", icon: Package },
    { id: "transactions" as TabType, label: "Transactions", icon: ArrowUpDown },
    { id: "issue" as TabType, label: "Issue/Return", icon: Plus },
    { id: "reports" as TabType, label: "Reports", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Inventory Management System</h1>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>Central Store, Gravity Hospital</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-lg">
                <Phone className="h-4 w-4" />
                <span className="text-sm">Store: +91 20 1234 5682</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-lg">
                <Clock className="h-4 w-4" />
                <span className="text-sm">24/7 Emergency Supply</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <div className="flex flex-wrap gap-2 bg-muted/50 p-1 rounded-lg flex-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2"
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Button>
            ))}
          </div>
          <Button
            onClick={() => setShowAddItemDialog(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
            data-testid="button-add-item"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Items
          </Button>
        </div>

        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Items</p>
                      <p className="text-3xl font-bold">{items.length}</p>
                    </div>
                    <Package className="h-10 w-10 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Low Stock Items</p>
                      <p className="text-3xl font-bold text-yellow-600">{lowStockItems.length}</p>
                    </div>
                    <AlertTriangle className="h-10 w-10 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Out of Stock</p>
                      <p className="text-3xl font-bold text-red-600">{items.filter(i => i.currentStock === 0).length}</p>
                    </div>
                    <TrendingDown className="h-10 w-10 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Transactions</p>
                      <p className="text-3xl font-bold">{transactions.length}</p>
                    </div>
                    <ArrowUpDown className="h-10 w-10 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {lowStockItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Low Stock Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {lowStockItems.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-yellow-600">{item.currentStock} {item.unit}</p>
                          <p className="text-xs text-muted-foreground">Min: {item.lowStockThreshold}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {transactions.slice(0, 5).map((tx) => {
                    const item = items.find(i => i.id === tx.itemId);
                    return (
                      <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(tx.type)}
                          <div>
                            <p className="font-medium">{item?.name || "Unknown Item"}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(tx.createdAt!).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getTransactionBadge(tx.type)}>{tx.type}</Badge>
                          <p className="text-sm font-medium mt-1">Qty: {tx.quantity}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "items" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-inventory"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48" data-testid="select-category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {itemsLoading ? (
              <div className="text-center py-8">Loading inventory...</div>
            ) : (
              <div className="grid gap-4">
                {filteredItems.map((item) => (
                  <Card key={item.id} data-testid={`card-item-${item.id}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <Package className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">{item.category}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Current Stock</p>
                            <p className="font-bold">{item.currentStock} {item.unit}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Min Stock</p>
                            <p className="font-medium">{item.lowStockThreshold}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Cost</p>
                            <p className="font-medium">Rs. {item.cost}</p>
                          </div>
                          {getStockBadge(item.currentStock, item.lowStockThreshold)}
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => openEditDialog(item)}
                              data-testid={`button-edit-item-${item.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => openDeleteDialog(item)}
                              data-testid={`button-delete-item-${item.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="space-y-4">
            {transactionsLoading ? (
              <div className="text-center py-8">Loading transactions...</div>
            ) : (
              <div className="grid gap-4">
                {transactions.map((tx) => {
                  const item = items.find(i => i.id === tx.itemId);
                  const staffMember = staff.find(s => s.id === tx.staffId);
                  const patient = patients.find(p => p.id === tx.patientId);
                  return (
                    <Card key={tx.id} data-testid={`card-transaction-${tx.id}`}>
                      <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex items-center gap-4">
                            {getTransactionIcon(tx.type)}
                            <div>
                              <h3 className="font-semibold">{item?.name || "Unknown Item"}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(tx.createdAt!).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-4">
                            <Badge className={getTransactionBadge(tx.type)}>{tx.type}</Badge>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Quantity</p>
                              <p className="font-bold">{tx.quantity}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Remaining</p>
                              <p className="font-medium">{tx.remainingStock}</p>
                            </div>
                            {staffMember && (
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">Staff</p>
                                <p className="font-medium">{staffMember.name}</p>
                              </div>
                            )}
                            {patient && (
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">Patient</p>
                                <p className="font-medium">{patient.name}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        {tx.notes && (
                          <p className="mt-2 text-sm text-muted-foreground border-t pt-2">{tx.notes}</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "issue" && (
          <Card>
            <CardHeader>
              <CardTitle>Issue / Return / Dispose Items</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTransaction} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Transaction Type</Label>
                    <Select name="type" required>
                      <SelectTrigger data-testid="select-transaction-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ISSUE">Issue</SelectItem>
                        <SelectItem value="RETURN">Return</SelectItem>
                        <SelectItem value="DISPOSE">Dispose</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="itemId">Item</Label>
                    <Select name="itemId" required>
                      <SelectTrigger data-testid="select-item">
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.currentStock} available)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      type="number"
                      name="quantity"
                      min="1"
                      required
                      placeholder="Enter quantity"
                      data-testid="input-quantity"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staffId">Staff Member</Label>
                    <Select name="staffId">
                      <SelectTrigger data-testid="select-staff">
                        <SelectValue placeholder="Select staff (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} ({s.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientId">Patient</Label>
                    <Select name="patientId">
                      <SelectTrigger data-testid="select-patient">
                        <SelectValue placeholder="Select patient (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.patientId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      name="notes"
                      placeholder="Add notes (optional)"
                      data-testid="input-notes"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createTransactionMutation.isPending}
                  data-testid="button-submit-transaction"
                >
                  {createTransactionMutation.isPending ? "Processing..." : "Submit Transaction"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === "reports" && (
          <div className="space-y-6">
            {/* Time Filter - Simplified */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium">Show:</span>
              {[
                { value: "all", label: "All Time" },
                { value: "today", label: "Today" },
                { value: "week", label: "This Week" },
                { value: "month", label: "This Month" },
                { value: "quarter", label: "Quarter" },
                { value: "year", label: "Year" },
              ].map((filter) => (
                <Button
                  key={filter.value}
                  variant={reportTimeFilter === filter.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setReportTimeFilter(filter.value as ReportTimeFilter)}
                  data-testid={`button-filter-${filter.value}`}
                >
                  {filter.label}
                </Button>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Total Inventory Value</p>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">Rs. {reports?.totalValue?.toLocaleString() || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">Total Items</p>
                  <p className="text-xl font-bold">{reports?.totalItems || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">Transactions</p>
                  <p className="text-xl font-bold">{filteredReportTransactions.length}</p>
                </CardContent>
              </Card>
              <Card className={reports?.lowStockItems ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" : ""}>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">Low Stock Alerts</p>
                  <p className="text-xl font-bold text-yellow-700 dark:text-yellow-300">{reports?.lowStockItems || 0}</p>
                </CardContent>
              </Card>
            </div>

            {/* Inventory Items with Cost Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-600" />
                  Item Cost Breakdown
                </CardTitle>
                <p className="text-sm text-muted-foreground">Each item's value = Quantity x Cost per Unit</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[350px] overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No items in inventory</p>
                  ) : (
                    items.map((item) => {
                      const costPerUnit = Number(item.cost) || 0;
                      const totalItemValue = item.currentStock * costPerUnit;
                      return (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.currentStock} {item.unit} x Rs. {costPerUnit.toLocaleString()} each
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-600 dark:text-emerald-400">Rs. {totalItemValue.toLocaleString()}</p>
                            <Badge variant="outline" className="text-xs">{item.category}</Badge>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Simple Activity Log */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Activity
                  <Badge variant="outline" className="ml-2">{filteredReportTransactions.length} records</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {filteredReportTransactions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No activity for selected period</p>
                  ) : (
                    filteredReportTransactions.slice(0, 15).map((tx) => {
                      const item = items.find(i => i.id === tx.itemId);
                      return (
                        <div key={tx.id} className="flex items-center justify-between p-2 border rounded-lg text-sm">
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(tx.type)}
                            <span><strong>{getTransactionText(tx.type)}</strong> {tx.quantity} {item?.unit || "units"} of {item?.name || "Unknown"}</span>
                          </div>
                          <span className="text-muted-foreground">
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Staff Summary - Simpler */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Staff Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {staff.slice(0, 5).map((s) => {
                    const staffTx = filteredReportTransactions.filter(tx => tx.staffId === s.id);
                    return (
                      <div key={s.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.department}</p>
                        </div>
                        <Badge variant={staffTx.length > 0 ? "default" : "outline"}>
                          {staffTx.length} actions
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Add Item Dialog */}
      <Dialog open={showAddItemDialog} onOpenChange={(open) => {
        setShowAddItemDialog(open);
        if (!open) setAddItemMode("existing");
      }}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              {addItemMode === "existing" ? "Add Stock to Item" : "Add New Item"}
            </DialogTitle>
            <DialogDescription>
              {addItemMode === "existing" 
                ? "Select an item from the list and add stock quantity" 
                : "Create a new item and add initial stock"}
            </DialogDescription>
          </DialogHeader>
          
          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <Button
              type="button"
              variant={addItemMode === "existing" ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => setAddItemMode("existing")}
              data-testid="button-mode-existing"
            >
              Select Existing
            </Button>
            <Button
              type="button"
              variant={addItemMode === "new" ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => setAddItemMode("new")}
              data-testid="button-mode-new"
            >
              Add New Item
            </Button>
          </div>

          <form onSubmit={handleAddItem} className="space-y-4">
            {addItemMode === "existing" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Item *</Label>
                  <Select name="itemId" required>
                    <SelectTrigger data-testid="select-add-item-name" className="w-full">
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.currentStock} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-quantity">Quantity to Add *</Label>
                  <Input
                    id="add-quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    placeholder="Enter quantity to add"
                    required
                    data-testid="input-add-item-quantity"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-name">Item Name *</Label>
                  <Input
                    id="new-name"
                    name="name"
                    placeholder="Enter item name"
                    required
                    data-testid="input-new-item-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-category">Category *</Label>
                  <Select name="category" required>
                    <SelectTrigger data-testid="select-new-item-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Medicine">Medicine</SelectItem>
                      <SelectItem value="Medical Supplies">Medical Supplies</SelectItem>
                      <SelectItem value="Equipment">Equipment</SelectItem>
                      <SelectItem value="Disposables">Disposables</SelectItem>
                      <SelectItem value="Syringes">Syringes</SelectItem>
                      <SelectItem value="Gloves">Gloves</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-quantity">Quantity *</Label>
                    <Input
                      id="new-quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      placeholder="e.g., 20"
                      required
                      onChange={(e) => {
                        const qty = parseInt(e.target.value) || 0;
                        const costInput = document.getElementById("new-cost") as HTMLInputElement;
                        const cost = parseFloat(costInput?.value) || 0;
                        const totalDisplay = document.getElementById("calculated-total");
                        if (totalDisplay) totalDisplay.textContent = `Rs. ${(qty * cost).toLocaleString()}`;
                      }}
                      data-testid="input-new-item-quantity"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-cost">Cost per Unit (Rs.) *</Label>
                    <Input
                      id="new-cost"
                      name="cost"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g., 50"
                      required
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || 0;
                        const qtyInput = document.getElementById("new-quantity") as HTMLInputElement;
                        const qty = parseInt(qtyInput?.value) || 0;
                        const totalDisplay = document.getElementById("calculated-total");
                        if (totalDisplay) totalDisplay.textContent = `Rs. ${(qty * cost).toLocaleString()}`;
                      }}
                      data-testid="input-new-item-cost"
                    />
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Total Cost:</span>
                    <span id="calculated-total" className="text-lg font-bold text-emerald-700 dark:text-emerald-300">Rs. 0</span>
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Quantity x Cost per Unit</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-lowStockThreshold">Low Stock Alert (Optional)</Label>
                  <Input
                    id="new-lowStockThreshold"
                    name="lowStockThreshold"
                    type="number"
                    min="0"
                    placeholder="Min stock level for alerts"
                    defaultValue="10"
                    data-testid="input-new-item-threshold"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddItemDialog(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700" 
                disabled={addStockMutation.isPending || createItemMutation.isPending} 
                data-testid="button-submit-add-item"
              >
                {(addStockMutation.isPending || createItemMutation.isPending) 
                  ? "Adding..." 
                  : addItemMode === "existing" ? "Add Stock" : "Create Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={showEditItemDialog} onOpenChange={setShowEditItemDialog}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Edit Item
            </DialogTitle>
            <DialogDescription>
              Update inventory item details
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={handleEditItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Item Name *</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    placeholder="Enter item name"
                    defaultValue={selectedItem.name}
                    required
                    data-testid="input-edit-item-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-quantity">Quantity *</Label>
                  <Input
                    id="edit-quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    placeholder="Enter quantity"
                    defaultValue={selectedItem.currentStock}
                    required
                    data-testid="input-edit-item-quantity"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category *</Label>
                  <Select name="category" defaultValue={selectedItem.category}>
                    <SelectTrigger data-testid="select-edit-item-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disposables">Disposables</SelectItem>
                      <SelectItem value="syringes">Syringes</SelectItem>
                      <SelectItem value="gloves">Gloves</SelectItem>
                      <SelectItem value="medicines">Medicines</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-unit">Unit</Label>
                  <Input
                    id="edit-unit"
                    name="unit"
                    placeholder="e.g., pieces, pairs, ml"
                    defaultValue={selectedItem.unit}
                    data-testid="input-edit-item-unit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cost">Cost (Rs.)</Label>
                  <Input
                    id="edit-cost"
                    name="cost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter cost per unit"
                    defaultValue={selectedItem.cost}
                    data-testid="input-edit-item-cost"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lowStockThreshold">Low Stock Threshold</Label>
                  <Input
                    id="edit-lowStockThreshold"
                    name="lowStockThreshold"
                    type="number"
                    min="0"
                    placeholder="Min stock level"
                    defaultValue={selectedItem.lowStockThreshold}
                    data-testid="input-edit-item-threshold"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditItemDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={updateItemMutation.isPending} data-testid="button-submit-edit-item">
                  {updateItemMutation.isPending ? "Updating..." : "Update Item"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Item Confirmation Dialog */}
      <Dialog open={showDeleteItemDialog} onOpenChange={setShowDeleteItemDialog}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Item
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="font-semibold">{selectedItem.name}</p>
                <p className="text-sm text-muted-foreground">{selectedItem.category} - {selectedItem.currentStock} {selectedItem.unit}</p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDeleteItemDialog(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteItem}
                  disabled={deleteItemMutation.isPending}
                  data-testid="button-confirm-delete-item"
                >
                  {deleteItemMutation.isPending ? "Deleting..." : "Delete Item"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
