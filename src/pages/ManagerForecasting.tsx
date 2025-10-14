import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useProfile } from "@/hooks/useProfile";
import { useRoleBasedData } from "@/hooks/useRoleBasedData";
import { ExportButton } from "@/components/ExportButton";
import { formatCurrency } from "@/lib/constants";
import { TrendingUp, Target, Calendar, AlertTriangle } from "lucide-react";
interface ForecastTile {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}
export default function ManagerForecasting() {
  const {
    profile
  } = useProfile();
  const {
    opportunities,
    loading
  } = useRoleBasedData();
  const [probabilityAdjustment, setProbabilityAdjustment] = useState([0]);

  // Calculate base weighted pipeline
  const calculateWeightedPipeline = (adjustment = 0) => {
    return opportunities.reduce((sum, opp) => {
      const adjustedProbability = Math.min(100, Math.max(0, (opp.probability || 0) + adjustment));
      return sum + opp.amount * adjustedProbability / 100;
    }, 0);
  };

  // Calculate forecast by quarter
  const calculateQuarterForecast = () => {
    const commit = opportunities.filter(opp => opp.forecast_category === 'Commit').reduce((sum, opp) => sum + opp.amount, 0);
    const best = opportunities.filter(opp => opp.forecast_category === 'Best Case').reduce((sum, opp) => sum + opp.amount, 0);
    const omitted = opportunities.filter(opp => opp.forecast_category === 'Pipeline').reduce((sum, opp) => sum + opp.amount, 0);
    const target = 5000000; // Mock quarterly target
    const gap = target - commit;
    return {
      commit,
      best,
      omitted,
      gap,
      target
    };
  };
  const baseWeightedPipeline = calculateWeightedPipeline();
  const adjustedWeightedPipeline = calculateWeightedPipeline(probabilityAdjustment[0]);
  const {
    commit,
    best,
    omitted,
    gap,
    target
  } = calculateQuarterForecast();
  const forecastTiles: ForecastTile[] = [{
    label: "Commit",
    value: commit,
    icon: <Target className="h-5 w-5" />,
    color: "text-green-600"
  }, {
    label: "Best",
    value: best,
    icon: <TrendingUp className="h-5 w-5" />,
    color: "text-blue-600"
  }, {
    label: "Omitted",
    value: omitted,
    icon: <Calendar className="h-5 w-5" />,
    color: "text-gray-600"
  }, {
    label: "Gap",
    value: gap,
    icon: <AlertTriangle className="h-5 w-5" />,
    color: gap > 0 ? "text-red-600" : "text-green-600"
  }];
  if (loading) {
    return <div className="p-6">Loading...</div>;
  }
  return <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pipeline Forecasting</h1>
          <p className="text-muted-foreground mt-1">
            Manager / Pipeline / Forecasting
          </p>
        </div>
        <ExportButton 
          data={opportunities} 
          filename="pipeline-forecast"
        />
      </div>

      {/* Weighted Pipeline Metric */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-500" />
            Weighted Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {formatCurrency(adjustedWeightedPipeline)}
              </div>
              {probabilityAdjustment[0] !== 0 && <div className="text-sm text-muted-foreground">
                  Base: {formatCurrency(baseWeightedPipeline)} 
                  <span className={`ml-2 ${adjustedWeightedPipeline > baseWeightedPipeline ? 'text-green-600' : 'text-red-600'}`}>
                    ({adjustedWeightedPipeline > baseWeightedPipeline ? '+' : ''}
                    {formatCurrency(adjustedWeightedPipeline - baseWeightedPipeline)})
                  </span>
                </div>}
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Based on</div>
              <div className="text-lg font-semibold">{opportunities.length} opportunities</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quarter Forecast Tiles */}
      <Card>
        <CardHeader>
          <CardTitle>Quarter Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {forecastTiles.map((tile, index) => <Card key={index} className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={tile.color}>
                      {tile.icon}
                    </div>
                    <span className="text-sm font-medium">{tile.label}</span>
                  </div>
                  <div className={`text-2xl font-bold ${tile.color}`}>
                    {formatCurrency(tile.value)}
                  </div>
                  {tile.label === "Gap" && <div className="text-xs text-muted-foreground mt-1">
                      Target: {formatCurrency(target)}
                    </div>}
                </CardContent>
              </Card>)}
          </div>

          {/* Forecast Summary */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-green-600">Commit Achievement</div>
                <div>{Math.round(commit / target * 100)}% of target</div>
              </div>
              <div>
                <div className="font-medium text-blue-600">Best Case Potential</div>
                <div>{Math.round((commit + best) / target * 100)}% of target</div>
              </div>
              <div>
                <div className="font-medium text-purple-600">Total Pipeline</div>
                <div>{formatCurrency(commit + best + omitted)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Probability Scenario Slider */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-medium">
                  Probability Adjustment: {probabilityAdjustment[0] > 0 ? '+' : ''}{probabilityAdjustment[0]}%
                </label>
                <button onClick={() => setProbabilityAdjustment([0])} className="text-sm text-blue-600 hover:text-blue-800">
                  Reset
                </button>
              </div>
              
              <Slider value={probabilityAdjustment} onValueChange={setProbabilityAdjustment} max={20} min={-20} step={1} className="w-full" />
              
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>-20%</span>
                <span>0%</span>
                <span>+20%</span>
              </div>
            </div>

            {/* Scenario Impact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="text-sm font-medium mb-2">Conservative Scenario (-10%)</div>
                <div className="text-lg font-bold text-orange-600">
                  {formatCurrency(calculateWeightedPipeline(-10))}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(calculateWeightedPipeline(-10) - baseWeightedPipeline)} vs baseline
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="text-sm font-medium mb-2">Optimistic Scenario (+10%)</div>
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(calculateWeightedPipeline(10))}
                </div>
                <div className="text-xs text-muted-foreground">
                  +{formatCurrency(calculateWeightedPipeline(10) - baseWeightedPipeline)} vs baseline
                </div>
              </div>
            </div>

            {/* Insights */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-800 mb-2">Forecasting Insights</div>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Current weighted pipeline is {Math.round(baseWeightedPipeline / target * 100)}% of quarterly target</li>
                <li>• {gap > 0 ? `Need ${formatCurrency(gap)} more in Commit category to reach target` : 'Exceeded target by ' + formatCurrency(Math.abs(gap))}</li>
                <li>• A +10% probability adjustment would add {formatCurrency(calculateWeightedPipeline(10) - baseWeightedPipeline)} to pipeline</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
}