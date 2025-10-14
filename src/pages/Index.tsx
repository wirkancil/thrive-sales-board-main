import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { profile, loading } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    // If user is authenticated but has no profile, redirect to pending approval
    // Exception: admins and department heads don't need approval
    if (user && !profile) {
      // Check if this is an admin or strategic leader email pattern
      const isAdminOrLeader = user.email?.includes('admin') || 
                                user.email?.includes('head') || 
                                user.email?.includes('leader') ||
                               user.email?.includes('head') ||
                               user.email === 'admin@gmail.com';
      
      if (!isAdminOrLeader) {
        navigate('/pending', { replace: true });
        return;
      }
    }

    // If no user, this should be handled by ProtectedRoute
    if (!user) return;

    // If profile exists, redirect based on role
    if (profile) {
      switch (profile.role) {
        case 'admin':
          navigate('/admin-dashboard', { replace: true });
          break;
        case 'manager':
          navigate('/team-dashboard', { replace: true });
          break;
        case 'head':
          navigate('/executive-dashboard', { replace: true });
          break;
        case 'account_manager':
          navigate('/sales-dashboard', { replace: true });
          break;
        default:
          // If role is not recognized, redirect to pending
          navigate('/pending', { replace: true });
      }
    }
  }, [profile, loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return null;
};

export default Index;
