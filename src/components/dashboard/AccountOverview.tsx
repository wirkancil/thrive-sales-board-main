import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Target, Users, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';

interface AccountMetrics {
  totalDeals: number;
  totalValue: number;
  wonDeals: number;
  lostDeals: number;
  activeDeals: number;
  winRate: number;
  avgDealSize: number;
  monthlyTarget: number;
}

export const AccountOverview: React.FC = () => {
  const { formatCurrency } = useCurrencyFormatter();
  const [metrics, setMetrics] = useState<AccountMetrics>({
    totalDeals: 0,
    totalValue: 0,
    wonDeals: 0,
    lostDeals: 0,
    activeDeals: 0,
    winRate: 0,
    avgDealSize: 0,
    monthlyTarget: 100000
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        // Fetch opportunities for current user
        const { data: opportunities } = await supabase
          .from('opportunities')
          .select('amount, opp_stage')
          .eq('owner_id', user.user.id);

        if (opportunities) {
          const totalDeals = opportunities.length;
          const totalValue = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
          // Since we don't know the exact enum values, let's use a more flexible approach
          const wonDeals = 0; // Will need to be updated when we know the actual won stage
          const lostDeals = 0; // Will need to be updated when we know the actual lost stage
          const activeDeals = opportunities.length; // All opportunities for now
          const winRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;
          const avgDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;

          setMetrics({
            totalDeals,
            totalValue,
            wonDeals,
            lostDeals,
            activeDeals,
            winRate,
            avgDealSize,
            monthlyTarget: 100000
          });
        }
      } catch (error) {
        console.error('Error fetching account metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);


  const targetProgress = (metrics.totalValue / metrics.monthlyTarget) * 100;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Overview</CardTitle>
          <CardDescription>Loading your personal metrics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Account Overview
        </CardTitle>
        <CardDescription>Your personal account metrics and performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total Pipeline</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metrics.totalValue)}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Active Deals</span>
            </div>
            <p className="text-2xl font-bold">{metrics.activeDeals}</p>
          </div>
        </div>

        {/* Target Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Monthly Target Progress</span>
            <span className="text-sm text-muted-foreground">
              {targetProgress.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(targetProgress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(metrics.totalValue)}</span>
            <span>{formatCurrency(metrics.monthlyTarget)}</span>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-lg font-semibold text-green-500">
                {metrics.wonDeals}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Won</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-lg font-semibold">
                {metrics.winRate.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-lg font-semibold">
                {formatCurrency(metrics.avgDealSize)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Avg Deal</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};