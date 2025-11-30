import { id } from "@instantdb/react";
import db from "@/lib/db";
import type { Category } from "@/types";

export const DEFAULT_CATEGORIES = [
  {
    name: "Uncategorized",
    color: "#808080",
    icon: "❓",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Wishlist",
    color: "#00b894",
    icon: "🎯",
    isDefault: true,
    isActive: true,
  }, // replaces generic "Savings"
  {
    name: "Food",
    color: "#f9a825",
    icon: "🍔",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Transport",
    color: "#29b6f6",
    icon: "🚗",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Housing",
    color: "#7e57c2",
    icon: "🏠",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Airtime / Bundles",
    color: "#ff9800",
    icon: "📱",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Utilities",
    color: "#009688",
    icon: "💡",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Debt Repayment",
    color: "#ec407a",
    icon: "💳",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Subscriptions",
    color: "#00bcd4",
    icon: "🔁",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Income (misc)",
    color: "#4caf50",
    icon: "💵",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Education",
    color: "#3f51b5",
    icon: "📚",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Health",
    color: "#e91e63",
    icon: "🏥",
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
    name: "Miscellaneous",
    color: "#9e9e9e",
    icon: "📦",
    isDefault: true,
    isActive: true,
  },
];

export async function ensureDefaultCategories(userId: string) {
  try {
    const { data } = await db.useQuery({
      categories: { $: { where: { "user.id": userId } } },
    });

    const existingCategories = data?.categories || [];
    const existingCategoryNames = new Set(
      existingCategories.map((c: Category) => c.name)
    );

    const missingCategories = DEFAULT_CATEGORIES.filter(
      (c) => !existingCategoryNames.has(c.name)
    );

    if (missingCategories.length > 0) {
      const transactions = missingCategories.map((category) =>
        db.tx.categories[id()].update({ ...category }).link({ user: userId })
      );
      await db.transact(transactions);
      console.log("Created missing default categories:", missingCategories);
    }
  } catch (error) {
    console.error("Failed to ensure default categories:", error);
  }
}
