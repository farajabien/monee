"use client";

import { useState } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { ConfigureDebtDialog } from "@/components/configure-debt-dialog";

interface AddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId?: string;
}

export function AddSheet({ open, onOpenChange, profileId }: AddSheetProps) {
  const [activeTab, setActiveTab] = useState("expense");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Configure Debt Dialog state
  const [showConfigureDebt, setShowConfigureDebt] = useState(false);
  const [newDebtId, setNewDebtId] = useState<string | undefined>();
  const [newDebtAmount, setNewDebtAmount] = useState<number | undefined>();
  const [newDebtPerson, setNewDebtPerson] = useState<string | undefined>();

  // Toggle modes for add new
  const [isNewSource, setIsNewSource] = useState(false);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [isNewRecipient, setIsNewRecipient] = useState(false);
  const [isNewItem, setIsNewItem] = useState(false);
  const [isNewPerson, setIsNewPerson] = useState(false);

  // Fetch existing data for dropdowns
  const { data } = db.useQuery({
    income: {},
    expenses: {},
    wishlist: {},
    debts: {},
  });

  // Get unique values
  const existingSources = Array.from(new Set(data?.income?.map(i => i.source).filter(Boolean))) as string[];
  const existingCategories = Array.from(new Set(data?.expenses?.map(e => e.category).filter(Boolean))) as string[];
  const existingRecipients = Array.from(new Set(data?.expenses?.map(e => e.recipient).filter(Boolean))) as string[];
  const existingItems = Array.from(new Set(data?.wishlist?.map(w => w.itemName).filter(Boolean))) as string[];
  const existingPersons = Array.from(new Set(data?.debts?.map(d => d.personName).filter(Boolean))) as string[];

  // Common fields
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  // Income fields
  const [incomeSource, setIncomeSource] = useState("");
  const [incomeIsRecurring, setIncomeIsRecurring] = useState(false);
  const [incomeFrequency, setIncomeFrequency] = useState("monthly");

  // Debt fields
  const [personName, setPersonName] = useState("");
  const [debtDirection, setDebtDirection] = useState("I_OWE");
  const [dueDate, setDueDate] = useState("");

  // Expense fields
  const [category, setCategory] = useState("");
  const [recipient, setRecipient] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [expenseFrequency, setExpenseFrequency] = useState("monthly");

  // Wishlist fields
  const [itemName, setItemName] = useState("");
  const [wishlistStatus, setWishlistStatus] = useState("want");

  const resetForm = () => {
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setIncomeSource("");
    setPersonName("");
    setCategory("");
    setRecipient("");
    setItemName("");
    setIsNewSource(false);
    setIsNewCategory(false);
    setIsNewRecipient(false);
    setIsNewItem(false);
    setIsNewPerson(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) {
      toast.error("Profile not found");
      return;
    }

    setIsSubmitting(true);

    try {
      const now = Date.now();
      const parsedAmount = parseFloat(amount) || 0;
      const dateTimestamp = new Date(date).getTime();

      switch (activeTab) {
        case "income":
          if (!incomeSource) {
            toast.error("Please enter income source");
            return;
          }
          await db.transact(
            db.tx.income[id()]
              .update({
                amount: parsedAmount,
                source: incomeSource,
                type: incomeIsRecurring ? "recurring" : "one-time",
                date: dateTimestamp,
                notes: notes || undefined,
                isRecurring: incomeIsRecurring,
                frequency: incomeIsRecurring ? incomeFrequency : undefined,
                createdAt: now,
              })
              .link({ profile: profileId })
          );
          toast.success("Income added!");
          break;

        case "debt":
          if (!personName) {
            toast.error("Please enter person name");
            return;
          }
          const debtId = id();
          await db.transact(
            db.tx.debts[debtId]
              .update({
                personName,
                amount: parsedAmount,
                currentBalance: parsedAmount, // Initialize currentBalance to amount
                direction: debtDirection,
                date: dateTimestamp,
                dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
                status: "pending",
                notes: notes || undefined,
                createdAt: now,
              })
              .link({ profile: profileId })
          );
          toast.success("Debt added!");

          // Set debt info for configuration dialog
          setNewDebtId(debtId);
          setNewDebtAmount(parsedAmount);
          setNewDebtPerson(personName);

          // Show configure debt dialog instead of closing immediately
          resetForm();
          onOpenChange(false);
          setShowConfigureDebt(true);
          return; // Return early to prevent the normal close flow
          break;

        case "expense":
          if (!recipient) {
            toast.error("Please enter recipient");
            return;
          }
          await db.transact(
            db.tx.expenses[id()]
              .update({
                amount: parsedAmount,
                category: category || "Uncategorized",
                recipient,
                date: dateTimestamp,
                notes: notes || undefined,
                isRecurring,
                frequency: isRecurring ? expenseFrequency : undefined,
                createdAt: now,
              })
              .link({ profile: profileId })
          );
          toast.success("Expense added!");
          break;

        case "elliw":
          if (!itemName) {
            toast.error("Please enter item name");
            return;
          }
          await db.transact(
            db.tx.wishlist[id()]
              .update({
                itemName,
                amount: parsedAmount || undefined,
                status: wishlistStatus,
                gotDate: wishlistStatus === "got" ? now : undefined,
                notes: notes || undefined,
                createdAt: now,
              })
              .link({ profile: profileId })
          );
          toast.success("Wishlist item added!");
          break;
      }

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding:", error);
      toast.error("Failed to add. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-xl p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <SheetTitle>Add Transaction</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-4 sticky top-0 z-10 bg-background max-w-md mx-auto">
              <TabsTrigger value="income" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold">Income</TabsTrigger>
              <TabsTrigger value="debt" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold">Debt</TabsTrigger>
              <TabsTrigger value="expense" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold">Expense</TabsTrigger>
              <TabsTrigger value="elliw" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold">ELLIW</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 pb-6 max-w-md mx-auto">
            {/* Common: Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (KSh)</Label>
              <Input
                id="amount"
                type="number"
                inputMode="numeric"
                step="0.01"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required={activeTab !== "elliw"}
              />
            </div>

            {/* Common: Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <TabsContent value="income" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                {!isNewSource ? (
                  <div className="flex gap-2">
                    <Select
                      value={incomeSource}
                      onValueChange={(value) => {
                        if (value === "__new__") {
                          setIsNewSource(true);
                          setIncomeSource("");
                        } else {
                          setIncomeSource(value);
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select or add new..." />
                      </SelectTrigger>
                      <SelectContent>
                        {existingSources.map((source) => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                        <SelectItem value="__new__" className="font-semibold bg-primary text-primary-foreground">
                          <div className="flex items-center gap-1.5">
                            <Plus className="h-3 w-3" />
                            Add New Source
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      id="source"
                      placeholder="Enter source name"
                      value={incomeSource}
                      onChange={(e) => setIncomeSource(e.target.value)}
                      required
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsNewSource(false)}
                      className="text-xs"
                    >
                      ← Back to existing sources
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between space-y-2">
                <div className="space-y-0.5">
                  <Label htmlFor="income-recurring">Recurring Income</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable for regular income (salary, freelance contracts)
                  </p>
                </div>
                <Switch
                  id="income-recurring"
                  checked={incomeIsRecurring}
                  onCheckedChange={setIncomeIsRecurring}
                />
              </div>

              {incomeIsRecurring && (
                <div className="space-y-2">
                  <Label htmlFor="income-frequency">Frequency</Label>
                  <Select value={incomeFrequency} onValueChange={setIncomeFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>

            <TabsContent value="debt" className="space-y-4 mt-0">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                <Label htmlFor="person">Person Name</Label>
                {!isNewPerson ? (
                  <div className="flex gap-2">
                    <Select
                      value={personName}
                      onValueChange={(value) => {
                        if (value === "__new__") {
                          setIsNewPerson(true);
                          setPersonName("");
                        } else {
                          setPersonName(value);
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select or add new..." />
                      </SelectTrigger>
                      <SelectContent>
                        {existingPersons.map((person) => (
                          <SelectItem key={person} value={person}>
                            {person}
                          </SelectItem>
                        ))}
                        <SelectItem value="__new__" className="font-semibold bg-primary text-primary-foreground">
                          <div className="flex items-center gap-1.5">
                            <Plus className="h-3 w-3" />
                            Add New Person
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      id="person"
                      placeholder="Enter person name"
                      value={personName}
                      onChange={(e) => setPersonName(e.target.value)}
                      required
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsNewPerson(false)}
                      className="text-xs"
                    >
                      ← Back to existing persons
                    </Button>
                  </div>
                )}
              </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direction">Direction</Label>
                <Select value={debtDirection} onValueChange={setDebtDirection}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="I_OWE">I Owe</SelectItem>
                    <SelectItem value="THEY_OWE_ME">They Owe Me</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="expense" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient</Label>
                {!isNewRecipient ? (
                  <div className="flex gap-2">
                    <Select
                      value={recipient}
                      onValueChange={(value) => {
                        if (value === "__new__") {
                          setIsNewRecipient(true);
                          setRecipient("");
                        } else {
                          setRecipient(value);
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select or add new..." />
                      </SelectTrigger>
                      <SelectContent>
                        {existingRecipients.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                        <SelectItem value="__new__" className="font-semibold bg-primary text-primary-foreground">
                          <div className="flex items-center gap-1.5">
                            <Plus className="h-3 w-3" />
                            Add New Recipient
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      id="recipient"
                      placeholder="Enter recipient name"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      required
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsNewRecipient(false)}
                      className="text-xs"
                    >
                      ← Back to existing recipients
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                {!isNewCategory ? (
                  <div className="flex gap-2">
                    <Select
                      value={category}
                      onValueChange={(value) => {
                        if (value === "__new__") {
                          setIsNewCategory(true);
                          setCategory("");
                        } else {
                          setCategory(value);
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select or add new..." />
                      </SelectTrigger>
                      <SelectContent>
                        {existingCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                        <SelectItem value="__new__" className="font-semibold bg-primary text-primary-foreground">
                          <div className="flex items-center gap-1.5">
                            <Plus className="h-3 w-3" />
                            Add New Category
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      id="category"
                      placeholder="Enter category name"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsNewCategory(false)}
                      className="text-xs"
                    >
                      ← Back to existing categories
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between space-y-2">
                <div className="space-y-0.5">
                  <Label htmlFor="expense-recurring">Recurring Expense</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable for regular expenses (rent, subscriptions)
                  </p>
                </div>
                <Switch
                  id="expense-recurring"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
              </div>

              {isRecurring && (
                <div className="space-y-2">
                  <Label htmlFor="expense-frequency">Frequency</Label>
                  <Select value={expenseFrequency} onValueChange={setExpenseFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>

            <TabsContent value="elliw" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="item">Item Name</Label>
                {!isNewItem ? (
                  <div className="flex gap-2">
                    <Select
                      value={itemName}
                      onValueChange={(value) => {
                        if (value === "__new__") {
                          setIsNewItem(true);
                          setItemName("");
                        } else {
                          setItemName(value);
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select or add new..." />
                      </SelectTrigger>
                      <SelectContent>
                        {existingItems.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                        <SelectItem value="__new__" className="font-semibold bg-primary text-primary-foreground">
                          <div className="flex items-center gap-1.5">
                            <Plus className="h-3 w-3" />
                            Add New Item
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      id="item"
                      placeholder="Enter item name"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      required
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsNewItem(false)}
                      className="text-xs"
                    >
                      ← Back to existing items
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={wishlistStatus} onValueChange={setWishlistStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="want">Want</SelectItem>
                    <SelectItem value="got">Got</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Common: Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Add notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add"}
            </Button>
            </form>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>

    {/* Configure Debt Dialog */}
    <ConfigureDebtDialog
      open={showConfigureDebt}
      onOpenChange={setShowConfigureDebt}
      debtId={newDebtId}
      debtAmount={newDebtAmount}
      personName={newDebtPerson}
    />
    </>
  );
}
