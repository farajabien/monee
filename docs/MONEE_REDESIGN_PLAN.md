# MONEE Redesign & Implementation Plan

**Created:** December 4, 2025  
**Status:** Ready for Implementation  
**Goal:** Unified, calm, beautiful design system that works on ALL devices

---

## 🎨 NEW DESIGN SYSTEM

### Design Philosophy
> **"Your money, finally in one place"**  
> Simple, trustworthy, focused. Amount-first. Actions hidden. Information calm.

### Core Principles

1. **Amount-First Layout** - Money is always the hero
2. **Unified Card Pattern** - Same design for expenses, income, debts, savings
3. **Minimal Actions** - Edit/delete hidden in dropdown (appears on hover)
4. **Color-Coded Types** - Red (expense), Green (income), Orange (debt), Blue (savings)
5. **Calm Aesthetics** - Professional fintech palette, subtle backgrounds

---

## 📐 Component Architecture

### 1. MoneeCard Component

**The Single Source of Truth for All List Items**

```tsx
// components/custom/monee-cards.tsx

interface MoneeCardProps {
  // Required
  type: "expense" | "income" | "debt" | "savings"
  amount: string | number
  name: string
  category: string
  date: string
  
  // Optional
  secondaryLabel?: string      // "Next payment", "Total balance"
  secondaryValue?: string      // "Ksh 5,000", "Due: 15 Dec"
  showActions?: boolean        // Default: true
  onEdit?: () => void
  onDelete?: () => void
}

// Visual Structure:
┌──────────────────────────────────────────────────┐
│ Ksh 2,000  Wifi                             ⋮   │  <- Amount (colored) + Name + Menu
│ [Internet] 2 Dec, 13:28                          │  <- Category badge + Date
│ Next payment: Ksh 5,000                          │  <- Secondary info (optional)
└──────────────────────────────────────────────────┘

// Color Mapping:
- expense: text-red-600 dark:text-red-400
- income: text-green-600 dark:text-green-400
- debt: text-orange-600 dark:text-orange-400
- savings: text-blue-600 dark:text-blue-400

// Interaction:
- Hover: border-primary/50 + shadow-sm
- Actions: Dropdown menu (MoreVertical icon)
- Appears on group-hover (opacity-0 → opacity-100)
```

### 2. MoneeDashboardMetric Component

**Dashboard Overview Cards (2x2 Grid)**

```tsx
<MoneeDashboardMetric
  icon={DollarSign}
  label="Total Spent"
  value="Ksh 26.3K"
  color="primary"  // primary | accent | secondary | muted
/>

// Visual:
┌─────────────────────┐
│ 💰 Total Spent      │  <- Icon + Label (small)
│ Ksh 26.3K           │  <- Value (large, bold)
└─────────────────────┘

// Layout: grid-cols-2 gap-3 (mobile/tablet)
// Desktop: Could expand to grid-cols-4
```

### 3. MoneeListHeader Component

**Section Headers with Count & Total**

```tsx
<MoneeListHeader
  title="All Expenses"
  count={12}
  total="Total: Ksh 26.3K"  // Optional
/>

// Visual:
All Expenses               [12 items]
Total: Ksh 26.3K

// Responsive: title on left, count badge on right
```

---

## 🏗️ Implementation Plan

### Phase 1: Create Unified Components (Day 1)

#### 1.1 Create MoneeCard Component ✨ HIGH PRIORITY
**File:** `components/custom/monee-cards.tsx`

**Tasks:**
- [x] Create MoneeCard with type-based color coding
- [x] Implement dropdown menu for actions (hidden by default)
- [x] Add hover states (border + shadow)
- [x] Support optional secondary info
- [x] Create MoneeDashboardMetric component
- [x] Create MoneeListHeader component

**Testing:**
- Render all 4 types (expense, income, debt, savings)
- Verify color coding in light & dark mode
- Test dropdown menu on hover
- Check responsive behavior (320px to 1920px)

#### 1.2 Update Theme Colors
**File:** `app/globals.css`

**Current Colors:** Safaricom Green (oklch-based)
**New Additions:**
```css
/* Keep existing Safaricom Green as primary */
--primary: oklch(0.55 0.18 155);  /* Green */

/* Ensure semantic colors for MoneeCard types */
/* These already exist in Tailwind, just document usage:
- Red: text-red-600 dark:text-red-400 (expenses)
- Green: text-green-600 dark:text-green-400 (income)
- Orange: text-orange-600 dark:text-orange-400 (debts)
- Blue: text-blue-600 dark:text-blue-400 (savings)
*/

/* Card hover state */
.monee-card:hover {
  border-color: hsl(var(--primary) / 0.5);
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}
```

---

### Phase 2: Migrate Existing Pages (Days 2-3)

