import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
// Icon imports from lucide-react
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Clock,
  Target,
  CheckCircle,
  XCircle,
  Calendar,
  AlertTriangle,
  Plus,
  FileText
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { RoleBadge } from "@/components/RoleBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, STAGE_PROBABILITIES, STAGE_PERFORMANCE_RULES, computeCumulativePerformanceScore } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AddOpportunityModal from "@/components/modals/AddOpportunityModal";
import { NextStepModal } from "@/components/modals/NextStepModal";
import { MarkLostModal } from "@/components/modals/MarkLostModal";
import OpportunityDetailModal from "@/components/modals/OpportunityDetailModal";
import { StageProgressBar } from "@/components/stages/StageProgressBar";
import { StageChip } from "@/components/stages/StageChip";
import { DelayModal } from "@/components/modals/DelayModal";

interface PipelineItem {
  id: string;
  opportunity_name: string;
  customer_name: string;
  amount: number | null;
  currency: string;
  status: string;
  expected_close_date: string | null;
  next_step_title?: string | null;
  next_step_due_date?: string | null;
  probability: number | null;
  created_at: string;
  opportunity_id: string;
  quotation_no: string | null;
  cost_of_goods: number | null;
  service_costs: number | null;
  other_expenses: number | null;
  stage: string;
  stage_entered_at: string | null;
  days_in_stage: number;
  is_overdue: boolean;
}

const PIPELINE_STAGES = [
  { key: 'Prospecting', name: 'Prospecting (10%)', color: 'bg-slate-500', description: 'Initial contact and research', points: 10 },
  { key: 'Qualification', name: 'Qualification (10%)', color: 'bg-blue-500', description: 'Needs assessment and qualification', points: 10 },
  { key: 'Discovery', name: 'Discovery (20%)', color: 'bg-cyan-500', description: 'Discovery and solution mapping', points: 20 },
  { key: 'Presentation/POC', name: 'Presentation/POC (20%)', color: 'bg-indigo-500', description: 'Proof of concept and presentation', points: 20 },
  { key: 'Negotiation', name: 'Negotiation (20%)', color: 'bg-purple-500', description: 'Commercial terms sent, decision date confirmed', points: 20 },
  { key: 'Closed Won', name: 'Closed Won (20)', color: 'bg-green-500', description: 'Opportunity won - earns 20 points', points: 20 },
  { key: 'Closed Lost', name: 'Closed Lost (0)', color: 'bg-red-500', description: 'Opportunity lost - earns 0 points', points: 0 }
];

