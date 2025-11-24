# MONEE - What's Remaining

## ✅ COMPLETED FEATURES

### Core Functionality
- ✅ **Authentication** - InstantDB auth with email/magic link
- ✅ **User Profiles** - Auto-created on first login
- ✅ **PWA Setup** - Service worker, manifest, offline capability
- ✅ **Responsive Design** - Mobile-first with desktop support

### Marketing & Landing (NEW)
- ✅ **Landing Page** - Full feature showcase at `/landing`
- ✅ **Free Analyzer Tool** - No-login transaction analyzer at `/analyzer`
- ✅ **Terms of Service** - Comprehensive legal page at `/terms`
- ✅ **Privacy Policy** - Detailed privacy page at `/privacy`
- ✅ **Professional Branding** - Money-bag logo across all pages
- ✅ **Footer Links** - Terms, Privacy, Support links on all marketing pages
- ✅ **Pricing Strategy** - Ksh 999 vs Ksh 1,500 comparison
- ✅ **Feature Comparison Table** - MONEE vs Excel templates
- ✅ **Route Structure** - (marketing) and (app) route groups

### Transaction Management
- ✅ **M-Pesa Parser** - Supports 6+ message formats including:
  - Standard sent/paid messages
  - M-Shwari transfers
  - Received money
  - Buy goods
  - Withdrawals
  - Deposits
- ✅ **Multi-Transaction Input** - Paste multiple messages at once
- ✅ **Auto-Categorization** - Smart recipient matching with fuzzy logic
- ✅ **Manual Categorization** - Select default category or override
- ✅ **Transaction List** - View, edit, delete transactions
- ✅ **Multi-Day Support** - Handles transactions from different dates
- ✅ **ScrollArea for Input** - 300px height with scrolling for long messages
- ✅ **Category Selector** - Assign categories during analysis
- ✅ **Auto-Dismiss Alerts** - Success messages disappear after 5 seconds
- ✅ **Duplicate Amount Badges** - Shows "3× Ksh 500" for repeated amounts

### Categories
- ✅ **System Categories** - 6 built-in: Food, Transport, Housing, Utilities, Savings, Misc
- ✅ **Custom Categories** - Create unlimited custom categories
- ✅ **Category Colors** - 8 color options for visual distinction
- ✅ **Active/Inactive Toggle** - Enable/disable categories
- ✅ **No Duplicates** - Fixed duplicate category display issue

### Daily Check-In
- ✅ **Daily Check-In Card** - Track if you've recorded today's spending
- ✅ **Batch Transaction Entry** - Paste all daily messages at once
- ✅ **Check-In Status** - Shows completed/pending status
- ✅ **Transaction Count** - Displays number of transactions logged

### Income Tracking
- ✅ **Multiple Income Sources** - Add salary, freelance, side hustles, etc.
- ✅ **Payday Tracking** - Set payday day and optional month
- ✅ **Active/Inactive Toggle** - Enable/disable income sources
- ✅ **Income Summary** - View total monthly income
- ✅ **Monthly Income vs Expenses** - Compare earnings to spending

### Debt Management
- ✅ **Debt List** - Track all debts with names and amounts
- ✅ **Monthly Payment Rules** - Set payment amount and due day
- ✅ **Interest Tracking** - Optional interest rate support
- ✅ **Push Months Plan** - Track months paying interest only
- ✅ **Payment History** - Record all debt payments
- ✅ **Payment Types** - Interest only, principal, or both
- ✅ **Debt Progress** - Visual progress bars and timeline
- ✅ **Total Debt Summary** - Overview of all debts
- ✅ **Auto-Expense Recording** - Debt payments automatically create expense transactions
- ✅ **Quick Push Expense Tracking** - Interest-only quick push also records expenses

### ELTIW (Every Little Thing I Want)
- ✅ **Wishlist** - Track things you want to buy
- ✅ **Amount & Reason** - Set price and optional reason
- ✅ **Link Support** - Add product links
- ✅ **Deadline Tracking** - Optional deadline dates
- ✅ **Got It Celebration** - Mark items as purchased with date
- ✅ **Pending/Completed Views** - Filter by status

