"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddCategoryDialog } from "@/components/categories/add-category-dialog";
import { DEFAULT_CATEGORIES } from "@/lib/bootstrap";
import { MOBILE_CONFIG } from "./config";
import { Check, Plus, Tag } from "lucide-react";
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
    <div className={MOBILE_CONFIG.spacing.sectionGap}>
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Tag className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className={MOBILE_CONFIG.text.title}>
                Select Categories
              </CardTitle>
              <p className={`${MOBILE_CONFIG.text.subtitle} text-muted-foreground mt-1`}>
                Choose categories to organize your expenses
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className={MOBILE_CONFIG.spacing.betweenInputs}>
          {/* Quick action */}
          <Button
            onClick={onUseDefaults}
            variant="outline"
            size="lg"
            className={`${MOBILE_CONFIG.button.full} ${MOBILE_CONFIG.touchTarget} w-full`}
          >
            Use Recommended Categories ({DEFAULT_CATEGORIES.length})
          </Button>

          {/* Category grid - Mobile first: 1 column, Desktop: 2 columns */}
          <div className={MOBILE_CONFIG.grid.categories}>
            {allCategories.map((category) => {
              const isSelected = selectedCategories.includes(category.name);
              return (
                <button
                  key={category.name}
                  onClick={() => onToggleCategory(category.name)}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${MOBILE_CONFIG.touchTarget} ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/50"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className={`${MOBILE_CONFIG.text.label} font-medium flex-1 text-left`}>
                    {category.name}
                  </span>
                  {isSelected && (
                    <Check className="h-5 w-5 text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Add custom category */}
          <Button
            onClick={() => setShowAddDialog(true)}
            variant="outline"
            size="lg"
            className={`${MOBILE_CONFIG.button.full} ${MOBILE_CONFIG.touchTarget} w-full`}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Custom Category
          </Button>

          <p className={`${MOBILE_CONFIG.text.helper} text-muted-foreground text-center`}>
            Selected: {selectedCategories.length} categories
          </p>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
          className={`${MOBILE_CONFIG.button.full} ${MOBILE_CONFIG.touchTarget} flex-1`}
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={selectedCategories.length === 0}
          size="lg"
          className={`${MOBILE_CONFIG.button.full} ${MOBILE_CONFIG.touchTarget} flex-1`}
        >
          Continue
        </Button>
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
