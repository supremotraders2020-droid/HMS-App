export const HMS_ROLES = [
  "SUPER_ADMIN",
  "ADMIN", 
  "DOCTOR",
  "NURSE",
  "OPD_MANAGER",
  "PATIENT",
  "PATHOLOGY_LAB",
  "MEDICAL_STORE"
] as const;

export type HMSRole = typeof HMS_ROLES[number];

export const HMS_MODULES = [
  "DASHBOARD",
  "USERS",
  "PATIENTS",
  "APPOINTMENTS",
  "BILLING",
  "STOCK",
  "SURGERY",
  "MEDICINE",
  "INSURANCE",
  "CLAIMS",
  "PACKAGES",
  "REPORTS",
  "AUDIT_LOGS",
  "BED_MANAGEMENT",
  "OPD",
  "IPD",
  "PATHOLOGY",
  "PRESCRIPTIONS",
  "EQUIPMENT",
  "BMW",
  "OXYGEN",
  "CONSENT_FORMS",
  "NOTIFICATIONS",
  "SETTINGS"
] as const;

export type HMSModule = typeof HMS_MODULES[number];

export const HMS_ACTIONS = [
  "view",
  "create", 
  "edit",
  "delete",
  "approve",
  "lock",
  "unlock",
  "export"
] as const;

export type HMSAction = typeof HMS_ACTIONS[number];

export const MODULE_LABELS: Record<HMSModule, string> = {
  DASHBOARD: "Dashboard",
  USERS: "User Management",
  PATIENTS: "Patient Records",
  APPOINTMENTS: "Appointments",
  BILLING: "Billing & Invoices",
  STOCK: "Stock & Inventory",
  SURGERY: "Surgery Packages",
  MEDICINE: "Medicine Database",
  INSURANCE: "Insurance Providers",
  CLAIMS: "Insurance Claims",
  PACKAGES: "Hospital Packages",
  REPORTS: "Reports & Analytics",
  AUDIT_LOGS: "Audit Logs",
  BED_MANAGEMENT: "Bed Management",
  OPD: "OPD Services",
  IPD: "IPD Services",
  PATHOLOGY: "Pathology Lab",
  PRESCRIPTIONS: "Prescriptions",
  EQUIPMENT: "Equipment Servicing",
  BMW: "Biomedical Waste",
  OXYGEN: "Oxygen Tracking",
  CONSENT_FORMS: "Consent Forms",
  NOTIFICATIONS: "Notifications",
  SETTINGS: "System Settings"
};

export const ACTION_LABELS: Record<HMSAction, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  approve: "Approve",
  lock: "Lock",
  unlock: "Unlock",
  export: "Export"
};

export const ROLE_LABELS: Record<HMSRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  OPD_MANAGER: "OPD Manager",
  PATIENT: "Patient",
  PATHOLOGY_LAB: "Pathology Lab",
  MEDICAL_STORE: "Medical Store"
};

export interface PermissionMatrix {
  role: HMSRole;
  module: HMSModule;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canLock: boolean;
  canUnlock: boolean;
  canExport: boolean;
}

