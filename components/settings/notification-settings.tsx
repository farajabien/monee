"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Bell,
  Calendar,
  DollarSign,
  Target,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface NotificationPreferences {
  enabled: boolean;
  dailyExpenseReminder: {
    enabled: boolean;
    time: string; // HH:MM format
  };
  debtReminders: {
    enabled: boolean;
    daysBefore: number; // Days before due date to notify
  };
  paydayReminders: {
    enabled: boolean;
    daysBefore: number; // Days before payday to notify
  };
  savingsReminders: {
    enabled: boolean;
    weeklyNudge: boolean;
    targetReached: boolean;
  };
  dailySpendingThreshold: {
    enabled: boolean;
    amount: number; // KSH amount per day
    notifyWhenExceeding: boolean;
    notifyWhenUnder: boolean;
  };
}

const defaultPreferences: NotificationPreferences = {
  enabled: false,
  dailyExpenseReminder: {
    enabled: true,
    time: "20:00",
  },
  debtReminders: {
    enabled: true,
    daysBefore: 2,
  },
  paydayReminders: {
    enabled: true,
    daysBefore: 1,
  },
  savingsReminders: {
    enabled: true,
    weeklyNudge: true,
    targetReached: true,
  },
  dailySpendingThreshold: {
    enabled: false,
    amount: 1000,
    notifyWhenExceeding: true,
    notifyWhenUnder: false,
  },
};

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("notificationPreferences");
        if (saved) {
          try {
            return JSON.parse(saved);
          } catch (error) {
            console.error("Failed to parse notification preferences:", error);
          }
        }
      }
      return defaultPreferences;
    }
  );
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(
      "notificationPreferences",
      JSON.stringify(preferences)
    );
  }, [preferences]);

  // Send messages to service worker when preferences change
  useEffect(() => {
    if (!("serviceWorker" in navigator) || permission !== "granted") return;

    navigator.serviceWorker.ready.then((registration) => {
      // Daily expense reminder
      if (preferences.enabled && preferences.dailyExpenseReminder.enabled) {
        registration.active?.postMessage({
          type: "SCHEDULE_DAILY_EXPENSE",
          data: { time: preferences.dailyExpenseReminder.time },
        });
      } else {
        registration.active?.postMessage({
          type: "CANCEL_DAILY_EXPENSE",
        });
      }

      // Weekly savings nudge
      if (
        preferences.enabled &&
        preferences.savingsReminders.enabled &&
        preferences.savingsReminders.weeklyNudge
      ) {
        registration.active?.postMessage({
          type: "SCHEDULE_SAVINGS_WEEKLY",
        });
      } else {
        registration.active?.postMessage({
          type: "CANCEL_SAVINGS_WEEKLY",
        });
      }
    });
  }, [
    preferences.enabled,
    preferences.dailyExpenseReminder.enabled,
    preferences.dailyExpenseReminder.time,
    preferences.savingsReminders.enabled,
    preferences.savingsReminders.weeklyNudge,
    permission,
  ]);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Notifications not supported", {
        description: "Your browser doesn&apos;t support push notifications.",
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        toast.success("Notifications enabled!", {
          description:
            "You&apos;ll receive reminders based on your preferences.",
        });

        // Send test notification
        new Notification("MONEE Notifications Enabled 🎉", {
          body: "You'll receive helpful reminders to stay on top of your finances.",
          icon: "/AppImages/money-bag.png",
        });

        return true;
      } else {
        toast.error("Permission denied", {
          description: "Please enable notifications in your browser settings.",
        });
        return false;
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("Failed to enable notifications");
      return false;
    }
  };

  const handleMasterToggle = async (enabled: boolean) => {
    if (enabled && permission !== "granted") {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }

    setPreferences((prev) => ({ ...prev, enabled }));

    if (enabled) {
      toast.success("Notifications enabled");
    } else {
      toast.info("Notifications disabled");
    }
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleTestNotification = () => {
    if (permission !== "granted") {
      toast.error("Notifications not enabled");
      return;
    }

    new Notification("MONEE Test Notification", {
      body: "This is a test notification. You're all set!",
      icon: "/AppImages/money-bag.png",
    });

    toast.success("Test notification sent!");
  };

  if (permission === "denied") {
    return (
      <div className="border border-destructive rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h3 className="font-semibold">Notifications Blocked</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            You&apos;ve blocked notifications for this site. To enable them:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Click the lock icon in your browser&apos;s address bar</li>
            <li>Find &quot;Notifications&quot; in the permissions list</li>
            <li>Change it from &quot;Block&quot; to &quot;Allow&quot;</li>
            <li>Refresh this page</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Master Toggle */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1">Push Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Get reminders to help you stay on top of your finances
            </p>
          </div>
          <Switch
            checked={preferences.enabled}
            onCheckedChange={handleMasterToggle}
          />
        </div>
        {preferences.enabled && (
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestNotification}
              className="w-full sm:w-auto"
            >
              Send Test Notification
            </Button>
          </div>
        )}
      </div>

      {/* Notification Settings Accordion */}
      {preferences.enabled && (
        <Accordion type="multiple" className="w-full space-y-4">
          {/* Daily Expense Reminder */}
          <AccordionItem
            value="daily-expense"
            className="border rounded-lg px-6"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-base">
                    Daily Expense Reminder
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Remind me to log my daily expenses
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Reminder</Label>
                  <Switch
                    checked={preferences.dailyExpenseReminder.enabled}
                    onCheckedChange={(enabled) =>
                      updatePreference("dailyExpenseReminder", {
                        ...preferences.dailyExpenseReminder,
                        enabled,
                      })
                    }
                  />
                </div>
                {preferences.dailyExpenseReminder.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="reminder-time">Reminder Time</Label>
                    <Input
                      id="reminder-time"
                      type="time"
                      value={preferences.dailyExpenseReminder.time}
                      onChange={(e) =>
                        updatePreference("dailyExpenseReminder", {
                          ...preferences.dailyExpenseReminder,
                          time: e.target.value,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      We&apos;ll remind you every day at this time
                    </p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Debt Reminders */}
          <AccordionItem
            value="debt-reminders"
            className="border rounded-lg px-6"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-destructive" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-base">
                    Debt Due Date Reminders
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Get notified before debt payments are due
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Reminder</Label>
                  <Switch
                    checked={preferences.debtReminders.enabled}
                    onCheckedChange={(enabled) =>
                      updatePreference("debtReminders", {
                        ...preferences.debtReminders,
                        enabled,
                      })
                    }
                  />
                </div>
                {preferences.debtReminders.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="debt-days">Notify me</Label>
                    <Select
                      value={preferences.debtReminders.daysBefore.toString()}
                      onValueChange={(value) =>
                        updatePreference("debtReminders", {
                          ...preferences.debtReminders,
                          daysBefore: parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger id="debt-days">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 day before</SelectItem>
                        <SelectItem value="2">2 days before</SelectItem>
                        <SelectItem value="3">3 days before</SelectItem>
                        <SelectItem value="7">1 week before</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Payday Reminders */}
          <AccordionItem
            value="payday-reminders"
            className="border rounded-lg px-6"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-base">
                    Payday Reminders
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Get notified when payday is coming
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Reminder</Label>
                  <Switch
                    checked={preferences.paydayReminders.enabled}
                    onCheckedChange={(enabled) =>
                      updatePreference("paydayReminders", {
                        ...preferences.paydayReminders,
                        enabled,
                      })
                    }
                  />
                </div>
                {preferences.paydayReminders.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="payday-days">Notify me</Label>
                    <Select
                      value={preferences.paydayReminders.daysBefore.toString()}
                      onValueChange={(value) =>
                        updatePreference("paydayReminders", {
                          ...preferences.paydayReminders,
                          daysBefore: parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger id="payday-days">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">On payday</SelectItem>
                        <SelectItem value="1">1 day before</SelectItem>
                        <SelectItem value="2">2 days before</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Savings Reminders */}
          <AccordionItem
            value="savings-reminders"
            className="border rounded-lg px-6"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-base">
                    Savings Reminders
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Stay motivated with savings milestones
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Reminder</Label>
                  <Switch
                    checked={preferences.savingsReminders.enabled}
                    onCheckedChange={(enabled) =>
                      updatePreference("savingsReminders", {
                        ...preferences.savingsReminders,
                        enabled,
                      })
                    }
                  />
                </div>
                {preferences.savingsReminders.enabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Weekly Nudge</Label>
                        <p className="text-xs text-muted-foreground">
                          Remind me to contribute to savings weekly
                        </p>
                      </div>
                      <Switch
                        checked={preferences.savingsReminders.weeklyNudge}
                        onCheckedChange={(checked) =>
                          updatePreference("savingsReminders", {
                            ...preferences.savingsReminders,
                            weeklyNudge: checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Target Reached</Label>
                        <p className="text-xs text-muted-foreground">
                          Celebrate when I reach a savings goal
                        </p>
                      </div>
                      <Switch
                        checked={preferences.savingsReminders.targetReached}
                        onCheckedChange={(checked) =>
                          updatePreference("savingsReminders", {
                            ...preferences.savingsReminders,
                            targetReached: checked,
                          })
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Daily Spending Threshold */}
          <AccordionItem
            value="spending-threshold"
            className="border rounded-lg px-6"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-base">
                    Daily Spending Threshold
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Track your daily spending against a limit
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Threshold</Label>
                  <Switch
                    checked={preferences.dailySpendingThreshold.enabled}
                    onCheckedChange={(enabled) =>
                      updatePreference("dailySpendingThreshold", {
                        ...preferences.dailySpendingThreshold,
                        enabled,
                      })
                    }
                  />
                </div>
                {preferences.dailySpendingThreshold.enabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="threshold-amount">
                        Daily Limit (KSh)
                      </Label>
                      <Input
                        id="threshold-amount"
                        type="number"
                        min="0"
                        step="100"
                        value={preferences.dailySpendingThreshold.amount}
                        onChange={(e) =>
                          updatePreference("dailySpendingThreshold", {
                            ...preferences.dailySpendingThreshold,
                            amount: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Your target daily spending limit
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Notify when exceeding</Label>
                        <p className="text-xs text-muted-foreground">
                          Alert me when spending goes over limit
                        </p>
                      </div>
                      <Switch
                        checked={
                          preferences.dailySpendingThreshold.notifyWhenExceeding
                        }
                        onCheckedChange={(checked) =>
                          updatePreference("dailySpendingThreshold", {
                            ...preferences.dailySpendingThreshold,
                            notifyWhenExceeding: checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Notify when under budget</Label>
                        <p className="text-xs text-muted-foreground">
                          Celebrate staying under your daily limit
                        </p>
                      </div>
                      <Switch
                        checked={
                          preferences.dailySpendingThreshold.notifyWhenUnder
                        }
                        onCheckedChange={(checked) =>
                          updatePreference("dailySpendingThreshold", {
                            ...preferences.dailySpendingThreshold,
                            notifyWhenUnder: checked,
                          })
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
