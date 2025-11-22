"use client";

import db from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecipientManager } from "./recipient-manager";
import { Users } from "lucide-react";

export function RecipientList() {
  const user = db.useUser();

  const { data } = db.useQuery({
    recipients: {
      $: {
        where: { "user.id": user.id },
        order: { updatedAt: "desc" },
      },
    },
  });

  const recipients = data?.recipients || [];

  if (recipients.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No saved recipients yet</p>
          <p className="text-sm mt-2">
            Add nicknames to recipients from the Insights tab
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Users className="h-6 w-6" />
        Saved Recipients ({recipients.length})
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        {recipients.map((recipient) => (
          <Card key={recipient.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-semibold">
                    {recipient.nickname || recipient.originalName}
                  </p>
                  {recipient.nickname && (
                    <p className="text-sm text-muted-foreground">
                      {recipient.originalName}
                    </p>
                  )}
                </div>
                <RecipientManager
                  recipientName={recipient.originalName}
                  currentCategory={recipient.defaultCategory}
                  compact
                />
              </div>

              {recipient.defaultCategory && (
                <Badge variant="secondary">{recipient.defaultCategory}</Badge>
              )}

              {recipient.notes && (
                <p className="text-xs text-muted-foreground italic">
                  {recipient.notes}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
