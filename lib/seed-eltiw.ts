import { id } from "@instantdb/react";
import db from "@/lib/db";

interface SeedEltiwOptions {
  profileId: string;
}

const SAMPLE_ITEMS = [
  // Tech items (Want)
  { itemName: "MacBook Pro M3", amount: 250000, status: "want" as const, category: "purchase" },
  { itemName: "iPhone 15 Pro", amount: 150000, status: "want" as const, category: "purchase" },
  { itemName: "AirPods Max", amount: 65000, status: "want" as const, category: "purchase" },
  { itemName: "iPad Pro", amount: 120000, status: "want" as const, category: "purchase" },

  // Lifestyle items (Want)
  { itemName: "Car Down Payment", amount: 500000, status: "want" as const, category: "purchase" },
  { itemName: "Vacation to Maldives", amount: 300000, status: "want" as const, category: "purchase" },
  { itemName: "New L-Shape Sofa", amount: 85000, status: "want" as const, category: "purchase" },
  { itemName: "Gaming Setup (PS5 + TV)", amount: 150000, status: "want" as const, category: "purchase" },

  // Tech items (Got)
  { itemName: "Sony WH-1000XM5 Headphones", amount: 45000, status: "got" as const, category: "purchase" },
  { itemName: "Apple Watch Series 9", amount: 55000, status: "got" as const, category: "purchase" },
  { itemName: "Samsung 4K Monitor", amount: 35000, status: "got" as const, category: "purchase" },
  { itemName: "Mechanical Keyboard", amount: 15000, status: "got" as const, category: "purchase" },

  // Lifestyle items (Got)
  { itemName: "Weekend Getaway - Diani", amount: 40000, status: "got" as const, category: "purchase" },
  { itemName: "Gym Membership (Annual)", amount: 25000, status: "got" as const, category: "purchase" },
  { itemName: "New Wardrobe", amount: 50000, status: "got" as const, category: "purchase" },
  { itemName: "Dining Table Set", amount: 60000, status: "got" as const, category: "purchase" },
];

/**
 * Seeds sample ELTIW (Every Little Thing I Want) items for a user profile
 * Includes a mix of tech and lifestyle items, half as "want" and half as "got"
 */
export async function seedEltiw({ profileId }: SeedEltiwOptions) {
  try {
    const now = Date.now();
    const transactions: any[] = [];

    for (const item of SAMPLE_ITEMS) {
      const itemId = id();
      const daysAgo = Math.floor(Math.random() * 90); // Random date within last 90 days
      const createdAt = now - daysAgo * 24 * 60 * 60 * 1000;
      const gotDate = item.status === "got" ? createdAt : undefined;

      transactions.push(
        db.tx.wishlist[itemId]
          .update({
            itemName: item.itemName,
            amount: item.amount,
            status: item.status,
            gotDate,
            createdAt,
            category: item.category,
            notes: `Seeded item - ${item.category}`,
          })
          .link({ profile: profileId })
      );
    }

    await db.transact(transactions);

    console.log(`✅ Successfully seeded ${SAMPLE_ITEMS.length} ELTIW items`);
    return {
      success: true,
      count: SAMPLE_ITEMS.length,
      items: SAMPLE_ITEMS,
    };
  } catch (error) {
    console.error("❌ Error seeding ELTIW items:", error);
    throw error;
  }
}

/**
 * Clears all wishlist items for a profile (useful for testing)
 */
export async function clearEltiw({ profileId }: SeedEltiwOptions) {
  try {
    const { data } = await db.queryOnce({
      wishlist: {
        $: {
          where: {
            profile: profileId,
          },
        },
      },
    });

    const wishlist = data?.wishlist || [];

    if (wishlist.length === 0) {
      console.log("No ELTIW items to clear");
      return { success: true, count: 0 };
    }

    const transactions = wishlist.map((item) => db.tx.wishlist[item.id].delete());

    await db.transact(transactions);

    console.log(`✅ Cleared ${wishlist.length} ELTIW items`);
    return {
      success: true,
      count: wishlist.length,
    };
  } catch (error) {
    console.error("❌ Error clearing ELTIW items:", error);
    throw error;
  }
}
