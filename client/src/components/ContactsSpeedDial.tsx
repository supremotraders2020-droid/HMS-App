import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
  AlertTriangle,
  Building2,
  Stethoscope,
  UserCog,
  Users,
  FlaskConical,
  Syringe,
  Activity,
  Pencil,
  Save,
  X
} from "lucide-react";

type UserRole = "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "PATIENT" | "NURSE" | "OPD_MANAGER" | "MEDICAL_STORE" | "PATHOLOGY_LAB" | "TECHNICIAN";

interface Contact {
  id: string;
  name: string;
  mobile: string;
  whatsapp?: string;
  role: string;
  department?: string;
  isEmergency?: boolean;
  visibleTo: UserRole[];
}

interface ContactSection {
  id: string;
  title: string;
  shortTitle: string;
  icon: typeof Phone;
  contacts: Contact[];
}

interface ContactsSpeedDialProps {
  currentRole: UserRole;
}

const INITIAL_CONTACTS: ContactSection[] = [
  {
    id: "management",
    title: "Management & Admin",
    shortTitle: "Management",
    icon: Building2,
    contacts: [
      { id: "m1", name: "Dr. Rajesh Kumar", mobile: "+91 98765 43210", whatsapp: "+91 98765 43210", role: "Director", isEmergency: true, visibleTo: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "SUPER_ADMIN"] },
      { id: "m2", name: "Mrs. Priya Sharma", mobile: "+91 98765 43211", whatsapp: "+91 98765 43211", role: "Hospital Administrator", visibleTo: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "SUPER_ADMIN"] },
      { id: "m3", name: "Mr. Anil Desai", mobile: "+91 98765 43212", role: "Accountant", visibleTo: ["ADMIN", "SUPER_ADMIN"] },
      { id: "m4", name: "Mrs. Sunita Patil", mobile: "+91 98765 43213", role: "Billing Head", visibleTo: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "SUPER_ADMIN"] },
      { id: "m5", name: "Mr. Rahul Singh", mobile: "+91 98765 43214", whatsapp: "+91 98765 43214", role: "Reception", visibleTo: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "SUPER_ADMIN"] },
    ]
  },
  {
    id: "anaesthesia",
    title: "Anaesthesia Team",
    shortTitle: "Anaesthesia",
    icon: Syringe,
    contacts: [
      { id: "a1", name: "Dr. Vikram Joshi", mobile: "+91 98765 43220", whatsapp: "+91 98765 43220", role: "Sr. Anaesthetist", department: "Anaesthesia", isEmergency: true, visibleTo: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "SUPER_ADMIN"] },
      { id: "a2", name: "Dr. Meena Kulkarni", mobile: "+91 98765 43221", whatsapp: "+91 98765 43221", role: "Anaesthetist", department: "Anaesthesia", isEmergency: true, visibleTo: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "SUPER_ADMIN"] },
      { id: "a3", name: "Dr. Suresh Nair", mobile: "+91 98765 43222", role: "Jr. Anaesthetist", department: "Anaesthesia", visibleTo: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "SUPER_ADMIN"] },
    ]
  },
  {
    id: "reference",
    title: "Reference Doctors (External)",
    shortTitle: "Ref. Doctors",
    icon: UserCog,
    contacts: [
      { id: "r1", name: "Dr. Ashok Mehta", mobile: "+91 98765 43230", role: "Cardiologist", department: "Cardiology", visibleTo: ["ADMIN", "DOCTOR", "OPD_MANAGER", "SUPER_ADMIN"] },
      { id: "r2", name: "Dr. Kavita Rao", mobile: "+91 98765 43231", role: "Neurologist", department: "Neurology", visibleTo: ["ADMIN", "DOCTOR", "OPD_MANAGER", "SUPER_ADMIN"] },
      { id: "r3", name: "Dr. Prakash Iyer", mobile: "+91 98765 43232", role: "Orthopedic Surgeon", department: "Orthopedics", visibleTo: ["ADMIN", "DOCTOR", "OPD_MANAGER", "SUPER_ADMIN"] },
      { id: "r4", name: "Dr. Neha Gupta", mobile: "+91 98765 43233", role: "Gynecologist", department: "Gynecology", visibleTo: ["ADMIN", "DOCTOR", "OPD_MANAGER", "SUPER_ADMIN"] },
    ]
  },
  {
    id: "inhouse",
    title: "In-House Doctors",
    shortTitle: "Doctors",
    icon: Stethoscope,
    contacts: [
      { id: "i1", name: "Dr. Suraj Patil", mobile: "+91 98765 43240", whatsapp: "+91 98765 43240", role: "General Physician", department: "General Medicine", isEmergency: true, visibleTo: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "SUPER_ADMIN"] },
      { id: "i2", name: "Dr. Anita Deshmukh", mobile: "+91 98765 43241", whatsapp: "+91 98765 43241", role: "Pediatrician", department: "Pediatrics", visibleTo: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "SUPER_ADMIN"] },
      { id: "i3", name: "Dr. Ravi Kulkarni", mobile: "+91 98765 43242", role: "Surgeon", department: "Surgery", isEmergency: true, visibleTo: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "SUPER_ADMIN"] },
      { id: "i4", name: "Dr. Pooja Sharma", mobile: "+91 98765 43243", role: "Dermatologist", department: "Dermatology", visibleTo: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "SUPER_ADMIN"] },
      { id: "i5", name: "Dr. Amit Jain", mobile: "+91 98765 43244", role: "ENT Specialist", department: "ENT", visibleTo: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "SUPER_ADMIN"] },
    ]
  },
  {
    id: "technicians",
    title: "Technicians (Lab/OT/Radiology)",
    shortTitle: "Technicians",
    icon: FlaskConical,
    contacts: [
      { id: "t1", name: "Mr. Santosh Kumar", mobile: "+91 98765 43250", role: "Lab Technician", department: "Pathology Lab", visibleTo: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "SUPER_ADMIN"] },
      { id: "t2", name: "Ms. Rekha Patil", mobile: "+91 98765 43251", role: "OT Technician", department: "Operation Theatre", visibleTo: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "SUPER_ADMIN"] },
      { id: "t3", name: "Mr. Vijay Gaikwad", mobile: "+91 98765 43252", role: "Radiology Tech", department: "Radiology", visibleTo: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "SUPER_ADMIN"] },
      { id: "t4", name: "Ms. Priya Naik", mobile: "+91 98765 43253", role: "ECG Technician", department: "Cardiology", visibleTo: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "SUPER_ADMIN"] },
    ]
  },
  {
    id: "icu",
    title: "ICU On-Duty Team",
    shortTitle: "ICU Team",
    icon: Activity,
    contacts: [
      { id: "c1", name: "Dr. Sandeep Rane", mobile: "+91 98765 43260", whatsapp: "+91 98765 43260", role: "ICU In-Charge", department: "ICU", isEmergency: true, visibleTo: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "SUPER_ADMIN"] },
      { id: "c2", name: "Nurse Kavitha M", mobile: "+91 98765 43261", whatsapp: "+91 98765 43261", role: "ICU Head Nurse", department: "ICU", isEmergency: true, visibleTo: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "SUPER_ADMIN"] },
      { id: "c3", name: "Mr. Ramesh Bhosle", mobile: "+91 98765 43262", role: "ICU Attendant", department: "ICU", visibleTo: ["ADMIN", "DOCTOR", "NURSE", "OPD_MANAGER", "SUPER_ADMIN"] },
    ]
  }
];

