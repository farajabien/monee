/**
 * Initialize ELLIW (wishlist) items from my-eltiw-items.json for a specific user
 */

import { id as newId } from "@instantdb/react";
import db from "@/lib/db";
import ellitData from "./my-eltiw-items.json";

interface EllitItem {
  id: string;
  name: string;
  amount?: number;
  gotIt?: boolean;
  link?: string;
  category?: string | null;
  createdAt: number;
  deadline?: number | null;
  source?: string | null;
  sourceEmoji?: string;
}

/**
 * Initialize ELLIW items for a user's profile
 * @param profileId - The profile ID to associate wishlist items with
 * @returns Success status and count of items created
 */
export async function initializeElliw(profileId: string) {
  try {
    if (!profileId) {
      console.error("Profile ID is required");
      return { success: false, error: "Profile ID is required" };
    }

    // Map JSON items to wishlist schema
    const elliw = ellitData as EllitItem[];
    const transactions = elliw.map((item) => {
      const wishlistId = newId();
      return db.tx.wishlist[wishlistId]
        .update({
          itemName: item.name,
          amount: item.amount || undefined,
          status: item.gotIt ? "got" : "want",
          gotDate: item.gotIt ? Date.now() : undefined,
          notes: [
            item.link ? `Link: ${item.link}` : "",
            item.category ? `Category: ${item.category}` : "",
            item.source ? `Source: ${item.source} ${item.sourceEmoji || ""}` : "",
          ]
            .filter(Boolean)
            .join(" | "),
          createdAt: item.createdAt,
          category: item.category || undefined,
        })
        .link({ profile: profileId });
    });

    // Batch insert
    await db.transact(transactions);
    
    console.log(`Successfully initialized ${elliw.length} ELLIW items for profile ${profileId}`);
    return { success: true, count: elliw.length };
  } catch (error) {
    console.error("Failed to initialize ELLIW:", error);
    return { success: false, error };
  }
}