### Budgets
- ✅ **Monthly Budget** - Set overall monthly budget
- ✅ **Category Budgets** - Set budget per category
- ✅ **Budget Progress** - Visual progress bars
- ✅ **Over Budget Warnings** - Highlights when over budget

### Insights
- ✅ **Monthly Summary** - Comprehensive financial overview
- ✅ **Income vs Expenses** - Clear balance calculation
- ✅ **Category Breakdown** - Spending by category with counts
- ✅ **Top Recipients** - See who you pay most (fuzzy matched)
- ✅ **Budget Progress** - Visual indicators for all budgets
- ✅ **Debt Payments Included** - Shows total expenses including debts

### Smart Features
- ✅ **Recipient Matching** - Fuzzy logic handles:
  - Case insensitivity
  - Phone number removal
  - Partial name matches
  - Extra space handling
- ✅ **Auto-Category Assignment** - Remembers categories for recipients
- ✅ **Multi-Date Preview** - Groups transactions by date in preview
- ✅ **Transaction Validation** - Robust error handling for bad formats

### Free Analyzer Tool (NEW)
- ✅ **No Login Required** - Instant access without account
- ✅ **100% Offline** - IndexedDB storage, no server calls
- ✅ **Bulk Analysis** - Paste 100+ messages at once
- ✅ **Category Assignment** - 11 categories to choose from
- ✅ **Smart Grouping** - By recipient with amount badges
- ✅ **Date Grouping** - Organized by transaction date
- ✅ **Export Features** - JSON and CSV export
- ✅ **Clear All Data** - Delete all stored transactions
- ✅ **Statistics Summary** - Total spent, transaction count, recipient count
- ✅ **Progress Bars** - Visual spending breakdown
- ✅ **ScrollArea Input** - Handles very long message lists

### Payment Integration (NEW)
- ✅ **Paystack Integration** - M-Pesa, cards, bank transfer support
- ✅ **Paywall Dialog** - Beautiful payment modal with feature list
- ✅ **One-Time Payment** - Ksh 999 lifetime access
- ✅ **Dynamic Import** - Paystack loaded client-side to avoid SSR issues
- ✅ **Payment Fields in Schema** - hasPaid, paymentDate, paystackReference
- ✅ **Webhook Endpoint** - Server-side verification at /api/webhooks/paystack
- ✅ **Signature Verification** - HMAC-SHA512 security
- ✅ **Duplicate Detection** - Handles retry webhooks and duplicate payments
- ✅ **InstantDB Admin** - Updates user status via webhook
- ✅ **Webhook Documentation** - Complete setup guide in docs/

---

## ❌ MISSING FEATURES (From README)

### Critical Missing Features

#### 1. **M-Pesa Statement Upload - ENHANCED** 🔴 HIGH PRIORITY
**Current Status:**
- ✅ PDF upload working in free analyzer
- ✅ PDF text extraction with pdfjs-dist
- ✅ Statement parser handles tabular format
- ✅ Supports Receipt No, Completion Time, Details, Status, Paid in, Withdrawn, Balance

**NEW Discovery - Better UX:**
- Users can generate statements directly in M-Pesa app (no password!)
- Process: Open app → "SEE ALL" → "Export Statements" → Select range → Generate
- Max 6 months per statement (need 2 for full year)
- Use case: Daily routine (last 7 days) OR catch-up mode (missing weeks)

