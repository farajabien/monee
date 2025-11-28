# Monee App Flow Documentation

**Last Updated:** 2025-11-28
**Version:** 3.0 (Unified List System Complete)

---

## Overview

Monee is an all-in-one financial tracking app that replaces 5-6 separate spreadsheets. The core philosophy is **"Set it up once, use it daily"** with focus on lightweight habit-forming interactions and recipient-based spending insights.

### Key Differentiators
1. **Recipient Nicknames** - See where money _really_ goes (not just categories)
2. **Cash Runway Prediction** - Know if you'll make it to payday
3. **Mpesa-Native** - Auto-import from messages and statements
4. **Offline-First** - Works without internet, syncs when online
5. **All-In-One** - Budget, debts, savings, business, student expenses in one place

---

## User Journey

### 1. First-Time Setup (Onboarding)

**Goal:** Get user productive in 10 minutes

**Flow:**
```
Welcome Screen
    ↓
Choose Profile Type
    - Personal Finance (default)
    - Student
    - Business/Side-Hustle
    - All of the above
    ↓
Add Income Sources
    - Name (e.g., "Salary", "Freelance")
    - Amount (KSh)
    - Payday date (day of month)
    - Frequency (monthly/bi-weekly/weekly)
    [Can add multiple sources]
    ↓
Set Recurring Monthly Budgets
    - Select categories
    - Allocate amounts
    - Auto-suggest based on income
    ↓
Add Debts (Optional)
    - Debt name
    - Total amount owed
    - Interest rate
    - Payment schedule
    - Minimum payment
    ↓
Create Savings Goals (Optional)
    - Goal name
    - Target amount
    - Deadline (optional)
    - Starting amount (optional)
    ↓
Setup Complete!
    → Take to Dashboard
```

**Current Status:** ❌ Not implemented
**Priority:** High
**Files to Create:**
- `components/onboarding/welcome-screen.tsx`
- `components/onboarding/profile-type-selector.tsx`
- `components/onboarding/income-setup.tsx`
- `components/onboarding/budget-setup.tsx`
- `components/onboarding/debt-setup.tsx`
- `components/onboarding/savings-setup.tsx`
- `components/onboarding/onboarding-wizard.tsx` (orchestrator)

---

### 2. Daily Use Flow

**Goal:** < 2 minutes to record expenses and check status

**Primary Flow:**
```
Open App
    ↓
Dashboard (Overview Tab) - Financial Snapshot
    ├── Income vs Expenses Card
    │   └── This month: Income KSh X | Expenses KSh Y | Balance +/- Z
    ├── Debts Alert Card
    │   └── Next payment: KSh X due on [date] | Total owed: KSh Y
    ├── Savings Progress Card
    │   └── Saved this month: KSh X (Total: KSh Y) | 45% to goal
    └── Cash Runway Card
        └── KSh X left | Y days to payday | Daily avg: KSh Z ↑/↓
    ↓
Quick Actions (Floating Button or Bottom Nav)
    - Add Expense (primary CTA)
    - Add Income
    - Make Debt Payment
    - Add to Savings
```

**Current Status:** ✅ Fully Implemented
- ✅ Bottom nav exists and working
- ✅ Dashboard redesigned with 4 key cards:
  - Income vs Expenses Card (with net balance)
  - Debts Alert Card (next payment due with urgency)
  - Savings Progress Card (monthly + total with % complete)
  - Cash Runway Card (days to payday, daily avg, discipline indicator)
- ✅ All dashboard cards use unified metrics and consistent styling
- ⚠️ Quick actions floating button (can be added later)

---

### 3. Add Expense Flow

**Goal:** Smart, fast expense entry with auto-categorization

**Flow:**
```
Add Expense Button
    ↓
Choose Input Method
    ├── Manual Entry
    ├── Paste Mpesa Message
    └── Upload Mpesa Statement (bulk)
    ↓
Manual Entry:
    - Amount (KSh)
    - Recipient (with autocomplete)
      → If recipient exists, auto-suggest category
      → If new, prompt for nickname
    - Category (auto-selected or choose)
    - Expense Type (Personal/Business/Student) [NEW]
    - Date (default: today)
    - Notes (optional)
    ↓
Save
    → Auto-match future expenses from this recipient
    → Return to expense list or dashboard
```

