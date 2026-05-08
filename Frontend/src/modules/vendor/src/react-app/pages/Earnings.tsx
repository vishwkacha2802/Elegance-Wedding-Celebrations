import { useEffect, useState } from "react";
import { IndianRupee, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@vendor/react-app/components/ui/card";
import { getEarnings } from "@vendor/react-app/services/api";

const formatInr = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

type EarningsSummaryState = {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  totalSaved: number;
  monthlyBreakdown: Array<{ month: string; total: number }>;
};

const EMPTY_EARNINGS: EarningsSummaryState = {
  totalEarnings: 0,
  thisMonth: 0,
  lastMonth: 0,
  totalSaved: 0,
  monthlyBreakdown: [],
};

export default function Earnings() {
  const [earnings, setEarnings] = useState(EMPTY_EARNINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadEarnings = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await getEarnings();
        if (!isMounted) {
          return;
        }

        setEarnings({
          totalEarnings: Number(data.totalEarnings || 0),
          thisMonth: Number(data.thisMonth || 0),
          lastMonth: Number(data.lastMonth || 0),
          totalSaved: Number(data.totalSaved || 0),
          monthlyBreakdown: Array.isArray(data.monthlyBreakdown) ? data.monthlyBreakdown : [],
        });
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load earnings.");
        setEarnings(EMPTY_EARNINGS);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadEarnings();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-2xl font-display font-semibold text-foreground">Earnings Overview</h1>
        <p className="mt-1 text-muted-foreground">
          Totals on this page are based on customer budgets, while saved amount shows the difference from service pricing.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-[hsl(var(--mauve))]/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <IndianRupee className="h-4 w-4 text-mauve" />
              Total Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-mauve-dark">
              {isLoading ? "Loading..." : formatInr(earnings.totalEarnings)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-[hsl(var(--mauve))]/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-gold" />
              This Month Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {isLoading ? "Loading..." : formatInr(earnings.thisMonth)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-[hsl(var(--mauve))]/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4 text-magenta" />
              Last Month Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {isLoading ? "Loading..." : formatInr(earnings.lastMonth)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-[hsl(var(--mauve))]/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <PiggyBank className="h-4 w-4 text-emerald-600" />
              Amount Saved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-700">
              {isLoading ? "Loading..." : formatInr(earnings.totalSaved)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[hsl(var(--mauve))]/20 shadow-sm">
        <CardHeader className="border-b border-[hsl(var(--mauve))]/15 bg-gradient-to-r from-cream/60 to-blush/40">
          <CardTitle className="text-base">Monthly Budget Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border/70 p-0">
          {isLoading ? (
            <div className="px-6 py-4 text-sm text-muted-foreground">Loading monthly budgets...</div>
          ) : earnings.monthlyBreakdown.length > 0 ? (
            earnings.monthlyBreakdown.map((item) => (
              <div key={item.month} className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-muted-foreground">{item.month}</span>
                <span className="font-semibold text-mauve-dark">{formatInr(item.total)}</span>
              </div>
            ))
          ) : (
            <div className="px-6 py-4 text-sm text-muted-foreground">No budget totals recorded yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
