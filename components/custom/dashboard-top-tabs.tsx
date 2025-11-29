import { Calendar, List, BarChart3, FileText } from "lucide-react";

const topTabs = [
  { label: "Daily", value: "daily", icon: List },
  { label: "Calendar", value: "calendar", icon: Calendar },
  { label: "Monthly", value: "monthly", icon: BarChart3 },
  { label: "Summary", value: "summary", icon: FileText },
];

export function DashboardTopTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  return (
    <div className="flex w-full border-b bg-background sticky top-0 z-40">
      {topTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={`flex-1 flex flex-col items-center py-3 px-1 transition-colors border-b-2 ${
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-5 w-5 mb-0.5" />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
