
import { tx } from "@instantdb/react";

export const DEFAULT_CATEGORIES = [
  {
    name: "Uncategorized",
    color: "#808080",
    icon: "❓",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Savings",
    color: "#00b894",
    icon: "💰",
    isDefault: true,
    isActive: true,
  },
  { name: "Food", color: "#f9a825", icon: "🍔", isDefault: true, isActive: true },
  {
    name: "Transport",
    color: "#29b6f6",
    icon: "🚗",
    isDefault: true,
    isActive: true,
  },
  { name: "Housing", color: "#7e57c2", icon: "🏠", isDefault: true, isActive: true },
  {
    name: "Entertainment",
    color: "#ec407a",
    icon: "🎉",
    isDefault: true,
    isActive: true,
  },
];

export async function ensureDefaultCategories(db: any, userId: string) {
  try {
    const { data: existingCategories } = await db.query("categories", {
      where: { "user.id": userId },
    });

    const existingCategoryNames = new Set(
      existingCategories.map((c: any) => c.name)
    );

    const missingCategories = DEFAULT_CATEGORIES.filter(
      (c) => !existingCategoryNames.has(c.name)
    );

    if (missingCategories.length > 0) {
      const transactions = missingCategories.map((category) =>
        tx.categories[crypto.randomUUID()].update({ ...category }).link({ user: userId })
      );
      await db.transact(transactions);
      console.log("Created missing default categories:", missingCategories);
    }
  } catch (error) {
    console.error("Failed to ensure default categories:", error);
  }
}
