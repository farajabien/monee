"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import db from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Bell, Globe, DollarSign } from "lucide-react";
import { toast } from "sonner";

const CURRENCIES = [
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh" },
];

const LOCALES = [
  { code: "en-US", name: "English (US)" },
  { code: "en-GB", name: "English (UK)" },
  { code: "en-KE", name: "English (Kenya)" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { data, isLoading } = db.useQuery({
    profiles: {},
  });

  const profile = data?.profiles?.[0];
  const [currency, setCurrency] = useState(profile?.currency || "KES");
  const [locale, setLocale] = useState(profile?.locale || "en-US");
  const [lowBalanceAlerts, setLowBalanceAlerts] = useState(false);
  const [recurringReminders, setRecurringReminders] = useState(false);
  const [debtReminders, setDebtReminders] = useState(false);

  const handleSave = async () => {
    if (!profile?.id) {
      toast.error("Profile not found");
      return;
    }

    try {
      await db.transact(
        db.tx.profiles[profile.id].update({
          currency,
          locale,
        })
      );
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Currency & Locale Section */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Regional Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} - {curr.name} ({curr.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locale">Language & Format</Label>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger id="locale">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCALES.map((loc) => (
                    <SelectItem key={loc.code} value={loc.code}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Alerts Section */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Alerts & Reminders</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="low-balance">Low Balance Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when your balance is running low
                </p>
              </div>
              <Switch
                id="low-balance"
                checked={lowBalanceAlerts}
                onCheckedChange={setLowBalanceAlerts}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="recurring">Recurring Payment Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Reminders before recurring payments are due
                </p>
              </div>
              <Switch
                id="recurring"
                checked={recurringReminders}
                onCheckedChange={setRecurringReminders}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="debt">Debt Payment Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get reminded about upcoming debt payments
                </p>
              </div>
              <Switch
                id="debt"
                checked={debtReminders}
                onCheckedChange={setDebtReminders}
              />
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <Button onClick={handleSave} className="w-full" size="lg">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
