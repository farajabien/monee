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
      monthlyBudget: i.number(),
      createdAt: i.number().indexed(),
      onboardingCompleted: i.boolean().optional(),
      onboardingStep: i.string().optional(),
      currency: i.string().optional(),
      locale: i.string().optional(),
    }),
    expenses: i.entity({
      amount: i.number().indexed(),
      recipient: i.string(),
      date: i.number().indexed(),
      category: i.string(),
      expenseType: i.string().optional().indexed(), // one-time | recurring | income
      rawMessage: i.string(),
      parsedData: i.json().optional(),
      notes: i.string().optional(),
      mpesaReference: i.string().optional().indexed(),
      linkedRecurringId: i.string().optional().indexed(),
      isRecurring: i.boolean().optional(),
      recurringTransactionId: i.string().optional().indexed(),
      paidThisMonth: i.boolean().optional(),
      // Payment details for tracking (M-Pesa, bank, etc.)
      paymentDetails: i.json().optional(), // { paybillNumber, tillNumber, accountNumber, phoneNumber, notes }
      createdAt: i.number().indexed(),
    }),
    categories: i.entity({
      name: i.string().indexed(),
      color: i.string(),
      icon: i.string(),
      isDefault: i.boolean().optional(),
      isActive: i.boolean().optional(),
      createdAt: i.number().optional().indexed(),
    }),
    budgets: i.entity({
      amount: i.number().indexed(),
      month: i.number().indexed(),
      year: i.number().indexed(),
    }),
    daily_checkins: i.entity({
      date: i.number().unique().indexed(),
      completed: i.boolean(),
      expensesCount: i.number(),
    }),
    income_sources: i.entity({
      name: i.string().indexed(),
      amount: i.number().indexed(),
      frequency: i.string().indexed(),
      paydayDay: i.number(),
      paydayMonth: i.number().optional(),
      isActive: i.boolean(),
      createdAt: i.number().indexed(),
    }),
    debts: i.entity({
      debtor: i.string().optional().indexed(), // Name of the person/entity you owe
      debtTaken: i.number().optional().indexed(), // Original amount borrowed
      currentBalance: i.number().indexed(), // Current amount owed
      interestRate: i.number().optional(), // Interest rate (e.g., 15 for 15%)
      interestFrequency: i.string().optional().indexed(), // per month | per year | N/A
      repaymentTerms: i.string().optional().indexed(), // Interest Push | No Interest | Amortizing | One-time
      nextPaymentAmount: i.number().optional().indexed(), // Amount due for next payment (calculated or set)
      nextPaymentDueDate: i.number().optional().indexed(), // Timestamp for next payment
      remainingDays: i.number().optional(), // Calculated field for UI (auto-calculated from nextPaymentDueDate)
      // Structured payment details for M-Pesa, bank transfers, etc.
      paymentDetails: i.json().optional(), // { paybillNumber, tillNumber, accountNumber, phoneNumber, bankName, notes }
      monthlyPaymentAmount: i.number().optional(), // For regular payments
      paymentDueDay: i.number().optional(), // Day of month for recurring payments
      compoundingFrequency: i.string().optional(), // monthly | quarterly | annually
      pushMonthsPlan: i.number().optional(), // For interest push debts
      pushMonthsCompleted: i.number().optional().indexed(),
      lastInterestPaymentDate: i.number().optional().indexed(),
      interestAccrued: i.number().optional(),
      deadline: i.number().optional().indexed(),
      isActive: i.boolean().optional(),
      createdAt: i.number().indexed(),
      updatedAt: i.number().optional().indexed(),
    }),
    debt_payments: i.entity({
      amount: i.number().indexed(),
      paymentDate: i.number().indexed(),
      paymentType: i.string().indexed(), // interest | principal | full
      interestAmount: i.number().optional(),
      principalAmount: i.number().optional(),
      notes: i.string().optional(),
      createdAt: i.number().indexed(),
    }),
    recipients: i.entity({
      originalName: i.string().indexed(),
      nickname: i.string().optional().indexed(),
      defaultCategory: i.string().optional(),
      notes: i.string().optional(),
      totalAmount: i.number().optional().indexed(), // Total spent on this recipient (auto-calculated)
      expensesCount: i.number().optional().indexed(), // Number of expenses (auto-calculated)
      percentageOfExpenses: i.number().optional(), // % of total expenses (auto-calculated)
      // Payment details for this recipient (default payment method)
      paymentDetails: i.json().optional(), // { paybillNumber, tillNumber, accountNumber, phoneNumber, bankName, notes }
      createdAt: i.number().indexed(),
      updatedAt: i.number().indexed(),
    }),
    savings_goals: i.entity({
      name: i.string().indexed(),
      targetAmount: i.number().indexed(),
      currentAmount: i.number().indexed(),
      emoji: i.string().optional(),
      deadline: i.number().optional().indexed(),
      category: i.string().optional().indexed(),
      isCompleted: i.boolean(),
      createdAt: i.number().indexed(),
      // Regular savings fields
      isRegular: i.boolean().optional(),
      frequency: i.string().optional().indexed(),
      regularAmount: i.number().optional().indexed(),
      nextDueDate: i.number().optional().indexed(),
      lastContributionDate: i.number().optional().indexed(),
    }),
    savings_contributions: i.entity({
      amount: i.number().indexed(),
      date: i.number().indexed(),
      contributionDate: i.number().indexed(),
      notes: i.string().optional(),
      createdAt: i.number().indexed(),
    }),
    recurring_transactions: i.entity({
      name: i.string().indexed(),
      amount: i.number().indexed(),
      recipient: i.string().indexed(),
      category: i.string(),
      frequency: i.string().indexed(), // weekly | biweekly | monthly | quarterly | annually
      dueDate: i.number().optional().indexed(),
      nextDueDate: i.number().optional().indexed(),
      lastPaidDate: i.number().optional().indexed(),
      paidThisMonth: i.boolean().optional(), // TRUE when paid, FALSE when not paid
      remainingDays: i.number().optional(), // Calculated for UI (auto-calculated from nextDueDate)
      reminderDays: i.number().optional(),
      isPaused: i.boolean().optional(),
      // Consolidated structured payment details
      paymentDetails: i.json().optional(), // { paybillNumber, tillNumber, accountNumber, phoneNumber, bankName, notes }
      isActive: i.boolean(),
      createdAt: i.number().indexed(),
      updatedAt: i.number().optional().indexed(),
    }),
    feedback: i.entity({
      feedbackType: i.string().indexed(), // Bug | Feature | Suggestion | UI/UX | Performance | General
      feedbackText: i.string(),
      rating: i.number().optional().indexed(),
      priority: i.string().optional(), // Low | Medium | High (for bugs)
      affectedArea: i.string().optional().indexed(), // Expenses | Debts | Savings | Income | Dashboard | Settings
      stepsToReproduce: i.string().optional(), // For bugs
      name: i.string().optional(),
      userEmail: i.string().optional(),
      createdAt: i.number().indexed(),
    }),
  },
  links: {
    userProfiles: {
      forward: { on: "profiles", has: "one", label: "user" },
      reverse: { on: "$users", has: "one", label: "profile" },
    },
    profileExpenses: {
      forward: { on: "expenses", has: "one", label: "profile" },
      reverse: { on: "profiles", has: "many", label: "expenses" },
    },
    profileCategories: {
      forward: { on: "categories", has: "one", label: "profile" },
      reverse: { on: "profiles", has: "many", label: "categories" },
    },
    categoryBudgets: {
      forward: { on: "budgets", has: "one", label: "category" },
      reverse: { on: "categories", has: "many", label: "budgets" },
    },
    profileBudgets: {
      forward: { on: "budgets", has: "one", label: "profile" },
      reverse: { on: "profiles", has: "many", label: "budgets" },
    },
    profileDailyCheckins: {
      forward: { on: "daily_checkins", has: "one", label: "profile" },
      reverse: { on: "profiles", has: "many", label: "dailyCheckins" },
    },
    profileIncomeSources: {
      forward: { on: "income_sources", has: "one", label: "profile" },
      reverse: { on: "profiles", has: "many", label: "incomeSources" },
    },
    profileDebts: {
      forward: { on: "debts", has: "one", label: "profile" },
      reverse: { on: "profiles", has: "many", label: "debts" },
    },
    debtPayments: {
      forward: { on: "debt_payments", has: "one", label: "debt" },
      reverse: { on: "debts", has: "many", label: "payments" },
    },
    profileRecipients: {
      forward: { on: "recipients", has: "one", label: "profile" },
      reverse: { on: "profiles", has: "many", label: "recipients" },
    },
    profileSavingsGoals: {
      forward: { on: "savings_goals", has: "one", label: "profile" },
      reverse: { on: "profiles", has: "many", label: "savingsGoals" },
    },
    savingsGoalContributions: {
      forward: { on: "savings_contributions", has: "one", label: "goal" },
      reverse: { on: "savings_goals", has: "many", label: "contributions" },
    },
    profileRecurringTransactions: {
      forward: { on: "recurring_transactions", has: "one", label: "profile" },
      reverse: { on: "profiles", has: "many", label: "recurringTransactions" },
    },
    recurringTransactionExpenses: {
      forward: { on: "expenses", has: "one", label: "recurringTransaction" },
      reverse: {
        on: "recurring_transactions",
        has: "many",
        label: "linkedExpenses",
      },
    },
    profileFeedback: {
      forward: { on: "feedback", has: "one", label: "profile" },
      reverse: { on: "profiles", has: "many", label: "feedback" },
    },
  },
  rooms: {},
});

type _AppSchema = typeof _schema;
type AppSchema = _AppSchema;
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
