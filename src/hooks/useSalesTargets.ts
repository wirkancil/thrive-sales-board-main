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
        setAccountManagers([]);
        return;
      }

      // Cast the Supabase client to any here to prevent deep generic
      // type instantiation on PostgREST builder chains
      const { data: userProfile, error: profileError } = await (supabase as any)
        .from("user_profiles")
        .select("id, role, division_id, department_id")
        .eq("user_id", currentUser.id)
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
        // Manager assigns targets to Account Managers (not to themselves)
        // Manager receives targets from Head
        if (!userProfile.department_id) {
          console.warn(
            "Manager profile without department_id; will use explicit mapping or division scope",
            userProfile
          );
        }

        // Try explicit team mapping first via manager_team_members
        const { data: teamMap, error: teamErr } = await supabase
          .from("manager_team_members")
          .select("account_manager_id")
          .eq("manager_id", (userProfile as any).id);

        if (teamErr) {
          console.error("Error fetching manager team mapping:", teamErr);
          // Don't fail completely, try other methods
        }

        const mappedAmIds = (teamMap || [])
          .map((t: any) => t.account_manager_id)
          .filter(Boolean);

        if (mappedAmIds.length > 0) {
          // Use separate queries for roles to avoid TS generic recursion
          const buildMapped = (role: string) => {
            return (supabase as any)
              .from("user_profiles")
              .select("id, full_name, role")
              .in("id", mappedAmIds)
              .eq("is_active", true)
              .not("email", "ilike", "demo_am_%@example.com")
              .eq("role", role)
              .order("full_name");
          };

          const [{ data: am1, error: e1 }, { data: am2, error: e2 }] = await Promise.all([
            buildMapped("account_manager"),
            buildMapped("staff"),
          ]);

          const amError = e1 ?? e2;
          const amData = [...(am1 ?? []), ...(am2 ?? [])] as any[];

          if (amError != null) {
            console.error("Error fetching mapped account managers:", amError);
            // Continue to fallback methods
          } else if (amData.length > 0) {
            setAccountManagers(
              amData as Array<{ id: string; full_name: string; role?: string }>
            );
            return; // Do not fallback if explicit mapping exists and has data
          }
        }

        // Second preference: direct manager_id relationship mapping
        // Fetch both AMs and staff directly linked by manager_id
        const buildMgrLinked = (role: string) => {
          return (supabase as any)
            .from("user_profiles")
            .select("id, full_name, role")
            .eq("manager_id", (userProfile as any).id)
            .eq("is_active", true)
            .not("email", "ilike", "demo_am_%@example.com")
            .eq("role", role)
            .order("full_name");
        };

        const [{ data: mgr1, error: err1 }, { data: mgr2, error: err2 }] = await Promise.all([
          buildMgrLinked("account_manager"),
          buildMgrLinked("staff"),
        ]);

        const mgrLinkedErr = err1 ?? err2;
        const mgrLinkedAms = [...(mgr1 ?? []), ...(mgr2 ?? [])] as any[];

        if (mgrLinkedErr != null) {
          console.error("Error fetching manager_id-linked account managers:", mgrLinkedErr);
          // Continue to next fallback
        } else if (mgrLinkedAms.length > 0) {
          setAccountManagers(
            mgrLinkedAms as { id: string; full_name: string; role?: string }[]
          );
          return;
        }

        // Fallback to scoped active team members: prefer department, else division
        // Scoped by department (prefer) or division, and include both AMs and staff
        const buildScoped = (role: string) => {
          let qb: any = (supabase as any)
            .from("user_profiles")
            .select("id, full_name, role")
            .eq("is_active", true)
            .not("email", "ilike", "demo_am_%@example.com")
            .eq("role", role);
          if ((userProfile as any).department_id) {
            qb = qb.eq("department_id", (userProfile as any).department_id);
          } else if ((userProfile as any).division_id) {
            qb = qb.eq("division_id", (userProfile as any).division_id);
          }
          return qb.order("full_name");
        };

        const [{ data: scopedAm, error: scopedErr1 }, { data: scopedStaff, error: scopedErr2 }] =
          await Promise.all([
            buildScoped("account_manager"),
            buildScoped("staff"),
          ]);

        const amError = scopedErr1 ?? scopedErr2;
        const amData = [...(scopedAm ?? []), ...(scopedStaff ?? [])] as any[];

        if (amError != null) {
          console.error("Error fetching account managers:", amError);
          // Continue to broader fallback
        } else if (amData && amData.length > 0) {
          setAccountManagers(
            amData as Array<{ id: string; full_name: string; role?: string }>
          );
          return;
        }

        // If we reach here, no account managers found in department/division
        if (true) {
          // Last-resort: broaden search to division or global to avoid empty dropdown
          const buildBroad = (role: string) => {
            let qb: any = (supabase as any)
              .from("user_profiles")
              .select("id, full_name, role")
              .eq("is_active", true)
              .eq("role", role);
            if ((userProfile as any).division_id) {
              qb = qb.eq("division_id", (userProfile as any).division_id);
            }
            return qb.not("email", "ilike", "demo_am_%@example.com").order("full_name");
          };

          const [{ data: fb1, error: fe1 }, { data: fb2, error: fe2 }] = await Promise.all([
            buildBroad("account_manager"),
            buildBroad("staff"),
          ]);

        const fallbackErr = fe1 ?? fe2;
        const fallbackData = [...(fb1 ?? []), ...(fb2 ?? [])] as any[];

          if (fallbackErr != null) {
            console.error("Error fetching fallback account managers:", fallbackErr);
            // Continue to ultra fallback
          } else if (fallbackData && fallbackData.length > 0) {
            toast({
              title: "Showing division Account Managers",
              description: "No Account Managers found in your department",
            });
            setAccountManagers(
              fallbackData as { id: string; full_name: string; role?: string }[]
            );
            return;
          }

          if (true) {
            // New ultra-fallback: drop is_active filter to ensure real data surfaces
            const buildUltra = (role: string) => {
              let qb: any = (supabase as any)
                .from("user_profiles")
                .select("id, full_name, role")
                .eq("role", role);
              if ((userProfile as any).department_id) {
                qb = qb.eq("department_id", (userProfile as any).department_id);
              } else if ((userProfile as any).division_id) {
                qb = qb.eq("division_id", (userProfile as any).division_id);
              }
              return qb.not("email", "ilike", "demo_am_%@example.com").order("full_name");
            };

            const [{ data: u1, error: ue1 }, { data: u2, error: ue2 }] = await Promise.all([
              buildUltra("account_manager"),
              buildUltra("staff"),
            ]);

            const ultraErr = ue1 ?? ue2;
            const ultraData = [...(u1 ?? []), ...(u2 ?? [])] as any[];

            if (ultraErr != null) {
              console.error("Error fetching ultra fallback account managers:", ultraErr);
              // Continue to global fallback
            } else if (ultraData && ultraData.length > 0) {
              setAccountManagers(
                ultraData as { id: string; full_name: string; role?: string }[]
              );
              return;
            }

            if (true) {
              // Global ultra-fallback without is_active filter
              // Final dev-rescue fallback: include demo emails and inactive users
              const [{ data: g1, error: ge1 }, { data: g2, error: ge2 }] = await Promise.all([
                (supabase as any)
                  .from("user_profiles")
                  .select("id, full_name, role")
                  .eq("role", "account_manager")
                  .order("full_name"),
                (supabase as any)
                  .from("user_profiles")
                  .select("id, full_name, role")
                  .eq("role", "staff")
                  .order("full_name"),
              ]);

              const globalUltraErr = ge1 ?? ge2;
              const globalUltra = [...(g1 ?? []), ...(g2 ?? [])] as any[];

              if (globalUltraErr != null) {
                console.error("Error fetching global ultra fallback:", globalUltraErr);
                toast({
                  title: "No Account Managers Found",
                  description: "Please add Account Managers to your department first",
                  variant: "destructive",
                });
                setAccountManagers([]);
                return;
              }

              if (globalUltra && globalUltra.length > 0) {
                toast({
                  title: "Showing all Account Managers",
                  description: "Please configure your team/department",
                });
                setAccountManagers(
                  globalUltra as { id: string; full_name: string; role?: string }[]
                );
                return;
              }

              // Absolutely no account managers found
              toast({
                title: "No Account Managers Found",
                description: "Please add Account Managers to the system first",
                variant: "destructive",
              });
              setAccountManagers([]);
              return;
            }
          }
        }
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

        const { data: amData, error: amError } = await (supabase as any)
          .from("user_profiles")
          .select("id, full_name, role")
          .eq("division_id", userProfile.division_id)
          .eq("is_active", true)
          .not("email", "ilike", "demo_am_%@example.com")
          .or("role.eq.manager,role.eq.account_manager,role.eq.staff") // include staff under head
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
        const { data: amData, error: amError } = await (supabase as any)
          .from("user_profiles")
          .select("id, full_name, role")
          .eq("is_active", true)
          .not("email", "ilike", "demo_am_%@example.com")
          .or("role.eq.head,role.eq.manager,role.eq.account_manager,role.eq.staff") // include staff for admin view
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
      } else if (userProfile.role === "account_manager" || userProfile.role === "staff") {
        // Account managers and staff receive targets from their Manager
        // They should not be able to create their own targets
        setAccountManagers([]);
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

      const { data: userProfile, error: profileError } = await (supabase as any)
        .from("user_profiles")
        .select("id, role, division_id, department_id")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw profileError;
      }

      if (!userProfile) {
        throw new Error("User profile not found");
      }

      // Build query based on user role and permissions
      const baseQuery = `*`;
      let query = supabase.from("sales_targets").select(baseQuery);

      if (userProfile.role === "admin") {
        // Admin sees all targets
      } else if (userProfile.role === "manager") {
        // Manager sees targets in their department; if missing, fall back to division
        if (userProfile.department_id) {
          query = query.eq("department_id", userProfile.department_id);
        } else if (userProfile.division_id) {
          query = query.eq("division_id", userProfile.division_id);
        } else {
          console.warn("Manager profile missing department_id and division_id; showing own targets");
          query = query.eq("assigned_to", (userProfile as any).id);
        }
      } else if (userProfile.role === "head") {
        if (!userProfile.division_id) {
          console.error("Head missing division_id:", userProfile);
          throw new Error("Head account is missing division assignment");
        }

        // Head sees targets in their division
        query = query.eq("division_id", userProfile.division_id);
      } else {
        // Others see only their own targets
        query = query.eq("assigned_to", (userProfile as any).id);
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
      // Join assigned user profiles separately to avoid FK name dependency
      const targets = ((data as any[]) || []) as any[];
      const assignedIds = Array.from(
        new Set(targets.map((t) => t.assigned_to).filter(Boolean))
      );
      let userMap = new Map<string, any>();
      if (assignedIds.length > 0) {
        const { data: users, error: usersErr } = await (supabase as any)
          .from("user_profiles")
          .select("id, full_name, role, division_id, department_id")
          .in("id", assignedIds);
        if (!usersErr && users) {
          userMap = new Map((users as any[]).map((u: any) => [u.id, u]));
        }
      }

      const processedTargets = targets.map((item) => ({
        ...item,
        account_manager: userMap.get(item.assigned_to) || null,
      }));

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
        await (supabase as any)
          .from("user_profiles")
          .select("division_id, department_id")
          .eq("user_id", currentUser.id)
          .single();

      if (currentProfileError) {
        console.error(
          "Error fetching current user profile:",
          currentProfileError
        );
        throw currentProfileError;
      }

      const { data, error } = await (supabase as any)
        .from("sales_targets")
        .insert({
          assigned_to: targetData.account_manager_id,
          measure: targetData.measure,
          amount: targetData.target_amount,
          period_start: targetData.period_start,
          period_end: targetData.period_end,
          division_id: currentUserProfile?.division_id || null,
          department_id: currentUserProfile?.department_id || null,
        })
        .select("*")
        .single();

      if (error) throw error;

      let hydrated = data as any;
      if (hydrated?.assigned_to) {
        const { data: amUser } = await (supabase as any)
          .from("user_profiles")
          .select("id, full_name, role, division_id, department_id")
          .eq("id", hydrated.assigned_to)
          .maybeSingle();
        hydrated = { ...hydrated, account_manager: amUser || null };
      }

      setTargets((prev) => [hydrated as unknown as SalesTarget, ...prev]);
      toast({
        title: "Success",
        description: "Sales target created successfully",
      });

      return { data: hydrated, error: null };
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
        .select("*")
        .single();

      if (error) throw error;

      let hydrated = data as any;
      if (hydrated?.assigned_to) {
        const { data: amUser } = await (supabase as any)
          .from("user_profiles")
          .select("id, full_name, role, division_id, department_id")
          .eq("id", hydrated.assigned_to)
          .maybeSingle();
        hydrated = { ...hydrated, account_manager: amUser || null };
      }

      setTargets((prev) =>
        prev.map((target) =>
          target.id === id ? (hydrated as unknown as SalesTarget) : target
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