export const DEFAULT_PERMISSIONS: Record<HMSRole, Partial<Record<HMSModule, Partial<Record<HMSAction, boolean>>>>> = {
  SUPER_ADMIN: Object.fromEntries(
    HMS_MODULES.map(module => [module, { view: true, create: true, edit: true, delete: true, approve: true, lock: true, unlock: true, export: true }])
  ) as Record<HMSModule, Record<HMSAction, boolean>>,
  
  ADMIN: {
    DASHBOARD: { view: true },
    USERS: { view: true, create: true, edit: true, delete: true },
    PATIENTS: { view: true, create: true, edit: true, delete: true },
    APPOINTMENTS: { view: true, create: true, edit: true, delete: true, approve: true },
    BILLING: { view: true, create: true, edit: true },
    STOCK: { view: true, create: true, edit: true },
    SURGERY: { view: true, create: true, edit: true },
    MEDICINE: { view: true, create: true, edit: true },
    INSURANCE: { view: true, create: true, edit: true },
    CLAIMS: { view: true, create: true, edit: true, approve: true },
    PACKAGES: { view: true, create: true, edit: true },
    REPORTS: { view: true, export: true },
    AUDIT_LOGS: { view: true },
    BED_MANAGEMENT: { view: true, create: true, edit: true },
    OPD: { view: true, create: true, edit: true },
    IPD: { view: true, create: true, edit: true },
    PATHOLOGY: { view: true },
    PRESCRIPTIONS: { view: true },
    EQUIPMENT: { view: true, create: true, edit: true },
    BMW: { view: true, create: true, edit: true },
    OXYGEN: { view: true, create: true, edit: true },
    CONSENT_FORMS: { view: true },
    NOTIFICATIONS: { view: true, create: true },
    SETTINGS: { view: true, edit: true }
  },
  
  DOCTOR: {
    DASHBOARD: { view: true },
    PATIENTS: { view: true, edit: true },
    APPOINTMENTS: { view: true, edit: true },
    PRESCRIPTIONS: { view: true, create: true, edit: true, approve: true },
    OPD: { view: true },
    IPD: { view: true },
    PATHOLOGY: { view: true },
    CONSENT_FORMS: { view: true },
    NOTIFICATIONS: { view: true }
  },
  
  NURSE: {
    DASHBOARD: { view: true },
    PATIENTS: { view: true, edit: true },
    APPOINTMENTS: { view: true },
    PRESCRIPTIONS: { view: true },
    BED_MANAGEMENT: { view: true, edit: true },
    OPD: { view: true },
    IPD: { view: true },
    OXYGEN: { view: true, edit: true },
    CONSENT_FORMS: { view: true },
    NOTIFICATIONS: { view: true }
  },
  
  OPD_MANAGER: {
    DASHBOARD: { view: true },
    PATIENTS: { view: true, create: true, edit: true },
    APPOINTMENTS: { view: true, create: true, edit: true, delete: true },
    BILLING: { view: true, create: true },
    OPD: { view: true, create: true, edit: true },
    CONSENT_FORMS: { view: true },
    NOTIFICATIONS: { view: true, create: true }
  },
  
  PATIENT: {
    DASHBOARD: { view: true },
    APPOINTMENTS: { view: true },
    PRESCRIPTIONS: { view: true },
    BILLING: { view: true },
    NOTIFICATIONS: { view: true }
  },
  
  PATHOLOGY_LAB: {
    DASHBOARD: { view: true },
    PATIENTS: { view: true },
    PATHOLOGY: { view: true, create: true, edit: true, approve: true },
    REPORTS: { view: true, export: true },
    NOTIFICATIONS: { view: true }
  },
  
  MEDICAL_STORE: {
    DASHBOARD: { view: true },
    PRESCRIPTIONS: { view: true },
    MEDICINE: { view: true, edit: true },
    STOCK: { view: true, create: true, edit: true },
    BILLING: { view: true, create: true },
    NOTIFICATIONS: { view: true }
  }
};

export function hasPermission(
  permissions: PermissionMatrix[],
  role: HMSRole,
  module: HMSModule,
  action: HMSAction
): boolean {
  if (role === "SUPER_ADMIN") return true;
  
  const permission = permissions.find(p => p.role === role && p.module === module);
  if (!permission) {
    const defaultPerm = DEFAULT_PERMISSIONS[role]?.[module]?.[action];
    return defaultPerm ?? false;
  }
  
  switch (action) {
    case "view": return permission.canView;
    case "create": return permission.canCreate;
    case "edit": return permission.canEdit;
    case "delete": return permission.canDelete;
    case "approve": return permission.canApprove;
    case "lock": return permission.canLock;
    case "unlock": return permission.canUnlock;
    case "export": return permission.canExport;
    default: return false;
  }
}

export function getDefaultPermissionForRole(role: HMSRole, module: HMSModule): Partial<Record<HMSAction, boolean>> {
  return DEFAULT_PERMISSIONS[role]?.[module] ?? {};
}
