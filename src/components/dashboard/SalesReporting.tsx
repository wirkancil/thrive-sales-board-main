import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, DollarSign } from "lucide-react";

const salesData = [
  {
    title: "Total Sales",
    value: "$124,500",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
  },
  {
    title: "Sales Target",
    value: "$150,000",
    change: "Monthly Goal",
    trend: "neutral",
    icon: Target,
  },
  {
    title: "Achievement",
    value: "83%",
    change: "+5.2%",
    trend: "up",
    icon: TrendingUp,
  },
];

interface SalesReportingProps {
  deals: any[];
  activities: any[];
  metrics: any;
}

export function SalesReporting({ deals, activities, metrics }: SalesReportingProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {salesData.map((item) => (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                {item.trend === "up" && (
                  <TrendingUp className="h-3 w-3 text-success" />
                )}
                {item.trend === "down" && (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <span
                  className={
                    item.trend === "up"
                      ? "text-success"
                      : item.trend === "down"
                      ? "text-destructive"
                      : ""
                  }
                >
                  {item.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                Sales chart visualization will be displayed here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Weekly/Monthly sales trends and performance metrics
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}