import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useProfile, UserProfile } from '@/hooks/useProfile';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserProfile['role'][];
  redirectTo?: string;
}

export const RoleBasedRoute = ({ 
  children, 
  allowedRoles, 
  redirectTo = '/403' 
}: RoleBasedRouteProps) => {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};