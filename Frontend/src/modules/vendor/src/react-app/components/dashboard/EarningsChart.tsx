import { TrendingUp } from "lucide-react";

import { formatDateInIndia } from "@vendor/react-app/lib/dateTime";
import { Minus, TrendingDown } from "lucide-react";

interface MonthlyData {
  month: string;
  total: number;
}

interface EarningsChartProps {
  monthlyData?: MonthlyData[];
}

export default function EarningsChart({ monthlyData = [] }: EarningsChartProps) {
  // Format month data or use defaults
  const chartData = monthlyData.length > 0
    ? monthlyData.map(d => ({
        label: formatDateInIndia(`${d.month}-01`, { month: "short" }),
        value: d.total
      }))
    : [
        { label: "Jul", value: 0 },
        { label: "Aug", value: 0 },
        { label: "Sep", value: 0 },
        { label: "Oct", value: 0 },
        { label: "Nov", value: 0 },
        { label: "Dec", value: 0 },
      ];

  const budgetTotals = chartData.map(d => d.value);
  const months = chartData.map(d => d.label);
  const maxBudget = Math.max(...budgetTotals, 1);
  const latestBudget = budgetTotals[budgetTotals.length - 1] || 0;
  const previousBudget = budgetTotals[budgetTotals.length - 2] || 0;
  const trendDelta = latestBudget - previousBudget;
  const trendPercent = previousBudget > 0
    ? (trendDelta / previousBudget) * 100
    : latestBudget > 0
      ? 100
      : 0;
  const isTrendPositive = trendDelta > 0;
  const isTrendNegative = trendDelta < 0;
  const trendLabel = Number.isInteger(trendPercent) ? trendPercent.toFixed(0) : trendPercent.toFixed(1);
  const TrendIcon = isTrendPositive ? TrendingUp : isTrendNegative ? TrendingDown : Minus;
  const trendClassName = isTrendPositive
    ? "text-emerald-600"
    : isTrendNegative
      ? "text-destructive"
      : "text-muted-foreground";
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[hsl(var(--gold))]/10 bg-white shadow-sm">
      <div className="p-6 border-b border-[hsl(var(--gold))]/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Budget Overview</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Last 6 months customer budgets</p>
          </div>
          <div className={`flex items-center gap-2 ${trendClassName}`}>
            <TrendIcon className="h-4 w-4" />
            <span className="text-sm font-medium">
              {isTrendPositive ? "+" : isTrendNegative ? "-" : ""}
              {trendLabel.replace("-", "")}%
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        {/* Total budget */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">Period Budget</p>
          <p className="text-3xl font-bold text-foreground">
            ₹{budgetTotals.reduce((a: number, b: number) => a + b, 0).toLocaleString()}
          </p>
        </div>

        {/* Chart */}
        <div className="flex min-h-40 flex-1 items-end justify-between gap-2">
          {months.map((month, index) => {
            const height = (budgetTotals[index] / maxBudget) * 100;
            return (
              <div key={month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center">
                  <span className="text-xs font-medium text-foreground mb-1">
                    ₹{(budgetTotals[index] / 1000).toFixed(1)}k
                  </span>
                  <div
                    className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-[hsl(var(--gold))] to-[hsl(var(--gold))]/70 transition-all duration-500 hover:from-[hsl(var(--gold))]/90 hover:to-[hsl(var(--gold))]/60"
                    style={{ 
                      height: `${height}%`,
                      animationDelay: `${index * 100}ms`
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{month}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
