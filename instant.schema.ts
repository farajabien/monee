import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      type: i.string().optional(),
      hasPaid: i.boolean().optional(),
      paymentDate: i.number().optional().indexed(),
      paystackReference: i.string().optional(),
    }),
    profiles: i.entity({
      handle: i.string(),
      createdAt: i.number().indexed(),
      onboardingCompleted: i.boolean().optional(),
      onboardingStep: i.string().optional(),
      currency: i.string().optional(),
      locale: i.string().optional(),
    }),
    // Core Entity 1: Income
    income: i.entity({
      amount: i.number().indexed(),
      source: i.string(), // Where it's from (salary, freelance, friend, etc.)
      type: i.string().indexed(), // "one-time" or "recurring"
      date: i.number().indexed(),
      notes: i.string().optional(),
      isRecurring: i.boolean().optional(),
      frequency: i.string().optional(), // "monthly" for recurring
      createdAt: i.number().indexed(),
    }),
    // Core Entity 2: Debts (two-way tracking)
    // TEMPORARY: Fields marked optional for migration - will be required after data fix
    debts: i.entity({
      personName: i.string().indexed().optional(), // Friend's name
      amount: i.number().indexed().optional(),
      currentBalance: i.number().indexed().optional(), // Remaining balance
      direction: i.string().indexed().optional(), // "I_OWE" or "THEY_OWE_ME"
      date: i.number().indexed().optional(), // When borrowed/lent
      dueDate: i.number().optional().indexed(), // When to pay back
      status: i.string().indexed().optional(), // "pending" | "paid" | "collected"
      notes: i.string().optional(),
      createdAt: i.number().indexed().optional(),
      // Debt configuration fields
      interestRate: i.number().optional(), // Annual interest rate (e.g., 5 for 5%)
      debtType: i.string().optional(), // "one-time" | "interest-push" | "amortizing"
      compoundingFrequency: i.string().optional(), // "monthly" | "quarterly" | "annually"
      monthlyPayment: i.number().optional(), // Agreed monthly payment amount
    }),
    // Core Entity 3: Expenses (with recurring support)
    expenses: i.entity({
      amount: i.number().indexed(),
      category: i.string().optional(), // Food, Transport, Rent, Subscriptions, etc.
      recipient: i.string().optional(), // Where money was spent
      date: i.number().indexed(),
      notes: i.string().optional(),
      isRecurring: i.boolean().optional(), // Track if it's recurring (rent, subscription, etc.)
      frequency: i.string().optional(), // "monthly", "weekly", "yearly" for recurring expenses
      nextDueDate: i.number().optional().indexed(), // When next payment is due (for recurring)
      createdAt: i.number().indexed(),
    }),
    // Core Entity 4: Wishlist (ELLIW - Every Little Thing I Want)
    wishlist: i.entity({
      itemName: i.string().indexed(),
      amount: i.number().optional(), // Estimated price
      status: i.string().indexed(), // "want" | "got"
      gotDate: i.number().optional().indexed(), // When purchased
      notes: i.string().optional(),
      createdAt: i.number().indexed(),
      category: i.string().optional(), // "purchase" | "savings_contribution"
    }),
  },
  links: {
    userProfiles: {
      forward: { on: "profiles", has: "one", label: "user" },
      reverse: { on: "$users", has: "one", label: "profile" },
    },
    profileIncome: {
      forward: { on: "income", has: "one", label: "profile" },
      reverse: { on: "profiles", has: "many", label: "income" },
    },
    profileDebts: {
      forward: { on: "debts", has: "one", label: "profile" },
      reverse: { on: "profiles", has: "many", label: "debts" },
    },
    profileExpenses: {
      forward: { on: "expenses", has: "one", label: "profile" },
      reverse: { on: "profiles", has: "many", label: "expenses" },
    },
    profileWishlist: {
      forward: { on: "wishlist", has: "one", label: "profile" },
      reverse: { on: "profiles", has: "many", label: "wishlist" },
    },
  },
  rooms: {},
});

type _AppSchema = typeof _schema;
type AppSchema = _AppSchema;
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
