
import db from "@/lib/db";
import { type WishlistItem } from "@/types";

// Helper to extract URL from string
const extractUrl = (text: string): string | null => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches ? matches[0] : null;
};

// Helper to clean notes after extraction
// Removes "Link: <url> |" or just the URL
const cleanNotes = (text: string, url: string): string => {
  if (!text) return "";
  
  // Try to remove "Link: <url> |" pattern
  let cleaned = text.replace(new RegExp(`Link:\\s*${escapeRegExp(url)}\\s*\\|\\s*`, "i"), "");
  
  // Try to remove "Link: <url>" pattern at end
  cleaned = cleaned.replace(new RegExp(`Link:\\s*${escapeRegExp(url)}\\s*`, "i"), "");
  
  // Try to remove just the URL if it's standalone
  cleaned = cleaned.replace(url, "");
  
  // Clean up double pipes or trailing pipes
  cleaned = cleaned.replace(/\|\s*\|/g, "|").replace(/^\|\s*/, "").replace(/\|\s*$/, "").trim();
  
  return cleaned;
};

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const migrateWishlistLinks = async (profileId: string) => {
  console.log("Starting wishlist link migration...");
  
  // Fetch all wishlist items for profile
  // Note: In a real script we'd use a query, but here we assume this is called 
  // from a component where we might pass data or fetch it. 
  // For simplicity, we'll return a function that takes the current items 
  // and returns the transaction ops.
  
  // However, `initializeElliw` style used direct DB access? 
  // Check how `initializeElliw` worked. It used `db.transact`.
  // We can't query inside a non-component easily unless we use `init` pattern or pass data.
  // EXCEPT if we make this a hook or call it from a component with data.
  
  // Pattern: We will expose a function to process items and return updates.
};

// Improved pattern: Use a hook or component to run this.
// Or simply execute the logic on the client side with the data we already have in TodayView!

export const getMigrationUpdates = (items: WishlistItem[]) => {
  const updates: any[] = [];
  let count = 0;

  items.forEach((item) => {
    // Skip if already has a link (and we don't want to overwrite?)
    // But schema just added it, so it's likely null/undefined.
    
    if (item.notes && !item.link) {
      const url = extractUrl(item.notes);
      
      if (url) {
        const cleanedNotes = cleanNotes(item.notes, url);
        
        updates.push(
          db.tx.wishlist[item.id].update({
            link: url,
            notes: cleanedNotes
          })
        );
        count++;
      }
    }
  });

  return { updates, count };
};
