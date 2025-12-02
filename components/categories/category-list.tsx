"use client";

import { useState } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { UnifiedListContainer } from "@/components/custom/unified-list-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Tag, Palette } from "lucide-react";
import { SteppedFormModal } from "@/components/stepped-form-modal";
import type { Category } from "@/types";
import type { FormStep } from "@/components/stepped-form-modal";
import { cn } from "@/lib/utils";
import {
  createCategoryListConfig,
  getDisplayCategories,
} from "./category-list-config";

const CATEGORY_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

const steps: FormStep[] = [
  {
    id: "name",
    title: "Category Name",
    description: "What would you like to call this category?",
    icon: Tag,
    required: true,
  },
  {
    id: "color",
    title: "Choose Color",
    description: "Pick a color to identify this category",
    icon: Palette,
    required: true,
  },
];

export default function CategoryList() {
  const user = db.useUser();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState("");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data } = db.useQuery({
    profiles: {
      $: {
        where: { "user.id": user.id },
      },
      categories: {
        $: {
          order: { name: "asc" },
        },
      },
    },
  });

  const profile = data?.profiles?.[0];
  const userCategories = profile?.categories || [];
  const displayCategories = getDisplayCategories(userCategories);

  const resetForm = () => {
    setName("");
    setColor(CATEGORY_COLORS[0]);
    setFieldErrors({});
    setCurrentStep(0);
  };

  const handleModalChange = (open: boolean) => {
    setShowAddDialog(open);
    if (!open) {
      resetForm();
    }
  };

  const validateStep = (stepIndex: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepIndex === 0) {
      if (!name.trim()) {
        newErrors.name = "Category name is required";
      }
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!name.trim() || !profile) return;

    await db.transact(
      db.tx.categories[id()]
        .update({
          name: name.trim(),
          color: color,
          icon: "",
          isActive: true,
        })
        .link({ profile: profile.id })
    );

    handleModalChange(false);
  };

  const handleToggleActive = async (category: Category, nextState: boolean) => {
    // If category exists in database
    if (!category.id.startsWith("template-")) {
      await db.transact(
        db.tx.categories[category.id].update({
          isActive: nextState,
        })
      );
    } else if (nextState && profile) {
      // Create new category for this user (from template)
      await db.transact(
        db.tx.categories[id()]
          .update({
            name: category.name,
            color: category.color || CATEGORY_COLORS[0],
            icon: "",
            isActive: true,
          })
          .link({ profile: profile.id })
      );
    }
  };

  const config = createCategoryListConfig(user.id, handleToggleActive);

  return (
    <div className="space-y-4">
      <UnifiedListContainer
        config={config}
        data={displayCategories}
        additionalFilters={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        }
      />

      <SteppedFormModal
        open={showAddDialog}
        onOpenChange={handleModalChange}
        title="Add Category"
        description="Create a new category to organize your expenses."
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        validateStep={validateStep}
        onSubmit={handleSubmit}
        renderStep={(step) => {
          if (step.id === "name") {
            return (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category-name">Category Name</Label>
                  <Input
                    id="category-name"
                    placeholder="Food, Transport, Rent..."
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) {
                        setFieldErrors({ ...fieldErrors, name: "" });
                      }
                    }}
                  />
                  {fieldErrors.name && (
                    <p className="text-sm text-destructive">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>
              </div>
            );
          }

          if (step.id === "color") {
            return (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Choose a Color</Label>
                  <div className="flex gap-3 flex-wrap">
                    {CATEGORY_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={cn(
                          "w-12 h-12 rounded-full border-4 transition-all",
                          color === c
                            ? "border-foreground scale-110"
                            : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="mt-4 p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Preview:
                    </p>
                    <Badge
                      style={{
                        backgroundColor: color,
                        color: "white",
                      }}
                    >
                      {name || "Category Name"}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          }

          return null;
        }}
      />
    </div>
  );
}
