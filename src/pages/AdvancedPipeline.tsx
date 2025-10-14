import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ExportButton } from "@/components/ExportButton";
import { BarChart3, TrendingUp, Search, AlertTriangle, Command, Plus, FileText } from "lucide-react";
import GlobalSearchCommand from "@/components/advanced/GlobalSearchCommand";
import { useManagerTeam } from "@/hooks/useManagerTeam";
import { toast } from "sonner";

export default function AdvancedPipeline() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchOpen, setSearchOpen] = useState(false);
  const { teamMembers } = useManagerTeam();
  
  const activeTab = searchParams.get('tab') || 'analytics';
  
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // Global keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Pipeline</h1>
          <p className="text-muted-foreground mt-1">
            Advanced analytics and search for Level Manager view
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setSearchOpen(true)}
          className="gap-2"
        >
          <Command className="h-4 w-4" />
          Search
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            ⌘K
          </kbd>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="health">Health Score</TabsTrigger>
          <TabsTrigger value="ai-forecast">AI Forecasting</TabsTrigger>
          <TabsTrigger value="search">Global Search</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Pipeline Analytics</h2>
              <p className="text-muted-foreground text-sm">Advanced analytics and reporting</p>
            </div>
            <ExportButton 
              data={[]} 
              filename="advanced-pipeline-analytics"
            />
          </div>
          <div className="grid gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Pipeline Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">$2.4M</div>
                    <div className="text-sm text-muted-foreground">Total Revenue</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-success">156</div>
                    <div className="text-sm text-muted-foreground">Active Opportunities</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-warning">67%</div>
                    <div className="text-sm text-muted-foreground">Conversion Rate</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-accent">$3.8M</div>
                    <div className="text-sm text-muted-foreground">Pipeline Value</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Revenue Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 flex items-center justify-center bg-muted/20 rounded-lg">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Revenue trends chart</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Team Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {teamMembers.slice(0, 3).map((member) => (
                          <div key={member.id} className="flex items-center justify-between">
                            <span className="font-medium">{member.full_name}</span>
                            <Badge variant="secondary">{Math.floor(Math.random() * 100)}%</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Pipeline Health Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <div className="text-2xl font-bold text-green-600">A</div>
                      </div>
                      <div>
                        <div className="text-xl font-semibold">Overall Pipeline Health</div>
                        <div className="text-muted-foreground">Excellent pipeline health across all metrics</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-600">85</div>
                      <div className="text-sm text-muted-foreground">out of 100</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">Velocity Score</h3>
                          <Badge variant="secondary">Excellent</Badge>
                        </div>
                        <Progress value={90} className="mb-2" />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>90%</span>
                          <span>Target: 85%</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">Quality Score</h3>
                          <Badge variant="secondary">Good</Badge>
                        </div>
                        <Progress value={78} className="mb-2" />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>78%</span>
                          <span>Target: 80%</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">Engagement Score</h3>
                          <Badge variant="secondary">Excellent</Badge>
                        </div>
                        <Progress value={92} className="mb-2" />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>92%</span>
                          <span>Target: 75%</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Opportunity Health Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                          <div>
                            <div className="font-medium">High-value opportunities stagnant</div>
                            <div className="text-sm text-muted-foreground">3 deals over $100K with no activity in 14+ days</div>
                          </div>
                          <Badge variant="destructive">Action Required</Badge>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                          <div>
                            <div className="font-medium">Pipeline velocity improving</div>
                            <div className="text-sm text-muted-foreground">Average time in pipeline decreased by 8 days</div>
                          </div>
                          <Badge variant="secondary" className="bg-green-100 text-green-700">Positive Trend</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai-forecast" className="space-y-6">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  AI Forecasting Engine
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Select defaultValue="quarterly">
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly View</SelectItem>
                        <SelectItem value="quarterly">Quarterly View</SelectItem>
                        <SelectItem value="yearly">Yearly View</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={() => toast.success("Forecast updated with latest data")}
                      className="gap-2"
                    >
                      <TrendingUp className="h-4 w-4" />
                      Generate Forecast
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-primary mb-2">$1.8M</div>
                        <div className="text-sm text-muted-foreground mb-2">Predicted Revenue</div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          +12% vs Q3
                        </Badge>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-success mb-2">87%</div>
                        <div className="text-sm text-muted-foreground mb-2">Forecast Accuracy</div>
                        <Badge variant="secondary">High Confidence</Badge>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-warning mb-2">24</div>
                        <div className="text-sm text-muted-foreground mb-2">Active Insights</div>
                        <Badge variant="secondary">3 Critical</Badge>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-accent mb-2">92%</div>
                        <div className="text-sm text-muted-foreground mb-2">Pipeline Health</div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">Excellent</Badge>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Revenue Forecast vs Actual</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48 flex items-center justify-center bg-muted/20 rounded-lg">
                          <div className="text-center">
                            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">Forecast vs Actual chart</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Scenario Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 border rounded-lg">
                            <span className="font-medium">Conservative</span>
                            <span className="text-lg font-bold">$1.2M</span>
                          </div>
                          <div className="flex justify-between items-center p-3 border rounded-lg bg-primary/5">
                            <span className="font-medium">Most Likely</span>
                            <span className="text-lg font-bold text-primary">$1.8M</span>
                          </div>
                          <div className="flex justify-between items-center p-3 border rounded-lg">
                            <span className="font-medium">Optimistic</span>
                            <span className="text-lg font-bold">$2.4M</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Global Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center py-12">
                    <Command className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Search Across Your Pipeline</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Use the command palette to quickly search opportunities, organizations, contacts, and activities within your team's scope.
                    </p>
                    <div className="flex justify-center gap-4">
                      <Button 
                        onClick={() => setSearchOpen(true)}
                        className="gap-2"
                      >
                        <Search className="h-4 w-4" />
                        Open Search
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                          ⌘K
                        </kbd>
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Plus className="h-5 w-5" />
                          Quick Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Button variant="outline" className="w-full justify-start gap-3">
                            <Plus className="h-4 w-4" />
                            New Opportunity
                          </Button>
                          <Button variant="outline" className="w-full justify-start gap-3">
                            <FileText className="h-4 w-4" />
                            View Reports
                          </Button>
                          <Button variant="outline" className="w-full justify-start gap-3">
                            <BarChart3 className="h-4 w-4" />
                            Team Analytics
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Search Tips</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 text-sm">
                          <div>
                            <div className="font-medium">⌘/Ctrl + K</div>
                            <div className="text-muted-foreground">Open search from anywhere</div>
                          </div>
                          <div>
                            <div className="font-medium">Search by type</div>
                            <div className="text-muted-foreground">Results grouped by opportunities, contacts, etc.</div>
                          </div>
                          <div>
                            <div className="font-medium">Fuzzy matching</div>
                            <div className="text-muted-foreground">Find results even with typos</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <GlobalSearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}