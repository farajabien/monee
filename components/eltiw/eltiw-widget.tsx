"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Plus, TrendingUp } from "lucide-react";
import db from "@/lib/db";
import { useState } from "react";
import { QuickAddEltiwModal } from "./quick-add-eltiw-modal";
import Link from "next/link";

export function EltiwWidget() {
  const user = db.useUser();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const { data } = db.useQuery({
    eltiw_items: {
      $: {
        where: { "user.id": user.id },
      },
    },
  });

  const items = data?.eltiw_items || [];
  const activeItems = items.filter((item) => !item.gotIt);
  const totalWishlistValue = activeItems.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const completedThisMonth = items.filter((item) => {
    if (!item.gotItDate) return false;
    const now = new Date();
    const gotItDate = new Date(item.gotItDate);
    return (
      gotItDate.getMonth() === now.getMonth() &&
      gotItDate.getFullYear() === now.getFullYear()
    );
  }).length;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            ELTIW Wishlist
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={() => setShowQuickAdd(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{activeItems.length}</div>
              <p className="text-xs text-muted-foreground">Pending items</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">
                Ksh {totalWishlistValue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Total value</p>
            </div>
          </div>

          {completedThisMonth > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 p-2 rounded">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span>
                <strong>{completedThisMonth}</strong> items crossed off this
                month! 🎉
              </span>
            </div>
          )}

          {activeItems.length > 0 && (
            <div className="space-y-1 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Top 3 Items:
              </p>
              {activeItems
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 3)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="truncate flex-1 flex items-center gap-1">
                      {item.sourceEmoji && <span>{item.sourceEmoji}</span>}
                      {item.name}
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      Ksh {item.amount.toLocaleString()}
                    </Badge>
                  </div>
                ))}
            </div>
          )}

          {activeItems.length > 0 && (
            <Link href="/dashboard?tab=eltiw">
              <Button variant="outline" size="sm" className="w-full mt-2">
                View All Items
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
      <QuickAddEltiwModal open={showQuickAdd} onOpenChange={setShowQuickAdd} />
    </>
  );
}
