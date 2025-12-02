/**
 * Migration Script: Relationship Audit & Repair
 *
 * This script audits all entity relationships in the database
 * and identifies/fixes any orphaned records (missing profile links).
 *
 * Usage:
 *   pnpm tsx scripts/migrate-relationships.ts --audit        # Read-only audit
 *   pnpm tsx scripts/migrate-relationships.ts --fix          # Fix orphaned records
 *   pnpm tsx scripts/migrate-relationships.ts --delete       # Delete orphaned records
 *
 * Environment variables required:
 *   NEXT_PUBLIC_INSTANT_APP_ID
 *   INSTANT_APP_ADMIN_TOKEN
 */

// Load environment variables from .env.local BEFORE any other imports
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

// Now import InstantDB admin (after env vars are loaded)
import { init } from "@instantdb/admin";
import schema from "../instant.schema";

// Initialize admin DB with loaded env vars
const adminDb = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN!,
  schema: schema,
});

// Entity types that MUST link to profile
const PROFILE_LINKED_ENTITIES = [
  "expenses",
  "categories",
  "budgets",
  "daily_checkins",
  "income_sources",
  "debts",
  "recipients",
  "savings_goals",
  "recurring_transactions",
  "feedback",
] as const;

// Entities with special parent relationships (not profile)
const PARENT_LINKED_ENTITIES = {
  debt_payments: "debt",
  savings_contributions: "goal",
} as const;

type ProfileLinkedEntity = (typeof PROFILE_LINKED_ENTITIES)[number];
type ParentLinkedEntity = keyof typeof PARENT_LINKED_ENTITIES;

interface AuditResult {
  entityType: string;
  totalRecords: number;
  orphanedRecords: number;
  invalidLinks: number;
  emptyStringLinks: number;
  orphanedIds: string[];
  issues: string[];
}

interface MigrationReport {
  timestamp: string;
  mode: "audit" | "fix" | "delete";
  results: AuditResult[];
  summary: {
    totalEntities: number;
    totalRecords: number;
    totalOrphaned: number;
    entitiesWithIssues: number;
  };
}

// Type for query results
interface QueryRecord {
  id: string;
  profile?: { id: string; handle?: string };
  category?: { id: string; name?: string };
  debt?: { id: string };
  goal?: { id: string };
  createdAt?: number;
  [key: string]: unknown;
}

interface QueryResult {
  data: {
    [key: string]: QueryRecord[];
  };
}

/**
 * Audit a profile-linked entity type
 */
