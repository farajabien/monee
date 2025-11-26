import ExpenseList from "@/components/expenses/expense-list";

export default function DashboardPage() {
  // The layout handles tabs and nav, so just render the default (Daily) view here
  return <ExpenseList />;
}
