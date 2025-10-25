import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users,
  DollarSign,
  Target,
  Activity,
  Brain,
  Zap,
  RefreshCw
} from 'lucide-react';

interface HealthScore {
  overall: number;
  velocity: number;
  quality: number;
  conversion: number;
  engagement: number;
}

interface PipelineHealth {
  id: string;
  name: string;
  owner: string;
  stage: string;
  value: number;
  probability: number;
  daysInStage: number;
  lastActivity: string;
  healthScore: HealthScore;
  riskFactors: string[];
  recommendations: string[];
  trend: 'improving' | 'declining' | 'stable';
}

interface HealthMetric {
  title: string;
  score: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
  icon: React.ComponentType<any>;
}

const PipelineHealthScoring: React.FC = () => {
  const [selectedPipeline, setSelectedPipeline] = useState('all');
  const [timeframe, setTimeframe] = useState('30d');

  // Empty data - would be loaded from API
  const healthMetrics: HealthMetric[] = [];

  const pipelineOpportunities: PipelineHealth[] = [];

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBadge = (score: number) => {
    if (score >= 80) return { variant: 'default' as const, label: 'Healthy', color: 'bg-green-100 text-green-800' };
    if (score >= 60) return { variant: 'secondary' as const, label: 'At Risk', color: 'bg-yellow-100 text-yellow-800' };
    return { variant: 'destructive' as const, label: 'Critical', color: 'bg-red-100 text-red-800' };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Pipeline Health Scoring</h2>
          <p className="text-muted-foreground">
            AI-powered insights and health metrics for your sales pipeline
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pipelines</SelectItem>
              <SelectItem value="sales">Sales Pipeline</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {healthMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-2xl font-bold">{metric.score}</div>
                <div className={`text-xs flex items-center gap-1 ${metric.color}`}>
                  {metric.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : metric.trend === 'down' ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  {Math.abs(metric.change)}%
                </div>
              </div>
              <Progress value={metric.score} className="h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="opportunities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="opportunities">Opportunity Health</TabsTrigger>
          <TabsTrigger value="analytics">Health Analytics</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          <div className="space-y-4">
            {pipelineOpportunities.map((opportunity) => {
              const healthBadge = getHealthBadge(opportunity.healthScore.overall);
              
              return (
                <Card key={opportunity.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Opportunity Info */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">{opportunity.name}</h3>
                            <p className="text-muted-foreground">
                              Owner: {opportunity.owner} • Stage: {opportunity.stage}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={healthBadge.color}>
                              {healthBadge.label}
                            </Badge>
                            {getTrendIcon(opportunity.trend)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Value:</span>
                            <div className="font-medium">${opportunity.value.toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Probability:</span>
                            <div className="font-medium">{opportunity.probability}%</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Days in Stage:</span>
                            <div className="font-medium">{opportunity.daysInStage}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Activity:</span>
                            <div className="font-medium">{opportunity.lastActivity}</div>
                          </div>
                        </div>

                        {/* Health Scores */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Health Breakdown</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                            {Object.entries(opportunity.healthScore).map(([key, score]) => (
                              <div key={key} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="capitalize">{key}</span>
                                  <span className={getHealthColor(score)}>{score}</span>
                                </div>
                                <Progress value={score} className="h-1" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Risk Factors & Recommendations */}
                      <div className="lg:w-80 space-y-4">
                        {/* Risk Factors */}
                        {opportunity.riskFactors.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-red-600 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              Risk Factors
                            </h4>
                            <ul className="text-sm space-y-1">
                              {opportunity.riskFactors.map((risk, index) => (
                                <li key={index} className="text-red-600">• {risk}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Recommendations */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-blue-600 flex items-center gap-2">
                            <Brain className="w-4 h-4" />
                            AI Recommendations
                          </h4>
                          <ul className="text-sm space-y-1">
                            {opportunity.recommendations.map((rec, index) => (
                              <li key={index} className="text-blue-600">• {rec}</li>
                            ))}
                          </ul>
                        </div>

                        <Button variant="outline" size="sm" className="w-full">
                          <Activity className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Health Score Distribution</CardTitle>
                <CardDescription>
                  Distribution of opportunities by health score ranges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Healthy (80-100)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '60%' }} />
                      </div>
                      <span className="text-sm font-medium">12 opps</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">At Risk (60-79)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '30%' }} />
                      </div>
                      <span className="text-sm font-medium">6 opps</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Critical (0-59)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: '10%' }} />
                      </div>
                      <span className="text-sm font-medium">2 opps</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Health Trends</CardTitle>
                <CardDescription>
                  Pipeline health trends over the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">+8.5%</div>
                    <p className="text-muted-foreground">Overall improvement</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-blue-600">156</div>
                      <p className="text-xs text-muted-foreground">Total Opportunities</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-purple-600">$3.2M</div>
                      <p className="text-xs text-muted-foreground">Pipeline Value</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-600" />
                  AI-Powered Insights
                </CardTitle>
                <CardDescription>
                  Machine learning recommendations for pipeline optimization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">High-Priority Actions</h4>
                  <ul className="mt-2 text-sm space-y-1 text-blue-800 dark:text-blue-200">
                    <li>• Follow up on 3 stagnant opportunities in negotiation stage</li>
                    <li>• Schedule executive meetings for 2 high-value deals</li>
                    <li>• Review pricing strategy for competitive situations</li>
                  </ul>
                </div>

                <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20">
                  <h4 className="font-medium text-green-900 dark:text-green-100">Process Improvements</h4>
                  <ul className="mt-2 text-sm space-y-1 text-green-800 dark:text-green-200">
                    <li>• Implement automated follow-up sequences</li>
                    <li>• Standardize proposal templates</li>
                    <li>• Improve qualification criteria</li>
                  </ul>
                </div>

                <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100">Risk Mitigation</h4>
                  <ul className="mt-2 text-sm space-y-1 text-yellow-800 dark:text-yellow-200">
                    <li>• Address low engagement in 5 key accounts</li>
                    <li>• Accelerate decision-making process</li>
                    <li>• Strengthen stakeholder relationships</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Predictions</CardTitle>
                <CardDescription>
                  Forecasted outcomes based on current pipeline health
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold">87%</div>
                  <p className="text-muted-foreground">Predicted close rate for Q1</p>
                  <Progress value={87} className="h-3" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-green-600">$2.1M</div>
                    <p className="text-xs text-muted-foreground">Expected Revenue</p>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-600">23</div>
                    <p className="text-xs text-muted-foreground">Deals to Close</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Key Success Factors</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Maintain current engagement levels</li>
                    <li>• Focus on qualification improvements</li>
                    <li>• Accelerate proposal delivery</li>
                    <li>• Strengthen competitive positioning</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PipelineHealthScoring;