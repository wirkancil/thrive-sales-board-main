import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission: keyof ReturnType<typeof usePermissions>;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export const PermissionGuard = ({ 
  children, 
  permission, 
  fallback, 
  showFallback = true 
}: PermissionGuardProps) => {
  const permissions = usePermissions();
  const hasPermission = permissions[permission];

  if (!hasPermission) {
    if (showFallback) {
      return fallback || (
        <Alert className="border-muted-foreground/20">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this feature.
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  }

  return <>{children}</>;
};

// Convenience component for inline permission checking
export const usePermissionCheck = (permission: keyof ReturnType<typeof usePermissions>): boolean => {
  const permissions = usePermissions();
  return permissions[permission];
};