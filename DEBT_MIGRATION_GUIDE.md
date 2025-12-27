# Debt Schema Migration Guide

This guide walks you through fixing the InstantDB schema migration issue with existing debt records.

## What Happened?

Your existing debt records have `null` values for fields that are now required in the schema. This prevents the schema from being pushed.

## Solution Steps

Follow these steps **in order**:

### Step 1: Push the Temporary Schema ✅

The debt fields are now temporarily marked as optional. Push this version:

```bash
npx instant-cli@latest push -y
```

✅ **Expected result**: Schema push should succeed this time.

---

### Step 2: Run the Migration Script

Open your browser console in your app at `http://localhost:3000` and run:

```javascript
// Import the migration function
const { migrateDebts, verifyDebts } = await import('./lib/migrate-debts');

// Run the migration
const result = await migrateDebts();
console.log('Migration result:', result);
```

This will:
- Find all debts with missing data
- Set default values:
  - `amount`: 0
  - `direction`: "I_OWE"
  - `status`: "pending"
  - `personName`: "Unknown"
  - `date`: Current timestamp
  - `currentBalance`: Same as amount (or 0)

✅ **Expected output**:
```
🔄 Starting debt migration...
📊 Found X debt records
🔧 Migrating debt {...}
💾 Updating X debt records...
✅ Successfully migrated X debts
```

---

### Step 3: Verify the Migration

Still in the browser console, verify all debts now have required fields:

```javascript
const { verifyDebts } = await import('./lib/migrate-debts');
const verification = await verifyDebts();
console.log('Verification:', verification);
```

✅ **Expected output**:
```
✅ All X debts have required fields
{ valid: true, total: X }
```

If you see any issues, run `migrateDebts()` again.

---

### Step 4: Make Fields Required Again

Now that all debts have proper values, make the fields required again.

**Edit `instant.schema.ts`** and change the debts entity back to:

```typescript
// Core Entity 2: Debts (two-way tracking)
debts: i.entity({
  personName: i.string().indexed(), // Remove .optional()
  amount: i.number().indexed(), // Remove .optional()
  currentBalance: i.number().indexed(), // Remove .optional()
  direction: i.string().indexed(), // Remove .optional()
  date: i.number().indexed(), // Remove .optional()
  dueDate: i.number().optional().indexed(), // Keep optional
  status: i.string().indexed(), // Remove .optional()
  notes: i.string().optional(), // Keep optional
  createdAt: i.number().indexed(), // Remove .optional()
  // Debt configuration fields (keep all optional)
  interestRate: i.number().optional(),
  debtType: i.string().optional(),
  compoundingFrequency: i.string().optional(),
  monthlyPayment: i.number().optional(),
}),
```

---

### Step 5: Push the Final Schema

```bash
npx instant-cli@latest push -y
```

✅ **Expected result**: Schema push succeeds, and all fields are now required.

---

## Alternative: Quick Clean Slate

If you'd prefer to just delete all test debts and start fresh:

1. Go to your InstantDB dashboard: https://instantdb.com/dash
2. Navigate to your app
3. Go to the "Data" tab
4. Select the `debts` namespace
5. Delete all debt records
6. Skip Step 1 and go straight to Step 4 (make fields required)
7. Push the schema

This is faster if you don't need the test data!

---

## Troubleshooting

**Problem**: Migration script not found
**Solution**: Make sure you're in your app directory and the file `/lib/migrate-debts.ts` exists

**Problem**: Verification still shows missing fields
**Solution**: Run `migrateDebts()` again - some records might not have been caught

**Problem**: Schema push still fails after migration
**Solution**: Run `verifyDebts()` to check for any remaining issues

---

## Summary

1. ✅ Push temporary schema (fields optional)
2. ✅ Run migration to fix data
3. ✅ Verify all debts are valid
4. ✅ Make fields required again
5. ✅ Push final schema

After completing these steps, your schema will be up-to-date and all debt records will have proper values!
