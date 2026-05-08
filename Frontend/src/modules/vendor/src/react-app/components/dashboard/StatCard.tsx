import { LucideIcon } from "lucide-react";
import { cn } from "@vendor/react-app/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive?: boolean;
    direction?: "up" | "down" | "flat";
  };
  variant?: "default" | "gold" | "success" | "warning";
}

const variantStyles = {
  default: "from-mauve to-magenta",
  gold: "from-gold to-rose",
  success: "from-magenta to-mauve-dark",
  warning: "from-rose to-gold",
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: StatCardProps) {
  const trendDirection = trend?.direction ?? (trend?.isPositive ? "up" : "down");

  return (
    <div className="relative overflow-hidden bg-white rounded-xl border border-[hsl(var(--gold))]/10 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
      {/* Top accent line */}
      <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", variantStyles[variant])} />
      
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    "text-xs font-medium",
                    trendDirection === "up"
                      ? "text-mauve-dark"
                      : trendDirection === "down"
                        ? "text-destructive"
                        : "text-muted-foreground"
                  )}
                >
                  {trendDirection === "up" ? "+" : trendDirection === "down" ? "-" : ""}
                  {String(trend.value).replace("-", "")}%
                </span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            )}
          </div>
          
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg group-hover:scale-110 transition-transform duration-300",
            variantStyles[variant]
          )}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

