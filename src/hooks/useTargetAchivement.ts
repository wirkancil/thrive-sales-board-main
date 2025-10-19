import { supabase } from "@/integrations/supabase/client";
import React from "react";
import { toast } from "sonner";

export default function useTargetAchievement(user) {
  const [targetAchievement, setTargetAchievement] = React.useState({
    revenue: { actual: 0, target: 0, percentage: 0 },
    margin: { actual: 0, target: 0, percentage: 0 },
  });

  React.useEffect(() => {
    if (!user?.id) return;

    const fetchAchievement = async () => {
      try {
        const { data: opportunities, error: oppError } = await supabase
          .from("opportunities")
          .select(
            "id, amount, status, stage, is_won, is_closed, expected_close_date"
          )
          .eq("owner_id", user.id);

        if (oppError) throw oppError;

        // --- 1️⃣ Hitung total revenue dari deals yang WON ---
        const wonOpps = opportunities.filter(
          (opp) => opp.status === "won" || opp.is_won === true
        );

        const wonAmount =
          wonOpps.reduce((sum, opp) => sum + (opp.amount || 0), 0) || 0;

        const wonOpportunityIds = wonOpps.map((opp) => opp.id);

        // --- 2️⃣ Ambil biaya dari pipeline_items (berdasarkan opportunity yang won) ---
        const { data: pipelineItems, error: pipelineError } = await supabase
          .from("pipeline_items")
          .select(
            "opportunity_id, cost_of_goods, service_costs, other_expenses"
          )
          .in("opportunity_id", wonOpportunityIds);

        if (pipelineError) throw pipelineError;

        const totalCosts =
          pipelineItems?.reduce((sum, item) => {
            const totalItemCost =
              (item.cost_of_goods || 0) +
              (item.service_costs || 0) +
              (item.other_expenses || 0);
            return sum + totalItemCost;
          }, 0) || 0;

        const totalMargin = wonAmount - totalCosts;

        // --- 3️⃣ Ambil sales target berdasarkan user ---
        const { data: salesTargets, error: targetError } = await supabase
          .from("sales_targets")
          .select("amount, measure, created_at")
          .eq("assigned_to", user.id)
          .order("created_at", { ascending: false });

        if (targetError) throw targetError;

        // --- 4️⃣ Pisahkan target berdasarkan measure ---
        const revenueTarget =
          salesTargets?.find((t) => t.measure === "revenue")?.amount || 0;
        const marginTarget =
          salesTargets?.find((t) => t.measure === "margin")?.amount || 0;

        // --- 5️⃣ Hitung persentase pencapaian ---
        const revenuePercentage =
          revenueTarget > 0 ? (wonAmount / revenueTarget) * 100 : 0;
        const marginPercentage =
          marginTarget > 0 ? (totalMargin / marginTarget) * 100 : 0;

        // --- 6️⃣ Set hasil ke state ---
        setTargetAchievement({
          revenue: {
            actual: wonAmount,
            target: revenueTarget,
            percentage: revenuePercentage,
          },
          margin: {
            actual: totalMargin,
            target: marginTarget,
            percentage: marginPercentage,
          },
        });
      } catch (err) {
        console.error("Error calculating achievement:", err);
        toast.error("Failed to fetch target achievement");
      }
    };

    fetchAchievement();
  }, [user?.id]);

  return targetAchievement;
}
