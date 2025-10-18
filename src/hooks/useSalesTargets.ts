import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export interface SalesTarget {
  id: string;
  assigned_to: string;
  measure: string;
  period_start: string;
  period_end: string;
  amount: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  division_id?: string;
  department_id?: string;
  assigned_user?: {
    id: string;
    full_name: string;
    role: string;
    division_id: string;
    department_id: string;
  } | null;
  account_manager?: {
    full_name: string;
    role?: string;
  } | null;
}

export const useSalesTargets = () => {
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [accountManagers, setAccountManagers] = useState<
    Array<{ id: string; full_name: string; role?: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAccountManagers = async () => {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) {
        console.log("No authenticated user found");
        setAccountManagers([]);
        return;
      }

      const { data: userProfile, error: profileError } = await supabase
        .from("user_profiles")
        .select("role, division_id, department_id")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (profileError) {
        toast({
          title: "Error",
          description: "Failed to fetch user profile",
          variant: "destructive",
        });
        setAccountManagers([]);
        return;
      }

      if (!userProfile) {
        console.log("No user profile found");
        toast({
          title: "Warning",
          description:
            "User profile not found. Please contact your administrator.",
          variant: "destructive",
        });
        setAccountManagers([]);
        return;
      }

      // Validate role and scope before proceeding
      if (userProfile.role === "manager") {
        if (!userProfile.department_id) {
          console.error(
            "Department manager missing department_id:",
            userProfile
          );
          toast({
            title: "Configuration Error",
            description: "Your account is missing department assignment",
            variant: "destructive",
          });
          setAccountManagers([]);
          return;
        }

        const { data: amData, error: amError } = await supabase
          .from("user_profiles")
          .select("id, full_name, role")
          .eq("department_id", userProfile.department_id)
          .eq("role", "account_manager")
          .eq("is_active", true)
          .order("full_name");

        if (amError) {
          console.error("Error fetching account managers:", amError);
          toast({
            title: "Error",
            description: "Failed to fetch account managers for your department",
            variant: "destructive",
          });
          setAccountManagers([]);
          return;
        }

        if (!amData || amData.length === 0) {
          toast({
            title: "No Data",
            description: "No active account managers found in your department",
          });
          setAccountManagers([]);
          return;
        }

        setAccountManagers(
          amData as Array<{ id: string; full_name: string; role?: string }>
        );
      } else if (userProfile.role === "head") {
        if (!userProfile.division_id) {
          console.error("Division head missing division_id:", userProfile);
          toast({
            title: "Configuration Error",
            description: "Your account is missing division assignment",
            variant: "destructive",
          });
          setAccountManagers([]);
          return;
        }

        const { data: amData, error: amError } = await supabase
          .from("user_profiles")
          .select("id, full_name, role")
          .eq("division_id", userProfile.division_id)
          .in("role", ["account_manager", "manager"])
          .eq("is_active", true)
          .order("role", { ascending: false })
          .order("full_name");

        if (amError) {
          console.error("Error fetching division team members:", amError);
          toast({
            title: "Error",
            description: "Failed to fetch team members for your division",
            variant: "destructive",
          });
          setAccountManagers([]);
          return;
        }

        if (!amData || amData.length === 0) {
          toast({
            title: "No Data",
            description: "No active team members found in your division",
          });
          setAccountManagers([]);
          return;
        }

        setAccountManagers(
          amData as Array<{ id: string; full_name: string; role?: string }>
        );
      } else if (userProfile.role === "admin") {
        // Admins can see all account managers
        const { data: amData, error: amError } = await supabase
          .from("user_profiles")
          .select("id, full_name, role")
          .in("role", ["account_manager", "manager", "head"])
          .eq("is_active", true)
          .order("role", { ascending: false })
          .order("full_name");

        if (amError) {
          console.error("Error fetching all users:", amError);
          toast({
            title: "Error",
            description: "Failed to fetch team members",
            variant: "destructive",
          });
          setAccountManagers([]);
          return;
        }

        setAccountManagers(amData || []);
      } else {
        setAccountManagers([]);
      }
    } catch (error) {
      console.error("Error in fetchAccountManagers:", error);
      toast({
        title: "Error",
        description:
          "An unexpected error occurred while fetching account managers",
        variant: "destructive",
      });
      setAccountManagers([]);
    }
  };

  const fetchTargets = async (selectedPeriod?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get current user profile to filter by division
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) {
        console.error("No authenticated user found");
        throw new Error("User not authenticated");
      }

      const { data: userProfile, error: profileError } = await supabase
        .from("user_profiles")
        .select("role, division_id, department_id")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw profileError;
      }

      if (!userProfile) {
        throw new Error("User profile not found");
      }

      // Build query based on user role and permissions
      const baseQuery = `
        *,
        assigned_user:user_profiles!fk_sales_targets_assigned_to_user_profiles(
          id, full_name, role, division_id, department_id
        )
      `;

      let query = supabase.from("sales_targets").select(baseQuery);

      if (userProfile.role === "admin") {
        console.log("Admin access - showing all targets");
        // Admin sees all targets
      } else if (userProfile.role === "manager") {
        if (!userProfile.department_id) {
          console.error("Manager missing department_id:", userProfile);
          throw new Error("Manager account is missing department assignment");
        }

        // Manager sees targets in their department
        query = query.eq("department_id", userProfile.department_id);
      } else if (userProfile.role === "head") {
        if (!userProfile.division_id) {
          console.error("Head missing division_id:", userProfile);
          throw new Error("Head account is missing division assignment");
        }

        // Head sees targets in their division
        query = query.eq("division_id", userProfile.division_id);
      } else {
        console.log("Individual access - showing own targets only");
        // Others see only their own targets
        query = query.eq("assigned_to", currentUser.id);
      }

      // Filter by quarter if selectedPeriod is provided
      if (selectedPeriod) {
        const [quarter, year] = selectedPeriod.split(" ");
        const quarterNum = parseInt(quarter.substring(1)); // Extract number from Q1, Q2, etc.
        const yearNum = parseInt(year);

        // Calculate quarter start and end dates for filtering
        const quarterStartMonth = (quarterNum - 1) * 3 + 1; // Q1=1, Q2=4, Q3=7, Q4=10
        const quarterEndMonth = quarterNum * 3; // Q1=3, Q2=6, Q3=9, Q4=12

        const quarterStart = `${yearNum}-${String(quarterStartMonth).padStart(
          2,
          "0"
        )}-01`;

        // Calculate proper quarter end date (last day of the quarter's last month)
        const quarterEndDate = new Date(yearNum, quarterEndMonth, 0); // Day 0 = last day of previous month
        const quarterEnd = `${yearNum}-${String(quarterEndMonth).padStart(
          2,
          "0"
        )}-${String(quarterEndDate.getDate()).padStart(2, "0")}`;

        // Filter targets that have any overlap with the selected quarter
        query = query
          .lte("period_start", quarterEnd)
          .gte("period_end", quarterStart);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) {
        console.error("Query error:", error);
        throw error;
      }

      const processedTargets =
        (data as any[])?.map((item) => ({
          ...item,
          account_manager: item.assigned_user || null,
        })) || [];

      setTargets(processedTargets);
    } catch (err: any) {
      console.error("Error fetching sales targets:", err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to fetch sales targets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTarget = async (
    targetData: Omit<
      SalesTarget,
      | "id"
      | "created_at"
      | "updated_at"
      | "created_by"
      | "account_manager"
      | "division_id"
      | "department_id"
    > & { account_manager_id: string; target_amount: number }
  ) => {
    try {
      // Get current user info
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) throw new Error("User not authenticated");

      // Get current user's profile for division_id
      const { data: currentUserProfile, error: currentProfileError } =
        await supabase
          .from("user_profiles")
          .select("division_id, department_id")
          .eq("id", currentUser.id)
          .single();

      if (currentProfileError) {
        console.error(
          "Error fetching current user profile:",
          currentProfileError
        );
        throw currentProfileError;
      }

      const { data, error } = await supabase
        .from("sales_targets")
        .insert({
          assigned_to: targetData.account_manager_id,
          measure: targetData.measure,
          amount: targetData.target_amount,
          period_start: targetData.period_start,
          period_end: targetData.period_end,
          created_by: currentUser.id,
          division_id: currentUserProfile?.division_id || null,
          department_id: currentUserProfile?.department_id || null,
        })
        .select(
          `
          *,
          assigned_user:user_profiles!fk_sales_targets_assigned_to_user_profiles(
            id, full_name, role, division_id, department_id
          )
        `
        )
        .single();

      if (error) throw error;

      setTargets((prev) => [data as unknown as SalesTarget, ...prev]);
      toast({
        title: "Success",
        description: "Sales target created successfully",
      });

      return { data, error: null };
    } catch (err: any) {
      console.error("Error creating sales target:", err);
      toast({
        title: "Error",
        description: "Failed to create sales target",
        variant: "destructive",
      });
      return { data: null, error: err.message };
    }
  };

  const updateTarget = async (id: string, updates: Partial<SalesTarget>) => {
    try {
      const { data, error } = await supabase
        .from("sales_targets")
        .update(updates)
        .eq("id", id)
        .select(
          `
          *,
          assigned_user:user_profiles!fk_sales_targets_assigned_to_user_profiles(
            full_name
          )
        `
        )
        .single();

      if (error) throw error;

      setTargets((prev) =>
        prev.map((target) =>
          target.id === id ? (data as unknown as SalesTarget) : target
        )
      );
      toast({
        title: "Success",
        description: "Sales target updated successfully",
      });

      return { data, error: null };
    } catch (err: any) {
      console.error("Error updating sales target:", err);
      toast({
        title: "Error",
        description: "Failed to update sales target",
        variant: "destructive",
      });
      return { data: null, error: err.message };
    }
  };

  const deleteTarget = async (id: string) => {
    try {
      const { error } = await supabase
        .from("sales_targets")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setTargets((prev) => prev.filter((target) => target.id !== id));
      toast({
        title: "Success",
        description: "Sales target deleted successfully",
      });

      return { error: null };
    } catch (err: any) {
      console.error("Error deleting sales target:", err);
      toast({
        title: "Error",
        description: "Failed to delete sales target",
        variant: "destructive",
      });
      return { error: err.message };
    }
  };

  useEffect(() => {
    fetchAccountManagers();
    fetchTargets();
  }, []);

  // Also refetch when the component becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchAccountManagers();
        fetchTargets();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return {
    targets,
    accountManagers,
    loading,
    error,
    fetchTargets,
    fetchAccountManagers,
    createTarget,
    updateTarget,
    deleteTarget,
  };
};