#### 2.1 Expenses List
**File:** `components/expenses/expense-list.tsx`

**Before:**
```tsx
<UnifiedItemCard
  primaryBadge={{ value: formatCurrency(amount) }}
  title={recipient}
  badges={[{ label: category }]}
  metadata={[{ icon: <Calendar />, text: formatDate(date) }]}
  ...
/>
```

**After:**
```tsx
<MoneeCard
  type="expense"
  amount={amount}
  name={recipient}
  category={category}
  date={formatDate(date)}
  onEdit={() => handleEdit(expense)}
  onDelete={() => handleDelete(expense.id)}
/>
```

**Benefits:**
- 60% less code
- Consistent design
- Better performance (fewer components)

#### 2.2 Income List
**File:** `components/income/income-source-list.tsx`

**Migration:**
```tsx
<MoneeCard
  type="income"
  amount={source.amount}
  name={source.name}
  category={source.frequency}  // "Monthly", "Weekly"
  date={`Next: ${getNextPayday(source)}`}
  onEdit={() => handleEdit(source)}
  onDelete={() => handleDelete(source.id)}
/>
```

#### 2.3 Debt List
**File:** `components/debts/debt-list.tsx`

**Migration:**
```tsx
<MoneeCard
  type="debt"
  amount={debt.currentBalance}
  name={debt.name}
  category="Total Balance"
  date={`Due: ${formatDate(debt.nextPaymentDate)}`}
  secondaryLabel="Next payment"
  secondaryValue={formatCurrency(debt.monthlyPayment)}
  onEdit={() => handleEdit(debt)}
  onDelete={() => handleDelete(debt.id)}
/>
```

#### 2.4 Savings List
**File:** `components/savings/savings-goal-list.tsx`

**Migration:**
```tsx
{savingsGoals.map((goal) => {
  const percentage = (goal.currentAmount / goal.targetAmount) * 100;
  
  return (
    <div key={goal.id} className="space-y-2">
      <MoneeCard
        type="savings"
        amount={goal.currentAmount}
        name={`${goal.emoji} ${goal.name}`}
        category={`${Math.round(percentage)}% of goal`}
        date={`Target: ${formatCurrency(goal.targetAmount)}`}
        showActions={false}  // Hide edit/delete for cleaner progress view
      />
      
      {/* Progress bar below card */}
      <div className="flex items-center gap-2 px-3">
        <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all" 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
})}
```

---

### Phase 3: Update Dashboard (Day 4)

#### 3.1 Dashboard Overview
**File:** `components/dashboard/dashboard-overview.tsx`

**Add Dashboard Metrics:**
```tsx
<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
  <MoneeDashboardMetric
    icon={DollarSign}
    label="Total Spent"
    value={formatCurrencyCompact(totalExpenses)}
    color="primary"
  />
  <MoneeDashboardMetric
    icon={TrendingUp}
    label="Total Income"
    value={formatCurrencyCompact(totalIncome)}
    color="accent"
  />
  <MoneeDashboardMetric
    icon={PieChart}
    label="Debts Due"
    value={formatCurrencyCompact(totalDebts)}
    color="secondary"
  />
  <MoneeDashboardMetric
    icon={Target}
    label="Savings Progress"
    value={`${savingsProgress}%`}
    color="accent"
  />
</div>
```

#### 3.2 Cash Runway Card
**Keep existing CashFlowHealthCard but update styling:**
```tsx
<div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
  <p className="text-xs font-medium text-muted-foreground mb-2">Cash Runway</p>
  <p className="text-lg font-bold">
    You'll have <span className="text-primary">{formatCurrency(remainingMoney)}</span> left until payday
  </p>
  <p className="text-xs text-muted-foreground mt-2">
    {runwayStatus === 'on-track' ? '✓ Based on your spending rate, you\'re on track' : '⚠️ Consider reducing spending'}
  </p>
</div>
```

#### 3.3 Recent Transactions
```tsx
<div>
  <MoneeListHeader title="Recent Transactions" count={recentExpenses.length} />
  <div className="space-y-2">
    {recentExpenses.slice(0, 5).map((expense) => (
      <MoneeCard
        key={expense.id}
        type="expense"
        amount={expense.amount}
        name={expense.recipient}
        category={expense.category}
        date={formatDate(expense.date)}
        onEdit={() => handleEdit(expense)}
        onDelete={() => handleDelete(expense.id)}
      />
    ))}
  </div>
</div>
```

---

### Phase 4: Navigation & Layout (Day 5)

#### 4.1 Update Tab Navigation Style
**File:** `app/home-client.tsx` (or create new nav component)

