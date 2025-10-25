import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Zap, 
  Plus, 
  Settings, 
  Clock, 
  Mail, 
  Bell, 
  Users, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger_type: 'stage_change' | 'time_based' | 'value_change' | 'inactivity';
  conditions: any;
  actions: any;
  is_active: boolean;
  created_at: string;
}

interface WorkflowExecution {
  id: string;
  rule_id: string;
  opportunity_id: string;
  status: 'success' | 'failed' | 'pending';
  executed_at: string;
  result: any;
}

type NewWorkflowRule = Omit<WorkflowRule, 'id' | 'is_active' | 'created_at'>;

export const WorkflowAutomation = () => {
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [newRule, setNewRule] = useState<NewWorkflowRule>({
    name: '',
    description: '',
    trigger_type: 'stage_change' as const,
    conditions: {},
    actions: {}
  });

  useEffect(() => {
    const fetchWorkflowData = async () => {
      setLoading(true);
      try {
        // Initialize empty data - in real app, fetch from API
        setRules([]);
        setExecutions([]);
      } catch (error) {
        console.error('Error fetching workflow data:', error);
        toast.error('Failed to load workflow data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkflowData();
  }, []);



  const toggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      // Update rule status
      setRules(prev => prev.map(rule => 
        rule.id === ruleId ? { ...rule, is_active: isActive } : rule
      ));
      
      toast.success(`Workflow ${isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('Failed to update workflow rule');
    }
  };

  const createRule = async () => {
    try {
      const rule: WorkflowRule = {
        id: `rule-${Date.now()}`,
        ...newRule,
        is_active: true,
        created_at: new Date().toISOString()
      };

      setRules(prev => [...prev, rule]);
      setShowCreateRule(false);
      setNewRule({
        name: '',
        description: '',
        trigger_type: 'stage_change',
        conditions: {},
        actions: {}
      });
      
      toast.success('Workflow rule created successfully');
    } catch (error) {
      console.error('Error creating rule:', error);
      toast.error('Failed to create workflow rule');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'stage_change':
        return <TrendingUp className="h-4 w-4" />;
      case 'time_based':
        return <Clock className="h-4 w-4" />;
      case 'value_change':
        return <TrendingUp className="h-4 w-4" />;
      case 'inactivity':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Workflow Automation
          </h2>
          <p className="text-muted-foreground">Automate your sales process with intelligent workflows</p>
        </div>
        <Button onClick={() => setShowCreateRule(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">Active Rules</TabsTrigger>
          <TabsTrigger value="executions">Recent Executions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getTriggerIcon(rule.trigger_type)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{rule.name}</h3>
                        <Badge variant={rule.is_active ? "default" : "secondary"}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Trigger: {rule.trigger_type.replace('_', ' ')}</span>
                        <span>Created: {new Date(rule.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                    />
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          {executions.map((execution) => {
            const rule = rules.find(r => r.id === execution.rule_id);
            return (
              <Card key={execution.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(execution.status)}
                      <div>
                        <p className="font-medium">{rule?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Opportunity: {execution.opportunity_id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium capitalize">{execution.status}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(execution.executed_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Executions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{executions.length}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((executions.filter(e => e.status === 'success').length / executions.length) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">Successful executions</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Active Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rules.filter(r => r.is_active).length}</div>
                <p className="text-xs text-muted-foreground">Currently running</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Rule Modal */}
      {showCreateRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create Workflow Rule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  placeholder="Enter rule name"
                  value={newRule.name}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rule-description">Description</Label>
                <Textarea
                  id="rule-description"
                  placeholder="Describe what this rule does"
                  value={newRule.description}
                  onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="trigger-type">Trigger Type</Label>
                <Select
                  value={newRule.trigger_type}
                  onValueChange={(value) => setNewRule(prev => ({ ...prev, trigger_type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stage_change">Stage Change</SelectItem>
                    <SelectItem value="time_based">Time Based</SelectItem>
                    <SelectItem value="value_change">Value Change</SelectItem>
                    <SelectItem value="inactivity">Inactivity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={createRule} className="flex-1">Create Rule</Button>
                <Button variant="outline" onClick={() => setShowCreateRule(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};