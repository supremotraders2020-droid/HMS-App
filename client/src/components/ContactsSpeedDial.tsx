import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Phone,
  MessageCircle,
  Search,
  LayoutGrid,
  List,
  Building2,
  Stethoscope,
  Users,
  FlaskConical,
  Activity,
  Pencil,
  Save,
  X,
  UserCog,
  ShoppingBag,
  PhoneOff,
} from "lucide-react";

type UserRole = "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "PATIENT" | "NURSE" | "OPD_MANAGER" | "MEDICAL_STORE" | "PATHOLOGY_LAB" | "TECHNICIAN";

interface StaffUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  phone?: string | null;
  email?: string | null;
  specialty?: string;
  department?: string;
}

interface ContactsSpeedDialProps {
  currentRole: UserRole;
}

interface SectionDef {
  id: string;
  title: string;
  shortTitle: string;
  icon: typeof Phone;
  roles: UserRole[];
  visibleTo: UserRole[];
}

const SECTIONS: SectionDef[] = [
  {
    id: "admin",
    title: "Administration",
    shortTitle: "Admin",
    icon: Building2,
    roles: ["ADMIN", "SUPER_ADMIN"],
    visibleTo: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER"],
  },
  {
    id: "doctors",
    title: "Doctors",
    shortTitle: "Doctors",
    icon: Stethoscope,
    roles: ["DOCTOR"],
    visibleTo: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER"],
  },
  {
    id: "nurses",
    title: "Nurses",
    shortTitle: "Nurses",
    icon: Activity,
    roles: ["NURSE"],
    visibleTo: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER"],
  },
  {
    id: "opd",
    title: "OPD Management",
    shortTitle: "OPD",
    icon: UserCog,
    roles: ["OPD_MANAGER"],
    visibleTo: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER"],
  },
  {
    id: "lab",
    title: "Pathology Lab",
    shortTitle: "Lab",
    icon: FlaskConical,
    roles: ["PATHOLOGY_LAB"],
    visibleTo: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER"],
  },
  {
    id: "store",
    title: "Medical Store",
    shortTitle: "Store",
    icon: ShoppingBag,
    roles: ["MEDICAL_STORE"],
    visibleTo: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER"],
  },
  {
    id: "technicians",
    title: "Technicians",
    shortTitle: "Techs",
    icon: Users,
    roles: ["TECHNICIAN"],
    visibleTo: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER"],
  },
];

const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrator",
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  OPD_MANAGER: "OPD Manager",
  PATIENT: "Patient",
  MEDICAL_STORE: "Medical Store",
  PATHOLOGY_LAB: "Pathology Lab",
  TECHNICIAN: "Technician",
};

