// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      hasPaid: i.boolean().optional(),
      imageURL: i.string().optional(),
      paymentDate: i.number().indexed().optional(),
      paystackReference: i.string().optional(),
      type: i.string().optional(),
    }),
    debts: i.entity({
      amount: i.number().indexed().optional(),
      compoundingFrequency: i.string().optional(),
      createdAt: i.number().indexed().optional(),
      currentBalance: i.number().indexed().optional(),
      date: i.number().indexed().optional(),
      debtType: i.string().optional(),
      direction: i.string().indexed().optional(),
      dueDate: i.number().indexed().optional(),
      interestRate: i.number().optional(),
      monthlyPayment: i.number().optional(),
      notes: i.string().optional(),
      personName: i.string().indexed().optional(),
      status: i.string().indexed().optional(),
    }),
    expenses: i.entity({
      amount: i.number().indexed(),
      category: i.string().optional(),
      createdAt: i.number().indexed(),
      date: i.number().indexed(),
      frequency: i.string().optional(),
      isRecurring: i.boolean().optional(),
      nextDueDate: i.number().indexed().optional(),
      notes: i.string().optional(),
      recipient: i.string().optional(),
    }),
    income: i.entity({
      amount: i.number().indexed(),
      createdAt: i.number().indexed(),
      date: i.number().indexed(),
      frequency: i.string().optional(),
      isRecurring: i.boolean().optional(),
      notes: i.string().optional(),
      source: i.string(),
      type: i.string().indexed(),
    }),
    profiles: i.entity({
      createdAt: i.number().indexed(),
      currency: i.string().optional(),
      handle: i.string(),
      locale: i.string().optional(),
      onboardingCompleted: i.boolean().optional(),
      onboardingStep: i.string().optional(),
    }),
    wishlist: i.entity({
      amount: i.number().optional(),
      category: i.string().optional(),
      createdAt: i.number().indexed(),
      gotDate: i.number().indexed().optional(),
      itemName: i.string().indexed(),
      link: i.string().optional(),

      notes: i.string().optional(),
      status: i.string().indexed(),
      expenseId: i.string().optional(), // ID of the expense created when fulfiled
    }),
  },
  links: {
    $usersLinkedPrimaryUser: {
      forward: {
        on: "$users",
        has: "one",
        label: "linkedPrimaryUser",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "linkedGuestUsers",
      },
    },
    debtsProfile: {
      forward: {
        on: "debts",
        has: "one",
        label: "profile",
        required: true,
        onDelete: "cascade",
      },
      reverse: {
        on: "profiles",
        has: "many",
        label: "debts",
      },
    },
    expensesProfile: {
      forward: {
        on: "expenses",
        has: "one",
        label: "profile",
        onDelete: "cascade",
      },
      reverse: {
        on: "profiles",
        has: "many",
        label: "expenses",
      },
    },
    incomeProfile: {
      forward: {
        on: "income",
        has: "one",
        label: "profile",
        required: true,
        onDelete: "cascade",
      },
      reverse: {
        on: "profiles",
        has: "many",
        label: "income",
      },
    },
    profilesUser: {
      forward: {
        on: "profiles",
        has: "one",
        label: "user",
        required: true,
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "one",
        label: "profile",
        onDelete: "cascade",
      },
    },
    wishlistProfile: {
      forward: {
        on: "wishlist",
        has: "one",
        label: "profile",
      },
      reverse: {
        on: "profiles",
        has: "many",
        label: "wishlist",
      },
    },
  },
  rooms: {},
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
