# **MONEE – Open Source Personal Finance Tracker**
> Simple, powerful money tracking. Open Source & Forever Free to Self-Host.

**MONEE** is your personal money tracker built for real life. Track income, expenses, debts, and wishlist items—all in one clean, intuitive app.

---

## **Cloud vs Self-Hosted**

MONEE is proudly **Open Source**. You have two ways to use it:

### **1. ☁️ Managed Cloud (Recommended)**
The easiest way to get started. We handle the hosting, backups, updates, and database management for you.
- **Cost**: **KSh 999 Lifetime License** (One-time payment)
- **Includes**: 7-day free trial, priority support, automatic updates, zero setup.
- **[Get Started with Cloud Version](https://monee.co.ke)**

### **2. 🛠️ Self-Hosted**
For developers and DIY enthusiasts. Host it yourself for free on your own infrastructure.
- **Cost**: **Free Forever**
- **You Manage**: Vercel deployment, InstantDB instance, updates, and maintenance.
- **[Jump to Self-Hosting Guide](#self-hosting-guide)**

---

---

## **Features**

### **💰 Income & Expense Tracking**
- Track all your income sources (salary, side hustles, etc.)
- **Smart Recurring Transactions**: Set monthly bills (Rent, subscriptions) once, and they auto-renew.
- Categorize and monitor expenses.

### **📊 Cashflow Health Monitoring**
- Instant visual health indicators (💚 Excellent | ⚠️ Good | 🔴 Warning)
- Real-time savings rate calculation
- Net cashflow at a glance

### **🤝 Advanced Debt Management**
- Track money you owe and money owed to you
- **Tabbed Interface**: Separate views for Active and Paid items.
- Color-coded labels (red for debts, green for receivables)
- Mark debts as "Paid Off" to archive them.

### **✨ Wishlist 2.0 (ELTIW - Every lil thing I Want)**
- Track items you're saving for with links and notes.
- **Smart Conversion**: One tap "Got It" button marks item as purchased AND auto-creates an expense.
- **Undo / Revert**: Accidentally clicked Got It? Revert restores the wish and auto-deletes the expense.
- Unified view for all wants and fulfilled wishes.

### **📈 Visual Stats & Insights**
- Stats view with period selection (Weekly/Monthly/Annually)
- Expense breakdown by category with percentages
- Stacked bar charts for visualization

### **🌍 Multi-Currency Support**
- Support for 150+ currencies
- Set your preferred currency, affects all formatting instantly.

### **🎨 Clean, Modern Design**
- Safaricom Green branding 🟢
- Full dark mode support 🌙
- PWA-ready for mobile installation 📱
- Responsive on all devices 💻📱

### **⚡ Real-Time Updates**
- Powered by InstantDB for instant sync
- Offline-first architecture
- Cloud sync across all devices
- No backend configuration needed

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

## **Cashflow Health Indicator**

MONEE analyzes your financial data and gives you instant feedback:

- **💚 Excellent**: Savings rate ≥ 20% (Strong financial health)
- **⚠️ Good**: Net cashflow positive but could save more
- **🔴 Warning**: Spending exceeds income

The indicator updates in real-time as you add transactions.

---

## **Roadmap**

### **Coming Soon**
- 📱 M-PESA integration for auto-import (Kenya)
- 📊 Budget planning tools
- 📁 Export to CSV/PDF
- 🔔 Push notifications for reminders
- 📈 Advanced analytics and trends

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