async function auditProfileLinkedEntity(
  entityType: ProfileLinkedEntity
): Promise<AuditResult> {
  console.log(`\n🔍 Auditing ${entityType}...`);

  const result: AuditResult = {
    entityType,
    totalRecords: 0,
    orphanedRecords: 0,
    invalidLinks: 0,
    emptyStringLinks: 0,
    orphanedIds: [],
    issues: [],
  };

  try {
    // Query all records of this entity type
    // Note: InstantDB Admin API has different query syntax
    const query = { [entityType]: { profile: {} } };
    const { data } = (await adminDb.query(query)) as QueryResult;

    const records = data[entityType] || [];
    result.totalRecords = records.length;

    console.log(`  Found ${records.length} ${entityType} records`);

    // Check each record for profile link
    for (const record of records) {
      // Check if profile link exists
      if (!record.profile) {
        result.orphanedRecords++;
        result.orphanedIds.push(record.id);
        result.issues.push(`${entityType} ${record.id}: Missing profile link`);
      }
      // Check for empty string profile link (defensive fallback gone wrong)
      else if (record.profile.id === "") {
        result.emptyStringLinks++;
        result.orphanedIds.push(record.id);
        result.issues.push(
          `${entityType} ${record.id}: Profile linked to empty string ""`
        );
      }
      // Check for invalid profile (profile doesn't exist)
      else if (!record.profile.handle) {
        // If profile exists, it should have a handle
        result.invalidLinks++;
        result.orphanedIds.push(record.id);
        result.issues.push(
          `${entityType} ${record.id}: Profile link points to non-existent profile ${record.profile.id}`
        );
      }
    }

    if (
      result.orphanedRecords === 0 &&
      result.invalidLinks === 0 &&
      result.emptyStringLinks === 0
    ) {
      console.log(`  ✅ All ${entityType} records have valid profile links`);
    } else {
      console.log(
        `  ⚠️  Issues found: ${result.orphanedRecords} orphaned, ${result.invalidLinks} invalid, ${result.emptyStringLinks} empty string`
      );
    }
  } catch (error) {
    result.issues.push(
      `Failed to query ${entityType}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    console.error(`  ❌ Error auditing ${entityType}:`, error);
  }

  return result;
}

/**
 * Audit budget entity (requires BOTH profile and category links)
 */
async function auditBudgets(): Promise<AuditResult> {
  console.log(`\n🔍 Auditing budgets (profile + category links)...`);

  const result: AuditResult = {
    entityType: "budgets",
    totalRecords: 0,
    orphanedRecords: 0,
    invalidLinks: 0,
    emptyStringLinks: 0,
    orphanedIds: [],
    issues: [],
  };

  try {
    const query = { budgets: { profile: {}, category: {} } };
    const { data } = (await adminDb.query(query)) as QueryResult;

    const records = data.budgets || [];
    result.totalRecords = records.length;

    console.log(`  Found ${records.length} budget records`);

    for (const record of records) {
      const issues: string[] = [];

      // Check profile link
      if (!record.profile) {
        issues.push("Missing profile link");
      } else if (record.profile.id === "") {
        issues.push("Profile linked to empty string");
      } else if (!record.profile.handle) {
        issues.push(`Invalid profile ${record.profile.id}`);
      }

      // Check category link
      if (!record.category) {
        issues.push("Missing category link");
      } else if (record.category.id === "") {
        issues.push("Category linked to empty string");
      } else if (!record.category.name) {
        issues.push(`Invalid category ${record.category.id}`);
      }

      if (issues.length > 0) {
        result.orphanedRecords++;
        result.orphanedIds.push(record.id);
        result.issues.push(`budgets ${record.id}: ${issues.join(", ")}`);
      }
    }

    if (result.orphanedRecords === 0) {
      console.log(
        `  ✅ All budget records have valid profile and category links`
      );
    } else {
      console.log(`  ⚠️  ${result.orphanedRecords} budgets with invalid links`);
    }
  } catch (error) {
    result.issues.push(
      `Failed to query budgets: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    console.error(`  ❌ Error auditing budgets:`, error);
  }

  return result;
}

/**
 * Audit parent-linked entities (debt_payments → debt, savings_contributions → goal)
 */
async function auditParentLinkedEntity(
  entityType: ParentLinkedEntity
): Promise<AuditResult> {
  const parentType = PARENT_LINKED_ENTITIES[entityType];
  console.log(`\n🔍 Auditing ${entityType} (links to ${parentType})...`);

  const result: AuditResult = {
    entityType,
    totalRecords: 0,
    orphanedRecords: 0,
    invalidLinks: 0,
    emptyStringLinks: 0,
    orphanedIds: [],
    issues: [],
  };

  try {
    const query = { [entityType]: { [parentType]: {} } };
    const { data } = (await adminDb.query(query)) as QueryResult;

    const records = data[entityType] || [];
    result.totalRecords = records.length;

    console.log(`  Found ${records.length} ${entityType} records`);

    for (const record of records) {
      if (!record[parentType]) {
        result.orphanedRecords++;
        result.orphanedIds.push(record.id);
        result.issues.push(
          `${entityType} ${record.id}: Missing ${parentType} link`
        );
      } else if ((record[parentType] as { id: string }).id === "") {
        result.emptyStringLinks++;
        result.orphanedIds.push(record.id);
        result.issues.push(
          `${entityType} ${record.id}: ${parentType} linked to empty string`
        );
      }
    }

    if (result.orphanedRecords === 0 && result.emptyStringLinks === 0) {
      console.log(
        `  ✅ All ${entityType} records have valid ${parentType} links`
      );
    } else {
      console.log(
        `  ⚠️  ${result.orphanedRecords} orphaned, ${result.emptyStringLinks} empty string`
      );
    }
  } catch (error) {
    result.issues.push(
      `Failed to query ${entityType}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    console.error(`  ❌ Error auditing ${entityType}:`, error);
  }

  return result;
}

/**
 * Attempt to infer correct profile for orphaned entity
 * This looks at user creation patterns to match entities to profiles
 */
async function inferProfileForOrphanedEntity(
  entityType: string,
  entityId: string
): Promise<string | null> {
  // Strategy: Look at creation time and match to profiles created around same time
  // This is a best-effort heuristic for data created during user-based period

  try {
    // Get the orphaned entity
    const query = { [entityType]: { $: { where: { id: entityId } } } };
    const { data } = (await adminDb.query(query)) as QueryResult;
    const entity = data[entityType]?.[0];

    if (!entity || !entity.createdAt) {
      return null;
    }

    // Get all profiles
    const profileQuery = { profiles: { user: {} } };
    const { data: profileData } = (await adminDb.query(
      profileQuery
    )) as QueryResult;
    const profiles = profileData.profiles || [];

    if (profiles.length === 0) {
      return null;
    }

    // If only one profile exists, use it
    if (profiles.length === 1) {
      console.log(`  💡 Only one profile exists, linking to ${profiles[0].id}`);
      return profiles[0].id;
    }

    // Find profile created closest to entity creation time (within 1 hour)
    const entityCreatedAt = entity.createdAt;
    const ONE_HOUR = 60 * 60 * 1000;

    const matchingProfiles = profiles.filter((p: QueryRecord) => {
      if (!p.createdAt) return false;
      const timeDiff = Math.abs(p.createdAt - entityCreatedAt);
      return timeDiff < ONE_HOUR;
    });

    if (matchingProfiles.length === 1) {
      console.log(
        `  💡 Found profile created within 1 hour, linking to ${matchingProfiles[0].id}`
      );
      return matchingProfiles[0].id;
    }

    console.log(
      `  ⚠️  Cannot safely infer profile (${matchingProfiles.length} candidates)`
    );
    return null;
  } catch (error) {
    console.error(`  ❌ Error inferring profile:`, error);
    return null;
  }
}

/**
 * Fix orphaned records by linking them to profiles
 */
async function fixOrphanedRecords(results: AuditResult[]): Promise<number> {
  console.log(`\n🔧 Starting fix mode...`);
  let fixedCount = 0;

  for (const result of results) {
    if (result.orphanedIds.length === 0) continue;

    console.log(
      `\n  Fixing ${result.orphanedIds.length} orphaned ${result.entityType}...`
    );

    for (const entityId of result.orphanedIds) {
      try {
        const profileId = await inferProfileForOrphanedEntity(
          result.entityType,
          entityId
        );

        if (profileId) {
          // Create link using InstantDB Admin API
          // Use type assertion to bypass TypeScript's strict index signature checking
          const txChunk = adminDb.tx as Record<
            string,
            Record<string, { link: (links: { profile: string }) => unknown }>
          >;
          await adminDb.transact([
            txChunk[result.entityType][entityId].link({ profile: profileId }),
          ]);

          fixedCount++;
          console.log(
            `    ✅ Fixed ${result.entityType} ${entityId} → profile ${profileId}`
          );
        } else {
          console.log(
            `    ⚠️  Could not infer profile for ${result.entityType} ${entityId}`
          );
        }
      } catch (error) {
        console.error(
          `    ❌ Failed to fix ${result.entityType} ${entityId}:`,
          error
        );
      }
    }
  }

  return fixedCount;
}

/**
 * Delete orphaned records that cannot be fixed
 */
async function deleteOrphanedRecords(results: AuditResult[]): Promise<number> {
  console.log(`\n🗑️  Starting delete mode...`);
  let deletedCount = 0;

  for (const result of results) {
    if (result.orphanedIds.length === 0) continue;

    console.log(
      `\n  Deleting ${result.orphanedIds.length} orphaned ${result.entityType}...`
    );

    for (const entityId of result.orphanedIds) {
      try {
        // Use type assertion to bypass TypeScript's strict index signature checking
        const txChunk = adminDb.tx as Record<
          string,
          Record<string, { delete: () => unknown }>
        >;
        await adminDb.transact([txChunk[result.entityType][entityId].delete()]);

        deletedCount++;
        console.log(`    ✅ Deleted ${result.entityType} ${entityId}`);
      } catch (error) {
        console.error(
          `    ❌ Failed to delete ${result.entityType} ${entityId}:`,
          error
        );
      }
    }
  }

  return deletedCount;
}

/**
 * Main audit function
 */
async function runAudit(): Promise<MigrationReport> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📊 MONEE RELATIONSHIP AUDIT`);
  console.log(`${"=".repeat(60)}\n`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`App ID: ${process.env.NEXT_PUBLIC_INSTANT_APP_ID}\n`);

  const results: AuditResult[] = [];

  // Audit profile-linked entities
  for (const entityType of PROFILE_LINKED_ENTITIES) {
    if (entityType === "budgets") {
      // Budgets handled separately (dual links)
      continue;
    }
    const result = await auditProfileLinkedEntity(entityType);
    results.push(result);
  }

  // Audit budgets (special case)
  const budgetResult = await auditBudgets();
  results.push(budgetResult);

  // Audit parent-linked entities
  for (const entityType of Object.keys(
    PARENT_LINKED_ENTITIES
  ) as ParentLinkedEntity[]) {
    const result = await auditParentLinkedEntity(entityType);
    results.push(result);
  }

  // Calculate summary
  const summary = {
    totalEntities: results.length,
    totalRecords: results.reduce((sum, r) => sum + r.totalRecords, 0),
    totalOrphaned: results.reduce(
      (sum, r) => sum + r.orphanedRecords + r.invalidLinks + r.emptyStringLinks,
      0
    ),
    entitiesWithIssues: results.filter(
      (r) =>
        r.orphanedRecords > 0 || r.invalidLinks > 0 || r.emptyStringLinks > 0
    ).length,
  };

  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    mode: "audit",
    results,
    summary,
  };

  return report;
}

/**
 * Print final report
 */
function printReport(
  report: MigrationReport,
  fixedCount?: number,
  deletedCount?: number
) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📋 AUDIT SUMMARY`);
  console.log(`${"=".repeat(60)}\n`);

  console.log(`Total Entities Audited: ${report.summary.totalEntities}`);
  console.log(`Total Records: ${report.summary.totalRecords}`);
  console.log(`Total Orphaned/Invalid: ${report.summary.totalOrphaned}`);
  console.log(`Entities with Issues: ${report.summary.entitiesWithIssues}`);

  if (fixedCount !== undefined) {
    console.log(`\n✅ Fixed Records: ${fixedCount}`);
  }

  if (deletedCount !== undefined) {
    console.log(`\n🗑️  Deleted Records: ${deletedCount}`);
  }

  console.log(`\n${"=".repeat(60)}`);

  if (report.summary.totalOrphaned === 0) {
    console.log(`✅ SUCCESS: All relationships are valid!`);
  } else {
    console.log(
      `⚠️  WARNING: ${report.summary.totalOrphaned} records need attention`
    );
    console.log(`\nTo fix: pnpm tsx scripts/migrate-relationships.ts --fix`);
    console.log(
      `To delete: pnpm tsx scripts/migrate-relationships.ts --delete`
    );
  }

  console.log(`${"=".repeat(60)}\n`);

  // Print detailed issues
  if (report.summary.totalOrphaned > 0) {
    console.log(`\n📝 DETAILED ISSUES:\n`);
    for (const result of report.results) {
      if (result.issues.length > 0) {
        console.log(`\n${result.entityType}:`);
        result.issues.forEach((issue) => console.log(`  - ${issue}`));
      }
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || "--audit";

  if (!["--audit", "--fix", "--delete"].includes(mode)) {
    console.error(`Invalid mode: ${mode}`);
    console.log(
      `Usage: pnpm tsx scripts/migrate-relationships.ts [--audit|--fix|--delete]`
    );
    process.exit(1);
  }

  // Verify environment variables
  if (
    !process.env.NEXT_PUBLIC_INSTANT_APP_ID ||
    !process.env.INSTANT_APP_ADMIN_TOKEN
  ) {
    console.error(`❌ Missing environment variables:`);
    console.error(
      `   NEXT_PUBLIC_INSTANT_APP_ID: ${
        process.env.NEXT_PUBLIC_INSTANT_APP_ID ? "✅" : "❌"
      }`
    );
    console.error(
      `   INSTANT_APP_ADMIN_TOKEN: ${
        process.env.INSTANT_APP_ADMIN_TOKEN ? "✅" : "❌"
      }`
    );
    process.exit(1);
  }

  try {
    // Run audit
    const report = await runAudit();

    if (mode === "--audit") {
      printReport(report);
    } else if (mode === "--fix") {
      const fixedCount = await fixOrphanedRecords(report.results);
      report.mode = "fix";
      printReport(report, fixedCount);
    } else if (mode === "--delete") {
      console.log(
        `\n⚠️  WARNING: This will permanently delete orphaned records!`
      );
      console.log(`Press Ctrl+C to cancel, or wait 5 seconds to continue...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const deletedCount = await deleteOrphanedRecords(report.results);
      report.mode = "delete";
      printReport(report, undefined, deletedCount);
    }

    // Save report to file
    const fs = await import("fs/promises");
    const reportPath = `migration-report-${Date.now()}.json`;
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Report saved to: ${reportPath}\n`);

    process.exit(report.summary.totalOrphaned === 0 ? 0 : 1);
  } catch (error) {
    console.error(`\n❌ Fatal error:`, error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { runAudit, type MigrationReport, type AuditResult };
