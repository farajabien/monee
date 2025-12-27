import db from "@/lib/db";

/**
 * Migration utility to fix existing debt records with missing required fields
 *
 * This script sets default values for debts that are missing:
 * - amount
 * - direction
 * - status
 * - personName
 * - date
 */
export async function migrateDebts() {
  try {
    console.log("🔄 Starting debt migration...");

    // Query all debts
    const { data } = await db.queryOnce({
      debts: {},
    });

    const debts = data?.debts || [];
    console.log(`📊 Found ${debts.length} debt records`);

    if (debts.length === 0) {
      console.log("✅ No debts to migrate");
      return { success: true, migrated: 0 };
    }

    const now = Date.now();
    const transactions: any[] = [];
    let migratedCount = 0;

    for (const debt of debts) {
      const updates: any = {};
      let needsUpdate = false;

      // Check and set defaults for missing fields
      if (debt.amount === null || debt.amount === undefined) {
        updates.amount = 0;
        needsUpdate = true;
      }

      if (!debt.direction) {
        updates.direction = "I_OWE"; // Default to I_OWE
        needsUpdate = true;
      }

      if (!debt.status) {
        updates.status = "pending";
        needsUpdate = true;
      }

      if (!debt.personName) {
        updates.personName = "Unknown"; // Placeholder name
        needsUpdate = true;
      }

      if (!debt.date) {
        updates.date = now; // Set to current timestamp
        needsUpdate = true;
      }

      if (!debt.createdAt) {
        updates.createdAt = now;
        needsUpdate = true;
      }

      if (!debt.currentBalance && debt.amount) {
        updates.currentBalance = debt.amount;
        needsUpdate = true;
      } else if (!debt.currentBalance) {
        updates.currentBalance = 0;
        needsUpdate = true;
      }

      // If this debt needs updates, add to transaction batch
      if (needsUpdate) {
        console.log(`🔧 Migrating debt ${debt.id}:`, updates);
        transactions.push(db.tx.debts[debt.id].update(updates));
        migratedCount++;
      }
    }

    if (transactions.length > 0) {
      console.log(`💾 Updating ${transactions.length} debt records...`);
      await db.transact(transactions);
      console.log(`✅ Successfully migrated ${migratedCount} debts`);
    } else {
      console.log("✅ No debts needed migration");
    }

    return {
      success: true,
      total: debts.length,
      migrated: migratedCount,
    };
  } catch (error) {
    console.error("❌ Error migrating debts:", error);
    throw error;
  }
}

/**
 * Verify all debts have required fields
 */
export async function verifyDebts() {
  try {
    const { data } = await db.queryOnce({
      debts: {},
    });

    const debts = data?.debts || [];
    const issues: any[] = [];

    for (const debt of debts) {
      const missing: string[] = [];

      if (debt.amount === null || debt.amount === undefined) missing.push("amount");
      if (!debt.direction) missing.push("direction");
      if (!debt.status) missing.push("status");
      if (!debt.personName) missing.push("personName");
      if (!debt.date) missing.push("date");
      if (debt.currentBalance === null || debt.currentBalance === undefined) missing.push("currentBalance");

      if (missing.length > 0) {
        issues.push({
          id: debt.id,
          missing,
        });
      }
    }

    if (issues.length > 0) {
      console.log(`⚠️  Found ${issues.length} debts with missing fields:`);
      issues.forEach((issue) => {
        console.log(`  - Debt ${issue.id}: missing ${issue.missing.join(", ")}`);
      });
      return { valid: false, issues };
    }

    console.log(`✅ All ${debts.length} debts have required fields`);
    return { valid: true, total: debts.length };
  } catch (error) {
    console.error("❌ Error verifying debts:", error);
    throw error;
  }
}