**What's Needed:**
- [ ] **Multi-PDF upload support** - Handle 2+ statements at once
- [ ] **Duplicate detection** - Merge statements without duplicates (by receipt #)
- [ ] **Date range analysis** - Show coverage, detect gaps
- [ ] **Progress feedback** - "Processing 2 of 3 statements..."
- [ ] **Smart recommendations** - "For full year, upload Jan-Jun + Jul-Dec"
- [ ] **Gap warnings** - "Missing transactions between Jun 30 - Jul 1"
- [ ] **Incremental updates** - Add new statement to existing data
- [ ] **How-to guide section** - Step-by-step with screenshots

**Files to Create/Update:**
- `/docs/mpesa-statement-guide.md` - ✅ Created
- `/docs/images/mpesa-see-all-button.jpg` - Need screenshot
- `/docs/images/mpesa-generate-statements.jpg` - Need screenshot
- `/lib/statement-parser.ts` - ✅ Exists, needs multi-file support
- `/components/transactions/multi-statement-upload.tsx` - New component
- Update free analyzer page with multi-upload UI

---

#### 2. **Push Notifications & Daily Reminders** 🔴 HIGH PRIORITY
**What's Missing:**
- No push notification setup
- No evening reminder at specific time
- Service worker exists but no notification scheduling

**What's Needed:**
- [ ] Push notification permissions request
- [ ] Daily reminder scheduler (evening time, e.g., 7 PM)
- [ ] Notification settings page
- [ ] User preference for reminder time
- [ ] "Did you record today's spending?" notification
- [ ] Firebase Cloud Messaging or Web Push API integration

**Files to Create/Update:**
- `/lib/notifications.ts` - Notification helper
- `/components/settings/notification-settings.tsx`
- Update `/public/sw.js` with scheduling
- Add notification permission prompt to onboarding

**Tech Stack Decision Needed:**
- Firebase Cloud Messaging (full backend)
- OR Web Push API with custom server (web-push already installed!)
- OR Third-party service (OneSignal, Pusher, etc.)

---

#### 3. **User Settings & Preferences** 🟡 MEDIUM PRIORITY
**What's Missing:**
- No settings page
- No way to edit profile handle
- No way to set notification preferences
- No theme settings (dark/light mode)
- No data export/import

**What's Needed:**
- [ ] Settings page/modal
- [ ] Profile editing (handle, email)
- [ ] Notification preferences
- [ ] Theme toggle (next-themes already installed!)
- [ ] Monthly budget editing
- [ ] Data export (JSON/CSV)
- [ ] Account deletion option

**Files to Create:**
- `/components/settings/settings-dialog.tsx`
- `/components/settings/profile-settings.tsx`
- `/components/settings/notification-settings.tsx`
- `/components/settings/theme-toggle.tsx`
- `/components/settings/data-export.tsx`

---

#### 4. **Onboarding Flow** 🟡 MEDIUM PRIORITY
**What's Missing:**
- No first-time user guide
- No tutorial/walkthrough
- Users dropped into app without context

**What's Needed:**
- [ ] Welcome screen with MONEE intro
- [ ] Step-by-step onboarding wizard:
  1. Set monthly budget
  2. Activate default categories
  3. Add first income source
  4. Try pasting first transaction
  5. Set notification preferences
- [ ] Skip/complete tracking
- [ ] "Getting Started" tips

**Files to Create:**
- `/components/onboarding/onboarding-wizard.tsx`
- `/components/onboarding/welcome-screen.tsx`
- `/components/onboarding/onboarding-step.tsx`
- Add flag to user profile for onboarding completion

---

#### 5. **Data Visualization Improvements** 🟡 MEDIUM PRIORITY
**What's Missing:**
- No charts/graphs (recharts installed but unused)
- Monthly summary is text-based
- No spending trends over time
- No week-by-week breakdown

**What's Needed:**
- [ ] Spending trends chart (line/bar chart)
- [ ] Category breakdown pie/donut chart
- [ ] Week-by-week comparison
- [ ] Month-over-month comparison
- [ ] Income vs Expenses chart
- [ ] Debt payoff projection chart

**Files to Update:**
- `/components/insights/monthly-summary.tsx` - Add charts
- `/components/insights/spending-trends.tsx` - New component
- `/components/insights/category-breakdown-chart.tsx` - New component

---

### Nice-to-Have Features (Future Enhancements)

#### 6. **Transaction Search & Filters** 🟢 LOW PRIORITY
- [ ] Search transactions by recipient, amount, date
- [ ] Filter by category, date range
- [ ] Sort options (date, amount, category)

#### 7. **Bulk Transaction Actions** 🟢 LOW PRIORITY
- [ ] Select multiple transactions
- [ ] Bulk categorize
- [ ] Bulk delete
- [ ] Bulk edit

#### 8. **Recurring Transactions** 🟢 LOW PRIORITY
- [ ] Mark transactions as recurring (rent, subscriptions)
- [ ] Auto-categorize recurring transactions
- [ ] Recurring transaction reminders

#### 9. **Export & Sharing** 🟢 LOW PRIORITY
- [ ] Export transactions to CSV
- [ ] Export monthly report PDF
- [ ] Share monthly summary screenshot

#### 10. **Advanced M-Pesa Parsing** 🟢 LOW PRIORITY
- [ ] Support for Fuliza messages
- [ ] Support for Lipa na M-Pesa messages
- [ ] Support for M-Pesa Global messages
- [ ] Better error recovery for malformed messages

---

## 🎨 DESIGN UPDATES NEEDED

### Safaricom Brand Colors
- [ ] Update primary color to Safaricom green (#00A65E)
- [ ] Add red accent for CTAs
- [ ] Update `globals.css` with new color tokens
- [ ] Maintain dark mode compatibility
- [ ] Test across all pages (landing, analyzer, dashboard)

**Proposed Color Scheme:**
```css
--safaricom-green: oklch(0.65 0.15 155);
--safaricom-green-dark: oklch(0.45 0.12 155);
--accent-red: oklch(0.577 0.245 27.325);
--primary: var(--safaricom-green);
```

---

## 🔧 TECHNICAL IMPROVEMENTS NEEDED

### Performance
- [ ] Implement pagination for transaction list (currently limited to 50)
- [ ] Add infinite scroll or "Load More" button
- [ ] Optimize queries with indexes
- [ ] Add loading skeletons instead of "Loading..."

### Error Handling
- [ ] Replace `alert()` with toast notifications (sonner already installed!)
- [ ] Better error messages for users
- [ ] Error boundary components
- [ ] Retry logic for failed operations

### User Experience
- [ ] Add loading states to all buttons
- [ ] Add optimistic updates for better perceived performance
- [ ] Add confirmation dialogs for destructive actions
- [ ] Add success messages after operations
- [ ] Add keyboard shortcuts for power users

### Security & Data
- [ ] Add data backup/restore functionality
- [ ] Add transaction edit history/audit log
- [ ] Add profile picture upload
- [ ] Add two-factor authentication option

### Testing
- [ ] Add unit tests for parsers
- [ ] Add integration tests for critical flows
- [ ] Add E2E tests for main user journeys
- [ ] Add visual regression tests

---

## 🚀 RECOMMENDED IMPLEMENTATION ORDER

### Phase 1: Core Missing Features (1-2 weeks)
1. **M-Pesa Statement Upload** - Users need this for onboarding
2. **Settings Page** - Users need to customize experience
3. **Toast Notifications** - Replace alerts, improve UX
4. **Theme Toggle** - Easy win, better UX

### Phase 2: Engagement Features (1 week)
5. **Push Notifications** - Critical for daily habit formation
6. **Onboarding Flow** - Help new users get started
7. **Data Visualization** - Make insights more engaging

### Phase 3: Polish & Performance (1 week)
8. **Transaction Search & Filters** - As transaction list grows
9. **Loading States & Optimistic Updates** - Better perceived performance
10. **Error Handling Improvements** - Professional feel

### Phase 4: Advanced Features (Ongoing)
11. **Recurring Transactions**
12. **Bulk Actions**
13. **Export & Sharing**
14. **Advanced Parsing**

---

## 📝 NOTES

### What's Working Really Well
- InstantDB realtime sync is fast and reliable
- M-Pesa parser handles most common formats including M-Shwari
- Recipient matching with fuzzy logic is smart and accurate
- Category system is flexible and user-friendly
- Debt management is comprehensive
- ELTIW feature is unique and emotional
- **NEW: Landing page showcases features professionally**
- **NEW: Free analyzer is excellent lead magnet (no login, offline)**
- **NEW: Terms/Privacy pages build trust**
- **NEW: Money-bag branding is clean and professional**

### What Needs Immediate Attention
- **Payment integration** - CRITICAL for monetization (Ksh 999)
- **Analytics** - Track conversions from analyzer to full app
- **Push notifications** - Core to the "evening ritual" promise
- **Settings page** - Users have no control over preferences
- **Onboarding** - New users need guided first-time experience
- **SEO & Open Graph** - For social sharing

### Technical Debt
- Many `alert()` calls should be replaced with toasts
- No error boundaries
- No loading skeletons
- No pagination for growing datasets
- Service worker is basic, needs notification scheduling

### Database Schema Looks Good
- All entities are properly defined
- Relationships are correct
- Indexes are in place for common queries

---

## 🎯 LAUNCH READINESS

**Current Status: 85% Complete** ⬆️ (was 75%)

### ✅ COMPLETED FOR LAUNCH:
1. ✅ Landing page with pricing
2. ✅ Free analyzer tool (lead magnet)
3. ✅ Terms of Service
4. ✅ Privacy Policy
5. ✅ Professional branding
6. ✅ Route structure (marketing vs app)
7. ✅ Enhanced login UI
8. ✅ Footer with legal links
9. ✅ **Payment integration (Paystack - M-Pesa, cards, bank)**
10. ✅ **Server-side webhook verification**
11. ✅ **Automatic debt expense tracking**

### Blocking Issues for Launch:
1. ❌ Production Paystack keys (need to switch from test)
2. ❌ Production webhook URL configuration
3. ❌ Push notifications (optional for MVP)
4. ❌ Onboarding flow (can launch with basic version)
5. ❌ Settings page (can launch with basic version)

### Can Launch Without (But Should Add Soon):
- Charts/graphs
- Transaction search
- Bulk actions
- Advanced parsing

### MVP Launch Checklist:
- [ ] Implement statement upload (optional for MVP)
- [ ] Add basic onboarding (3-step wizard)
- [ ] Create settings page (profile + notifications)
- [ ] Set up push notifications (optional for MVP)
- [ ] Replace alerts with toasts
- [ ] Add loading states to buttons
- [ ] Test on multiple devices
- ✅ Create landing page
- [ ] Set up analytics (GA4, Plausible, or PostHog)
- ✅ Add privacy policy & terms
- ✅ **Integrate payment (Ksh 999 via Paystack)**
- ✅ **Set up payment webhook with duplicate detection**
- [ ] Switch to production Paystack keys
- [ ] Configure production webhook URL
- [ ] Test payment flow with Paystack test cards
- [ ] Add SEO meta tags & Open Graph
- [ ] Test entire user flow: landing → analyzer → login → payment → dashboard
- [ ] Soft launch to small group for feedback

---

## 💡 QUICK WINS (Can Implement in <1 Hour Each)

1. **Toast Notifications** - Replace all `alert()` with Sonner toasts
2. **Theme Toggle** - Add dark/light mode switch (next-themes installed)
3. **Loading States** - Add `disabled` + loading text to all buttons
4. **Profile Handle Edit** - Add edit button in dashboard header
5. **Transaction Count** - Show total transactions in header
6. **Empty States** - Better empty state messages with CTAs
7. **Keyboard Shortcuts** - Add Cmd/Ctrl + K for quick add transaction
8. **Auto-focus** - Auto-focus text inputs when opening dialogs
9. **Clear Button** - Add clear button to transaction textarea
10. **Transaction Stats** - Show total spent today/week/month in header

---

**Last Updated:** November 21, 2025 (Updated with landing page, analyzer, terms/privacy)
