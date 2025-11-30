import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackTypeCardProps {
  icon: LucideIcon;
  emoji: string;
  title: string;
  description: string;
  value: string;
  selected: boolean;
  onClick: () => void;
}

export function FeedbackTypeCard({
  icon: Icon,
  emoji,
  title,
  description,
  selected,
  onClick,
}: FeedbackTypeCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md active:scale-95",
        "min-h-[120px] md:min-h-[140px]",
        selected
          ? "border-2 border-primary bg-primary/5 shadow-md"
          : "border-2 border-transparent hover:border-primary/30"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 md:p-6 space-y-2 h-full flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label={title}>
            {emoji}
          </span>
          <Icon className={cn("h-5 w-5", selected ? "text-primary" : "text-muted-foreground")} />
        </div>
        <div className="flex-1">
          <h3 className={cn("font-semibold text-sm md:text-base", selected && "text-primary")}>
            {title}
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
