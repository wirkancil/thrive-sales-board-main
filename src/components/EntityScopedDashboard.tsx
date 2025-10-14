import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2, Target, TrendingUp, Users, Eye, Globe, Users2, User } from 'lucide-react';
import { useEntityScopedData } from '@/hooks/useEntityScopedData';
import { useProfile } from '@/hooks/useProfile';
import { CurrencyDisplay } from './CurrencyDisplay';

const SCOPE_CONFIG = {
  global: {
    icon: Globe,
    label: 'Global View',
    description: 'All entities and users',
    color: 'text-purple-600'
  },
  entity: {
    icon: Building2,
    label: 'Entity View',
    description: 'All teams in your entity',
    color: 'text-blue-600'
  },
  team: {
    icon: Users2,
    label: 'Team View',
    description: 'Your managed team members',
    color: 'text-green-600'
  },
  individual: {
    icon: User,
    label: 'Individual View',
    description: 'Your personal data only',
    color: 'text-orange-600'
  }
};

export const EntityScopedDashboard = () => {
  const { profile } = useProfile();
  const { 
    opportunities, 
    targets, 
    loading, 
    getOpportunityStats, 
    getTargetStats, 
    getEntityScope 
  } = useEntityScopedData();

  const entityScope = getEntityScope();
  const opportunityStats = getOpportunityStats();
  const targetStats = getTargetStats();
  const scopeConfig = SCOPE_CONFIG[entityScope] || SCOPE_CONFIG.individual;
  const ScopeIcon = scopeConfig.icon;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-muted-foreground">Loading dashboard data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scope Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Dashboard Scope
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted ${scopeConfig.color}`}>
              <ScopeIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">{scopeConfig.label}</div>
              <div className="text-sm text-muted-foreground">{scopeConfig.description}</div>
            </div>
            <Badge variant="outline" className="ml-auto">
              {profile?.role?.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Opportunities</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{opportunityStats.total}</div>
            <p className="text-xs text-muted-foreground">
              Total pipeline items in scope
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay 
                amount={opportunityStats.totalValue} 
                showBothCurrencies={false}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Total opportunity value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Targets</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{targetStats.currentPeriod}</div>
            <p className="text-xs text-muted-foreground">
              Current period targets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Value</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay 
                amount={targetStats.currentPeriodValue} 
                showBothCurrencies={false}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Current period target value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline by Stage</CardTitle>
            <CardDescription>
              Opportunity distribution across pipeline stages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {opportunityStats.stageBreakdown.map(({ stage, count }) => {
                const percentage = opportunityStats.total > 0 
                  ? (count / opportunityStats.total) * 100 
                  : 0;
                
                return (
                  <div key={stage} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{stage}</span>
                      <span className="text-muted-foreground">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
              
              {opportunityStats.stageBreakdown.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No opportunities in scope
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest opportunities and updates in your scope
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {opportunities.slice(0, 5).map((opportunity) => (
                <div key={opportunity.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium text-sm">{opportunity.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Stage: {opportunity.stage}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">
                      <CurrencyDisplay 
                        amount={opportunity.amount || 0} 
                        showBothCurrencies={false}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(opportunity.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {opportunities.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No recent opportunities
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entity Information */}
      {entityScope !== 'individual' && (
        <Card>
          <CardHeader>
            <CardTitle>Scope Details</CardTitle>
            <CardDescription>
              Information about your current data scope and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold text-primary">
                  {entityScope === 'global' ? 'All' : profile?.entity_id ? '1' : '0'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {entityScope === 'global' ? 'Entities' : 'Entity'}
                </div>
              </div>
              
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold text-primary">
                  {opportunities.length}
                </div>
                <div className="text-sm text-muted-foreground">Opportunities</div>
              </div>
              
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold text-primary">
                  {targets.length}
                </div>
                <div className="text-sm text-muted-foreground">Targets</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};