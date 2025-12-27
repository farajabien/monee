// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

const rules = {
  savings_contributions: {
    allow: {
      create: "auth.id != null",
      delete: "auth.id != null",
      update: "auth.id != null",
    },
  },
  income_sources: {
    allow: {
      create: "auth.id != null",
      delete: "auth.id != null",
      update: "auth.id != null",
    },
  },
  categories: {
    allow: {
      create: "auth.id != null",
      delete: "auth.id != null",
      update: "auth.id != null",
    },
  },
  eltiw_items: {
    allow: {
      create: "auth.id != null",
      delete: "auth.id != null",
      update: "auth.id != null",
    },
  },
  profiles: {
    allow: {
      create: "auth.id != null",
      delete: "auth.id != null",
      update: "auth.id != null",
    },
  },
  debt_payments: {
    allow: {
      create: "auth.id != null",
      delete: "auth.id != null",
      update: "auth.id != null",
    },
  },
  recipients: {
    allow: {
      create: "auth.id != null",
      delete: "auth.id != null",
      update: "auth.id != null",
    },
  },
  expenses: {
    allow: {
      create: "auth.id != null",
      delete: "auth.id != null",
      update: "auth.id != null",
    },
  },
  budgets: {
    allow: {
      create: "auth.id != null",
      delete: "auth.id != null",
      update: "auth.id != null",
    },
  },
  daily_checkins: {
    allow: {
      create: "auth.id != null",
      delete: "auth.id != null",
      update: "auth.id != null",
    },
  },
  savings_goals: {
    allow: {
      create: "auth.id != null",
      delete: "auth.id != null",
      update: "auth.id != null",
    },
  },
  debts: {
    allow: {
      create: "auth.id != null",
      delete: "auth.id != null",
      update: "auth.id != null",
    },
  },
} satisfies InstantRules;

export default rules;
