"use client";

import { useState, useMemo } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { DataViewControls } from "@/components/ui/data-view-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Tag, Palette } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { SteppedFormModal } from "@/components/stepped-form-modal";
import CategoryBadge from "./category-badge";
import type { Category } from "@/types";
import type { FormStep } from "@/components/stepped-form-modal";
import { cn } from "@/lib/utils";

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

type DisplayCategory = {
  key: string;
  name: string;
  color?: string;
  isActive: boolean;
  isDefaultTemplate: boolean;
  userCategoryId?: string;
  templateCategory?: Category;
};

const normalizeName = (name: string) => name.trim().toLowerCase();

export default function CategoryList() {
  const user = db.useUser();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState("");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleViewModeChange = (mode: "grid" | "list" | "table") => {
    if (mode !== "table") setViewMode(mode);
  };

  const {
    isLoading,
    error,
    data,
  } = db.useQuery({
    categories: {
      $: {
        where: { "user.id": user.id },
        order: { name: "asc" },
      },
    },
  });

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
    if (!name.trim()) return;

    await db.transact(
      db.tx.categories[id()]
        .update({
          name: name.trim(),
          color: color,
          icon: "",
          isActive: true,
        })
        .link({ user: user.id })
    );

    handleModalChange(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">Error: {error.message}</div>
        </CardContent>
      </Card>
    );
  }

  const userCategories = data?.categories || [];

  // System default category names
  const systemCategoryNames = new Set([
    "food",
    "transport",
    "housing",
    "utilities",
    "savings",
    "misc"
  ]);

  const displayDefaults: DisplayCategory[] = [];
  const customDisplays: DisplayCategory[] = [];

  userCategories.forEach((category) => {
    const normalized = normalizeName(category.name);
    const isSystemCategory = systemCategoryNames.has(normalized);

    const displayCategory: DisplayCategory = {
      key: `${isSystemCategory ? 'default' : 'custom'}-${category.id}`,
      name: category.name,
      color: category.color,
      isActive: category.isActive !== false,
      isDefaultTemplate: isSystemCategory,
      userCategoryId: category.id,
      templateCategory: category,
    };

    if (isSystemCategory) {
      displayDefaults.push(displayCategory);
    } else {
      customDisplays.push(displayCategory);
    }
  });

  // Add missing system categories as inactive
  const existingSystemCategories = new Set(
    displayDefaults.map(d => normalizeName(d.name))
  );

  const DEFAULT_CATEGORIES = [
    { name: "Food", color: "#f97316" },
    { name: "Transport", color: "#3b82f6" },
    { name: "Housing", color: "#8b5cf6" },
    { name: "Utilities", color: "#06b6d4" },
    { name: "Savings", color: "#22c55e" },
    { name: "Misc", color: "#a3a3a3" },
  ];

  DEFAULT_CATEGORIES.forEach(defaultCat => {
    if (!existingSystemCategories.has(normalizeName(defaultCat.name))) {
      displayDefaults.push({
        key: `template-${defaultCat.name}`,
        name: defaultCat.name,
        color: defaultCat.color,
        isActive: false,
        isDefaultTemplate: true,
        userCategoryId: undefined,
        templateCategory: undefined,
      });
    }
  });

  // Sort defaults by name
  displayDefaults.sort((a, b) => a.name.localeCompare(b.name));

  // Filter categories
  const filteredDefaults = useMemo(() => {
    let result = [...displayDefaults];

    if (searchQuery) {
      result = result.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((c) => {
        if (statusFilter === "active") return c.isActive;
        if (statusFilter === "inactive") return !c.isActive;
        return true;
      });
    }

    return result;
  }, [displayDefaults, searchQuery, statusFilter]);

  const filteredCustoms = useMemo(() => {
    let result = [...customDisplays];

    if (searchQuery) {
      result = result.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((c) => {
        if (statusFilter === "active") return c.isActive;
        if (statusFilter === "inactive") return !c.isActive;
        return true;
      });
    }

    return result;
  }, [customDisplays, searchQuery, statusFilter]);

  const handleToggleActive = async (
    category: DisplayCategory,
    nextState: boolean
  ) => {
    if (category.userCategoryId) {
      // Update existing category
      await db.transact(
        db.tx.categories[category.userCategoryId].update({
          isActive: nextState,
        })
      );
    } else if (nextState) {
      // Create new category for this user
      await db.transact(
        db.tx.categories[id()]
          .update({
            name: category.name,
            color: category.color || CATEGORY_COLORS[0],
            icon: "",
            isActive: true,
          })
          .link({ user: user.id })
      );
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Categories</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <DataViewControls
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search categories..."
            sortValue="name"
            onSortChange={() => {}}
            sortOptions={[
              { value: "name", label: "Name (A-Z)" },
            ]}
            filterValue={statusFilter}
            onFilterChange={setStatusFilter}
            filterOptions={[
              { value: "all", label: "All Categories" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            filterLabel="Status"
            totalCount={displayDefaults.length + customDisplays.length}
            filteredCount={filteredDefaults.length + filteredCustoms.length}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">System categories</p>
              <p className="text-xs text-muted-foreground">
                Toggle to add/remove
              </p>
            </div>
            {filteredDefaults.length > 0 ? (
              <div className={cn(
                viewMode === "grid" 
                  ? "flex flex-wrap gap-3" 
                  : "space-y-2"
              )}>
                {filteredDefaults.map((category) => (
                  <div
                    key={category.key}
                    className={cn(
                      "flex items-center gap-3 rounded-full border px-4 py-2 transition-colors",
                      !category.isActive && "opacity-60"
                    )}
                  >
                    <CategoryBadge
                      category={{ name: category.name, color: category.color }}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                      <Switch
                        checked={category.isActive}
                        onCheckedChange={(checked) =>
                          handleToggleActive(category, checked)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No system categories available.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Your categories</p>
              <p className="text-xs text-muted-foreground">
                Custom and imported
              </p>
            </div>
            {filteredCustoms.length > 0 ? (
              <div className={cn(
                viewMode === "grid" 
                  ? "flex flex-wrap gap-3" 
                  : "space-y-2"
              )}>
                {filteredCustoms.map((category) => (
                  <div
                    key={category.key}
                    className={cn(
                      "flex items-center gap-3 rounded-full border px-4 py-2 transition-colors",
                      !category.isActive && "opacity-60"
                    )}
                  >
                    <CategoryBadge
                      category={{ name: category.name, color: category.color }}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                      <Switch
                        checked={category.isActive}
                        onCheckedChange={(checked) =>
                          handleToggleActive(category, checked)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No custom categories yet. Use the button above to create your
                own.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
