"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { PWABottomNav } from "@/components/pwa/pwa-bottom-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  Moon,
  Sun,
  Monitor,
  User,
  Mail,
  Calendar,
  TrendingUp,
  Download,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import db from "@/lib/db";
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
import { NotificationSettings } from "@/components/settings/notification-settings";

export default function SettingsClient() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [currency, setCurrency] = useState("KES");
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { isLoading, error, data } = db.useQuery({
    profiles: {
      expenses: {},
      categories: {},
      budgets: {},
      eltiwItems: {},
      dailyCheckins: {},
      incomeSources: {},
      debts: {
        payments: {},
      },
      recipients: {},
      savingsGoals: {
        contributions: {},
      },
    },
    $users: {},
  });

  const profile = data?.profiles?.[0];
  const user = data?.$users?.[0];

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    // Apply theme logic here
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // System preference
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    toast.success(`Theme changed to ${newTheme}`);
  };

  const handleProfileUpdate = async (field: string, value: string | number) => {
    if (!profile) return;

    try {
      await db.transact([
        db.tx.profiles[profile.id].update({ [field]: value }),
      ]);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error("Failed to update profile");
    }
  };

  const handleExportData = async () => {
    if (!profile) return;

    setIsExporting(true);
    try {
      // Compile all user data
      const exportData = {
        profile: {
          handle: profile.handle,
          monthlyBudget: profile.monthlyBudget,
          createdAt: profile.createdAt,
        },
        user: {
          email: user?.email,
          hasPaid: user?.hasPaid,
          paymentDate: user?.paymentDate,
        },
        expenses: profile.expenses || [],
        categories: profile.categories || [],
        budgets: profile.budgets || [],
        eltiwItems: profile.eltiwItems || [],
        dailyCheckins: profile.dailyCheckins || [],
        incomeSources: profile.incomeSources || [],
        debts:
          profile.debts?.map((debt) => ({
            ...debt,
            payments: debt.payments || [],
          })) || [],
        recipients: profile.recipients || [],
        savingsGoals:
          profile.savingsGoals?.map((goal) => ({
            ...goal,
            contributions: goal.contributions || [],
          })) || [],
        exportDate: new Date().toISOString(),
      };

      // Create JSON blob
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `monee-data-export-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Data exported successfully");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportTransactions = async () => {
    if (!profile || !profile.expenses) return;

    setIsExporting(true);
    try {
      // Create CSV content
      const headers = [
        "Date",
        "Amount",
        "Recipient",
        "Category",
        "Type",
        "Notes",
        "Created At",
      ];
      const rows = profile.expenses.map((expense) => [
        new Date(expense.date).toLocaleDateString("en-KE"),
        expense.amount,
        expense.recipient,
        expense.category,
        expense.expenseType || "",
        expense.notes || "",
        new Date(expense.createdAt).toLocaleString("en-KE"),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      // Create CSV blob
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `monee-transactions-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Transaction history exported successfully");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export transaction history");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile || !user) return;

    setIsDeleting(true);
    try {
      // Delete all related data
      const transactions = [];

      // Delete all expenses
      if (profile.expenses) {
        profile.expenses.forEach((expense) => {
          transactions.push(db.tx.expenses[expense.id].delete());
        });
      }

      // Delete all categories
      if (profile.categories) {
        profile.categories.forEach((category) => {
          transactions.push(db.tx.categories[category.id].delete());
        });
      }

      // Delete all budgets
      if (profile.budgets) {
        profile.budgets.forEach((budget) => {
          transactions.push(db.tx.budgets[budget.id].delete());
        });
      }

      // Delete all eltiw items
      if (profile.eltiwItems) {
        profile.eltiwItems.forEach((item) => {
          transactions.push(db.tx.eltiw_items[item.id].delete());
        });
      }

      // Delete all daily checkins
      if (profile.dailyCheckins) {
        profile.dailyCheckins.forEach((checkin) => {
          transactions.push(db.tx.daily_checkins[checkin.id].delete());
        });
      }

      // Delete all income sources
      if (profile.incomeSources) {
        profile.incomeSources.forEach((source) => {
          transactions.push(db.tx.income_sources[source.id].delete());
        });
      }

      // Delete all debt payments and debts
      if (profile.debts) {
        profile.debts.forEach((debt) => {
          if (debt.payments) {
            debt.payments.forEach((payment) => {
              transactions.push(db.tx.debt_payments[payment.id].delete());
            });
          }
          transactions.push(db.tx.debts[debt.id].delete());
        });
      }

      // Delete all recipients
      if (profile.recipients) {
        profile.recipients.forEach((recipient) => {
          transactions.push(db.tx.recipients[recipient.id].delete());
        });
      }

      // Delete all savings contributions and goals
      if (profile.savingsGoals) {
        profile.savingsGoals.forEach((goal) => {
          if (goal.contributions) {
            goal.contributions.forEach((contribution) => {
              transactions.push(
                db.tx.savings_contributions[contribution.id].delete()
              );
            });
          }
          transactions.push(db.tx.savings_goals[goal.id].delete());
        });
      }

      // Delete profile
      transactions.push(db.tx.profiles[profile.id].delete());

      // Execute all deletions
      await db.transact(transactions);

      toast.success("Account deleted successfully");

      // Sign out user
      db.auth.signOut();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4">Error: {error.message}</div>;
  if (!profile) return <div className="p-4">No profile found</div>;

  return (
    <div className="mx-auto max-w-md p-3 sm:p-4 md:p-6 pb-20 md:pb-0">
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-muted-foreground mb-4">
        Manage your preferences and account settings
      </p>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full grid grid-cols-4 mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how Monee looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    className="w-full"
                    onClick={() => handleThemeChange("light")}
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    className="w-full"
                    onClick={() => handleThemeChange("dark")}
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    className="w-full"
                    onClick={() => handleThemeChange("system")}
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    System
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Currency & Format</CardTitle>
              <CardDescription>Set your preferred currency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KES">KES (Kenyan Shilling)</SelectItem>
                    <SelectItem value="USD">USD (US Dollar)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <NotificationSettings />
        </TabsContent>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="handle">
                  <User className="h-4 w-4 inline mr-2" />
                  Handle
                </Label>
                <Input
                  id="handle"
                  value={profile.handle || ""}
                  onChange={(e) =>
                    handleProfileUpdate("handle", e.target.value)
                  }
                  placeholder="Your handle"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyBudget">
                  <span className="inline mr-2">💰</span>
                  Monthly Budget (KES)
                </Label>
                <Input
                  id="monthlyBudget"
                  type="number"
                  value={profile.monthlyBudget || 0}
                  onChange={(e) =>
                    handleProfileUpdate("monthlyBudget", Number(e.target.value))
                  }
                  placeholder="50000"
                />
                <p className="text-xs text-muted-foreground">
                  Your total monthly budget across all categories
                </p>
              </div>

              <div className="space-y-2">
                <Label>
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Member Since
                </Label>
                <Input
                  value={
                    profile.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString(
                          "en-KE",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "Unknown"
                  }
                  disabled
                  className="bg-muted"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <TrendingUp className="h-5 w-5 inline mr-2" />
                Your Stats
              </CardTitle>
              <CardDescription>
                Overview of your financial activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Total Expenses
                </span>
                <span className="font-semibold">
                  {profile.expenses?.length || 0} transactions
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Active Categories
                </span>
                <span className="font-semibold">
                  {profile.categories?.filter((c) => c.isActive !== false)
                    .length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Savings Goals
                </span>
                <span className="font-semibold">
                  {profile.savingsGoals?.length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Active Debts
                </span>
                <span className="font-semibold">
                  {profile.debts?.length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Income Sources
                </span>
                <span className="font-semibold">
                  {profile.incomeSources?.filter((i) => i.isActive).length || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Manage your Monee subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Status</Label>
                  <p className="text-sm text-muted-foreground">
                    {user?.hasPaid ? "Active - Lifetime Access" : "Free Trial"}
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user?.hasPaid
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                  }`}
                >
                  {user?.hasPaid ? "PAID" : "TRIAL"}
                </div>
              </div>

              {user?.hasPaid && user?.paymentDate && (
                <div className="space-y-0.5">
                  <Label>Payment Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user.paymentDate).toLocaleDateString("en-KE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}

              {!user?.hasPaid && (
                <Button className="w-full" size="lg">
                  Upgrade to Lifetime Access - KES 999
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data & Privacy</CardTitle>
              <CardDescription>
                Manage your data and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleExportData}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export My Data"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Download all your data in JSON format
              </p>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleExportTransactions}
                disabled={isExporting || !profile.expenses?.length}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Download Transaction History"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Export your transactions as a CSV file
              </p>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">
                <AlertTriangle className="h-5 w-5 inline mr-2" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? "Deleting..." : "Delete Account"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your account and remove all your data from our servers,
                      including:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>All expenses and transactions</li>
                        <li>Categories and budgets</li>
                        <li>Savings goals and contributions</li>
                        <li>Debts and payment history</li>
                        <li>Income sources</li>
                        <li>Recipients and preferences</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, delete my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <p className="text-xs text-muted-foreground text-center">
                This will permanently delete your account and all associated
                data
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="h-20" />
      <PWABottomNav />
    </div>
  );
}
