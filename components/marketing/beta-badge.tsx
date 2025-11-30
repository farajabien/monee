import { Badge } from "@/components/ui/badge";
import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

interface BetaBadgeProps {
  variant?: "default" | "gradient" | "outline";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function BetaBadge({
  variant = "default",
  size = "md",
  showIcon = true,
  className,
}: BetaBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const variantClasses = {
    default:
      "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30",
    gradient:
      "bg-gradient-to-r from-primary/20 to-blue-500/20 border-primary/30",
    outline: "border-primary/50 bg-transparent",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold uppercase tracking-wide",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {showIcon && <FlaskConical className="h-3 w-3 mr-1" />}
      Beta
    </Badge>
  );
}