export function ContactsSpeedDial({ currentRole }: ContactsSpeedDialProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string>("management");
  const [contacts, setContacts] = useState<ContactSection[]>(INITIAL_CONTACTS);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    mobile: "",
    whatsapp: "",
    role: "",
    department: ""
  });

  const isAdmin = currentRole === "ADMIN" || currentRole === "SUPER_ADMIN";

  const filteredSections = useMemo(() => {
    return contacts.map(section => {
      const filteredContacts = section.contacts.filter(contact => {
        if (!contact.visibleTo.includes(currentRole)) return false;
        
        const matchesSearch = searchQuery === "" || 
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (contact.department?.toLowerCase().includes(searchQuery.toLowerCase()));
        
        return matchesSearch;
      });
      
      return { ...section, contacts: filteredContacts };
    }).filter(section => section.contacts.length > 0);
  }, [currentRole, searchQuery, contacts]);

  const totalContacts = filteredSections.reduce((sum, section) => sum + section.contacts.length, 0);

  const handleCall = (mobile: string) => {
    window.location.href = `tel:${mobile.replace(/\s/g, '')}`;
  };

  const handleWhatsApp = (whatsapp: string) => {
    const cleanNumber = whatsapp.replace(/\s/g, '').replace('+', '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  const openEditDialog = (contact: Contact) => {
    setEditingContact(contact);
    setEditForm({
      name: contact.name,
      mobile: contact.mobile,
      whatsapp: contact.whatsapp || "",
      role: contact.role,
      department: contact.department || ""
    });
    setEditDialogOpen(true);
  };

  const handleSaveContact = () => {
    if (!editingContact) return;
    
    setContacts(prev => prev.map(section => ({
      ...section,
      contacts: section.contacts.map(contact => 
        contact.id === editingContact.id 
          ? { 
              ...contact, 
              name: editForm.name,
              mobile: editForm.mobile,
              whatsapp: editForm.whatsapp || undefined,
              role: editForm.role,
              department: editForm.department || undefined
            }
          : contact
      )
    })));
    
    setEditDialogOpen(false);
    setEditingContact(null);
  };

  return (
    <>
      <Card className="border-0 shadow-lg bg-gradient-to-b from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-950">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500 rounded-xl">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Hospital Speed Dial</CardTitle>
                  <p className="text-sm text-muted-foreground">{totalContacts} contacts available</p>
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
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/80 dark:bg-slate-800/80"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <ScrollArea className="w-full">
            <div className="flex flex-wrap gap-2 mb-4">
              {filteredSections.map((section) => (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveSection(section.id)}
                  className="flex items-center gap-1.5 flex-shrink-0"
                >
                  <section.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{section.title}</span>
                  <span className="md:hidden">{section.shortTitle}</span>
                  <span className="text-xs opacity-70 ml-0.5">{section.contacts.length}</span>
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          
          <AnimatePresence mode="wait">
            {filteredSections.map((section) => (
              activeSection === section.id && (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ScrollArea className="max-h-[350px]">
                    <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2" : "space-y-2"}>
                      {section.contacts.map((contact) => (
                        <div
                          key={contact.id}
                          className={`
                            p-3 bg-white dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/50
                            ${viewMode === "list" ? "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" : ""}
                            ${contact.isEmergency ? "ring-2 ring-red-400/60 dark:ring-red-500/50" : ""}
                          `}
                        >
                          <div className={viewMode === "list" ? "flex-1 min-w-0" : ""}>
                            <div className="flex items-center gap-2 mb-1">
                              {contact.isEmergency && (
                                <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                              )}
                              <span className="font-medium text-sm truncate">{contact.name}</span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>{contact.role}</span>
                              {contact.department && (
                                <>
                                  <span className="text-slate-300 dark:text-slate-600">|</span>
                                  <span>{contact.department}</span>
                                </>
                              )}
                            </div>
                            <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mt-1">{contact.mobile}</p>
                          </div>
                          
                          <div className={`flex items-center gap-1.5 flex-shrink-0 ${viewMode === "grid" ? "mt-3" : "mt-2 sm:mt-0"}`}>
                            <Button
                              size="sm"
                              onClick={() => handleCall(contact.mobile)}
                            >
                              <Phone className="h-3.5 w-3.5 mr-1" />
                              Call
                            </Button>
                            {contact.whatsapp && (
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleWhatsApp(contact.whatsapp!)}
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {isAdmin && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditDialog(contact)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </motion.div>
              )
            ))}
          </AnimatePresence>
          
          {filteredSections.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No contacts found matching your search.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update contact details. Only administrators can make changes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-mobile">Mobile Number</Label>
              <Input
                id="edit-mobile"
                value={editForm.mobile}
                onChange={(e) => setEditForm(prev => ({ ...prev, mobile: e.target.value }))}
                placeholder="+91 98765 43210"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-whatsapp">WhatsApp Number (Optional)</Label>
              <Input
                id="edit-whatsapp"
                value={editForm.whatsapp}
                onChange={(e) => setEditForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                placeholder="+91 98765 43210"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role / Designation</Label>
              <Input
                id="edit-role"
                value={editForm.role}
                onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                placeholder="e.g., Sr. Doctor"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-department">Department (Optional)</Label>
              <Input
                id="edit-department"
                value={editForm.department}
                onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                placeholder="e.g., Cardiology"
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSaveContact}>
              <Save className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
