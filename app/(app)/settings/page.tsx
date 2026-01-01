"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import db from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Bell, Globe, DollarSign, User, Clock, Info, Palette, Moon, Sun } from "lucide-react";
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

const REMINDER_TIMES = [
  { value: "08:00", label: "8:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "18:00", label: "6:00 PM" },
  { value: "19:00", label: "7:00 PM" },
  { value: "20:00", label: "8:00 PM" },
  { value: "21:00", label: "9:00 PM" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const { data, isLoading } = db.useQuery({
    profiles: {},
  });

  const profile = data?.profiles?.[0];
  
  // Mount check for theme
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Profile settings
  const [currency, setCurrency] = useState(profile?.currency || "KES");
  const [locale, setLocale] = useState(profile?.locale || "en-US");
  
  // Reminder settings
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(true);
  const [dailyReminderTime, setDailyReminderTime] = useState("19:00");
  const [recurringReminders, setRecurringReminders] = useState(true);
  const [recurringDays, setRecurringDays] = useState({ three: true, one: true, due: true });
  const [debtReminders, setDebtReminders] = useState(true);
  const [debtDays, setDebtDays] = useState({ three: true, one: true, due: true });
  const [lowBalanceAlerts, setLowBalanceAlerts] = useState(false);
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState("5000");

  // Update states when profile loads
  useEffect(() => {
    if (profile) {
      setCurrency(profile.currency || "KES");
      setLocale(profile.locale || "en-US");
    }
  }, [profile]);

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
      
      // Save reminder settings to localStorage for now
      const reminderSettings = {
        dailyReminderEnabled,
        dailyReminderTime,
        recurringReminders,
        recurringDays,
        debtReminders,
        debtDays,
        lowBalanceAlerts,
        lowBalanceThreshold,
      };
      localStorage.setItem("monee-reminders", JSON.stringify(reminderSettings));
      
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    }
  };

  // Load reminder settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("monee-reminders");
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        setDailyReminderEnabled(settings.dailyReminderEnabled ?? true);
        setDailyReminderTime(settings.dailyReminderTime ?? "19:00");
        setRecurringReminders(settings.recurringReminders ?? true);
        setRecurringDays(settings.recurringDays ?? { three: true, one: true, due: true });
        setDebtReminders(settings.debtReminders ?? true);
        setDebtDays(settings.debtDays ?? { three: true, one: true, due: true });
        setLowBalanceAlerts(settings.lowBalanceAlerts ?? false);
        setLowBalanceThreshold(settings.lowBalanceThreshold ?? "5000");
      } catch (e) {
        console.error("Failed to parse reminder settings:", e);
      }
    }
  }, []);

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

      {/* Content with Tabs */}
      <div className="p-4 max-w-2xl mx-auto">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="reminders" className="gap-2">
              <Bell className="h-4 w-4" />
              Reminders
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-2">
              <Info className="h-4 w-4" />
              About
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
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

            <Card className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Account</h2>
              </div>

              <div className="space-y-2">
                <Label>Handle</Label>
                <p className="text-sm text-muted-foreground">@{profile?.handle || "user"}</p>
              </div>
            </Card>

            {/* Appearance/Theme Card */}
            <Card className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Appearance</h2>
              </div>

              <div className="space-y-3">
                <Label>Theme</Label>
                {mounted && (
                  <div className="flex gap-2">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("light")}
                      className="flex-1"
                    >
                      <Sun className="h-4 w-4 mr-2" />
                      Light
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("dark")}
                      className="flex-1"
                    >
                      <Moon className="h-4 w-4 mr-2" />
                      Dark
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Reminders Tab */}
          <TabsContent value="reminders" className="space-y-4">
            {/* Daily Expense Reminder */}
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Daily Expense Reminder</h2>
                </div>
                <Switch
                  checked={dailyReminderEnabled}
                  onCheckedChange={setDailyReminderEnabled}
                />
              </div>
              
              {dailyReminderEnabled && (
                <div className="space-y-2 pl-7">
                  <Label>Reminder Time</Label>
                  <Select value={dailyReminderTime} onValueChange={setDailyReminderTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REMINDER_TIMES.map((time) => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Daily reminder to log your expenses
                  </p>
                </div>
              )}
            </Card>

            {/* Recurring Payment Reminders */}
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Recurring Payment Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified before recurring payments are due
                  </p>
                </div>
                <Switch
                  checked={recurringReminders}
                  onCheckedChange={setRecurringReminders}
                />
              </div>
              
              {recurringReminders && (
                <div className="space-y-3 pl-0 pt-2 border-t">
                  <Label className="text-sm text-muted-foreground">Remind me:</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={recurringDays.three ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRecurringDays(d => ({ ...d, three: !d.three }))}
                    >
                      3 Days Before
                    </Button>
                    <Button
                      variant={recurringDays.one ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRecurringDays(d => ({ ...d, one: !d.one }))}
                    >
                      1 Day Before
                    </Button>
                    <Button
                      variant={recurringDays.due ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRecurringDays(d => ({ ...d, due: !d.due }))}
                    >
                      On Due Day
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Debt Payment Reminders */}
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Debt Payment Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded about upcoming debt payments
                  </p>
                </div>
                <Switch
                  checked={debtReminders}
                  onCheckedChange={setDebtReminders}
                />
              </div>
              
              {debtReminders && (
                <div className="space-y-3 pl-0 pt-2 border-t">
                  <Label className="text-sm text-muted-foreground">Remind me:</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={debtDays.three ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDebtDays(d => ({ ...d, three: !d.three }))}
                    >
                      3 Days Before
                    </Button>
                    <Button
                      variant={debtDays.one ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDebtDays(d => ({ ...d, one: !d.one }))}
                    >
                      1 Day Before
                    </Button>
                    <Button
                      variant={debtDays.due ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDebtDays(d => ({ ...d, due: !d.due }))}
                    >
                      On Due Day
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Low Balance Alerts */}
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Low Balance Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your balance drops below threshold
                  </p>
                </div>
                <Switch
                  checked={lowBalanceAlerts}
                  onCheckedChange={setLowBalanceAlerts}
                />
              </div>
              
              {lowBalanceAlerts && (
                <div className="space-y-2 pt-2 border-t">
                  <Label>Threshold Amount</Label>
                  <Input
                    type="number"
                    value={lowBalanceThreshold}
                    onChange={(e) => setLowBalanceThreshold(e.target.value)}
                    placeholder="5000"
                  />
                </div>
              )}
            </Card>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-4">
            <Card className="p-4 space-y-4">
              <h2 className="text-lg font-semibold">About MONEE</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Version:</strong> 1.0.0</p>
                <p><strong>Built with:</strong> Next.js, InstantDB, shadcn/ui</p>
                <p className="pt-2">
                  MONEE is an open-source personal finance tracker. Track income, expenses, 
                  debts, and wishlist items all in one place.
                </p>
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <h2 className="text-lg font-semibold">Links</h2>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="https://github.com/farajabien/monee" target="_blank" rel="noopener">
                    GitHub Repository
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/privacy" target="_blank">
                    Privacy Policy
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/terms" target="_blank">
                    Terms of Service
                  </a>
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button - Always visible */}
        <Button onClick={handleSave} className="w-full mt-6" size="lg">
          Save Changes
        </Button>
      </div>
    </div>
  );
}

