"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id } from "@instantdb/react";
import { Calendar, Trash2, Copy, Bookmark, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import db from "@/lib/db";
import type { Expense, IncomeSource, Debt, WishlistItem } from "@/types";

type TransactionType = "expense" | "income" | "debt" | "wishlist";

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Expense | IncomeSource | Debt | WishlistItem;
  type: TransactionType;
  profileId?: string;
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  type,
  profileId,
}: EditTransactionDialogProps) {
  const [activeTab, setActiveTab] = useState<string>(type);
  const [debtEditTab, setDebtEditTab] = useState<"details" | "payment">("details");
  const [expenseEditTab, setExpenseEditTab] = useState<"details" | "mpesa">("details");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  
  // Fetch existing categories
  const { data } = db.useQuery({
    expenses: {},
  });
  const existingCategories = Array.from(new Set(data?.expenses?.map(e => e.category).filter(Boolean))) as string[];
  
  const [formData, setFormData] = useState(() => {
    // Initialize form data based on transaction type
    if (type === "expense") {
      const exp = transaction as Expense;
      return {
        date: exp.date,
        amount: exp.amount,
        recipient: exp.recipient || "",
        category: exp.category || "",
        notes: exp.notes || "",
        isRecurring: exp.isRecurring || false,
        frequency: exp.frequency || "monthly",
        // M-Pesa fields
        mpesaReference: (exp as any).mpesaReference || "",
        mpesaPhoneNumber: (exp as any).mpesaPhoneNumber || "",
        mpesaTransactionCost: (exp as any).mpesaTransactionCost || 0,
        mpesaBalance: (exp as any).mpesaBalance || 0,
        mpesaExpenseType: (exp as any).mpesaExpenseType || "",
        mpesaRawMessage: (exp as any).mpesaRawMessage || "",
      };
    } else if (type === "income") {
      const inc = transaction as IncomeSource;
      return {
        date: inc.date,
        amount: inc.amount,
        source: inc.source || "",
        notes: inc.notes || "",
        isRecurring: inc.isRecurring || false,
        frequency: inc.frequency || "monthly",
      };
    } else if (type === "debt") {
      const debt = transaction as Debt;
      return {
        date: debt.date || debt.createdAt,
        amount: debt.currentBalance || debt.amount || 0,
        originalAmount: debt.amount || 0,
        personName: debt.personName || "",
        direction: debt.direction || "I_OWE",
        dueDate: debt.dueDate || null,
        debtType: debt.debtType || "friend",
        interestRate: debt.interestRate || 0,
        notes: debt.notes || "",
      };
    } else {
      const wish = transaction as WishlistItem;
      return {
        itemName: wish.itemName || "",
        amount: wish.amount || 0,
        status: wish.status || "want",
        link: wish.link || "",
        notes: wish.notes || "",
      };
    }
  });

  const handleUpdate = async () => {
    try {
      if (type === "expense") {
        await db.transact([
          db.tx.expenses[transaction.id].update({
            amount: formData.amount,
            recipient: formData.recipient,
            category: formData.category,
            notes: formData.notes,
            date: formData.date,
            isRecurring: (formData as any).isRecurring,
            frequency: (formData as any).isRecurring ? (formData as any).frequency : undefined,
            // M-Pesa fields
            mpesaReference: (formData as any).mpesaReference || undefined,
            mpesaPhoneNumber: (formData as any).mpesaPhoneNumber || undefined,
            mpesaTransactionCost: (formData as any).mpesaTransactionCost || undefined,
            mpesaBalance: (formData as any).mpesaBalance || undefined,
            mpesaExpenseType: (formData as any).mpesaExpenseType || undefined,
            mpesaRawMessage: (formData as any).mpesaRawMessage || undefined,
          }),
        ]);
      } else if (type === "income") {
        await db.transact([
          db.tx.income[transaction.id].update({
            amount: formData.amount,
            source: (formData as any).source,
            notes: formData.notes,
            date: formData.date,
            isRecurring: (formData as any).isRecurring,
            frequency: (formData as any).isRecurring ? (formData as any).frequency : undefined,
          }),
        ]);
      } else if (type === "debt") {
        await db.transact([
          db.tx.debts[transaction.id].update({
            currentBalance: formData.amount,
            amount: (formData as any).originalAmount,
            personName: (formData as any).personName,
            direction: (formData as any).direction,
            dueDate: (formData as any).dueDate,
            debtType: (formData as any).debtType,
            interestRate: (formData as any).debtType === "shylock" ? (formData as any).interestRate : undefined,
            date: formData.date,
            notes: formData.notes,
          }),
        ]);
      } else if (type === "wishlist") {
        await db.transact([
          db.tx.wishlist[transaction.id].update({
            itemName: (formData as any).itemName,
            amount: formData.amount,
            status: (formData as any).status,
            link: (formData as any).link,
            notes: formData.notes,
          }),
        ]);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update transaction:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    
    try {
      if (type === "expense") {
        await db.transact([db.tx.expenses[transaction.id].delete()]);
      } else if (type === "income") {
        await db.transact([db.tx.income[transaction.id].delete()]);
      } else if (type === "debt") {
        await db.transact([db.tx.debts[transaction.id].delete()]);
      } else if (type === "wishlist") {
        await db.transact([db.tx.wishlist[transaction.id].delete()]);
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  };

  const handleDuplicate = async () => {
    try {
      if (type === "expense") {
        await db.transact(
          db.tx.expenses[id()]
            .update({
              amount: formData.amount,
              recipient: formData.recipient,
              category: formData.category,
              notes: `${formData.notes} (Copy)`,
              date: Date.now(),
              createdAt: Date.now(),
            })
            .link({ profile: profileId })
        );
      } else if (type === "income") {
        await db.transact(
          db.tx.income[id()]
            .update({
              amount: formData.amount,
              source: (formData as any).source,
              type: "one-time",
              notes: `${formData.notes} (Copy)`,
              date: Date.now(),
              createdAt: Date.now(),
            })
            .link({ profile: profileId })
        );
      } else if (type === "debt") {
        await db.transact(
          db.tx.debts[id()]
            .update({
              amount: formData.amount,
              currentBalance: formData.amount,
              personName: (formData as any).personName,
              direction: (formData as any).direction,
              notes: `${formData.notes} (Copy)`,
              date: Date.now(),
              status: "pending",
              createdAt: Date.now(),
            })
            .link({ profile: profileId })
        );
      } else if (type === "wishlist") {
        await db.transact(
          db.tx.wishlist[id()]
            .update({
              itemName: `${(formData as any).itemName} (Copy)`,
              amount: formData.amount,
              status: "want",
              link: (formData as any).link,
              notes: formData.notes,
              createdAt: Date.now(),
            })
            .link({ profile: profileId })
        );
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to duplicate transaction:", error);
    }
  };

  // Record a payment towards a debt
  const handleRecordPayment = async () => {
    if (type !== "debt") return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }
    
    const debt = transaction as Debt;
    const currentBalance = (formData as any).amount || debt.currentBalance || debt.amount || 0;
    const newBalance = Math.max(0, currentBalance - amount);
    
    try {
      await db.transact([
        db.tx.debts[transaction.id].update({
          currentBalance: newBalance,
          notes: `${formData.notes || ""}\n[${new Date().toLocaleDateString()}] Payment: ${amount}`.trim(),
        }),
      ]);
      
      // Update local form data
      setFormData({ ...formData, amount: newBalance } as any);
      setPaymentAmount("");
      
      if (newBalance === 0) {
        alert("🎉 Debt fully paid off!");
      }
    } catch (error) {
      console.error("Failed to record payment:", error);
    }
  };

  // Mark debt as fully paid
  const handleMarkAsPaid = async () => {
    if (type !== "debt") return;
    
    try {
      await db.transact([
        db.tx.debts[transaction.id].update({
          currentBalance: 0,
          notes: `${formData.notes || ""}\n[${new Date().toLocaleDateString()}] Marked as fully paid`.trim(),
        }),
      ]);
      
      setFormData({ ...formData, amount: 0 } as any);
      alert("🎉 Debt marked as fully paid!");
    } catch (error) {
      console.error("Failed to mark as paid:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {type === "expense" && "Expense"}
            {type === "income" && "Income"}
            {type === "debt" && "Debt"}
            {type === "wishlist" && "ELTIW Item"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type Tabs (for expense/income only) */}
          {(type === "expense" || type === "income") && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="income">Income</TabsTrigger>
                <TabsTrigger value="expense">Expense</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Date Field */}
          {type !== "wishlist" && (
            <div className="space-y-2">
              <Label>Date</Label>
              <div className="flex items-center gap-2 p-3 rounded-md border bg-muted/50">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {format(new Date(formData.date || Date.now()), "EEE, dd/MM/yyyy")}
                </span>
              </div>
            </div>
          )}

          {/* Amount Field */}
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: parseFloat(e.target.value) })
              }
              placeholder="0.00"
            />
          </div>

          {/* Expense Fields - Tabbed Interface */}
          {type === "expense" && (
            <Tabs value={expenseEditTab} onValueChange={(v) => setExpenseEditTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="mpesa">M-Pesa</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="space-y-2">
                  <Label>Recipient</Label>
                  <Input
                    value={(formData as any).recipient || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, recipient: e.target.value } as any)
                    }
                    placeholder="Recipient name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={(formData as any).category || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value } as any)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {existingCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                      {existingCategories.length === 0 && (
                        <SelectItem value="Uncategorized">Uncategorized</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Recurring Toggle */}
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label>Recurring Expense</Label>
                    <p className="text-xs text-muted-foreground">Is this a recurring payment?</p>
                  </div>
                  <Switch
                    checked={(formData as any).isRecurring || false}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isRecurring: checked } as any)
                    }
                  />
                </div>

                {(formData as any).isRecurring && (
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={(formData as any).frequency || "monthly"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, frequency: value } as any)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="mpesa" className="space-y-4">
                <div className="space-y-2">
                  <Label>Transaction Reference</Label>
                  <Input
                    value={(formData as any).mpesaReference || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, mpesaReference: e.target.value } as any)
                    }
                    placeholder="e.g., TKJPNAJ1D1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={(formData as any).mpesaPhoneNumber || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, mpesaPhoneNumber: e.target.value } as any)
                    }
                    placeholder="e.g., 0712345678"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Transaction Cost</Label>
                    <Input
                      type="number"
                      value={(formData as any).mpesaTransactionCost || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, mpesaTransactionCost: parseFloat(e.target.value) || 0 } as any)
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Balance After</Label>
                    <Input
                      type="number"
                      value={(formData as any).mpesaBalance || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, mpesaBalance: parseFloat(e.target.value) || 0 } as any)
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Transaction Type</Label>
                  <Select
                    value={(formData as any).mpesaExpenseType || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, mpesaExpenseType: value } as any)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="send">Send Money</SelectItem>
                      <SelectItem value="receive">Receive Money</SelectItem>
                      <SelectItem value="buy">Buy Goods</SelectItem>
                      <SelectItem value="withdraw">Withdraw</SelectItem>
                      <SelectItem value="deposit">Deposit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(formData as any).mpesaRawMessage && (
                  <div className="space-y-2">
                    <Label>Original Message</Label>
                    <div className="p-3 rounded-md bg-muted/50 text-xs text-muted-foreground max-h-24 overflow-y-auto">
                      {(formData as any).mpesaRawMessage}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Income Fields */}
          {type === "income" && (
            <>
              <div className="space-y-2">
                <Label>Source</Label>
                <Input
                  value={(formData as any).source}
                  onChange={(e) =>
                    setFormData({ ...formData, source: e.target.value } as any)
                  }
                  placeholder="Income source"
                />
              </div>
              
              {/* Recurring Toggle */}
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label>Recurring Income</Label>
                  <p className="text-xs text-muted-foreground">Is this a recurring income?</p>
                </div>
                <Switch
                  checked={(formData as any).isRecurring || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isRecurring: checked } as any)
                  }
                />
              </div>
              
              {(formData as any).isRecurring && (
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={(formData as any).frequency || "monthly"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, frequency: value } as any)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {/* Debt Fields - Tabbed Interface */}
          {type === "debt" && (
            <Tabs value={debtEditTab} onValueChange={(v) => setDebtEditTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="payment">Payment</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="space-y-2">
                  <Label>Person Name</Label>
                  <Input
                    value={(formData as any).personName}
                    onChange={(e) =>
                      setFormData({ ...formData, personName: e.target.value } as any)
                    }
                    placeholder="Person name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Direction</Label>
                  <Select
                    value={(formData as any).direction}
                    onValueChange={(value) =>
                      setFormData({ ...formData, direction: value } as any)
                    }
                  >
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
                  <Label>Loan Type</Label>
                  <div className="flex items-center gap-2 bg-background rounded-md p-1 border">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, debtType: "friend" } as any)}
                      className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${(formData as any).debtType === "friend" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                    >
                      Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, debtType: "shylock" } as any)}
                      className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${(formData as any).debtType === "shylock" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                    >
                      Shylock
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Original Amount</Label>
                    <Input
                      type="number"
                      value={(formData as any).originalAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, originalAmount: parseFloat(e.target.value) || 0 } as any)
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Balance</Label>
                    <Input
                      type="number"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {(formData as any).debtType === "shylock" && (
                  <div className="space-y-2">
                    <Label>Interest Rate (%)</Label>
                    <Input
                      type="number"
                      value={(formData as any).interestRate}
                      onChange={(e) =>
                        setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 } as any)
                      }
                      placeholder="15"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Due Date (Optional)</Label>
                  <Input
                    type="date"
                    value={(formData as any).dueDate ? new Date((formData as any).dueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value ? new Date(e.target.value).getTime() : null } as any)
                    }
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="payment" className="space-y-4">
                <div className="p-4 rounded-lg bg-accent/20 text-center space-y-1">
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className={`text-2xl font-bold ${(formData as any).direction === "I_OWE" ? "text-red-500" : "text-green-500"}`}>
                     {((formData as any).direction === "I_OWE" ? "-" : "+")}{formData.amount.toLocaleString()}
                  </p>
                </div>
                
                {formData.amount > 0 ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Record Payment Amount</Label>
                      <Input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="Amount paid"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={handleRecordPayment} className="w-full">
                        Record Payment
                      </Button>
                      <Button onClick={handleMarkAsPaid} variant="outline" className="w-full">
                        Mark Fully Paid
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>🎉 This debt is fully paid!</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Wishlist Fields */}
          {type === "wishlist" && (
            <>
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input
                  value={(formData as any).itemName}
                  onChange={(e) =>
                    setFormData({ ...formData, itemName: e.target.value } as any)
                  }
                  placeholder="Item name"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="w-full p-2 rounded-md border bg-background"
                  value={(formData as any).status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value } as any)
                  }
                >
                  <option value="want">Want</option>
                  <option value="got">Got it</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={(formData as any).link || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, link: e.target.value } as any)
                    }
                    placeholder="https://..."
                  />
                  {(formData as any).link && (
                    <Button 
                      size="icon" 
                      variant="outline" 
                      onClick={() => window.open((formData as any).link, "_blank")}
                      title="Open Link"
                    >
                      <Globe className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Notes Field */}
          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Add a note..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button
              variant="outline"
              onClick={handleDuplicate}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            <Button
              variant="outline"
              onClick={handleUpdate}
              className="gap-2"
            >
              <Bookmark className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
