import { Plus } from "lucide-react";

export function FloatingAddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-6 z-50 bg-primary text-primary-foreground rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-3xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
      aria-label="Add Expense"
    >
      <Plus className="w-8 h-8" />
    </button>
  );
}
