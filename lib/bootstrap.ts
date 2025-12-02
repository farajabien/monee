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
    name: "Side Hustles",
    color: "#66bb6a",
    icon: "💼",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Business Income",
    color: "#81c784",
    icon: "🏢",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Freelance / Consulting",
    color: "#a5d6a7",
    icon: "💻",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Gifts / Allowances",
    color: "#c8e6c9",
    icon: "🎁",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Refunds / Reimbursements",
    color: "#e8f5e9",
    icon: "↩️",
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
    name: "Groceries",
    color: "#f9a825",
    icon: "🛒",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Electricity (KPLC)",
    color: "#fdd835",
    icon: "💡",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Water",
    color: "#29b6f6",
    icon: "💧",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Cooking Gas",
    color: "#ff9800",
    icon: "🔥",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Internet / WiFi",
    color: "#00bcd4",
    icon: "📡",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Airtime & Data",
    color: "#ff9800",
    icon: "📱",
    isDefault: true,
    isActive: true,
  },

  // Transport
  {
    name: "Matatu",
    color: "#29b6f6",
    icon: "🚌",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Boda",
    color: "#42a5f5",
    icon: "🏍️",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Uber / Bolt",
    color: "#1e88e5",
    icon: "🚗",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Fuel",
    color: "#1976d2",
    icon: "⛽",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Car Maintenance",
    color: "#1565c0",
    icon: "🔧",
    isDefault: true,
    isActive: true,
  },

  // Food & Lifestyle
  {
    name: "Eating Out",
    color: "#f9a825",
    icon: "🍔",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Coffee & Snacks",
    color: "#fbc02d",
    icon: "☕",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Nightlife / Drinks",
    color: "#f57c00",
    icon: "🍻",
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

  // Subscriptions
  {
    name: "Netflix",
    color: "#e50914",
    icon: "📺",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Spotify",
    color: "#1db954",
    icon: "🎵",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Showmax",
    color: "#d32f2f",
    icon: "🎬",
    isDefault: true,
    isActive: true,
  },
  {
    name: "YouTube Premium",
    color: "#ff0000",
    icon: "▶️",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Gym",
    color: "#ff6f00",
    icon: "💪",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Software Tools",
    color: "#00bcd4",
    icon: "🔧",
    isDefault: true,
    isActive: true,
  },

  // Personal & Home
  {
    name: "House Supplies",
    color: "#9e9e9e",
    icon: "🧹",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Self-Care",
    color: "#ec407a",
    icon: "💇",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Clothing",
    color: "#ab47bc",
    icon: "👕",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Household Items",
    color: "#78909c",
    icon: "🧴",
    isDefault: true,
    isActive: true,
  },

  // Work & Productivity
  {
    name: "Courses",
    color: "#3f51b5",
    icon: "📚",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Equipment",
    color: "#5c6bc0",
    icon: "⚙️",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Workspace / Office",
    color: "#7986cb",
    icon: "🏢",
    isDefault: true,
    isActive: true,
  },

  // Transfers & Finance
  {
    name: "M-Pesa to Bank",
    color: "#009688",
    icon: "💸",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Bank to M-Pesa",
    color: "#26a69a",
    icon: "💵",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Savings Deposits",
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
    color: "#f06292",
    icon: "🤝",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Paybill Loans",
    color: "#f48fb1",
    icon: "📲",
    isDefault: true,
    isActive: true,
  },

  // Goals
  {
    name: "Big Purchases",
    color: "#00b894",
    icon: "🎯",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Travel",
    color: "#00cec9",
    icon: "✈️",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Emergency Fund",
    color: "#fdcb6e",
    icon: "🆘",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Wishlists",
    color: "#74b9ff",
    icon: "⭐",
    isDefault: true,
    isActive: true,
  },

  // Health
  {
    name: "Medicine",
    color: "#e91e63",
    icon: "💊",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Hospital",
    color: "#f06292",
    icon: "🏥",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Insurance",
    color: "#f48fb1",
    icon: "🛡️",
    isDefault: true,
    isActive: true,
  },

  // Miscellaneous
  {
    name: "Gifts",
    color: "#9e9e9e",
    icon: "🎁",
    isDefault: true,
    isActive: true,
  },
  {
    name: "One-offs",
    color: "#bdbdbd",
    icon: "📦",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Unexpected costs",
    color: "#e0e0e0",
    icon: "⚠️",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Donations",
    color: "#eeeeee",
    icon: "🤲",
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
