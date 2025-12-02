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
      expenseType: i.string().optional().indexed(),
      rawMessage: i.string(),
      parsedData: i.json().optional(),
      notes: i.string().optional(),
      mpesaReference: i.string().optional().indexed(),
      linkedRecurringId: i.string().optional().indexed(),
      isRecurring: i.boolean().optional(),
      recurringTransactionId: i.string().optional().indexed(),
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
    eltiw_items: i.entity({
      name: i.string(),
      amount: i.number().indexed(),
      reason: i.string().optional(),
      link: i.string().optional(),
      source: i.string().optional().indexed(),
      sourceEmoji: i.string().optional(),
      category: i.string().optional().indexed(),
      deadline: i.number().optional().indexed(),
      gotIt: i.boolean(),
      gotItDate: i.number().optional(),
      createdAt: i.number().indexed(),
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
      name: i.string().indexed(),
      totalAmount: i.number().indexed(),
      currentBalance: i.number().indexed(),
      monthlyPaymentAmount: i.number(),
      paymentDueDay: i.number(),
      interestRate: i.number().optional(),
      debtType: i.string().optional().indexed(), // one-time | interest-push | amortizing
      compoundingFrequency: i.string().optional(), // monthly | quarterly | annually
      pushMonthsPlan: i.number().optional(),
      pushMonthsCompleted: i.number().optional().indexed(),
      lastInterestPaymentDate: i.number().optional().indexed(),
      interestAccrued: i.number().optional(),
      deadline: i.number().optional().indexed(),
      createdAt: i.number().indexed(),
    }),
    debt_payments: i.entity({
      amount: i.number().indexed(),
      paymentDate: i.number().indexed(),
      paymentType: i.string().indexed(),
      interestAmount: i.number().optional(),
      principalAmount: i.number().optional(),
      createdAt: i.number().indexed(),
    }),
    recipients: i.entity({
      originalName: i.string().indexed(),
      nickname: i.string().optional().indexed(),
      defaultCategory: i.string().optional(),
      notes: i.string().optional(),
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
    }),
    savings_contributions: i.entity({
      amount: i.number().indexed(),
      date: i.number().indexed(),
      contributionDate: i.number().indexed(),
      notes: i.string().optional(),
      createdAt: i.number().indexed(),
    }),
    statement_expenses: i.entity({
      amount: i.number().indexed(),
      recipient: i.string().indexed(),
      timestamp: i.number().indexed(),
      description: i.string(),
      category: i.string().optional().indexed(),
      isProcessed: i.boolean(),
      createdAt: i.number().indexed(),
    }),
    recurring_transactions: i.entity({
      name: i.string().indexed(),
      amount: i.number().indexed(),
      recipient: i.string().indexed(),
      category: i.string(),
      frequency: i.string().indexed(),
      dueDate: i.number().optional().indexed(),
      nextDueDate: i.number().optional().indexed(),
      lastPaidDate: i.number().optional().indexed(),
      reminderDays: i.number().optional(),
      isPaused: i.boolean().optional(),
      paybillNumber: i.string().optional().indexed(),
      tillNumber: i.string().optional().indexed(),
      accountNumber: i.string().optional(),
      isActive: i.boolean(),
      createdAt: i.number().indexed(),
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
    profileEltiwItems: {
      forward: { on: "eltiw_items", has: "one", label: "profile" },
      reverse: { on: "profiles", has: "many", label: "eltiwItems" },
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
    profileStatementExpenses: {
      forward: { on: "statement_expenses", has: "one", label: "profile" },
      reverse: { on: "profiles", has: "many", label: "statementExpenses" },
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
