# **MONEE – Track Your Money with Clarity**

> Simple money tracking. Know your cashflow health at a glance.

**MONEE** is your personal money tracker built for real life. Track income, expenses, debts, and wishlist items—all in one clean, intuitive app.

---

## **Features**

### **💰 Income & Expense Tracking**
- Track all your income sources (salary, side hustles, etc.)
- Categorize and monitor expenses
- See daily, weekly, and monthly breakdowns

### **📊 Cashflow Health Monitoring**
- Instant visual health indicators (💚 Excellent | ⚠️ Good | 🔴 Warning)
- Real-time savings rate calculation
- Net cashflow at a glance
- Smart status messages based on your financial health

### **🤝 Debt Management**
- Track money you owe and money owed to you
- Color-coded labels (red for debts, green for receivables)
- Monitor balances and payment history
- See who owes what at a glance

### **✨ Wishlist (ELLIW - Everything I Like I Want)**
- Track items you're saving for
- Set target amounts
- Mark items as "got" when purchased
- Stay motivated toward your goals

### **📈 Visual Stats & Insights**
- Stats view with period selection (Weekly/Monthly/Annually)
- Expense breakdown by category with percentages
- Stacked bar charts for visualization
- Interactive period navigation

### **🌍 Multi-Currency Support**
- Support for 150+ currencies
- Set your preferred currency
- All amounts automatically formatted
- Currency-aware calculations

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
- Filter tabs (Summary, Income, Expenses, Debts, ELLIW)
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
- **ELLIW**: Only wishlist items

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

## **Getting Started**

### Prerequisites
- Node.js 18+ installed
- npm or pnpm package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/monee.git
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
