"use client";

import { useMemo } from "react";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Wallet,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  ShoppingBag,
} from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import { useRecurringMetrics, DueItem } from "@/hooks/use-recurring-metrics";
import { Badge } from "@/components/ui/badge";

export function RecurringDashboard() {
  const user = db.useUser();

  const { data, isLoading } = db.useQuery({
    profiles: {
      $: {
        where: { "user.id": user.id },
      },
      incomeSources: {
        $: { where: { isActive: true } },
      },
      recurringTransactions: {
        $: { where: { isActive: true } },
      },
      debts: {
        $: { where: { isActive: true } },
      },
      wishlistItems: {
        $: { where: { status: "wishlist" } },
      },
    },
  });

  const profile = data?.profiles?.[0];
  const { formatCurrency, formatCurrencyCompact } = useCurrency(
    profile?.currency,
    profile?.locale
  );

  const incomeSources = useMemo(
    () => profile?.incomeSources || [],
    [profile?.incomeSources]
  );
  const recurringTransactions = useMemo(
    () => profile?.recurringTransactions || [],
    [profile?.recurringTransactions]
  );
  const debts = useMemo(() => profile?.debts || [], [profile?.debts]);
  const wishlistItems = useMemo(
    () => profile?.wishlistItems || [],
    [profile?.wishlistItems]
  );

  const metrics = useRecurringMetrics(
    incomeSources,
    recurringTransactions,
    debts,
    wishlistItems
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-6 bg-muted rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* MRI - Monthly Recurring Income */}
        <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background border-emerald-200 dark:border-emerald-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mb-1">
              <TrendingUp className="h-3 w-3" />
              <span>MRI</span>
            </div>
            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
              {formatCurrencyCompact(metrics.mri)}
            </div>
            <div className="text-xs text-muted-foreground">/month</div>
          </CardContent>
        </Card>

        {/* WRI - Weekly Recurring Income */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Calendar className="h-3 w-3" />
              <span>WRI</span>
            </div>
            <div className="text-lg font-bold">
              {formatCurrencyCompact(metrics.wri)}
            </div>
            <div className="text-xs text-muted-foreground">/week</div>
          </CardContent>
        </Card>

        {/* TRO - Total Recurring Outflows */}
        <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background border-red-200 dark:border-red-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 mb-1">
              <TrendingDown className="h-3 w-3" />
              <span>TRO</span>
            </div>
            <div className="text-lg font-bold text-red-700 dark:text-red-300">
              {formatCurrencyCompact(metrics.tro)}
            </div>
            <div className="text-xs text-muted-foreground">/month</div>
          </CardContent>
        </Card>

        {/* EDP - Expected Debt Payments */}
        <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background border-orange-200 dark:border-orange-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 mb-1">
              <AlertCircle className="h-3 w-3" />
              <span>EDP</span>
            </div>
            <div className="text-lg font-bold text-orange-700 dark:text-orange-300">
              {formatCurrencyCompact(metrics.edp)}
            </div>
            <div className="text-xs text-muted-foreground">/month</div>
          </CardContent>
        </Card>

        {/* NRCF - Net Recurring Cash Flow */}
        <Card
          className={
            metrics.nrcf >= 0
              ? "bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background border-green-200 dark:border-green-900"
              : "bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background border-red-200 dark:border-red-900"
          }
        >
          <CardContent className="p-4">
            <div
              className={`flex items-center gap-1 text-xs mb-1 ${
                metrics.nrcf >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              <Wallet className="h-3 w-3" />
              <span>NRCF</span>
            </div>
            <div
              className={`text-lg font-bold ${
                metrics.nrcf >= 0
                  ? "text-green-700 dark:text-green-300"
                  : "text-red-700 dark:text-red-300"
              }`}
            >
              {formatCurrencyCompact(metrics.nrcf)}
            </div>
            <div className="text-xs text-muted-foreground">/month</div>
          </CardContent>
        </Card>

        {/* Cover Ratio */}
        <Card
          className={
            metrics.coverRatio >= 1
              ? "bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background border-blue-200 dark:border-blue-900"
              : "bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background border-red-200 dark:border-red-900"
          }
        >
          <CardContent className="p-4">
            <div
              className={`flex items-center gap-1 text-xs mb-1 ${
                metrics.coverRatio >= 1
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {metrics.coverRatio >= 1 ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              <span>Cover</span>
            </div>
            <div
              className={`text-lg font-bold ${
                metrics.coverRatio >= 1
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-red-700 dark:text-red-300"
              }`}
            >
              {metrics.coverRatio >= 100
                ? "∞"
                : `${metrics.coverRatio.toFixed(2)}×`}
            </div>
            <div className="text-xs text-muted-foreground">
              {metrics.coverRatio >= 1 ? "covered" : "shortfall"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cover Ratio Bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Income vs Obligations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {formatCurrency(metrics.mri)} income
              </span>
              <span className="text-red-600 dark:text-red-400 font-medium">
                {formatCurrency(metrics.tro + metrics.edp)} obligations
              </span>
            </div>
            <div className="relative h-4 bg-red-100 dark:bg-red-900/30 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-emerald-500 dark:bg-emerald-600 transition-all"
                style={{
                  width: `${Math.min(
                    (metrics.mri / (metrics.tro + metrics.edp || 1)) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
            <div className="text-center text-sm font-medium">
              {metrics.coverRatio >= 1 ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  ✓ Income covers {((metrics.coverRatio - 1) * 100).toFixed(0)}%
                  more than obligations
                </span>
              ) : (
                <span className="text-red-600 dark:text-red-400">
                  ⚠ Shortfall of{" "}
                  {formatCurrency(metrics.tro + metrics.edp - metrics.mri)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Section: Next 30 Days + Wishlist */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Next 30 Days Due */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Next 30 Days Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.next30DaysDue.length > 0 ? (
              <div className="space-y-2">
                {metrics.next30DaysDue.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-sm py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          item.type === "debt" ? "destructive" : "secondary"
                        }
                        className="text-xs"
                      >
                        {item.type === "debt" ? "Debt" : "Bill"}
                      </Badge>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrencyCompact(item.amount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(item.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {metrics.next30DaysDue.length > 5 && (
                  <div className="text-center text-xs text-muted-foreground pt-2">
                    +{metrics.next30DaysDue.length - 5} more items
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No payments due in the next 30 days
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wishlist Mini */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Wishlist
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wishlistItems.length > 0 ? (
              <div className="space-y-3">
                {wishlistItems.slice(0, 4).map((item: any) => {
                  const progress =
                    item.price > 0
                      ? ((item.savedAmount || 0) / item.price) * 100
                      : 0;
                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate">{item.name}</span>
                        <Badge
                          variant={
                            item.priority === "high"
                              ? "destructive"
                              : item.priority === "medium"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs ml-2"
                        >
                          {item.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground min-w-[60px] text-right">
                          {formatCurrencyCompact(item.savedAmount || 0)} /{" "}
                          {formatCurrencyCompact(item.price)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {wishlistItems.length > 4 && (
                  <div className="text-center text-xs text-muted-foreground pt-2">
                    +{wishlistItems.length - 4} more items
                  </div>
                )}
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Wishlist Gap:</span>
                    <span className="font-semibold">
                      {formatCurrency(metrics.wishlistGap)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No wishlist items yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
