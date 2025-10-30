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

  console.log('=== ROLE BASED ROUTE DEBUG ===');
  console.log('Loading:', loading);
  console.log('Profile:', profile);
  console.log('User role:', profile?.role);
  console.log('Allowed roles:', allowedRoles);
  console.log('Role check result:', profile && allowedRoles.includes(profile.role));
  console.log('Will redirect to:', !profile || !allowedRoles.includes(profile.role) ? redirectTo : 'ALLOWED');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    console.log('Access denied - redirecting to:', redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  console.log('Access granted - rendering children');
  return <>{children}</>;
};