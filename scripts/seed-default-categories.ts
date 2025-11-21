"use server";

/**
 * Default categories are no longer seeded globally.
 * They are now created per-user when activated in the UI.
 * This file is kept for reference but the function is now a no-op.
 */

const DEFAULT_CATEGORIES = [
  { name: "Food", color: "#f97316" },
  { name: "Transport", color: "#3b82f6" },
  { name: "Housing", color: "#8b5cf6" },
  { name: "Utilities", color: "#06b6d4" },
  { name: "Savings", color: "#22c55e" },
  { name: "Misc", color: "#a3a3a3" },
];

export async function ensureDefaultCategories() {
  // No-op: Default categories are now created per-user in the UI
  return [];
}

export { DEFAULT_CATEGORIES };