**Mpesa Message Flow:**
```
Paste Mpesa Message
    ↓
Auto-parse:
    - Amount
    - Recipient name
    - Transaction date
    - Reference number
    ↓
Check Recipient Database
    ├── Existing → Auto-fill category and nickname
    └── New → Prompt for nickname and category
    ↓
Confirm and Save
```

**Mpesa Statement Bulk Import:**
```
Upload CSV/PDF Statement
    ↓
Parse all transactions
    ↓
Show preview table:
    - Auto-matched (green) - recipient known
    - Needs review (yellow) - new recipient
    - Failed to parse (red)
    ↓
Bulk assign nicknames/categories for new recipients
    ↓
Confirm and Import All
    → Show summary: X imported, Y need manual review
```

**Current Status:** ⚠️ Basic implementation
- ✅ Manual entry exists (`add-expense-form.tsx`)
- ⚠️ Mpesa parsing exists but needs enhancement
- ❌ Recipient auto-matching logic missing
- ❌ Business/Student tagging UI missing
- ❌ Bulk statement import missing

**Files to Update/Create:**
- `components/expenses/add-expense-form.tsx` (add expense type field)
- `components/expenses/mpesa-bulk-import.tsx` (create)
- `lib/mpesa-parser.ts` (enhance)
- `lib/recipient-matcher.ts` (create auto-matching logic)

---

### 4. Dashboard Navigation Structure

**Bottom Navigation Tabs:**

| Tab | Icon | Screen | Current Status |
|-----|------|--------|----------------|
| **Overview** | Home | Financial Snapshot (4 cards) | ✅ Fully Implemented |
| **Expenses** | ArrowLeftRight | Expense list + Add expense | ✅ Working (Unified List) |
| **Income** | TrendingUp | Income sources list | ✅ Working (Unified List) |
| **Savings** | Wallet | Savings goals + progress | ✅ Fully Migrated (Unified List) |
| **More** | MoreHorizontal | Dropdown menu (Debts, Budgets, etc.) | ✅ Working |

**More Menu Items:**
- Debts
- Categories
- Recipients
- Year Review
- Settings

**Current Implementation:** `components/pwa/pwa-bottom-nav.tsx`

---

### 4.1. Unified List System Architecture

**Status:** ✅ **Fully Implemented (Nov 28, 2025)**

**Overview:**
All list components (Expenses, Debts, Income, Budgets, Savings) now use a unified, standardized system that eliminates code duplication and ensures consistent UX across the entire app.

**Code Reduction Achievement:**
- **Before:** ~1,906 lines across 5 list components
- **After:** ~506 lines across 5 list components
- **Reduction:** ~1,400 lines removed (73% decrease!)

**Architecture Components:**

1. **Type System** (`types/list-config.ts`)
   - `ListConfig<T>` - Generic configuration interface for any list
   - `FilterConfig` - Supports select, multi-select, month-select, date-range, boolean filters
   - `MetricConfig` - Badge metrics (currency, count, percentage, average)
   - `CustomAction<T>` - Conditional custom actions per item
   - `ViewMode` - Grid, list, or table views

2. **Hooks** (`hooks/`)
   - `use-list-data.ts` - Filter, sort, search logic with full memoization
   - `use-list-actions.ts` - CRUD handlers with dialogs and toast notifications

3. **UI Components** (`components/ui/`)
   - `list-metrics.tsx` - Consistent badge metrics display
   - `standard-list-item.tsx` - Standardized list item renderer
   - `standard-grid-card.tsx` - Standardized grid card renderer
   - `unified-list-container.tsx` - Main orchestrator component

**Implementation Pattern:**

Each list now follows this pattern:
```typescript
// 1. Configuration file (e.g., expense-list-config.tsx)
export const createExpenseListConfig = (): ListConfig<Expense> => ({
  title: "Expenses",
  metrics: [/* metric configs */],
  filters: [/* filter configs */],
  sortOptions: [/* sort options */],
  renderListItem: (item, index, actions) => { /* render logic */ },
  renderGridCard: (item, index, actions) => { /* render logic */ },
  actions: { edit, delete },
  customSort: (a, b, sortBy) => { /* custom sort logic */ },
  customFilter: (item, query, filters) => { /* custom filter logic */ },
});

// 2. Component file (e.g., expense-list.tsx) - ~40-120 lines
export function ExpenseList() {
  const { data } = db.useQuery({ /* query */ });
  const config = useMemo(() => createExpenseListConfig(), []);

  return <UnifiedListContainer config={config} data={data} />;
}
```

