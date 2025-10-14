import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  BarChart3,
  Lightbulb,
  Zap,
  Clock,
  Star
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ForecastData {
  period: string;
  predicted: number;
  actual?: number;
  confidence: number;
}

interface Insight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
}

interface ScenarioAnalysis {
  scenario: string;
  probability: number;
  revenue: number;
  factors: string[];
}

export const AIForecastingEngine = () => {
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('quarter');

  useEffect(() => {
    generateForecast();
  }, [selectedTimeframe]);

  const generateForecast = async () => {
    setLoading(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // Mock forecast data
      const mockForecastData: ForecastData[] = [
        { period: 'Jan', predicted: 850000, actual: 820000, confidence: 92 },
        { period: 'Feb', predicted: 920000, actual: 950000, confidence: 89 },
        { period: 'Mar', predicted: 1100000, actual: 1080000, confidence: 94 },
        { period: 'Apr', predicted: 1250000, confidence: 87 },
        { period: 'May', predicted: 1350000, confidence: 85 },
        { period: 'Jun', predicted: 1420000, confidence: 88 }
      ];

      const mockInsights: Insight[] = [
        {
          id: '1',
          type: 'warning',
          title: 'Conversion Rate Decline Detected',
          description: 'Your qualification to proposal conversion rate has dropped by 15% this month. Consider reviewing qualification criteria.',
          confidence: 94,
          impact: 'high',
          actionable: true
        },
        {
          id: '2',
          type: 'success',
          title: 'Strong Q2 Pipeline Building',
          description: 'Q2 pipeline is 23% ahead of the same period last year. Enterprise deals are driving growth.',
          confidence: 91,
          impact: 'high',
          actionable: false
        },
        {
          id: '3',
          type: 'recommendation',
          title: 'Focus on Mid-Market Segment',
          description: 'AI analysis suggests increasing focus on $50K-$200K deals will optimize win rate and cycle time.',
          confidence: 87,
          impact: 'medium',
          actionable: true
        },
        {
          id: '4',
          type: 'info',
          title: 'Seasonal Pattern Identified',
          description: 'Historical data shows 18% increase in deal closures during the last two weeks of each quarter.',
          confidence: 96,
          impact: 'medium',
          actionable: true
        }
      ];

      const mockScenarios: ScenarioAnalysis[] = [
        {
          scenario: 'Conservative',
          probability: 80,
          revenue: 4200000,
          factors: ['Current pipeline velocity', 'Historical close rates', 'Market conditions']
        },
        {
          scenario: 'Most Likely',
          probability: 60,
          revenue: 4850000,
          factors: ['Deal acceleration', 'New market expansion', 'Product launches']
        },
        {
          scenario: 'Optimistic',
          probability: 25,
          revenue: 5600000,
          factors: ['Perfect execution', 'Market upturn', 'Competitive advantages']
        }
      ];

      setForecastData(mockForecastData);
      setInsights(mockInsights);
      setScenarios(mockScenarios);
    } catch (error) {
      console.error('Error generating forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'recommendation':
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case 'info':
        return <Brain className="h-4 w-4 text-purple-500" />;
      default:
        return <Brain className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-y-4">
            <div className="animate-spin">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div className="ml-3">
              <p className="text-lg font-medium">AI is analyzing your data...</p>
              <p className="text-sm text-muted-foreground">Generating intelligent forecasts and insights</p>
            </div>
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
            <Brain className="h-6 w-6 text-primary" />
            AI Forecasting Engine
          </h2>
          <p className="text-muted-foreground">AI-powered revenue predictions and sales insights</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={selectedTimeframe === 'month' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedTimeframe('month')}
          >
            Monthly
          </Button>
          <Button 
            variant={selectedTimeframe === 'quarter' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedTimeframe('quarter')}
          >
            Quarterly
          </Button>
          <Button 
            variant={selectedTimeframe === 'year' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedTimeframe('year')}
          >
            Yearly
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Forecast Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">94%</div>
            <div className="text-xs text-muted-foreground">Last 6 months</div>
            <Progress value={94} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Pipeline Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">87%</div>
            <div className="text-xs text-muted-foreground">Confidence score</div>
            <Progress value={87} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-500" />
              Predicted Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">$4.85M</div>
            <div className="text-xs text-muted-foreground">Next quarter</div>
            <div className="text-xs text-green-600 mt-1">+12% vs target</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Active Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{insights.length}</div>
            <div className="text-xs text-muted-foreground">Actionable items</div>
            <div className="text-xs text-blue-600 mt-1">{insights.filter(i => i.actionable).length} require action</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="forecast" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="forecast">Revenue Forecast</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="scenarios">Scenario Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecast vs Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(value: any) => [`$${(value / 1000000).toFixed(2)}M`, 'Revenue']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="#8884d8" 
                      strokeWidth={3}
                      name="AI Forecast"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#82ca9d" 
                      strokeWidth={3}
                      name="Actual"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {insights.map((insight) => (
            <Card key={insight.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{insight.title}</h3>
                        <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}>
                          {insight.impact} impact
                        </Badge>
                        {insight.actionable && (
                          <Badge variant="outline">Actionable</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getConfidenceColor(insight.confidence)}`}>
                      {insight.confidence}% confidence
                    </div>
                    {insight.actionable && (
                      <Button size="sm" className="mt-2">Take Action</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="scenarios">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Scenario Probabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={scenarios}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ scenario, probability }) => `${scenario} (${probability}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="probability"
                      >
                        {scenarios.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {scenarios.map((scenario, index) => (
                <Card key={scenario.scenario}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{scenario.scenario}</h3>
                      <Badge variant={index === 1 ? 'default' : 'outline'}>
                        {scenario.probability}% likely
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold mb-2">
                      ${(scenario.revenue / 1000000).toFixed(2)}M
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Key factors:</p>
                      {scenario.factors.map((factor, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
                          {factor}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Key Trends Detected</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Deal Velocity Improving</p>
                        <p className="text-sm text-muted-foreground">Average sales cycle reduced by 8 days</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Enterprise Segment Growth</p>
                        <p className="text-sm text-muted-foreground">42% increase in $100K+ deals</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium">Seasonal Pattern</p>
                        <p className="text-sm text-muted-foreground">Q4 historically outperforms by 23%</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Recommendations</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-start gap-2">
                        <Star className="h-4 w-4 text-yellow-500 mt-1" />
                        <div>
                          <p className="font-medium">Increase Enterprise Focus</p>
                          <p className="text-sm text-muted-foreground">Allocate 60% of resources to deals {'>'} $50K</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-start gap-2">
                        <Star className="h-4 w-4 text-yellow-500 mt-1" />
                        <div>
                          <p className="font-medium">Optimize Q4 Strategy</p>
                          <p className="text-sm text-muted-foreground">Prepare for 23% higher close rates</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-start gap-2">
                        <Star className="h-4 w-4 text-yellow-500 mt-1" />
                        <div>
                          <p className="font-medium">Accelerate Mid-Stage Deals</p>
                          <p className="text-sm text-muted-foreground">Focus on proposal stage optimization</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};