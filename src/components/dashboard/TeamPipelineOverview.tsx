import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, TrendingUp, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';

interface DivisionPipelineOverviewProps {
  selectedRep: string;
  dateRange: string;
}

interface PipelineStage {
  name: string;
  count: number;
  value: number;
  color: string;
  percentage: number;
}

export function TeamPipelineOverview({ selectedRep, dateRange }: DivisionPipelineOverviewProps) {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrencyFormatter();
  const [pipelineData, setPipelineData] = useState<PipelineStage[]>([]);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    // Initialize empty data - in real app, fetch from API
    setPipelineData([]);
    setTotalValue(0);
  }, [selectedRep, dateRange]);




  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Sales Pipeline Overview
            </CardTitle>
            <CardDescription>
              Division-wide pipeline performance across all stages
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/pipeline')}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            View Full Pipeline
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Total Pipeline Value */}
        <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Pipeline Value</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(totalValue)}</p>
          </div>
        </div>

        {/* Horizontal Pipeline Flow */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Pipeline Flow</span>
            <span>Deal Count • Value</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {pipelineData.map((stage, index) => (
              <div key={stage.name} className="flex items-center gap-2">
                <div className="flex-1 min-w-[140px]">
                  <div className="p-3 bg-card border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{stage.name}</h4>
                      <Badge 
                        variant="secondary" 
                        className={`${stage.color} text-white text-xs`}
                      >
                        {stage.count}
                      </Badge>
                    </div>
                    <p className="text-lg font-semibold text-foreground">
                      {formatCurrency(stage.value)}
                    </p>
                    
                    {/* Conversion Rate for non-terminal stages */}
                    {stage.name !== 'Won' && stage.name !== 'Lost' && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Conversion</span>
                          <span>{stage.percentage}%</span>
                        </div>
                        <Progress value={stage.percentage} className="h-1" />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Arrow separator */}
                {index < pipelineData.length - 2 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {pipelineData.find(s => s.name === 'Won')?.count || 0}
            </p>
            <p className="text-xs text-muted-foreground">Deals Won</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {pipelineData.reduce((sum, stage) => stage.name !== 'Won' && stage.name !== 'Lost' ? sum + stage.count : sum, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Active Deals</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {Math.round((pipelineData.find(s => s.name === 'Won')?.count || 0) / 
                Math.max(pipelineData.reduce((sum, stage) => sum + stage.count, 0), 1) * 100)}%
            </p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency((pipelineData.find(s => s.name === 'Won')?.value || 0) / Math.max(pipelineData.find(s => s.name === 'Won')?.count || 1, 1))}
            </p>
            <p className="text-xs text-muted-foreground">Avg Deal Size</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}