"use client";

import { useState, useEffect } from "react";
import db from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Bell, Download, Moon, Sun, Trash2, DollarSign } from "lucide-react";
import { useTheme } from "next-themes";

export default function SettingsClient() {
  const user = db.useUser();
  const { theme, setTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [reminderTime, setReminderTime] = useState("20:00");
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
      // Check if user has enabled notifications in localStorage
      const enabled = localStorage.getItem("notifications-enabled") === "true";
      const savedTime = localStorage.getItem("notification-time");
      setNotificationsEnabled(enabled && Notification.permission === "granted");
      if (savedTime) setReminderTime(savedTime);
    }
  }, []);

  // Fetch user data (payment info is on $users, not profiles)
  const { data: userData } = db.useQuery({
    $users: {
      $: {
        where: { id: user.id },
      },
    },
  });

  const userRecord = userData?.$users?.[0];

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled && notificationPermission !== "granted") {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === "granted") {
        setNotificationsEnabled(true);
        localStorage.setItem("notifications-enabled", "true");
        
        // Send test notification
        new Notification("MONEE Notifications Enabled! 🇰🇪", {
          body: `You'll receive a daily reminder at ${reminderTime} to track your expenses.`,
          icon: "/AppImages/money-bag.png",
          badge: "/AppImages/money-bag.png",
        });
        
        // Schedule daily reminder
        scheduleNotification(reminderTime);
      }
    } else {
      setNotificationsEnabled(enabled);
      localStorage.setItem("notifications-enabled", enabled.toString());
      if (!enabled) {
        cancelScheduledNotification();
      }
    }
  };

  const handleReminderTimeChange = (time: string) => {
    setReminderTime(time);
    localStorage.setItem("notification-time", time);
    if (notificationsEnabled) {
      scheduleNotification(time);
    }
  };

  const scheduleNotification = (time: string) => {
    // Store reminder time for service worker
    localStorage.setItem("notification-time", time);
    
    // Send message to service worker to schedule notification
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SCHEDULE_NOTIFICATION",
        time: time,
      });
    }
  };

  const cancelScheduledNotification = () => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "CANCEL_NOTIFICATION",
      });
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Fetch all user data
      const { data } = await db.queryOnce({
        transactions: {
          $: { where: { "user.id": user.id } },
        },
        categories: {
          $: { where: { "user.id": user.id } },
        },
        budgets: {
          $: { where: { "user.id": user.id } },
        },
        income_sources: {
          $: { where: { "user.id": user.id } },
        },
        debts: {
          $: { where: { "user.id": user.id } },
        },
        eltiw_items: {
          $: { where: { "user.id": user.id } },
        },
        recipients: {
          $: { where: { "user.id": user.id } },
        },
      });

      // Create export object
      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          hasPaid: userRecord?.hasPaid,
          paymentDate: userRecord?.paymentDate,
        },
        ...data,
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `monee-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Delete all user data (InstantDB will cascade delete related records)
      // Note: This would need proper implementation with InstantDB's delete API
      alert("Account deletion is not yet implemented. Please contact support@monee.app");
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your preferences and account settings
        </p>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Get daily reminders to track your expenses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive daily evening reminders
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={handleNotificationToggle}
            />
          </div>

          {notificationPermission === "denied" && (
            <div className="rounded-lg bg-destructive/10 p-4 text-sm">
              <p className="font-medium text-destructive">Notifications Blocked</p>
              <p className="text-muted-foreground mt-1">
                You&apos;ve blocked notifications. Enable them in your browser settings.
              </p>
            </div>
          )}

          {notificationsEnabled && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="reminder-time">Daily Reminder Time</Label>
                <Select value={reminderTime} onValueChange={handleReminderTimeChange}>
                  <SelectTrigger id="reminder-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="18:00">6:00 PM</SelectItem>
                    <SelectItem value="19:00">7:00 PM</SelectItem>
                    <SelectItem value="20:00">8:00 PM (Default)</SelectItem>
                    <SelectItem value="21:00">9:00 PM</SelectItem>
                    <SelectItem value="22:00">10:00 PM</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Get reminded to track your daily expenses at this time
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how MONEE looks on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose light or dark mode, or follow your system preference
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Currency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Currency & Format
          </CardTitle>
          <CardDescription>
            Currency formatting preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Currency</Label>
              <p className="text-sm text-muted-foreground">
                Kenyan Shilling (KES)
              </p>
            </div>
            <Badge>Default</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Format</Label>
              <p className="text-sm text-muted-foreground">
                Ksh 1,000.00
              </p>
            </div>
            <Badge variant="outline">Kenya Standard</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data & Privacy
          </CardTitle>
          <CardDescription>
            Export your data or delete your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Export All Data</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Download all your transactions, budgets, and settings as JSON
            </p>
            <Button
              variant="outline"
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Export Data"}
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-destructive">Danger Zone</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Permanently delete your account and all associated data
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    account and remove all your data from our servers including:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>All transactions</li>
                      <li>Categories and budgets</li>
                      <li>Income sources and debts</li>
                      <li>ELTIW wishlist items</li>
                      <li>All settings and preferences</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Everything"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your MONEE account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{user.email}</p>
            </div>
            <Separator />
            <div>
              <Label className="text-muted-foreground">Account Status</Label>
              <div className="flex items-center gap-2 mt-1">
                {userRecord?.hasPaid ? (
                  <>
                    <Badge className="bg-green-500">Premium - Lifetime Access</Badge>
                    {userRecord.paymentDate && (
                      <span className="text-sm text-muted-foreground">
                        Since {new Date(userRecord.paymentDate).toLocaleDateString("en-KE")}
                      </span>
                    )}
                  </>
                ) : (
                  <Badge variant="outline">Free Trial</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardContent className="pt-6 text-center text-sm text-muted-foreground">
          <p>MONEE v0.1.0</p>
          <p className="mt-1">Built in Kenya, for Kenyans 🇰🇪</p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <a href="/terms" className="hover:text-primary transition-colors">
              Terms
            </a>
            <a href="/privacy" className="hover:text-primary transition-colors">
              Privacy
            </a>
            <a href="mailto:support@monee.app" className="hover:text-primary transition-colors">
              Support
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