**Benefits:**
- ✅ Consistent UX across all data views (same filters, sort, search, metrics)
- ✅ ~1,400 lines of duplicate code eliminated
- ✅ Single source of truth for list behavior
- ✅ Easy to add new lists (just create a config)
- ✅ Automatic support for multiple view modes (grid, list, table)
- ✅ Built-in performance optimizations (memoization, efficient renders)

**Refactored Lists:**
1. ✅ Expenses List (375 → 44 lines, 88% reduction)
2. ✅ Debts List (700 → 128 lines, 82% reduction)
3. ✅ Income Sources List (344 → 107 lines, 69% reduction)
4. ✅ Budgets List (251 → 123 lines, 51% reduction)
5. ✅ Savings Goals List (236 → 104 lines, 56% reduction)

---

### 5. Overview Tab (Dashboard) Design

**Current State:**
- Shows tabs: "Summary" and "Budgets"
- Summary tab shows `MonthlySummary` component with:
  - Income vs Expenses totals
  - Net balance
  - Budget progress bar
  - Tabs for: Overview / By Category / Top Recipients

**Planned Redesign:**

```
┌─────────────────────────────────────────┐
│  Overview                               │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │  Income vs Expenses               │  │
│  │  Income:     KSh 50,000           │  │
│  │  Expenses:   KSh 32,500           │  │
│  │  Balance:    +KSh 17,500 ✅       │  │
│  └───────────────────────────────────┘  │
│                                          │
│  ┌───────────────────────────────────┐  │
│  │  Debts Alert                      │  │
│  │  Next payment: KSh 5,000          │  │
│  │  Due: Dec 5, 2025 (7 days)       │  │
│  │  Total owed: KSh 45,000           │  │
│  │  [View All Debts →]              │  │
│  └───────────────────────────────────┘  │
│                                          │
│  ┌───────────────────────────────────┐  │
│  │  Savings Progress                 │  │
│  │  This month: KSh 8,000            │  │
│  │  Total saved: KSh 120,000 (48%)   │  │
│  │  ▓▓▓▓▓▓░░░░░░ 48%                │  │
│  │  [Add to Savings →]              │  │
│  └───────────────────────────────────┘  │
│                                          │
│  ┌───────────────────────────────────┐  │
│  │  Cash Runway 🚀                   │  │
│  │  KSh 12,500 left until payday    │  │
│  │  15 days to go (Dec 15)           │  │
│  │  Daily avg: KSh 833 ↑ (Good!)    │  │
│  │  Prediction: You'll make it! ✅   │  │
│  └───────────────────────────────────┘  │
│                                          │
│  [View Detailed Summary →]              │
└─────────────────────────────────────────┘
```

**Components to Create:**
- `components/dashboard/income-expenses-card.tsx`
- `components/dashboard/debts-alert-card.tsx`
- `components/dashboard/savings-progress-card.tsx`
- `components/dashboard/cash-runway-card.tsx`
- `components/dashboard/dashboard-overview.tsx` (orchestrator)

**Cash Runway Calculation Logic:**
```typescript
// lib/cash-runway-calculator.ts
interface CashRunwayData {
  currentCash: number;           // Income this month - Expenses so far
  daysToPayday: number;          // Days until next income
  dailyAverageSpend: number;     // Total spent / days elapsed this month
  projectedBalance: number;      // currentCash - (dailyAvg * daysToPayday)
  willMakeIt: boolean;           // projectedBalance > 0
  disciplineIndicator: 'up' | 'down' | 'neutral';  // Compare to last period
}

function calculateCashRunway(
  incomeSources: IncomeSource[],
  expenses: Expense[],
  currentDate: Date
): CashRunwayData
```

---

### 6. Expense List View

**Current Implementation:** ✅ Working
- File: `components/expenses/expense-list.tsx`
- Features:
  - Data table with columns: Date, Recipient, Category, Amount
  - Edit and delete actions
  - Filtering by category
  - Search by recipient

**Enhancements Needed:**
- Add filter by expense type (Personal/Business/Student)
- Show recipient nickname (not just original name)
- Add bulk edit capabilities
- Export to CSV

