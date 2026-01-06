import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  HMS_MODULES, 
  HMS_ACTIONS, 
  DEFAULT_PERMISSIONS,
  type HMSRole, 
  type HMSModule, 
  type HMSAction,
  type PermissionMatrix 
} from "@shared/permissions";
import type { RolePermission } from "@shared/schema";

interface PermissionContextType {
  permissions: RolePermission[];
  userRole: HMSRole | null;
  isLoading: boolean;
  can: (module: HMSModule, action: HMSAction) => boolean;
  canAny: (module: HMSModule, actions: HMSAction[]) => boolean;
  canAll: (module: HMSModule, actions: HMSAction[]) => boolean;
  refreshPermissions: () => void;
}

const PermissionContext = createContext<PermissionContextType | null>(null);

export function PermissionProvider({ children, userRole }: { children: ReactNode; userRole: HMSRole | null }) {
  const queryClient = useQueryClient();
  
  const { data: permissionData, isLoading, refetch } = useQuery<{ role: string; permissions: RolePermission[] }>({
    queryKey: ["/api/permissions/current"],
    enabled: !!userRole && userRole !== "SUPER_ADMIN",
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true
  });

  const permissions = permissionData?.permissions || [];

  const can = useCallback((module: HMSModule, action: HMSAction): boolean => {
    if (!userRole) return false;
    if (userRole === "SUPER_ADMIN") return true;
    
    const permission = permissions.find(p => p.module === module);
    
    if (permission) {
      switch (action) {
        case "view": return permission.canView ?? false;
        case "create": return permission.canCreate ?? false;
        case "edit": return permission.canEdit ?? false;
        case "delete": return permission.canDelete ?? false;
        case "approve": return permission.canApprove ?? false;
        case "lock": return permission.canLock ?? false;
        case "unlock": return permission.canUnlock ?? false;
        case "export": return permission.canExport ?? false;
        default: return false;
      }
    }
    
    const defaultPerm = DEFAULT_PERMISSIONS[userRole]?.[module]?.[action];
    return defaultPerm ?? false;
  }, [userRole, permissions]);

  const canAny = useCallback((module: HMSModule, actions: HMSAction[]): boolean => {
    return actions.some(action => can(module, action));
  }, [can]);

  const canAll = useCallback((module: HMSModule, actions: HMSAction[]): boolean => {
    return actions.every(action => can(module, action));
  }, [can]);

  const refreshPermissions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/permissions/current"] });
    refetch();
  }, [queryClient, refetch]);

  return (
    <PermissionContext.Provider value={{
      permissions,
      userRole,
      isLoading,
      can,
      canAny,
      canAll,
      refreshPermissions
    }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    return {
      permissions: [],
      userRole: null,
      isLoading: false,
      can: () => false,
      canAny: () => false,
      canAll: () => false,
      refreshPermissions: () => {}
    };
  }
  return context;
}

export function useModulePermission(module: HMSModule) {
  const { can, userRole } = usePermissions();
  
  return {
    canView: can(module, "view"),
    canCreate: can(module, "create"),
    canEdit: can(module, "edit"),
    canDelete: can(module, "delete"),
    canApprove: can(module, "approve"),
    canLock: can(module, "lock"),
    canUnlock: can(module, "unlock"),
    canExport: can(module, "export"),
    userRole
  };
}

interface PermissionGateProps {
  module: HMSModule;
  action: HMSAction;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ module, action, children, fallback = null }: PermissionGateProps) {
  const { can } = usePermissions();
  
  if (can(module, action)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}

interface PermissionButtonProps {
  module: HMSModule;
  action: HMSAction;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  module: HMSModule,
  action: HMSAction
) {
  return function PermissionWrappedComponent(props: P) {
    const { can } = usePermissions();
    
    if (!can(module, action)) {
      return null;
    }
    
    return <WrappedComponent {...props} />;
  };
}
