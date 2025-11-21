"use client";

import { Badge } from "@/components/ui/badge";
type CategoryLike = {
  name: string;
  color?: string;
};

interface CategoryBadgeProps {
  category: CategoryLike;
}

export default function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <Badge
      variant="secondary"
      style={{
        backgroundColor: category.color ? `${category.color}20` : undefined,
        color: category.color || undefined,
        borderColor: category.color || undefined,
      }}
    >
      {category.name}
    </Badge>
  );
}

