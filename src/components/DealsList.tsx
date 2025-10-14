import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Minimal types for fetched data
type Deal = {
  id: string;
  company_name: string;
  deal_value: number;
  stage: string | null;
  status: string | null;
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function statusVariant(status?: string | null) {
  const s = (status || "").toLowerCase();
  if (s === "hot") return "destructive" as const;
  if (s === "warm") return "secondary" as const;
  if (s === "cold") return "outline" as const;
  return "default" as const;
}

export default function DealsList() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchDeals() {
      setLoading(true);
      setError(null);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Please log in to view deals.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("deals")
        .select("id, company_name, deal_value, stage, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!isMounted) return;
      if (error) {
        setError("⚠️ Failed to load deals from database.");
        setDeals([]);
      } else {
        setDeals((data as Deal[]) || []);
      }
      setLoading(false);
    }

    fetchDeals();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-6 text-muted-foreground">
        <span
          className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary"
          aria-hidden
        />
        <span>Loading…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!deals.length) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No deals found. Try adding one.
      </div>
    );
  }

  return (
    <section aria-labelledby="deals-heading" className="space-y-4">
      <header className="sticky top-0 z-10 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h2 id="deals-heading" className="px-2 py-4 text-lg font-semibold">
          Recent Deals
        </h2>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {deals.map((deal) => (
          <li key={deal.id}>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base font-semibold">
                    {deal.company_name}
                  </CardTitle>
                  <Badge variant={statusVariant(deal.status)}>
                    {deal.status || "Unknown"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <div className="text-2xl font-bold">
                  {currency.format(Number(deal.deal_value || 0))}
                </div>
                <Badge title="Stage" className="shrink-0">
                  {deal.stage || "Lead"}
                </Badge>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