---

### 7. Income Management

**Current Implementation:** ✅ Working
- File: `components/income/income-source-list.tsx`
- Features:
  - Add/edit/delete income sources
  - Track payday dates
  - Mark as active/inactive

**No major changes needed**

---

### 8. Savings Management

**Current Implementation:** ⚠️ Using workaround
- File: `components/savings/savings-goal-list.tsx`
- **ISSUE:** Using `eltiw_items` entity instead of proper `savings_goals`

**Required Migration:**
```typescript
// OLD (current):
db.useQuery({ eltiw_items: { where: { source: "savings" } } })

// NEW (target):
db.useQuery({
  savings_goals: {
    $: { where: { "user.id": user.id } },
    contributions: {}
  }
})
```

**New Component Structure:**
```
SavingsPage
  ├── SavingsGoalList
  │   └── SavingsGoalCard (for each goal)
  │       ├── Progress bar
  │       ├── Current vs Target amount
  │       ├── Deadline countdown
  │       └── [Add Money] button
  ├── AddSavingsGoalDialog
  └── SavingsSummary (total across all goals)
```

**Files to Refactor:**
- `components/savings/savings-goal-list.tsx` (migrate to new schema)
- `components/savings/savings-goal-form.tsx` (update to use savings_goals)
- `components/savings/add-to-savings-dialog.tsx` (create savings_contributions)

---

### 9. Debt Management

**Current Implementation:** ✅ Working
- Files:
  - `components/debts/debt-list.tsx`
  - `components/debts/debt-progress.tsx`
  - `components/debts/debt-payment-form.tsx`
- Features:
  - Add/edit/delete debts
  - Track payment history
  - Interest calculations
  - Progress visualization

**Enhancement Needed:**
- Add debt alert to Overview dashboard
- Add "next payment due" notification
- Add debt payoff calculator/projections

---

### 10. Budget Management

**Current Implementation:** ✅ Working
- File: `components/budgets/budget-list.tsx`
- Features:
  - Set monthly budgets by category
  - Track spending vs budget
  - Progress bars
  - Over-budget warnings

**No major changes needed** (currently accessible via Overview → Budgets tab)

---

### 11. Recipients & Nicknames

**Current Implementation:** ✅ Basic structure exists
- File: `components/recipients/recipient-list.tsx`
- Features:
  - View all recipients
  - Add nicknames
  - Set default category
  - Add notes

**Enhancements Needed:**
- **Auto-matching logic:** When adding expense, automatically match recipient and suggest category
- **Recipient merging:** Handle duplicates (e.g., "NAIVAS" vs "NAIVAS LTD")
- **Smart suggestions:** Learn from user's categorization patterns
- **Bulk operations:** Assign nicknames to multiple recipients at once

**Implementation:**
```typescript
// lib/recipient-matcher.ts
interface RecipientMatch {
  recipient: Recipient | null;
  confidence: 'high' | 'medium' | 'low';
  suggestedCategory: string | null;
  suggestedNickname: string | null;
}

function matchRecipient(
  transactionRecipient: string,
  existingRecipients: Recipient[]
): RecipientMatch {
  // 1. Exact match on originalName
  // 2. Fuzzy match on nickname
  // 3. Partial string match
  // 4. Return null if no match (new recipient)
}
```

---

### 12. Categories Management

**Current Implementation:** ✅ Working
- File: `components/categories/category-list.tsx`
- Features:
  - Add/edit/delete categories
  - Color coding
  - Icon selection
  - Default categories on first load

**No major changes needed**

---

### 13. Business & Student Modes

**Current State:** ❌ Not implemented (schema ready, UI missing)

**Implementation Plan:**

**Expense Type Field:**
- Add to expense form: `expenseType: 'personal' | 'business' | 'student'`
- Default: 'personal'
- Show tag badge in expense list

**Business View (Filtering):**
```
Business Dashboard (Filter expenses where expenseType = 'business')
  - Total business income
  - Total business expenses
  - Net profit/loss
  - Top business expense categories
  - Month-over-month comparison
```

**Student View (Filtering):**
```
Student Dashboard (Filter expenses where expenseType = 'student')
  - Total academic expenses
  - Breakdown: Tuition, Books, Supplies, Food, Transport
  - Compare to student budget
```

