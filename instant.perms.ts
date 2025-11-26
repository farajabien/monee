export default {
  profiles: {
    allow: {
      create: "auth.id != null",
      update: "auth.id != null",
      delete: "auth.id != null",
    },
  },
  expenses: {
    allow: {
      create: "auth.id != null",
      update: "auth.id != null",
      delete: "auth.id != null",
    },
  },
  categories: {
    allow: {
      create: "auth.id != null",
      update: "auth.id != null",
      delete: "auth.id != null",
    },
  },
  budgets: {
    allow: {
      create: "auth.id != null",
      update: "auth.id != null",
      delete: "auth.id != null",
    },
  },
  eltiw_items: {
    allow: {
      create: "auth.id != null",
      update: "auth.id != null",
      delete: "auth.id != null",
    },
  },
  daily_checkins: {
    allow: {
      create: "auth.id != null",
      update: "auth.id != null",
      delete: "auth.id != null",
    },
  },
  income_sources: {
    allow: {
      create: "auth.id != null",
      update: "auth.id != null",
      delete: "auth.id != null",
    },
  },
  debts: {
    allow: {
      create: "auth.id != null",
      update: "auth.id != null",
      delete: "auth.id != null",
    },
  },
  debt_payments: {
    allow: {
      create: "auth.id != null",
      update: "auth.id != null",
      delete: "auth.id != null",
    },
  },
};
