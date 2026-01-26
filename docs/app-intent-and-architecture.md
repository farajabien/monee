# Monee: App Intent & Architecture

> **Living Document** - This file serves as the source of truth for the app's purpose and structure, guiding future development and design decisions.

## 1. Core Intent & Philosophy

**Monee** is a **Personal Cashflow Tracker** that helps people see their money clearly and understand their spending behavior.

### The Cashflow-First Philosophy

Most expense trackers are glorified spreadsheets. Monee is different:

**Core Principle:** Everything flows through your cashflow.

- **Income** flows IN → Increases your cashflow
- **Expenses** flow OUT → Decreases your cashflow
- **Debts** affect cashflow when you borrow or repay
- **Wishlist** purchases automatically become expenses

### What Makes Monee an "APP" (Not Just a Form)

The user wants an **Application**, not a data entry form. This means:

*   **Clarity:** Your financial position is visible at a glance - no digging through tabs
*   **Speed:** Recording a transaction takes seconds, not minutes
*   **Automatic:** Debt payments and wishlist purchases auto-update your cashflow
*   **Behavioral:** It shows not just *what* you spent, but *why* and *how often*
*   **Engagement:** Instant visual feedback (💚 Good | ⚠️ Watch | 🔴 Warning)

---

## 2. The Module Hierarchy (Cashflow-First)

### Layer 1: CASHFLOW (The Foundation) 💰

**Income + Expenses = Your Cashflow**

*   **Primary Purpose:** Show financial position at a glance
*   **Key Metrics:**
    *   Current balance (Income - Expenses this month)
    *   Health indicator (💚 Good | ⚠️ Watch | 🔴 Warning)
    *   Savings rate (% of income saved)
*   **Key Features:**
    *   Add income sources (salary, freelance, etc.)
    *   Add expenses (daily spending)
    *   Recurring transactions (auto-renew monthly)
    *   Category tracking

**Why This Matters:** Without cashflow clarity, everything else is noise.

---

### Layer 2: DEBTS (Cashflow Modifiers) 🤝

**How borrowing and repayment affect your cashflow**

*   **Primary Purpose:** Track money obligations and their cashflow impact
*   **Key Insight:** Debts aren't separate—they affect your available cash
*   **Types:**
    1.  **You Owe (I Owe):** Shows as a future expense obligation
    2.  **They Owe You (Owed to Me):** Shows as expected future income
*   **The Magic:**
    *   When you make a debt payment → Auto-creates an expense → Updates cashflow
    *   Partial payments supported (`currentBalance` vs `originalAmount`)
    *   Interest calculations for loans
*   **Visual Design:**
    *   Red for debts you owe (danger/liability)
    *   Green for money owed to you (asset/income)

**Why This Matters:** Shows if borrowing is helping or hurting your financial health.

---

### Layer 3: WISHLIST (Behavioral Insights) ✨

**Understanding your spending psychology**

*   **Primary Purpose:** Curb impulse spending + track when you treat yourself
*   **Key Insight:** "Write it down first" creates a delay that prevents impulsive purchases
*   **The Magic:**
    *   Add items you want to buy
    *   When you click "Got It" → Auto-creates an expense → Updates cashflow
    *   Undo feature if clicked by mistake
*   **Behavioral Patterns Revealed:**
    *   How often do you treat yourself?
    *   Do you plan purchases or impulse buy?
    *   What categories do you splurge on?

**Why This Matters:** Helps users understand *why* they spend, not just *what* they spend on.

---

## 3. Data Architecture (Schema Overview)

The app uses **InstantDB** for real-time syncing and offline-first capabilities.

### Core Entities
| Entity | Description | Key Fields |
| :--- | :--- | :--- |
| `profiles` | User settings & identity. | `currency`, `onboardingCompleted` |
| `expenses` | Money Out. | `amount`, `category`, `recipient`, `isRecurring` |
| `income` | Money In. | `amount`, `source`, `frequency` |
| `debts` | Loans & Lendings. | `direction` ("I_OWE"\|"THEY_OWE"), `interestRate`, `dueDate`, `isPaidOff` |
| `wishlist` | Planned purchases. | `status` ("want"\|"got"), `link`, `gotDate`, `expenseId` (link to resulting expense) |

### Relationships
*   **Profile-Scoped:** All data is linked to a `profile`. This allows for future multi-profile support (e.g., Personal vs Business profiles) or shared household profiles.
*   **Expense <-> Wishlist:** When a wishlist item is "Got", it can optionally link to an `expense` record to avoid double entry.
*   **Debt <-> Payments:** (Future Refactor) Complex debts may need a dedicated `debt_payments` ledger to track history of partial repayments.

---

## 4. Primary User Flows

### Onboarding
1.  **Privacy First:** No email required initially (Guest mode).
2.  **Currency Setup:** Vital for the "Feel" of the app (KSh, $, £).

### The "Today" Dashboard (Home)
This is the command center.
*   **Header:** Cashflow Health Indicator (Emoji based on savings rate).
*   **Action Fab (+):** The primary interaction point. Opens the `AddSheet`.
*   **Tabs:** precise filtering between the 4 modules.
    *   *Logic Fix:* Filters must persist even if the list is empty (to allow switching views).

### The "Add" Experience (`AddSheet`)
*   **Unified Interface:** One button to add anything.
*   **Contextual Fields:**
    *   *Expense:* Needs Category.
    *   *Debt:* Needs Person + Due Date.
    *   *Wishlist:* Needs Link.

---

## 5. Technical Constraints & Choices
*   **Offline-First:** Critical for financial apps. Users enter data at the POS terminal or in a matatu.
*   **No Backend Logic:** Validations and "Business Logic" (like checking if a loan is overdue) must happen on the Client.