**Files to Create:**
- `components/business/business-dashboard.tsx`
- `components/student/student-dashboard.tsx`
- Update: `components/expenses/add-expense-form.tsx` (add expense type selector)

---

### 14. Insights & Reports

**Current Implementation:** ✅ Working
- File: `components/insights/monthly-summary.tsx`
- Features:
  - Monthly overview
  - Category breakdown (pie chart)
  - Top recipients (bar chart)
  - Yearly comparison
  - Export data

**File:** `components/insights/year-in-review.tsx`
- Features:
  - Annual summary
  - Trends over time
  - Biggest expenses
  - Savings achievements

**No major changes needed**

---

### 15. Settings

**Current Implementation:** ✅ Basic structure
- File: `app/(app)/settings/settings-client.tsx`

**Needs:**
- Currency selection
- Payday reminder settings
- Notification preferences
- Export all data
- Account management

---

## Technical Architecture

### State Management
- **InstantDB** for real-time sync and offline-first data
- **React Query** patterns via InstantDB hooks
- Local-first, syncs to cloud automatically

### Navigation
- **URL-based routing** with query params (`?tab=overview`)
- **PWA bottom navigation** for mobile-first experience
- **Deep linking** support for notifications

### Data Flow
```
User Action
    ↓
Component (React)
    ↓
InstantDB Transaction (tx)
    ↓
Local Database (offline-first)
    ↓
Cloud Sync (when online)
    ↓
Real-time Update (via db.useQuery)
    ↓
Component Re-render
```

### Key Files Structure
```
monee/
├── app/
│   ├── (app)/
│   │   ├── dashboard/page.tsx
│   │   └── settings/page.tsx
│   └── home-client.tsx (main orchestrator)
├── components/
│   ├── budgets/
│   ├── categories/
│   ├── dashboard/          [NEW - to create]
│   ├── debts/
│   ├── expenses/
│   ├── income/
│   ├── insights/
│   ├── onboarding/         [NEW - to create]
│   ├── pwa/
│   ├── recipients/
│   ├── savings/
│   ├── business/           [NEW - to create]
│   └── student/            [NEW - to create]
├── lib/
│   ├── db.ts
│   ├── bootstrap.ts
│   ├── mpesa-parser.ts
│   ├── recipient-matcher.ts   [NEW - to create]
│   └── cash-runway-calculator.ts [NEW - to create]
├── instant.schema.ts
└── instant.perms.ts
```

---

## Implementation Priority

### Phase 1: Critical Fixes (Week 1)
1. ✅ Update README with positioning
2. ✅ Add savings_goals to schema
3. 🟡 Migrate savings components to new schema
4. 🟡 Create dashboard card components
5. 🟡 Redesign Overview tab

### Phase 2: Core Features (Week 2)
6. Cash Runway calculator
7. Recipient auto-matching logic
8. Business/Student expense tagging UI
9. Mpesa bulk import

### Phase 3: Polish (Week 3)
10. Onboarding wizard
11. Enhanced settings
12. Notifications & reminders
13. Business/Student dashboards

### Phase 4: Growth (Week 4+)
14. Export/backup features
15. Advanced analytics
16. Multi-currency support
17. Payment integrations

---

## Success Metrics

### User Activation
- Time to first expense recorded: < 5 minutes
- Onboarding completion rate: > 80%

### Engagement
- Daily active usage: > 60% of users
- Average expenses recorded per week: > 10
- Recipient nicknames created: > 5 per user

### Value Delivery
- Users who reach payday without running out: > 70%
- Savings goals achieved: > 30% completion rate
- Budget adherence: > 60% stay within budget

---

## Future Considerations

### Integrations
- **Mpesa API** (automatic transaction fetching)
- **Bank account linking** (read-only access)
- **Bill reminders** (KPLC, water, rent auto-detection)

### AI Features
- **Smart categorization** (ML-based)
- **Spending predictions** (forecast next month)
- **Savings recommendations** (based on patterns)
- **Anomaly detection** (unusual expenses alert)

### Social Features
- **Shared budgets** (families/couples)
- **Savings challenges** (compete with friends)
- **Expense splitting** (group expenses)

---

**Document Status:** 🟢 Active Reference
**Next Review:** After Phase 1 completion
