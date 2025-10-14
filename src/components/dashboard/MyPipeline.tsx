import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';

interface PipelineOpportunity {
  id: string;
  name: string;
  amount: number;
  opp_stage: string;
  probability: number;
  expected_close_date: string | null;
  customer_name?: string;
}

export const MyPipeline: React.FC = () => {
  const { formatCurrency } = useCurrencyFormatter();
  const [opportunities, setOpportunities] = useState<PipelineOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPipeline = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        const { data: opps } = await supabase
          .from('opportunities')
          .select(`
            id,
            name,
            amount,
            opp_stage,
            probability,
            expected_close_date,
            organizations!opportunities_customer_id_fkey(name)
          `)
          .eq('owner_id', user.user.id)
          .order('expected_close_date', { ascending: true })
          .limit(5);

        if (opps) {
          const formattedOpps = opps.map(opp => ({
            ...opp,
            customer_name: opp.organizations?.name || 'Unknown Customer'
          }));
          setOpportunities(formattedOpps);
        }
      } catch (error) {
        console.error('Error fetching pipeline:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPipeline();
  }, []);


  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'contacted': 'bg-blue-100 text-blue-800',
      'qualified': 'bg-yellow-100 text-yellow-800',
      'proposal': 'bg-orange-100 text-orange-800',
      'negotiation': 'bg-purple-100 text-purple-800',
      'verbal': 'bg-green-100 text-green-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const totalPipelineValue = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
  const weightedValue = opportunities.reduce((sum, opp) => sum + ((opp.amount || 0) * (opp.probability || 0) / 100), 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Pipeline</CardTitle>
          <CardDescription>Loading your active deals...</CardDescription>
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
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            My Pipeline
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/pipeline')}
          >
            <Eye className="h-4 w-4 mr-2" />
            View All
          </Button>
        </CardTitle>
        <CardDescription>Track your active deals and opportunities</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pipeline Summary */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Total Pipeline</p>
            <p className="text-xl font-bold">{formatCurrency(totalPipelineValue)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Weighted Value</p>
            <p className="text-xl font-bold">{formatCurrency(weightedValue)}</p>
          </div>
        </div>

        {/* Active Opportunities */}
        <div className="space-y-4">
          <h4 className="font-medium">Active Opportunities</h4>
          {opportunities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No active opportunities found</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => navigate('/pipeline')}
              >
                Create New Opportunity
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {opportunities.map((opp) => (
                <div key={opp.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{opp.name}</p>
                      <p className="text-sm text-muted-foreground">{opp.customer_name}</p>
                    </div>
                    <Badge variant="secondary" className={getStageColor(opp.opp_stage || '')}>
                      {opp.opp_stage?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium">{formatCurrency(opp.amount || 0)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(opp.expected_close_date)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Probability</span>
                      <span>{opp.probability}%</span>
                    </div>
                    <Progress value={opp.probability} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};