**New Sticky Tab Design:**
```tsx
<div className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
    <TabsList className="grid w-full grid-cols-4 bg-transparent border-b-0 h-auto p-0 rounded-none">
      <TabsTrigger
        value="overview"
        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3"
      >
        <span className="text-xs sm:text-sm">Overview</span>
      </TabsTrigger>
      <TabsTrigger value="expenses" className="...">
        <span className="text-xs sm:text-sm">Expenses</span>
      </TabsTrigger>
      <TabsTrigger value="income" className="...">
        <span className="text-xs sm:text-sm">Income</span>
      </TabsTrigger>
      <TabsTrigger value="more" className="...">
        <span className="text-xs sm:text-sm">More</span>
      </TabsTrigger>
    </TabsList>
  </Tabs>
</div>
```

**Key Features:**
- Sticky positioning (`sticky top-0`)
- Backdrop blur for scrolling (`bg-background/95 backdrop-blur-sm`)
- Underline indicator (not background)
- 4 tabs: Overview, Expenses, Income, More (debts + savings)

#### 4.2 Update Container Widths
**Remove `max-w-md` restrictions:**

```tsx
// OLD (home-client.tsx)
<div className="mx-auto max-w-md p-3 sm:p-4 md:p-6 pb-20">

// NEW - Responsive container
<div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pb-20">
```

**Container Strategy:**
- Mobile: Full width with padding (320px+)
- Tablet/Desktop: `max-w-2xl` (672px) for list views
- Dashboard: `max-w-4xl` (896px) for wider metrics
- NO `max-w-md` anywhere!

#### 4.3 Header Design
**Add MONEE branding header:**

```tsx
<div className="bg-gradient-to-b from-primary/5 to-transparent border-b border-border p-4 sm:p-6">
  <div className="max-w-2xl mx-auto">
    <h1 className="text-2xl sm:text-3xl font-bold">MONEE</h1>
    <p className="text-sm text-muted-foreground">Your money, finally in one place</p>
  </div>
</div>
```

---

### Phase 5: Remove Old Components (Day 6)

#### 5.1 Deprecate UnifiedItemCard
**File:** `components/ui/unified-item-card.tsx`

**Status:** Mark as deprecated, do NOT delete yet (migration safety)

```tsx
/**
 * @deprecated Use MoneeCard from @/components/custom/monee-cards instead
 * This component will be removed in the next major version.
 */
export function UnifiedItemCard() {
  console.warn('UnifiedItemCard is deprecated. Use MoneeCard instead.');
  // ... keep existing code for now
}
```

#### 5.2 Clean Up Unused Imports
**Files to audit:**
- All list components (expense-list, income-source-list, debt-list, savings-goal-list)
- Dashboard components

**Remove:**
- Unused Badge imports
- Unused icon imports
- Old card component imports

---

### Phase 6: Polish & Testing (Day 7)

#### 6.1 Responsive Testing
**Test on:**
- 320px (iPhone SE)
- 375px (iPhone 12/13)
- 768px (iPad Mini)
- 1024px (iPad Pro)
- 1920px (Desktop)

**Verify:**
- MoneeCard scales properly
- Tab navigation stays sticky
- Dropdown menus work on all devices
- Colors look good in light & dark mode

#### 6.2 Performance Optimization
- Lazy load dashboard components
- Memoize MoneeCard if rendering many items
- Optimize dropdown menu animations

#### 6.3 Accessibility
- Keyboard navigation for dropdown menus
- Screen reader labels for actions
- Focus states for all interactive elements
- Color contrast meets WCAG AA

---

## 📊 Migration Checklist

### Components to Create
- [x] `components/custom/monee-cards.tsx` (MoneeCard, MoneeDashboardMetric, MoneeListHeader)
- [ ] `components/custom/monee-navigation.tsx` (optional: extract tab nav)

### Components to Update
- [ ] `components/expenses/expense-list.tsx` → Use MoneeCard
- [ ] `components/income/income-source-list.tsx` → Use MoneeCard
- [ ] `components/debts/debt-list.tsx` → Use MoneeCard
- [ ] `components/savings/savings-goal-list.tsx` → Use MoneeCard + progress bars
- [ ] `components/dashboard/dashboard-overview.tsx` → Add MoneeDashboardMetric grid
- [ ] `app/home-client.tsx` → Update container width + tab navigation style

### Components to Deprecate (Later)
- [ ] `components/ui/unified-item-card.tsx` (mark deprecated, keep for safety)

### Styling Updates
- [x] `app/globals.css` (already uses good color system)
- [ ] Verify card hover states work
- [ ] Test all 4 type colors in light/dark mode

---

## 🎨 Design Tokens Reference

### Colors by Type
```tsx
const TYPE_COLORS = {
  expense: {
    amount: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/20"
  },
  income: {
    amount: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/20"
  },
  debt: {
    amount: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/20"
  },
  savings: {
    amount: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/20"
  }
};
```

