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
    // KECUALI jika user adalah admin yang sudah ada di auth
    if (user && !profile) {
      // Check if this is the admin user by ID
      if (user.id === '3212a172-b6c8-417c-811a-735cc0033041') {
        // This is the admin user, redirect to admin dashboard instead of pending
        navigate('/admin/dashboard', { replace: true });
        return;
      }
      navigate('/pending', { replace: true });
      return;
    }

    // Jika tidak ada user, ditangani oleh ProtectedRoute
    if (!user) return;

    // Jika profile ada, cek apakah perlu approval berdasarkan assignment org
    if (profile) {
      const roleText = String(profile.role);
      
      // Admin selalu bypass approval check
      if (roleText === 'admin') {
        navigate('/admin/dashboard', { replace: true });
        return;
      }
      
      // Relaksasi: akun sales (account_manager) tidak wajib department_id untuk akses
      const needsApproval = (
        roleText === 'pending' ||
        (profile.role === 'manager' && !profile.department_id)
        // Catatan: head tanpa division_id sekarang diizinkan masuk
      );

      if (needsApproval) {
        navigate('/pending', { replace: true });
        return;
      }

      // Jika sudah lengkap, arahkan sesuai role
      switch (profile.role) {
        case 'account_manager':
          navigate('/sales-dashboard', { replace: true });
          break;
        case 'head':
          navigate('/executive-dashboard', { replace: true });
          break;
        case 'manager':
          navigate('/team-dashboard', { replace: true });
          break;
        case 'admin':
          navigate('/admin/dashboard', { replace: true });
          break;
        default:
          navigate('/auth', { replace: true });
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
