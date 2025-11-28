import type { YearStats } from "@/types/year-analysis";

/**
 * Export year statistics to CSV format
 */
export function exportToCSV(
  yearStats: YearStats,
  formatAmount: (amount: number) => string
): void {
  const csvRows: string[] = [];

  // Header
  csvRows.push("M-Pesa Year Analysis Report");
  csvRows.push(`Year: ${yearStats.year}`);
  csvRows.push(`Generated: ${new Date().toLocaleString("en-KE")}`);
  csvRows.push("");

  // Summary Stats
  csvRows.push("SUMMARY STATISTICS");
  csvRows.push("Metric,Value");
  csvRows.push(`Total Spent,${formatAmount(yearStats.totalSpent)}`);
  csvRows.push(`Total Expenses,${yearStats.totalExpenses}`);
  csvRows.push(`Average Expense,${formatAmount(yearStats.avgExpense)}`);
  csvRows.push(`Unique Recipients,${yearStats.totalRecipients}`);
  csvRows.push("");

  // Top Recipient
  csvRows.push("TOP RECIPIENT");
  csvRows.push("Name,Amount,Count");
  csvRows.push(
    `${yearStats.topRecipient.name},${formatAmount(yearStats.topRecipient.amount)},${yearStats.topRecipient.count}`
  );
  csvRows.push("");

  // Monthly Spending
  csvRows.push("MONTHLY SPENDING");
  csvRows.push("Month,Amount");
  yearStats.monthlySpending.forEach((month) => {
    csvRows.push(`${month.month},${formatAmount(month.amount)}`);
  });
  csvRows.push("");

  // Categories
  csvRows.push("SPENDING BY CATEGORY");
  csvRows.push("Category,Amount,Count,Percentage");
  yearStats.categories.forEach((cat) => {
    const percentage = ((cat.amount / yearStats.totalSpent) * 100).toFixed(1);
    csvRows.push(
      `${cat.category},${formatAmount(cat.amount)},${cat.count},${percentage}%`
    );
  });
  csvRows.push("");

  // Period
  csvRows.push("ANALYSIS PERIOD");
  csvRows.push(
    `First Expense,${yearStats.firstExpense.toLocaleDateString("en-KE")}`
  );
  csvRows.push(
    `Last Expense,${yearStats.lastExpense.toLocaleDateString("en-KE")}`
  );

  // Achievements (if available)
  if (yearStats.achievements) {
    csvRows.push("");
    csvRows.push("ACHIEVEMENTS");
    csvRows.push(
      `Categories Tracked,${yearStats.achievements.totalCategories}`
    );
    csvRows.push(`Budgets Created,${yearStats.achievements.totalBudgets}`);
    csvRows.push(`Debts Cleared,${yearStats.achievements.debtsCleared}`);
  }

  // Create CSV content
  const csvContent = csvRows.join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `mpesa-year-${yearStats.year}-analysis.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate printable HTML report for PDF export
 * Opens print dialog with pre-formatted report
 */
export function exportToPDF(
  yearStats: YearStats,
  formatAmount: (amount: number) => string
): void {
  // Create a new window for printing
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to export PDF");
    return;
  }

  // Generate HTML content
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>M-Pesa Year ${yearStats.year} Analysis</title>
  <style>
    @media print {
      @page { margin: 1cm; }
    }
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1 {
      color: #16a34a;
      border-bottom: 3px solid #16a34a;
      padding-bottom: 10px;
    }
    h2 {
      color: #15803d;
      margin-top: 30px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .stat-card {
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #16a34a;
    }
    .stat-label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 5px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #111827;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      text-align: left;
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f3f4f6;
      font-weight: 600;
    }
    .highlight {
      background: #fef3c7;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>🇰🇪 M-Pesa Year ${yearStats.year} Analysis</h1>
  <p style="color: #6b7280;">Generated on ${new Date().toLocaleString("en-KE")}</p>

  <h2>Summary Statistics</h2>
  <div class="summary-grid">
    <div class="stat-card">
      <div class="stat-label">Total Spent</div>
      <div class="stat-value">${formatAmount(yearStats.totalSpent)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Expenses</div>
      <div class="stat-value">${yearStats.totalExpenses}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Average Expense</div>
      <div class="stat-value">${formatAmount(yearStats.avgExpense)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Unique Recipients</div>
      <div class="stat-value">${yearStats.totalRecipients}</div>
    </div>
  </div>

  <div class="highlight">
    <h3 style="margin-top:0;">🏆 Top Recipient: ${yearStats.topRecipient.name}</h3>
    <p style="font-size:18px;margin:5px 0;"><strong>${formatAmount(yearStats.topRecipient.amount)}</strong> across ${yearStats.topRecipient.count} expenses</p>
  </div>

  <h2>Monthly Spending Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Month</th>
        <th>Amount</th>
        <th>% of Total</th>
      </tr>
    </thead>
    <tbody>
      ${yearStats.monthlySpending
        .map(
          (month) => `
        <tr>
          <td>${month.month}</td>
          <td>${formatAmount(month.amount)}</td>
          <td>${((month.amount / yearStats.totalSpent) * 100).toFixed(1)}%</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="highlight">
    <h3 style="margin-top:0;">📅 Most Expensive Month: ${yearStats.mostExpensiveMonth.month}</h3>
    <p style="font-size:18px;margin:5px 0;"><strong>${formatAmount(yearStats.mostExpensiveMonth.amount)}</strong></p>
  </div>

  <h2>Top Spending Categories</h2>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th>Amount</th>
        <th>Expenses</th>
        <th>% of Total</th>
      </tr>
    </thead>
    <tbody>
      ${yearStats.categories
        .slice(0, 10)
        .map(
          (cat) => `
        <tr>
          <td>${cat.category}</td>
          <td>${formatAmount(cat.amount)}</td>
          <td>${cat.count}</td>
          <td>${((cat.amount / yearStats.totalSpent) * 100).toFixed(1)}%</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  ${
    yearStats.achievements
      ? `
    <h2>Achievements</h2>
    <div class="summary-grid">
      <div class="stat-card">
        <div class="stat-label">Categories Tracked</div>
        <div class="stat-value">${yearStats.achievements.totalCategories}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Budgets Created</div>
        <div class="stat-value">${yearStats.achievements.totalBudgets}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Debts Cleared</div>
        <div class="stat-value">${yearStats.achievements.debtsCleared}</div>
      </div>
    </div>
  `
      : ""
  }

  <h2>Analysis Period</h2>
  <p><strong>First Expense:</strong> ${yearStats.firstExpense.toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}</p>
  <p><strong>Last Expense:</strong> ${yearStats.lastExpense.toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}</p>

  <div class="footer">
    <p>Generated by MONEE - Kenya's #1 Money Management App 🇰🇪</p>
    <p>This report is for personal use only. All data is private and secure.</p>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