### Typography Scale
```tsx
- Amount: text-lg font-bold (18px, 700)
- Name: text-sm font-medium (14px, 500)
- Category: text-xs in badge (12px)
- Date: text-xs text-muted-foreground (12px)
- Header: text-sm font-semibold (14px, 600)
```

### Spacing
```tsx
- Card padding: p-3 (12px)
- Card gap: space-y-2 (8px between cards)
- Section gap: space-y-6 (24px between sections)
- Grid gap: gap-3 (12px for metrics)
```

---

## 📝 Code Examples

### Complete Expense List Implementation

```tsx
// components/expenses/expense-list.tsx
"use client";

import { MoneeCard, MoneeListHeader } from "@/components/custom/monee-cards";
import { useCurrency } from "@/hooks/use-currency";
import db from "@/lib/db";

export function ExpenseList() {
  const { formatCurrency } = useCurrency();
  const user = db.useUser();
  
  const { data } = db.useQuery({
    profiles: {
      $: { where: { "user.id": user.id } },
      expenses: {
        $: { order: { date: "desc" }, limit: 50 }
      }
    }
  });

  const expenses = data?.profiles?.[0]?.expenses || [];
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4">
      <MoneeListHeader
        title="All Expenses"
        count={expenses.length}
        total={`Total: ${formatCurrency(totalAmount)}`}
      />
      
      <div className="space-y-2">
        {expenses.map((expense) => (
          <MoneeCard
            key={expense.id}
            type="expense"
            amount={expense.amount}
            name={expense.recipient}
            category={expense.category}
            date={formatDate(expense.date)}
            onEdit={() => handleEdit(expense)}
            onDelete={() => handleDelete(expense.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

### Complete Dashboard Overview

```tsx
// components/dashboard/dashboard-overview.tsx (updated)
"use client";

import { MoneeDashboardMetric, MoneeCard, MoneeListHeader } from "@/components/custom/monee-cards";
import { DollarSign, TrendingUp, PieChart, Target } from "lucide-react";

export function DashboardOverview() {
  // ... existing data fetching logic ...

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MoneeDashboardMetric
          icon={DollarSign}
          label="Total Spent"
          value={formatCurrencyCompact(totalExpenses)}
          color="primary"
        />
        <MoneeDashboardMetric
          icon={TrendingUp}
          label="Total Income"
          value={formatCurrencyCompact(totalIncome)}
          color="accent"
        />
        <MoneeDashboardMetric
          icon={PieChart}
          label="Debts Due"
          value={formatCurrencyCompact(debtsThisMonth)}
          color="secondary"
        />
        <MoneeDashboardMetric
          icon={Target}
          label="Savings Progress"
          value={`${savingsProgress}%`}
          color="accent"
        />
      </div>

      {/* Cash Runway */}
      <CashFlowHealthCard />

      {/* Recent Transactions */}
      <div>
        <MoneeListHeader title="Recent Transactions" count={recentExpenses.length} />
        <div className="space-y-2">
          {recentExpenses.slice(0, 5).map((expense) => (
            <MoneeCard
              key={expense.id}
              type="expense"
              amount={expense.amount}
              name={expense.recipient}
              category={expense.category}
              date={formatDate(expense.date)}
              onEdit={() => handleEdit(expense)}
              onDelete={() => handleDelete(expense.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 🚀 Quick Start Commands

```bash
# 1. Create new MoneeCard components
touch components/custom/monee-cards.tsx

# 2. Find all usages of UnifiedItemCard to migrate
grep -r "UnifiedItemCard" components/ --include="*.tsx"

# 3. Find container width restrictions
grep -r "max-w-md" app/ components/ --include="*.tsx"

# 4. Test build after changes
pnpm build

# 5. Run development server
pnpm dev
```

---

## 🎯 Success Metrics

### Before Redesign:
- 4 different card patterns (expenses, income, debts, savings)
- Complex UnifiedItemCard with 200+ lines
- Actions always visible (cluttered)
- Inconsistent spacing and colors

### After Redesign:
- ✅ 1 unified MoneeCard component (~100 lines)
- ✅ Actions hidden by default (clean)
- ✅ Consistent color coding by type
- ✅ 60% less code in list components
- ✅ Professional fintech aesthetic
- ✅ Responsive from 320px to 1920px+

---

## 📚 Resources

### Design Reference
- Example page: `app/page.tsx` (demo implementation)
- Component: `components/custom/monee-cards.tsx`

### Figma/Design Inspiration
- Modern fintech apps: Revolut, Monzo, N26
- Amount-first layouts
- Calm color palettes
- Minimal action patterns

---

**Status:** ✅ Design approved, ready for implementation  
**Priority:** HIGH - Core visual redesign  
**Estimated Time:** 1 week (7 days)  
**Risk:** LOW - Additive changes, old components kept for safety
