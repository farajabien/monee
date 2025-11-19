export default {
  profiles: {
    allow: {
      create: "auth.id != null",
      update: "auth.id != null",
      delete: "auth.id != null",
    },
  },
  transactions: {
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
};
