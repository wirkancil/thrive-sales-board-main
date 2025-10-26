import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Target, ExternalLink, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface DepartmentPipelineOverviewProps {
  selectedDivision: string;
  selectedRep: string;
  dateRange: string;
}

interface DivisionPipelineData {
  division: string;
  Lead: number;
  Contacted: number;
  "Proposal Sent": number;
  Negotiation: number;
  Won: number;
  Lost: number;
  total: number;
}

type StageKey = "Lead" | "Contacted" | "Proposal Sent" | "Negotiation" | "Won" | "Lost";

export function DepartmentPipelineOverview({ selectedDivision, selectedRep, dateRange }: DepartmentPipelineOverviewProps) {
  const navigate = useNavigate();
  const [pipelineData, setPipelineData] = useState<DivisionPipelineData[]>([]);

  const getRange = (range: string) => {
    const now = new Date();
    const start = new Date(now);
    switch (range) {
      case "week": {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0,0,0,0);
        const end = new Date(start);
        end.setDate(start.getDate() + 7);
        return { from: start.toISOString(), to: end.toISOString() };
      }
      case "quarter": {
        const month = now.getMonth();
        const qStartMonth = month - (month % 3);
        start.setMonth(qStartMonth, 1);
        start.setHours(0,0,0,0);
        const end = new Date(start);
        end.setMonth(qStartMonth + 3, 1);
        return { from: start.toISOString(), to: end.toISOString() };
      }
      case "year": {
        start.setMonth(0, 1);
        start.setHours(0,0,0,0);
        const end = new Date(start);
        end.setFullYear(start.getFullYear() + 1);
        return { from: start.toISOString(), to: end.toISOString() };
      }
      case "month":
      default: {
        start.setDate(1);
        start.setHours(0,0,0,0);
        const end = new Date(start);
        end.setMonth(start.getMonth() + 1, 1);
        return { from: start.toISOString(), to: end.toISOString() };
      }
    }
  };

  const normalizeStage = (stageName?: string): StageKey => {
    const s = (stageName || '').toLowerCase();
    if (s.includes('prospecting')) return 'Lead';
    if (s.includes('qualification')) return 'Contacted';
    if (s.includes('approach') || s.includes('discovery')) return 'Contacted';
    if (s.includes('presentation') || s.includes('poc') || s.includes('proposal sent')) return 'Proposal Sent';
    if (s.includes('proposal') || s.includes('negotiation')) return 'Negotiation';
    if (s.includes('won')) return 'Won';
    if (s.includes('lost')) return 'Lost';
    if (s.includes('lead')) return 'Lead';
    if (s.includes('contact')) return 'Contacted';
    if (s.includes('proposal')) return 'Proposal Sent';
    if (s.includes('negotiation')) return 'Negotiation';
    return 'Lead';
  };

  useEffect(() => {
    const fetchPipeline = async () => {
      try {
        const { from, to } = getRange(dateRange);
        let query = supabase
          .from('opportunities')
          .select('id, stage, created_at, owner_id');

        query = query.gte('created_at', from).lt('created_at', to);
        if (selectedRep && selectedRep !== 'all') {
          query = query.eq('owner_id', selectedRep);
        }

        const { data, error } = await query;
        if (error) throw error;

        const base: DivisionPipelineData = {
          division: selectedRep === 'all' ? 'All Reps' : 'Selected Rep',
          Lead: 0,
          Contacted: 0,
          'Proposal Sent': 0,
          Negotiation: 0,
          Won: 0,
          Lost: 0,
          total: 0,
        };

        (data || []).forEach((opp: any) => {
          const key = normalizeStage(opp.stage);
          (base as any)[key] += 1;
          base.total += 1;
        });

        // If a single rep is selected, try to use their name for label
        if (selectedRep && selectedRep !== 'all') {
          const { data: prof } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('user_id', selectedRep)
            .maybeSingle();
          if (prof?.full_name) base.division = prof.full_name;
        }

        setPipelineData([base]);
      } catch (err) {
        console.error('Error fetching pipeline overview:', err);
        setPipelineData([]);
      }
    };

    fetchPipeline();
  }, [selectedDivision, selectedRep, dateRange]);



  const stageColors = {
    Lead: "#64748b",
    Contacted: "#3b82f6",
    "Proposal Sent": "#f59e0b",
    Negotiation: "#f97316",
    Won: "#10b981",
    Lost: "#ef4444"
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      return (
          <div className="bg-popover border rounded-lg p-3 shadow-lg">
            <p className="font-medium mb-2">{selectedDivision === "department" ? label : `${label} Division`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value} deals
            </p>
          ))}
          <div className="border-t mt-2 pt-2">
            <p className="text-sm font-medium">Total: {total} deals</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const totalDeals = pipelineData.reduce((sum, division) => sum + division.total, 0);
  const totalWon = pipelineData.reduce((sum, division) => sum + division.Won, 0);
  const winRate = totalDeals > 0 ? Math.round((totalWon / totalDeals) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Department Sales Pipeline
            </CardTitle>
            <CardDescription>
              Deals by stage for Field Sales Staff in this department
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/pipeline')}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open Pipeline Viewer
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{totalDeals}</p>
            <p className="text-xs text-muted-foreground">Total Deals</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{totalWon}</p>
            <p className="text-xs text-muted-foreground">Deals Won</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{winRate}%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
        </div>

        {/* Stacked Bar Chart */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">
              {selectedDivision === "department" ? "Deals by Stage per Field Sales Staff" : "Deals by Stage per Level Head Area"}
            </h4>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">+12% vs last period</span>
            </div>
          </div>
          
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="division" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip content={<CustomTooltip />} />
                {Object.entries(stageColors).map(([stage, color]) => (
                  <Bar 
                    key={stage}
                    dataKey={stage} 
                    stackId="pipeline"
                    fill={color} 
                    name={stage}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {Object.entries(stageColors).map(([stage, color]) => (
              <div key={stage} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-muted-foreground">{stage}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Division Performance Summary */}
        {pipelineData.length > 1 && (
          <div className="mt-6 pt-4 border-t">
            <h5 className="font-medium text-foreground mb-3">
              {selectedDivision === "department" ? "Field Sales Staff Performance" : "Level Head Area Performance"}
            </h5>
            <div className="space-y-2">
              {pipelineData.map((division) => {
                const divisionWinRate = division.total > 0 ? Math.round((division.Won / division.total) * 100) : 0;
                return (
                  <div key={division.division} className="flex items-center justify-between p-2 bg-card rounded border">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground">{division.division}</span>
                      <span className="text-sm text-muted-foreground">{division.total} deals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-600">{division.Won} won</span>
                      <span className="text-sm text-muted-foreground">({divisionWinRate}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}