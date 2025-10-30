import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import AddOpportunityModal from '@/components/modals/AddOpportunityModal';
import { CurrencyDisplay } from '@/components/CurrencyDisplay';
import { OpportunityCard } from '@/components/OpportunityCard';

interface Opportunity {
  id: string;
  name: string;
  amount?: number | null;
  currency?: string;
  stage: string;
  status: string;
  probability?: number;
  expected_close_date?: string;
  created_at: string;
  company_name?: string;
  contact_name?: string;
  next_step_title?: string;
  next_step_due_date?: string;
  is_won?: boolean;
}

const Opportunities = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchOpportunities();
  }, [user]);

  const fetchOpportunities = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          pipeline_stages!stage_id (
            name
          )
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map the data to include stage name
      const mappedData = (data || []).map(opp => ({
        ...opp,
        stage: opp.pipeline_stages?.name || 'Prospecting'
      }));

      setOpportunities(mappedData);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      toast({
        title: "Error",
        description: "Failed to load opportunities",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Prospecting': return 'bg-blue-100 text-blue-800';
      case 'Qualification': return 'bg-yellow-100 text-yellow-800';
      case 'Discovery': return 'bg-orange-100 text-orange-800';
      case 'Presentation/POC': return 'bg-purple-100 text-purple-800';
      case 'Closed Won': return 'bg-green-100 text-green-800';
      case 'Closed Lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalValue = opportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);
  const activeOpportunities = opportunities.filter(opp => !['Closed Won', 'Closed Lost'].includes(opp.stage));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Opportunities</h1>
        </div>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Account Manager Opportunity</h1>
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Field Sales / AE
          </Badge>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-blue-500 hover:bg-blue-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Opportunity
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  <CurrencyDisplay amount={totalValue} />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Deals</p>
                <p className="text-2xl font-bold">{activeOpportunities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">
                  {opportunities.length > 0 
                    ? Math.round((opportunities.filter(o => o.stage === 'Closed Won').length / opportunities.length) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Stages */}
      <div className="space-y-6">
        {/* Prospecting Stage */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Prospecting (10%)</h2>
              <p className="text-sm text-muted-foreground">Contact engaged, ICP fit, discovery booked</p>
            </div>
            <Badge variant="outline" className="text-sm">
              {opportunities.filter(o => o.stage === 'Prospecting').length}
            </Badge>
          </div>
          <div className="text-lg font-bold mb-4">
            <CurrencyDisplay amount={opportunities.filter(o => o.stage === 'Prospecting').reduce((sum, o) => sum + (o.amount || 0), 0)} />
          </div>
          {opportunities.filter(o => o.stage === 'Prospecting').length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No opportunities in this stage
            </div>
          ) : (
            <div className="grid gap-4">
              {opportunities.filter(o => o.stage === 'Prospecting').map((opportunity) => (
                <OpportunityCard 
                  key={opportunity.id} 
                  opportunity={opportunity}
                  onEdit={fetchOpportunities}
                />
              ))}
            </div>
          )}
        </div>

        {/* Other Stages - Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Qualification */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
              <h2 className="text-xl font-semibold">Qualification (20%)</h2>
                <p className="text-sm text-muted-foreground">Need, budget/timeline, buying roles known, next step set</p>
              </div>
              <Badge variant="outline" className="text-sm">
                {opportunities.filter(o => o.stage === 'Qualification').length}
              </Badge>
            </div>
            <div className="text-lg font-bold mb-4">
              <CurrencyDisplay amount={opportunities.filter(o => o.stage === 'Qualification').reduce((sum, o) => sum + (o.amount || 0), 0)} />
            </div>
            {opportunities.filter(o => o.stage === 'Qualification').length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No opportunities in this stage
              </div>
            ) : (
              <div className="space-y-3">
                {opportunities.filter(o => o.stage === 'Qualification').map((opportunity) => (
                  <OpportunityCard 
                    key={opportunity.id} 
                    opportunity={opportunity}
                    onEdit={fetchOpportunities}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Approach/Discovery */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
              <h2 className="text-xl font-semibold">Approach/Discovery (40%)</h2>
                <p className="text-sm text-muted-foreground">Decision process/criteria mapped, champion identified</p>
              </div>
              <Badge variant="outline" className="text-sm">
                {opportunities.filter(o => o.stage === 'Approach/Discovery').length}
              </Badge>
            </div>
            <div className="text-lg font-bold mb-4">
              <CurrencyDisplay amount={opportunities.filter(o => o.stage === 'Approach/Discovery').reduce((sum, o) => sum + (o.amount || 0), 0)} />
            </div>
            {opportunities.filter(o => o.stage === 'Approach/Discovery').length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No opportunities in this stage
              </div>
            ) : (
              <div className="space-y-3">
                {opportunities.filter(o => o.stage === 'Approach/Discovery').map((opportunity) => (
                  <OpportunityCard 
                    key={opportunity.id} 
                    opportunity={opportunity}
                    onEdit={fetchOpportunities}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Presentation/POC Stage */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Presentation/POC (60%)</h2>
              <p className="text-sm text-muted-foreground">Demo/POC done, success metrics agreed, readout scheduled</p>
            </div>
            <Badge variant="outline" className="text-sm">
              {opportunities.filter(o => o.stage === 'Presentation/POC').length}
            </Badge>
          </div>
          <div className="text-lg font-bold mb-4">
            <CurrencyDisplay amount={opportunities.filter(o => o.stage === 'Presentation/POC').reduce((sum, o) => sum + (o.amount || 0), 0)} />
          </div>
          {opportunities.filter(o => o.stage === 'Presentation/POC').length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No opportunities in this stage
            </div>
          ) : (
            <div className="grid gap-4">
              {opportunities.filter(o => o.stage === 'Presentation/POC').map((opportunity) => (
                <OpportunityCard 
                  key={opportunity.id} 
                  opportunity={opportunity}
                  onEdit={fetchOpportunities}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddOpportunityModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddOpportunity={fetchOpportunities}
      />
    </div>
  );
};

export default Opportunities;