export function ContactsSpeedDial({ currentRole }: ContactsSpeedDialProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [editPhone, setEditPhone] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const isAdmin = currentRole === "ADMIN" || currentRole === "SUPER_ADMIN";

  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const { data: doctors = [] } = useQuery<any[]>({
    queryKey: ["/api/doctors"],
  });

  const staffUsers: StaffUser[] = useMemo(() => {
    return allUsers
      .filter((u: any) => u.role !== "PATIENT")
      .map((u: any) => {
        const doctorProfile = doctors.find((d: any) =>
          d.name === u.name || d.name === u.username
        );
        return {
          id: u.id,
          name: u.name || u.username,
          username: u.username,
          role: u.role as UserRole,
          phone: u.phone || null,
          email: u.email || null,
          specialty: doctorProfile?.specialty || undefined,
          department: doctorProfile?.specialty || undefined,
        };
      });
  }, [allUsers, doctors]);

  const updatePhoneMutation = useMutation({
    mutationFn: async ({ userId, phone }: { userId: string; phone: string }) => {
      return apiRequest("PATCH", `/api/users/${userId}`, { phone });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditDialogOpen(false);
      setEditingUser(null);
    },
  });

  const visibleSections = useMemo(() => {
    return SECTIONS
      .filter((s) => s.visibleTo.includes(currentRole))
      .map((section) => {
        const users = staffUsers.filter((u) => section.roles.includes(u.role));
        const filtered = users.filter((u) => {
          if (!searchQuery) return true;
          const q = searchQuery.toLowerCase();
          return (
            u.name.toLowerCase().includes(q) ||
            ROLE_LABEL[u.role].toLowerCase().includes(q) ||
            (u.specialty?.toLowerCase().includes(q) ?? false) ||
            (u.phone?.includes(q) ?? false)
          );
        });
        return { ...section, users: filtered };
      })
      .filter((s) => s.users.length > 0);
  }, [staffUsers, currentRole, searchQuery]);

  const totalContacts = visibleSections.reduce((sum, s) => sum + s.users.length, 0);

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone.replace(/\s/g, "")}`;
  };

  const handleWhatsApp = (phone: string) => {
    const clean = phone.replace(/\s/g, "").replace("+", "");
    window.open(`https://wa.me/${clean}`, "_blank");
  };

  const openEditDialog = (user: StaffUser) => {
    setEditingUser(user);
    setEditPhone(user.phone || "");
    setEditDialogOpen(true);
  };

  const handleSavePhone = () => {
    if (!editingUser) return;
    updatePhoneMutation.mutate({ userId: editingUser.id, phone: editPhone });
  };

  return (
    <>
      <Card className="border-0 shadow-lg bg-gradient-to-b from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-950">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500 rounded-xl">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Hospital Speed Dial</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {totalContacts} staff members
                    {totalContacts === 0 && " — add staff via User Management"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center border rounded-md overflow-visible bg-white/80 dark:bg-slate-800/80">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, role, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/80 dark:bg-slate-800/80"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {totalContacts === 0 && !searchQuery ? (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No staff members added yet</p>
              <p className="text-sm mt-1">Add staff through User Management to see them here.</p>
            </div>
          ) : (
            <>
              <ScrollArea className="w-full">
                <div className="flex flex-wrap gap-2 mb-2">
                  {visibleSections.map((section) => (
                    <Button
                      key={section.id}
                      variant={expandedSection === section.id ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setExpandedSection((prev) => (prev === section.id ? null : section.id))
                      }
                      className="flex items-center gap-1.5 flex-shrink-0"
                    >
                      <section.icon className="h-4 w-4" />
                      <span className="hidden md:inline">{section.title}</span>
                      <span className="md:hidden">{section.shortTitle}</span>
                      <span className="text-xs opacity-70 ml-0.5">{section.users.length}</span>
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              <AnimatePresence mode="wait">
                {visibleSections.map(
                  (section) =>
                    expandedSection === section.id && (
                      <motion.div
                        key={section.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="mt-3"
                      >
                        <div className="max-h-[300px] overflow-y-auto pr-1">
                          <div
                            className={
                              viewMode === "grid"
                                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"
                                : "space-y-2"
                            }
                          >
                            {section.users.map((user) => (
                              <div
                                key={user.id}
                                className={`p-3 bg-white dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/50
                                  ${viewMode === "list" ? "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" : ""}`}
                              >
                                <div className={viewMode === "list" ? "flex-1 min-w-0" : ""}>
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="font-medium text-sm">{user.name}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {ROLE_LABEL[user.role]}
                                    </Badge>
                                  </div>
                                  {user.specialty && (
                                    <p className="text-xs text-muted-foreground">{user.specialty}</p>
                                  )}
                                  {user.phone ? (
                                    <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mt-1">
                                      {user.phone}
                                    </p>
                                  ) : (
                                    <p className="text-xs text-muted-foreground italic mt-1 flex items-center gap-1">
                                      <PhoneOff className="h-3 w-3" />
                                      No phone added
                                    </p>
                                  )}
                                </div>

                                <div
                                  className={`flex items-center gap-1.5 flex-shrink-0 ${viewMode === "grid" ? "mt-3" : "mt-2 sm:mt-0"}`}
                                >
                                  {user.phone ? (
                                    <>
                                      <Button size="sm" onClick={() => handleCall(user.phone!)}>
                                        <Phone className="h-3.5 w-3.5 mr-1" />
                                        Call
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => handleWhatsApp(user.phone!)}
                                      >
                                        <MessageCircle className="h-4 w-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    isAdmin && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openEditDialog(user)}
                                      >
                                        <Pencil className="h-3.5 w-3.5 mr-1" />
                                        Add Phone
                                      </Button>
                                    )
                                  )}
                                  {user.phone && isAdmin && (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => openEditDialog(user)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )
                )}
              </AnimatePresence>

              {visibleSections.length === 0 && searchQuery && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No contacts found matching your search.</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Phone Number</DialogTitle>
            <DialogDescription>
              {editingUser ? `Set contact phone for ${editingUser.name}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Mobile / Phone Number</Label>
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              onClick={handleSavePhone}
              disabled={updatePhoneMutation.isPending}
            >
              <Save className="h-4 w-4 mr-1" />
              {updatePhoneMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
