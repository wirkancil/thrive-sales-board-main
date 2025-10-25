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

    // Jika user terautentikasi tapi belum ada profile, arahkan ke pending approval
    if (user && !profile) {
      navigate('/pending', { replace: true });
      return;
    }

    // Jika tidak ada user, ditangani oleh ProtectedRoute
    if (!user) return;

    // Jika profile ada, cek apakah perlu approval berdasarkan assignment org
    if (profile) {
      const roleText = String(profile.role);
      const needsApproval = (
        roleText === 'pending' ||
        (profile.role === 'head' && !profile.division_id) ||
        ((profile.role === 'manager' || profile.role === 'account_manager') && !profile.department_id)
      );

      if (needsApproval) {
        navigate('/pending', { replace: true });
        return;
      }

      // Jika sudah lengkap, arahkan sesuai role
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
