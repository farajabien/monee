"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddCategoryDialog } from "@/components/categories/add-category-dialog";
import { DEFAULT_CATEGORIES } from "@/lib/bootstrap";
import { Check, Plus } from "lucide-react";
import { useState } from "react";

interface Step2CategoriesProps {
  selectedCategories: string[];
  customCategories: Array<{ name: string; color: string }>;
  onToggleCategory: (name: string) => void;
  onCategoryCreated: (id: string, name: string, color: string) => void;
  onNext: () => void;
  onBack: () => void;
  onUseDefaults: () => void;
}

export function Step2Categories({
  selectedCategories,
  customCategories,
  onToggleCategory,
  onCategoryCreated,
  onNext,
  onBack,
  onUseDefaults,
}: Step2CategoriesProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] px-4 py-6 space-y-6">
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl font-semibold leading-tight">
              Select Categories
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Choose categories to organize your expenses
            </p>
          </div>
        </div>
        <Button
          onClick={onUseDefaults}
          variant="outline"
          size="lg"
          className="w-full h-12 text-base font-medium"
        >
          Use Recommended Categories ({DEFAULT_CATEGORIES.length})
        </Button>

        <ScrollArea className="h-[400px] w-full rounded-md border">
          <div className="grid grid-cols-1 gap-3 p-4">
            {allCategories.map((category) => {
              const isSelected = selectedCategories.includes(category.name);
              return (
                <button
                  key={category.name}
                  onClick={() => onToggleCategory(category.name)}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all min-h-[56px] ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/50"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-base font-medium flex-1 text-left">
                    {category.name}
                  </span>
                  {isSelected && (
                    <Check className="h-5 w-5 text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <Button
          onClick={() => setShowAddDialog(true)}
          variant="outline"
          size="lg"
          className="w-full h-12 text-base font-medium"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Custom Category
        </Button>

        <p className="text-xs sm:text-sm text-muted-foreground text-center leading-relaxed">
          Selected: {selectedCategories.length} categories
        </p>
      </CardContent>

      <div className="mt-auto pt-4">
        <div className="flex gap-3">
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className="flex-1 h-12 text-base font-medium shadow-sm"
          >
            Back
          </Button>
          <Button
            onClick={onNext}
            disabled={selectedCategories.length === 0}
            size="lg"
            className="flex-1 h-12 text-base font-medium shadow-sm"
          >
            Continue
          </Button>
        </div>
      </div>

      <AddCategoryDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onCategoryCreated={(id, name, color) => {
          onCategoryCreated(id, name, color);
          setShowAddDialog(false);
        }}
      />
    </div>
  );
}
