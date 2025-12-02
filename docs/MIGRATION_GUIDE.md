# Relationship Migration Guide

## Overview

This guide helps you audit and fix entity relationships in your MONEE database after migrating from user-based to profile-based links.

## What Was Changed

### Removed Entities
- **eltiw_items**: Unused entity removed from schema
- **statement_expenses**: Unused entity removed from schema

### Active Entities (12 profile-linked)
✅ All correctly link to profile:
- expenses
- categories
- budgets (also links to category)
- daily_checkins
- income_sources
- debts
- recipients
- savings_goals
- recurring_transactions
- feedback

### Parent-Linked Entities (2)
- **debt_payments** → debt
- **savings_contributions** → goal

## Running the Audit

### Prerequisites

1. **Get your InstantDB credentials:**
   ```bash
   # Go to: https://instantdb.com/dash
   # Navigate to your app > Settings
   # Copy: App ID and Admin Token
   ```

2. **Create `.env.local`:**
   ```bash
   NEXT_PUBLIC_INSTANT_APP_ID=your-app-id
   INSTANT_APP_ADMIN_TOKEN=your-admin-token
   ```

### Audit Mode (Safe - Read Only)

```bash
pnpm tsx scripts/migrate-relationships.ts --audit
```

**This will:**
- ✅ Check all entity relationships
- ✅ Identify orphaned records (missing profile links)
- ✅ Identify invalid links (profile doesn't exist)
- ✅ Identify empty string links (`profile: ""`)
- ✅ Generate detailed report
- ✅ Save report to `migration-report-[timestamp].json`
- ❌ **NO CHANGES** to database

**Expected output:**
```
🔍 Auditing expenses...
  Found 245 expenses records
  ✅ All expenses records have valid profile links

🔍 Auditing categories...
  Found 32 categories records
  ✅ All categories records have valid profile links

📋 AUDIT SUMMARY
==================
Total Entities Audited: 12
Total Records: 1,523
Total Orphaned/Invalid: 0
Entities with Issues: 0

✅ SUCCESS: All relationships are valid!
```

### Fix Mode (Automatic Repair)

```bash
pnpm tsx scripts/migrate-relationships.ts --fix
```

**This will:**
- ✅ Run audit first
- ✅ Attempt to infer correct profile for orphaned records
- ✅ Create missing profile links
- ⚠️ **MODIFIES DATABASE**

**Inference strategy:**
1. If only one profile exists → link to it
2. If entity created within 1 hour of profile → link to that profile
3. Otherwise → skip (manual intervention needed)

### Delete Mode (Nuclear Option)

```bash
pnpm tsx scripts/migrate-relationships.ts --delete
```

**This will:**
- ⚠️ **PERMANENTLY DELETE** orphaned records
- ⚠️ 5-second countdown before execution
- ⚠️ Use only if records cannot be salvaged

## Understanding the Report

### Example Issue Output

```
📝 DETAILED ISSUES:

expenses:
  - expenses abc123: Missing profile link
  - expenses def456: Profile linked to empty string ""
  - expenses ghi789: Profile link points to non-existent profile xyz999

budgets:
  - budgets jkl012: Missing category link
```

### Issue Types

1. **Missing profile link**: Entity has no `profile` relationship
2. **Empty string link**: Entity links to `""` (defensive fallback gone wrong)
3. **Invalid profile**: Profile ID exists but profile doesn't exist in database
4. **Missing category link** (budgets only): Budget missing category relationship

## Post-Migration Checklist

After running the migration:

- [ ] Run `--audit` mode to verify current state
- [ ] Review generated report file
- [ ] If issues found:
  - [ ] Try `--fix` mode to auto-repair
  - [ ] For remaining issues, investigate manually
  - [ ] Consider `--delete` if records are truly orphaned
- [ ] Re-run `--audit` to confirm all fixed
- [ ] Test app functionality (create expense, category, etc.)
- [ ] Verify queries return expected data

## Using Validation Utilities

The new `lib/validate-relationships.ts` provides runtime validation:

```typescript
import { validateProfile, assertProfileExists } from "@/lib/validate-relationships";

// Before creating an entity
const handleCreateExpense = async () => {
  try {
    validateProfile(profile); // Throws if invalid
    
    await db.transact(
      db.tx.expenses[id()]
        .update({ ...data })
        .link({ profile: profile.id })
    );
  } catch (error) {
    console.error("Cannot create expense:", error);
  }
};

// For batch operations
const handleBulkCreate = async () => {
  assertProfileExists(profile, "bulk create expenses");
  // Throws with helpful message if profile missing
  
  // Proceed with bulk operations...
};
```

## Common Scenarios

### Scenario 1: Fresh Installation (No Data)
```
✅ All relationships are valid!
Total Records: 0
```
**Action:** None needed, you're good to go!

### Scenario 2: Migrated Data (Pre-Phase 0)
```
⚠️ WARNING: 47 records need attention
- expenses: 23 missing profile link
- categories: 12 missing profile link
- debts: 8 missing profile link
- income_sources: 4 missing profile link
```
**Action:** Run `--fix` mode, then `--audit` again

### Scenario 3: Multiple Users
```
⚠️ Cannot safely infer profile (3 candidates)
```
**Action:** Manual investigation needed. Check entity `createdAt` timestamp and user records.

## Troubleshooting

### "Missing environment variables"
- Ensure `.env.local` exists with correct values
- Check spelling: `NEXT_PUBLIC_INSTANT_APP_ID` (not APP_KEY)
- Admin token must be from InstantDB dashboard > Settings

### "Failed to query [entity]"
- Verify InstantDB Admin Token has correct permissions
- Check network connection
- Verify app ID is correct

### "Cannot safely infer profile"
- Multiple profiles exist with similar creation times
- Manual investigation needed
- Consider using `--delete` if records are old/invalid

### Script hangs or times out
- InstantDB API might be slow with large datasets
- Try running during off-peak hours
- Check InstantDB dashboard for service status

## Rolling Back

If something goes wrong:

1. **Audit mode:** No rollback needed (read-only)
2. **Fix mode:** Use report file to identify what was changed, manually unlink if needed
3. **Delete mode:** ⚠️ **NO ROLLBACK POSSIBLE** - records are permanently deleted

Always run `--audit` first and review the report before using `--fix` or `--delete`.

## Support

For issues with the migration script:
1. Check the generated report file (`migration-report-[timestamp].json`)
2. Review console output for specific error messages
3. Open an issue with report file attached

## Success Criteria

Migration is complete when:
- ✅ Audit shows 0 orphaned records
- ✅ All app features work correctly
- ✅ Queries return expected data
- ✅ No console errors about missing relationships
- ✅ New entities can be created without errors