export default function Pipeline() {
  const { profile: userProfile, loading: profileLoading } = useProfile();
  const [showAddOpportunityModal, setShowAddOpportunityModal] = useState(false);
  const [pipelineItems, setPipelineItems] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lostModalOpen, setLostModalOpen] = useState(false);
  const [selectedPipelineItem, setSelectedPipelineItem] = useState<PipelineItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>('');

  useEffect(() => {
    if (!userProfile) return;
    fetchPipelineItems();
  }, [userProfile]);

  const fetchPipelineItems = async () => {
    if (!userProfile) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('pipeline_items')
        .select(`
          *,
          opportunity:opportunities!opportunity_id(
            name,
            customer:organizations!customer_id(name),
            owner_id,
            stage,
            stage_entered_at,
            next_step_title,
            next_step_due_date
          )
        `);

      // Role-based filtering
      if (userProfile.role === 'account_manager') {
        query = query.eq('opportunity.owner_id', userProfile.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Get stage metrics for each opportunity
      const opportunityIds = (data || []).map((item: any) => item.opportunity_id);
      const { data: metricsData } = await supabase
        .from('opportunity_stage_metrics')
        .select('id, days_in_stage, is_overdue')
        .in('id', opportunityIds);

      const metricsMap = new Map(
        (metricsData || []).map((m: any) => [m.id, m])
      );

      // Fallback: fetch opportunity core fields directly by IDs to avoid missing nested join data
      const { data: oppFallbackData } = await supabase
        .from('opportunities')
        .select('id, name, stage, stage_entered_at, next_step_title, next_step_due_date')
        .in('id', opportunityIds);
      const namesMap = new Map((oppFallbackData || []).map((n: any) => [n.id, n.name]));
      const stagesMap = new Map((oppFallbackData || []).map((n: any) => [n.id, n.stage]));
      const stageEnteredAtMap = new Map((oppFallbackData || []).map((n: any) => [n.id, n.stage_entered_at]));
      const nextStepTitleMap = new Map((oppFallbackData || []).map((n: any) => [n.id, n.next_step_title]));
      const nextStepDueDateMap = new Map((oppFallbackData || []).map((n: any) => [n.id, n.next_step_due_date]));

      const mappedData: PipelineItem[] = (data || []).map((item: any) => {
        const metrics = metricsMap.get(item.opportunity_id);
        const rawName: string | undefined = item.opportunity?.name;
        const fallbackName: string | undefined = namesMap.get(item.opportunity_id);
        const normalizedName = (rawName?.trim() || fallbackName?.trim() || '[No Name]');
        return {
          id: item.id,
          opportunity_name: normalizedName,
          customer_name: item.opportunity?.customer?.name || 'Unknown Customer',
          amount: item.amount,
          currency: item.currency || 'IDR',
          status: item.status || 'negotiation',
          expected_close_date: item.expected_close_date,
          next_step_title: item.opportunity?.next_step_title ?? nextStepTitleMap.get(item.opportunity_id) ?? null,
          next_step_due_date: item.opportunity?.next_step_due_date ?? nextStepDueDateMap.get(item.opportunity_id) ?? null,
          probability: item.probability || 0,
          created_at: item.created_at,
          opportunity_id: item.opportunity_id,
          quotation_no: item.quotation_no,
          cost_of_goods: item.cost_of_goods,
          service_costs: item.service_costs,
          other_expenses: item.other_expenses,
          // Gunakan field teks stage untuk kesederhanaan, lalu normalisasi ke key (fallback ke data langsung dari opportunities)
          stage: normalizeStageName(item.opportunity?.stage ?? stagesMap.get(item.opportunity_id) ?? 'Prospecting'),
          stage_entered_at: item.opportunity?.stage_entered_at ?? stageEnteredAtMap.get(item.opportunity_id) ?? null,
          days_in_stage: metrics?.days_in_stage || 0,
          is_overdue: metrics?.is_overdue || false
        };
      });

      setPipelineItems(mappedData);
    } catch (error) {
      console.error('Error fetching pipeline items:', error);
      toast.error('Failed to load pipeline items');
    } finally {
      setLoading(false);
    }
  };

  const markAsWon = async (opportunityId: string) => {
    try {
      // Update opportunity status and stage
      const { error: oppError } = await supabase
        .from('opportunities')
        .update({ 
          status: 'won',
          stage: 'Closed Won',
          expected_close_date: new Date().toISOString().split('T')[0],
          probability: 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', opportunityId);

      if (oppError) throw oppError;

      // Update pipeline item status to "won"
      const { error: pipelineError } = await supabase
        .from('pipeline_items')
        .update({ 
          status: 'won'
        })
        .eq('opportunity_id', opportunityId);

      if (pipelineError) throw pipelineError;

      // Create activity record for the win (optional, remove if causing issues)
      try {
        await supabase
          .from('activities')
          .insert({
            opportunity_id: opportunityId,
            subject: 'Opportunity marked as won',
            description: 'Congratulations! This opportunity has been successfully closed.',
            status: 'completed',
            created_by: (await supabase.auth.getUser()).data.user?.id
          });
      } catch (activityError) {
        console.warn('Warning: Failed to create activity record:', activityError);
      }

      toast.success('Pipeline item marked as won! 🎉');
      fetchPipelineItems();
    } catch (error) {
      console.error('Error marking opportunity as won:', error);
      toast.error('Failed to mark opportunity as won');
    }
  };

  const openLostModal = (pipelineItem: PipelineItem) => {
    setSelectedPipelineItem(pipelineItem);
    setLostModalOpen(true);
  };

  const openDetailModal = (opportunityId: string) => {
    setSelectedOpportunityId(opportunityId);
    setShowDetailModal(true);
  };

  const getInactivityDays = (lastActivity: string | null) => {
    if (!lastActivity) return null;
    const days = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getNextStepStatus = (dueDate: string | null) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'overdue', days: Math.abs(diffDays) };
    if (diffDays === 0) return { status: 'today', days: 0 };
    if (diffDays <= 3) return { status: 'due_soon', days: diffDays };
    return { status: 'future', days: diffDays };
  };

  const getPipelineItemsByStage = () => {
    const stageGroups: { [key: string]: PipelineItem[] } = {};
    
    PIPELINE_STAGES.forEach(stage => {
      stageGroups[stage.key] = pipelineItems.filter(item => {
        // Primary match by opportunity stage
        if (item.stage === stage.key) return true;

        // Fallback by pipeline item status to ensure closed items show correctly
        if (stage.key === 'Closed Won' && item.status === 'won') return true;
        if (stage.key === 'Closed Lost' && item.status === 'lost') return true;

        return false;
      });
    });
    
    return stageGroups;
  };

  const renderPipelineItemCard = (item: PipelineItem, stage: string) => {
    const nextStepStatus = getNextStepStatus(item.next_step_due_date || null);
    const perfScore = computeCumulativePerformanceScore({
      stage: item.stage,
      days_in_stage: item.days_in_stage,
      stage_entered_at: item.stage_entered_at,
      created_at: item.created_at,
    });

    const formatDate = (dateStr?: string | null) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
      <Card key={item.id} className="mb-3 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-sm truncate">{item.opportunity_name}</h4>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                Perf {perfScore}
              </Badge>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {Math.round(((STAGE_PROBABILITIES[item.stage] || 0) * 100))}%
              </Badge>
            </div>
          </div>
          
          <div className="text-lg font-bold text-primary mb-2">
            {formatCurrency(item.amount || 0)}
          </div>

          {/* Stage Chip */}
          <div className="mb-3">
            <StageChip 
              stage={item.stage}
              daysInStage={item.days_in_stage}
              isOverdue={item.is_overdue}
            />
          </div>

          {/* Stage Progress Bar */}
          <div className="mb-3">
            <StageProgressBar
              currentStage={item.stage}
              stageEnteredAt={item.stage_entered_at}
              daysInStage={item.days_in_stage}
              isOverdue={item.is_overdue}
            />
          </div>

          <div className="flex flex-wrap gap-1 mb-3">

            {/* Next Step Due Date Badge */}
            {nextStepStatus && (
              <Badge 
                variant={nextStepStatus.status === 'overdue' ? 'destructive' : 'secondary'}
                className={`text-xs ${
                  nextStepStatus.status === 'overdue' ? 'bg-red-100 text-red-800' :
                  nextStepStatus.status === 'today' ? 'bg-yellow-100 text-yellow-800' :
                  nextStepStatus.status === 'due_soon' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                <Calendar className="w-3 h-3 mr-1" />
                {`Due date ${formatDate(item.next_step_due_date)}`}
              </Badge>
            )}

            {/* Currency Badge */}
            <Badge variant="outline" className="text-xs">
              {item.currency}
            </Badge>
          </div>

          {item.next_step_title && item.next_step_title.toLowerCase().startsWith('delay:') && (
            <p className="text-xs text-amber-700 mb-2">
              {item.next_step_title}
            </p>
          )}

          {item.customer_name && (
            <p className="text-xs text-muted-foreground mb-2">{item.customer_name}</p>
          )}

          {item.quotation_no && (
            <p className="text-xs text-muted-foreground mb-3 italic">
              Quote: {item.quotation_no}
            </p>
          )}

          {/* Cost breakdown if available */}
          {(item.cost_of_goods || item.service_costs || item.other_expenses) && (
            <div className="text-xs text-muted-foreground mb-3">
              <div>COGS: {formatCurrency(item.cost_of_goods || 0)}</div>
              <div>Service: {formatCurrency(item.service_costs || 0)}</div>
              <div>Other: {formatCurrency(item.other_expenses || 0)}</div>
            </div>
          )}

          {/* Inline Actions - Only show Won/Lost buttons in Negotiation stage */}
          {stage === 'Negotiation' && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs text-green-700 hover:bg-green-50 border-green-200"
                onClick={() => markAsWon(item.opportunity_id)}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Won
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs text-red-700 hover:bg-red-50 border-red-200"
                onClick={() => openLostModal(item)}
              >
                <XCircle className="w-3 h-3 mr-1" />
                Lost
              </Button>
            </div>
          )}

          {/* Actions: Next Step + Detail (hide Next Step/Delay for Closed Won/Lost) */}
          <div className="flex justify-start gap-2">
            {stage !== 'Closed Won' && stage !== 'Closed Lost' && (
              <>
                <DelayModal
                  opportunityId={item.opportunity_id}
                  currentReason={item.next_step_title}
                  currentDueDate={item.next_step_due_date || undefined}
                  onSuccess={fetchPipelineItems}
                />
                <NextStepModal
                  opportunityId={item.opportunity_id}
                  opportunityName={item.opportunity_name}
                  currentNextStep={undefined}
                  currentDueDate={item.next_step_due_date || undefined}
                  onSuccess={fetchPipelineItems}
                />
              </>
            )}
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs text-blue-700 hover:bg-blue-50 border-blue-200"
              onClick={() => openDetailModal(item.opportunity_id)}
            >
              <FileText className="w-3 h-3 mr-1" />
              Detail
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading || profileLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Unable to load user profile</p>
        </CardContent>
      </Card>
    );
  }

  const stageGroups = getPipelineItemsByStage();
  const totalValue = pipelineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const activeDeals = pipelineItems.filter(item => 
    !['Closed Won', 'Closed Lost'].includes(item.stage)
  ).length;
  const wonOpportunities = stageGroups['Closed Won'] || [];
  const lostOpportunities = stageGroups['Closed Lost'] || [];
  const winRate = wonOpportunities.length + lostOpportunities.length > 0 
    ? Math.round((wonOpportunities.length / (wonOpportunities.length + lostOpportunities.length)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-foreground">Pipeline</h1>
          <RoleBadge role={userProfile.role as any} />
        </div>
        <Button onClick={() => setShowAddOpportunityModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Opportunity
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              {pipelineItems.length} pipeline items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDeals}</div>
            <p className="text-xs text-muted-foreground">
              Open opportunities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate}%</div>
            <p className="text-xs text-muted-foreground">
              {wonOpportunities.length} won of {wonOpportunities.length + lostOpportunities.length} closed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Health</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{PIPELINE_STAGES.filter(s => !['Closed Won', 'Closed Lost'].includes(s.key)).filter(s => (stageGroups[s.key] || []).length > 0).length}</div>
            <p className="text-xs text-muted-foreground">
              Active stages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Board - All Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageOpportunities = stageGroups[stage.key] || [];
          const stageValue = stageOpportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);

          return (
            <Card key={stage.key} className="h-fit">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                    {stage.name}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {stageOpportunities.length}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  {formatCurrency(stageValue)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stage.description} — earns {STAGE_PERFORMANCE_RULES[stage.key]?.points ?? stage.points} points
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {stageOpportunities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No opportunities in this stage
                    </p>
                  ) : (
                    stageOpportunities.map(item => renderPipelineItemCard(item, stage.key))
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Opportunity Modal */}
      <AddOpportunityModal
        isOpen={showAddOpportunityModal}
        onClose={() => setShowAddOpportunityModal(false)}
        onAddOpportunity={() => {
          fetchPipelineItems();
          setShowAddOpportunityModal(false);
        }}
      />

      {/* Mark Lost Modal */}
      {selectedPipelineItem && (
        <MarkLostModal
          open={lostModalOpen}
          onOpenChange={setLostModalOpen}
          opportunityId={selectedPipelineItem.opportunity_id}
          opportunityName={selectedPipelineItem.opportunity_name}
          onSuccess={fetchPipelineItems}
        />
      )}

      {/* Opportunity Detail Modal */}
      <OpportunityDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        opportunityId={selectedOpportunityId}
      />

    </div>
  );
}
// Normalisasi nama stage dari DB agar cocok dengan key di atas
const normalizeStageName = (name: string) => {
  const lower = (name || '').trim().toLowerCase();
  switch (lower) {
    case 'prospecting':
      return 'Prospecting';
    case 'qualification':
      return 'Qualification';
    case 'discovery':
    case 'approach/discovery':
      return 'Discovery';
    case 'presentation / poc':
    case 'presentation/poc':
      return 'Presentation/POC';
    case 'proposal / negotiation':
    case 'proposal/negotiation':
    case 'negotiation':
      return 'Negotiation';
    case 'closed won':
      return 'Closed Won';
    case 'closed lost':
      return 'Closed Lost';
    default:
      return 'Prospecting';
  }
};