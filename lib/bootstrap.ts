import { id } from "@instantdb/react";
import db from "@/lib/db";
import type { Category } from "@/types";

export const DEFAULT_CATEGORIES = [
  // Income
  {
    name: "Salary",
    color: "#4caf50",
    icon: "💰",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Business Income",
    color: "#66bb6a",
    icon: "🏢",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Freelance / Consulting",
    color: "#81c784",
    icon: "💻",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Gifts / Allowances",
    color: "#a5d6a7",
    icon: "🎁",
    isDefault: true,
    isActive: true,
  },

  // Essentials
  {
    name: "Rent",
    color: "#7e57c2",
    icon: "🏠",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Food & Groceries",
    color: "#f9a825",
    icon: "🛒",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Utilities",
    color: "#fdd835",
    icon: "💡",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Internet & Airtime",
    color: "#00bcd4",
    icon: "📡",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Household Supplies",
    color: "#9e9e9e",
    icon: "🧹",
    isDefault: true,
    isActive: true,
  },

  // Transport
  {
    name: "Public Transport",
    color: "#29b6f6",
    icon: "🚌",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Ride-Hailing",
    color: "#1e88e5",
    icon: "🚗",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Fuel & Car Care",
    color: "#1565c0",
    icon: "⛽",
    isDefault: true,
    isActive: true,
  },

  // Lifestyle
  {
    name: "Eating Out",
    color: "#f57c00",
    icon: "🍔",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Entertainment",
    color: "#ff5722",
    icon: "🎉",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Nightlife",
    color: "#f06292",
    icon: "🍻",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Personal Care",
    color: "#ec407a",
    icon: "💇",
    isDefault: true,
    isActive: true,
  },

  // Subscriptions
  {
    name: "Subscriptions",
    color: "#00bcd4",
    icon: "🔧",
    isDefault: true,
    isActive: true,
  },

  // Work & Learning
  {
    name: "Work Tools",
    color: "#5c6bc0",
    icon: "⚙️",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Education / Courses",
    color: "#3f51b5",
    icon: "📚",
    isDefault: true,
    isActive: true,
  },

  // Financial
  {
    name: "Transfers",
    color: "#009688",
    icon: "💸",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Savings",
    color: "#00b894",
    icon: "🏦",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Cash Withdrawals",
    color: "#4db6ac",
    icon: "🏧",
    isDefault: true,
    isActive: true,
  },

  // Debts
  {
    name: "Loans Owed",
    color: "#ec407a",
    icon: "💳",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Loans Given",
    color: "#f48fb1",
    icon: "🤝",
    isDefault: true,
    isActive: true,
  },

  // Goals
  {
    name: "Savings Goals",
    color: "#74b9ff",
    icon: "🎯",
    isDefault: true,
    isActive: true,
  },

  // Health
  {
    name: "Health & Medical",
    color: "#e91e63",
    icon: "💊",
    isDefault: true,
    isActive: true,
  },

  // Miscellaneous
  {
    name: "Miscellaneous",
    color: "#bdbdbd",
    icon: "📦",
    isDefault: true,
    isActive: true,
  },

  // Fallback
  {
    name: "Uncategorized",
    color: "#808080",
    icon: "❓",
    isDefault: true,
    isActive: true,
  },
];

export async function ensureDefaultCategories(profileId: string) {
  try {
    const { data } = await db.useQuery({
      profiles: {
        $: {
          where: { id: profileId },
        },
        categories: {},
      },
    });

    const profile = data?.profiles?.[0];
    const existingCategories = profile?.categories || [];
    const existingCategoryNames = new Set(
      existingCategories.map((c: Category) => c.name)
    );

    const missingCategories = DEFAULT_CATEGORIES.filter(
      (c) => !existingCategoryNames.has(c.name)
    );

    if (missingCategories.length > 0) {
      const transactions = missingCategories.map((category) =>
        db.tx.categories[id()]
          .update({ ...category })
          .link({ profile: profileId })
      );
      await db.transact(transactions);
      console.log("Created missing default categories:", missingCategories);
    }
  } catch (error) {
    console.error("Failed to ensure default categories:", error);
  }
}
