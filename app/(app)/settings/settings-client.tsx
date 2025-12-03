"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { PWABottomNav } from "@/components/pwa/pwa-bottom-nav";
import { PaywallDialog } from "@/components/payment/paywall-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Item,
  ItemHeader,
  ItemContent,
  ItemTitle,
  ItemDescription,
} from "@/components/ui/item";
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
  MessageSquare,
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
import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import {
  getAllCurrencies,
  getLocaleForCurrency,
  DEFAULT_CURRENCY,
} from "@/lib/currency-utils";

const FREE_TRIAL_DAYS = 7;

export default function SettingsClient() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark");
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

  const { isLoading, error, data } = db.useQuery({
    profiles: {
      expenses: {},
      categories: {},
      dailyCheckins: {},
      incomeSources: {},
      debts: {
        payments: {},
      },
      recipients: {},
      savingsGoals: {
        contributions: {},
      },
      feedback: {},
    },
    $users: {},
  });

  const profile = data?.profiles?.[0];
  const user = data?.$users?.[0];

  // Initialize currency from profile
  useEffect(() => {
    if (profile?.currency) {
      setCurrency(profile.currency);
    }
  }, [profile?.currency]);

  // Initialize theme from localStorage and system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as
      | "light"
      | "dark"
      | "system"
      | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Default to dark mode
      setTheme("dark");
      localStorage.setItem("theme", "dark");
      applyTheme("dark");
    }
  }, []);

  const applyTheme = (newTheme: "light" | "dark" | "system") => {
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
  };

  // Calculate trial status
  const profileCreatedAt = profile?.createdAt || Date.now();
  const daysSinceCreation = Math.floor(
    (Date.now() - profileCreatedAt) / (1000 * 60 * 60 * 24)
  );
  const isTrialActive = daysSinceCreation < FREE_TRIAL_DAYS;
  const daysRemaining = Math.max(0, FREE_TRIAL_DAYS - daysSinceCreation);

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
    toast.success(`Theme changed to ${newTheme}`);
  };

  const handleCurrencyChange = async (newCurrency: string) => {
    if (!profile) return;

    setCurrency(newCurrency);
    try {
      await db.transact([
        db.tx.profiles[profile.id].update({
          currency: newCurrency,
          locale: getLocaleForCurrency(newCurrency),
        }),
      ]);
      toast.success("Currency updated successfully");
    } catch (err) {
      toast.error("Failed to update currency");
    }
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
          createdAt: profile.createdAt,
        },
        user: {
          email: user?.email,
          hasPaid: user?.hasPaid,
          paymentDate: user?.paymentDate,
        },
        expenses: profile.expenses || [],
        categories: profile.categories || [],
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
    <>
      <PaywallDialog open={showPaywall} onOpenChange={setShowPaywall} />
      <FeedbackDialog
        open={showFeedbackDialog}
        onOpenChange={setShowFeedbackDialog}
      />
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full grid grid-cols-4 mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Item>
            <ItemHeader>
              <ItemTitle>Appearance</ItemTitle>
              <ItemDescription>Customize how Monee looks</ItemDescription>
            </ItemHeader>
            <ItemContent className="space-y-4">
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
            </ItemContent>
          </Item>

          <Item>
            <ItemHeader>
              <ItemTitle>Currency & Format</ItemTitle>
              <ItemDescription>Set your preferred currency</ItemDescription>
            </ItemHeader>
            <ItemContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllCurrencies().map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        {curr.symbol} {curr.code} ({curr.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </ItemContent>
          </Item>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <NotificationSettings />
        </TabsContent>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-4">
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="profile-info">
              <Item>
                <ItemHeader>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      <div className="text-left">
                        <ItemTitle>Profile Information</ItemTitle>
                        <ItemDescription>
                          Update your personal details
                        </ItemDescription>
                      </div>
                    </div>
                  </AccordionTrigger>
                </ItemHeader>
                <AccordionContent>
                  <ItemContent className="space-y-4">
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
                  </ItemContent>
                </AccordionContent>
              </Item>
            </AccordionItem>

            <AccordionItem value="stats">
              <Item>
                <ItemHeader>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      <div className="text-left">
                        <ItemTitle>Your Stats</ItemTitle>
                        <ItemDescription>
                          Overview of your financial activity
                        </ItemDescription>
                      </div>
                    </div>
                  </AccordionTrigger>
                </ItemHeader>
                <AccordionContent>
                  <ItemContent className="space-y-3">
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
                        {profile.incomeSources?.filter((i) => i.isActive)
                          .length || 0}
                      </span>
                    </div>
                  </ItemContent>
                </AccordionContent>
              </Item>
            </AccordionItem>

            <AccordionItem value="feedback">
              <Item>
                <ItemHeader>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      <div className="text-left">
                        <ItemTitle>Give Feedback</ItemTitle>
                        <ItemDescription>
                          Your feedback shapes the app
                        </ItemDescription>
                      </div>
                    </div>
                  </AccordionTrigger>
                </ItemHeader>
                <AccordionContent>
                  <ItemContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Your feedback shapes the app. Share your thoughts here, or
                      update it anytime.
                    </p>
                    {profile.feedback && profile.feedback.length > 0 && (
                      <div className="p-3 bg-muted rounded-lg text-sm">
                        <p className="text-muted-foreground">
                          Last feedback:{" "}
                          {new Date(
                            profile.feedback[
                              profile.feedback.length - 1
                            ].createdAt
                          ).toLocaleDateString("en-KE")}
                        </p>
                      </div>
                    )}
                    <Button
                      className="w-full"
                      onClick={() => setShowFeedbackDialog(true)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Share Feedback
                    </Button>
                  </ItemContent>
                </AccordionContent>
              </Item>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-4">
          <Item>
            <ItemHeader>
              <ItemTitle>Subscription</ItemTitle>
              <ItemDescription>Manage your Monee subscription</ItemDescription>
            </ItemHeader>
            <ItemContent className="space-y-4">
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

              {!user?.hasPaid && isTrialActive && (
                <div className="space-y-3">
                  <div className="p-3 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/20">
                    <p className="text-sm font-semibold text-center">
                      🎉 {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}{" "}
                      left in your free trial
                    </p>
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      Unlock lifetime access for just KSh 999
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setShowPaywall(true)}
                  >
                    Upgrade to Lifetime Access - KSh 999
                  </Button>
                </div>
              )}

              {!user?.hasPaid && !isTrialActive && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setShowPaywall(true)}
                >
                  Unlock Full Access - KSh 999
                </Button>
              )}
            </ItemContent>
          </Item>

          <Item>
            <ItemHeader>
              <ItemTitle>Data & Privacy</ItemTitle>
              <ItemDescription>
                Manage your data and privacy settings
              </ItemDescription>
            </ItemHeader>
            <ItemContent className="space-y-4">
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
            </ItemContent>
          </Item>

          <Item className="border-destructive">
            <ItemHeader>
              <ItemTitle className="text-destructive">
                <AlertTriangle className="h-5 w-5 inline mr-2" />
                Danger Zone
              </ItemTitle>
              <ItemDescription>Irreversible actions</ItemDescription>
            </ItemHeader>
            <ItemContent className="space-y-4">
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
                      <div className="space-y-2">
                        <p>
                          This action cannot be undone. This will permanently
                          delete your account and remove all your data from our
                          servers, including:
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>All expenses and transactions</li>
                          <li>Categories</li>
                          <li>Savings goals and contributions</li>
                          <li>Debts and payment history</li>
                          <li>Income sources</li>
                          <li>Recipients and preferences</li>
                        </ul>
                      </div>
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
            </ItemContent>
          </Item>
        </TabsContent>
      </Tabs>

      <div className="h-20" />
      <PWABottomNav />
    </>
  );
}
