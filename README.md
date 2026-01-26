# **MONEE – Personal Cashflow Tracker**
> See Your Money Clearly. Track Income, Expenses, Debts & Wishlists in Seconds.

Stop guessing where your money goes. **MONEE** shows your cashflow at a glance and helps you make smarter spending decisions.

---

## **Why MONEE?**

Most expense trackers just log numbers. MONEE helps you **understand your money behavior**.

- **Instant Cashflow Overview** – See exactly where you stand financially
- **Behavioral Insights** – Learn your spending patterns and habits
- **Automatic Sync** – Debt payments and purchases update your cashflow instantly
- **Simple & Fast** – Track money in seconds, not minutes

---

## **Pricing**

### **💚 $10 One-Time Payment**
Works on any device. No subscription. No hidden fees.

- ✅ Full cashflow tracking
- ✅ Unlimited income & expense entries
- ✅ Debt & wishlist management
- ✅ Behavioral insights & reports
- ✅ Automatic cloud sync
- ✅ 7-day money-back guarantee

**[Get MONEE for $10 →](https://monee.co.ke)**

### **🛠️ Free Self-Hosted Option**
For developers who want to run it themselves.
- **Cost**: Free Forever
- **You Manage**: Hosting, database, updates
- **[Self-Hosting Guide](#self-hosting-guide)**

---

## **How It Works**

### **1. Instant Cashflow Overview**
Combine your monthly income with daily expenses. Understand where your money is going without complex spreadsheets.

- See your current balance at a glance
- Track income vs expenses in real-time
- Get visual health indicators (💚 Good | ⚠️ Watch Out | 🔴 Warning)

### **2. Track Debts Effortlessly**
Keep an eye on what you owe and what's owed to you.

- See how borrowing impacts your cashflow
- Track repayment progress automatically
- Aim for debt-free living with minimal effort

### **3. Plan Your Wishlist & Spending**
Add items you want to buy and track when you treat yourself.

- Write it down first to curb impulse spending
- When you buy something, it automatically updates your cashflow
- Learn when you save and when you splurge

### **4. Understand Your Money Behavior**
Get insights about your financial patterns.

- Do you borrow often? Do you pay on time?
- Do you overspend or plan wisely?
- Make smarter decisions based on real data

---

## **Key Features**

### **💰 Cashflow-First Design**
- Monthly income + daily expenses = clear financial picture
- Real-time balance updates
- Smart health indicators
- Recurring transaction support

### **🤝 Debt Tracking That Makes Sense**
- Track what you owe and what's owed to you
- Automatic cashflow impact when you make payments
- Interest calculations for loans
- Payment history and progress visualization

### **✨ Wishlist with Automatic Expense Creation**
- Add items you want to buy
- One tap to mark as "Got It"
- Automatically creates an expense entry
- Undo if you clicked by mistake

### **📊 Behavioral Insights**
- Spending patterns over time
- Category breakdowns
- Savings rate tracking
- Monthly comparisons

### **⚡ Modern Tech Stack**
- Offline-first architecture
- Real-time sync across devices
- PWA-ready for mobile installation
- Fast, responsive, and reliable

---

## **How It Works**

### **Smart Navigation**

**Daily View**  
See all transactions for the current month, grouped by day with:
- Month navigation (← September 2025 →)
- Filter tabs (Summary, Income, Expenses, Debts, ELTIW)
- Cashflow health summary
- Day-by-day transaction breakdown

**Monthly View**  
Year-over-year summary with:
- All-time financial overview
- Expandable months to see details
- Income, expenses, and net totals per month
- Overall cashflow health metrics

**Stats View**  
Visual insights with:
- Period selector (Weekly/Monthly/Annually)
- Expense breakdown by category
- Percentage and amount for each category
- Stacked bar chart visualization

### **Filter by Type**

Easy tabs let you focus on what matters:
- **Summary**: Cashflow health overview with all transactions
- **Income**: Only income sources
- **Expenses**: Only spending
- **Debts**: Only money owed tracking
- **ELTIW**: Only wishlist items

### **Empty States**

Helpful empty states guide you when starting:
- Contextual emojis and messages
- Clear next steps
- Encourages taking action

---

## **Tech Stack**

- **Frontend**: Next.js 15 (App Router)
- **Database**: InstantDB (real-time, zero-backend)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Language**: TypeScript
- **Deployment**: Vercel
- **PWA**: Offline-first with service workers

---

## **Self-Hosting Guide**

### Prerequisites
- Node.js 18+ installed
- npm or pnpm package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/farajabien/monee.git
cd monee

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your InstantDB app ID to .env.local

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

```env
NEXT_PUBLIC_INSTANT_APP_ID=your_instant_app_id_here
```

Get your InstantDB App ID from [instantdb.com](https://instantdb.com)

---

## **Usage**

1. **Create an Account**: Sign up to start tracking
2. **Add Your First Transaction**: Click the **+** button
3. **Choose Type**: Income, Expense, Debt, or Wishlist
4. **Track Daily**: Add transactions as they happen
5. **Monitor Health**: Check your cashflow summary anytime

### Adding Transactions

**Income**
- Source name (e.g., "Salary", "Freelance")
- Amount
- Date
- Optional: Recurring status and frequency

**Expenses**
- Recipient/Merchant name
- Amount
- Category
- Date
- Optional: Notes

**Debts**
- Person's name
- Amount
- Direction (You owe / They owe you)
- Due date (optional)
- Optional: Notes

**Wishlist**
- Item name
- Target amount (optional)
- Status (Want / Got)

---

## **The Automatic Sync Magic**

What makes MONEE different? Everything connects to your cashflow automatically:

- **Pay off a debt** → Creates an expense entry → Updates your cashflow
- **Mark wishlist item as "Got"** → Creates an expense entry → Updates your cashflow
- **Add recurring income** → Auto-renews monthly → Keeps cashflow accurate

You track once, everything updates automatically.

---

## **Cashflow Health Indicator**

Get instant visual feedback on your financial health:

- **💚 Good**: Savings rate ≥ 20% (You're doing great!)
- **⚠️ Watch Out**: Positive cashflow but could save more
- **🔴 Warning**: Spending exceeds income (Time to adjust)

Updates in real-time as you add transactions.

---

## **What Users Are Saying**

> "Finally, an app that shows me where my money actually goes. The debt tracking changed my life."
> — *Sarah K., Nairobi*

> "I love how paying off a debt automatically updates my expenses. Everything just works together."
> — *James M., Developer*

> "The wishlist feature stopped my impulse buying. I think twice before spending now."
> — *Mercy A., Student*

---

## **Roadmap**

We're constantly improving MONEE based on user feedback:

### **Coming Soon**
- 📱 M-PESA SMS auto-import (Kenya)
- 📊 Advanced budget planning
- 📁 Export to CSV/PDF
- 🔔 Payment reminders
- 📈 Trend predictions

---

## **Contributing**

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## **License**

This project is licensed under the MIT License - see the LICENSE file for details.

---

## **Contact**

**Email:** hello@monee.co.ke  
**Website:** [monee.co.ke](https://monee.co.ke)

---

## **Acknowledgments**

- Built with [InstantDB](https://instantdb.com) for real-time data
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
- Inspired by Money Manager app

---

**Made with 💚 in Kenya**
