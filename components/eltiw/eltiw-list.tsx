"use client";
import { DataTable } from "@/components/ui/data-table";
import { eltiwColumns } from "@/components/eltiw/eltiw-columns";

import { useState, useMemo, useCallback } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  SteppedFormModal,
  type FormStep,
} from "@/components/stepped-form-modal";
import { CheckCircle2, Plus, X, ExternalLink, Calendar, Edit, Search, List, Grid3x3, Heart } from "lucide-react";
import type { EltiwItem } from "@/types";
import { Item } from "../ui/item";
import type { ViewMode } from "../ui/data-view-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EltiwList() {
  const user = db.useUser();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [link, setLink] = useState("");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    amount?: string;
  }>({});
  const [editingItem, setEditingItem] = useState<EltiwItem | null>(null);
  const [selectedSource, setSelectedSource] = useState("");

  const CATEGORY_OPTIONS = [
    { label: "Fashion", value: "fashion" },
    { label: "Hygiene", value: "hygiene" },
    { label: "Electronics", value: "electronics" },
    { label: "Gaming", value: "gaming" },
    { label: "Utensils", value: "utensils" },
    { label: "Furniture", value: "furniture" },
    { label: "Subscriptions", value: "subscriptions" },
    { label: "Software", value: "software" },
    { label: "Other", value: "other" },
  ];

  const SOURCE_OPTIONS = [
    { name: "TikTok Shop", emoji: "🎵", value: "tiktok" },
    { name: "Instagram", emoji: "📸", value: "instagram" },
    { name: "Jumia", emoji: "🛍️", value: "jumia" },
    { name: "Kilimall", emoji: "🏪", value: "kilimall" },
    { name: "Amazon", emoji: "📦", value: "amazon" },
    { name: "AliExpress", emoji: "🌏", value: "aliexpress" },
    { name: "Facebook", emoji: "👥", value: "facebook" },
    { name: "WhatsApp", emoji: "💬", value: "whatsapp" },
    { name: "Store", emoji: "🏬", value: "store" },
    { name: "Other", emoji: "✨", value: "other" },
  ];
  
  // View controls
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const now = useMemo(() => new Date().getTime(), []);

  const steps = useMemo<FormStep[]>(
    () => [
      {
        id: "basics",
        title: "Basics",
        description: "What do you want and how much does it cost?",
      },
      {
        id: "details",
        title: "Details",
        description: "Add more context, links, or deadlines.",
      },
    ],
    []
  );

  const { data } = db.useQuery({
    eltiw_items: {
      $: {
        where: { "user.id": user.id },
        order: { createdAt: "desc" },
      },
    },
  });

  const resetForm = useCallback(() => {
    setName("");
    setAmount("");
    setReason("");
    setLink("");
    setDeadline("");
    setCategory("");
    setSelectedSource("");
    setCurrentStep(0);
    setFieldErrors({});
  }, []);

  const handleModalChange = (open: boolean) => {
    setShowAddDialog(open);
    if (!open) {
      resetForm();
      setEditingItem(null);
    }
  };

  const validateStep = async (stepIndex: number) => {
    if (stepIndex === 0) {
      const errors: { name?: string; amount?: string } = {};
      if (!name.trim()) {
        errors.name = "Please enter an item name";
      }
      if (!amount.trim() || Number(amount) <= 0) {
        errors.amount = "Enter a valid amount";
      }
      setFieldErrors(errors);
      return Object.keys(errors).length === 0;
    }
    return true;
  };

  const handleAdd = async () => {
    const isValidBasics = await validateStep(0);
    if (!isValidBasics) {
      setCurrentStep(0);
      return;
    }

    const deadlineTimestamp = deadline
      ? new Date(deadline).getTime()
      : undefined;

    const sourceOption = SOURCE_OPTIONS.find((s) => s.value === selectedSource);

    try {
      setIsSubmitting(true);
      if (editingItem) {
        await db.transact(
          db.tx.eltiw_items[editingItem.id].update({
            name: name.trim(),
            amount: parseFloat(amount),
            reason: reason.trim() || undefined,
            link: link.trim() || undefined,
            source: sourceOption?.name,
            sourceEmoji: sourceOption?.emoji,
            deadline: deadlineTimestamp,
            category: category || undefined,
          })
        );
      } else {
        await db.transact(
          db.tx.eltiw_items[id()]
            .update({
              name: name.trim(),
              amount: parseFloat(amount),
              reason: reason.trim() || undefined,
              link: link.trim() || undefined,
              source: sourceOption?.name,
              sourceEmoji: sourceOption?.emoji,
              deadline: deadlineTimestamp,
              gotIt: false,
              createdAt: Date.now(),
              category: category || undefined,
            })
            .link({ user: user.id })
        );
      }
      handleModalChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: EltiwItem) => {
    setEditingItem(item);
    setName(item.name);
    setAmount(item.amount.toString());
    setReason(item.reason || "");
    setLink(item.link || "");
    setDeadline(
      item.deadline ? new Date(item.deadline).toISOString().split("T")[0] : ""
    );
    setCategory(item.category || "");
    const sourceOption = SOURCE_OPTIONS.find((s) => s.name === item.source);
    setSelectedSource(sourceOption?.value || "");
    setShowAddDialog(true);
  };

  const handleGotIt = (item: EltiwItem) => {
    db.transact(
      db.tx.eltiw_items[item.id].update({
        gotIt: true,
        gotItDate: new Date().getTime(),
      })
    );
  };

  const handleDelete = (itemId: string) => {
    db.transact(db.tx.eltiw_items[itemId].delete());
  };

  const items = useMemo(() => data?.eltiw_items || [], [data?.eltiw_items]);
  
  const formatCompact = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const metrics = useMemo(() => {
    const filterCat = categoryFilter !== "all" ? categoryFilter : null;
    const filtered = filterCat ? items.filter((item) => item.category === filterCat) : items;
    const activeItems = filtered.filter((item) => !item.gotIt);
    const completedItems = filtered.filter((item) => item.gotIt);
    const totalValue = activeItems.reduce((sum, item) => sum + item.amount, 0);
    const completedValue = completedItems.reduce((sum, item) => sum + item.amount, 0);
    return {
      activeCount: activeItems.length,
      totalValue,
      completedCount: completedItems.length,
      completedValue,
    };
  }, [items, categoryFilter]);
  
  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    items.forEach((item) => {
      if (item.source) sources.add(item.source);
    });
    return Array.from(sources);
  }, [items]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach((item) => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats);
  }, [items]);

  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.reason?.toLowerCase().includes(query)
      );
    }

    if (statusFilter === "active") {
      result = result.filter((item) => !item.gotIt);
    } else if (statusFilter === "completed") {
      result = result.filter((item) => item.gotIt);
    }

    if (sourceFilter !== "all") {
      result = result.filter((item) => item.source === sourceFilter);
    }

    if (categoryFilter !== "all") {
      result = result.filter((item) => item.category === categoryFilter);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.createdAt - a.createdAt;
        case "oldest":
          return a.createdAt - b.createdAt;
        case "amount-high":
          return b.amount - a.amount;
        case "amount-low":
          return a.amount - b.amount;
        case "deadline":
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return a.deadline - b.deadline;
        default:
          return 0;
      }
    });

    return result;
  }, [items, searchQuery, statusFilter, sortBy, sourceFilter, categoryFilter]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDeadline = (deadline: number | undefined) => {
    if (!deadline) return null;

    const diff = deadline - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 0) {
      return `Overdue by ${Math.abs(days)}d`;
    } else if (days === 0) {
      return "Today";
    } else if (days === 1) {
      return "Tomorrow";
    } else {
      return `${days}d`;
    }
  };

  const getDeadlineBadgeVariant = (deadline: number | undefined) => {
    if (!deadline) return "secondary";
    const diff = deadline - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return "destructive";
    if (days <= 3) return "default";
    return "secondary";
  };

  return (
    <div className="space-y-3 pb-[90px] sm:pb-0">
      {/* Compact Header with Metrics */}
      <div className="space-y-2">
        {/* Metrics Row */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            <Heart className="h-3 w-3 mr-1" />
            {metrics.activeCount}
          </Badge>
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            💰 {formatCompact(metrics.totalValue)}
          </Badge>
          <Badge variant="default" className="text-xs px-2 py-0.5">
            ✓ {metrics.completedCount}
          </Badge>
          {metrics.completedValue > 0 && (
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              🎉 {formatCompact(metrics.completedValue)}
            </Badge>
          )}
        </div>

        {/* Unified Filter Bar */}
        <div className="flex gap-2 items-center flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-8 text-sm"
            />
          </div>
          
          {/* View Toggle */}
          <div className="flex gap-0.5 border rounded-md p-0.5">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-7 w-7 p-0"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-7 w-7 p-0"
            >
              <Grid3x3 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[110px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="amount-high">Price ↓</SelectItem>
              <SelectItem value="amount-low">Price ↑</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Done</SelectItem>
            </SelectContent>
          </Select>

          {/* Category */}
          {uniqueCategories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="capitalize text-xs">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Source */}
          {uniqueSources.length > 0 && (
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {uniqueSources.map((source) => {
                  const sourceEmoji = items.find((i) => i.source === source)?.sourceEmoji;
                  return (
                    <SelectItem key={source} value={source} className="text-xs">
                      {sourceEmoji} {source}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Results Count */}
        <div className="text-xs text-muted-foreground">
          {filteredAndSortedItems.length === items.length ? (
            <span>{items.length} items</span>
          ) : (
            <span>{filteredAndSortedItems.length} of {items.length}</span>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredAndSortedItems.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          {searchQuery ? (
            <p className="text-sm">No items found matching &quot;{searchQuery}&quot;</p>
          ) : (
            <>
              <p className="text-sm mb-1">Your wishlist is empty</p>
              <p className="text-xs">Add something you want!</p>
            </>
          )}
        </div>
      )}

      {/* Grid View */}
      {filteredAndSortedItems.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredAndSortedItems.map((item: EltiwItem, index: number) => (
            <Item 
              key={item.id} 
              className={`flex flex-col gap-2 p-3 ${item.gotIt ? "opacity-50" : ""}`} 
              variant="outline" 
              size="sm"
            >
              {/* Header Row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    #{index + 1}
                  </Badge>
                  {item.category && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">
                      {item.category}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-0.5">
                  {!item.gotIt && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-green-600"
                        onClick={() => handleGotIt(item)}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => handleDelete(item.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Item Info */}
              <div className="space-y-1.5">
                <div className="flex items-start gap-1.5">
                  {item.sourceEmoji && <span className="text-base mt-0.5">{item.sourceEmoji}</span>}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm leading-tight ${item.gotIt ? "line-through" : ""}`}>
                      {item.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <Badge variant={item.gotIt ? "default" : "secondary"} className="text-xs">
                        {formatAmount(item.amount)}
                      </Badge>
                      {item.deadline && !item.gotIt && (
                        <Badge
                          variant={getDeadlineBadgeVariant(item.deadline)}
                          className="flex items-center gap-1 text-xs"
                        >
                          <Calendar className="h-2.5 w-2.5" />
                          {formatDeadline(item.deadline)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {item.reason && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.reason}
                  </p>
                )}

                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 w-fit"
                  >
                    <ExternalLink className="h-2.5 w-2.5" />
                    View
                  </a>
                )}

                {item.gotItDate && (
                  <p className="text-[10px] text-muted-foreground">
                    ✓ {new Date(item.gotItDate).toLocaleDateString("en-KE", { month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
            </Item>
          ))}
        </div>
      )}

      {/* List View */}
      {filteredAndSortedItems.length > 0 && viewMode === "list" && (
        <DataTable
          columns={eltiwColumns}
          data={filteredAndSortedItems}
          onEdit={handleEdit}
          onGotIt={handleGotIt}
          onDelete={handleDelete}
        />
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={() => setShowAddDialog(true)}
        className="fixed z-30 bottom-[calc(env(safe-area-inset-bottom,0px)+72px)] right-4 sm:right-8 bg-primary text-primary-foreground rounded-full shadow-lg p-3.5 flex items-center justify-center transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Add Item"
        style={{ boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10)" }}
      >
        <Plus className="h-5 w-5" />
      </button>

      {/* Modal */}
      <SteppedFormModal
        open={showAddDialog}
        onOpenChange={handleModalChange}
        title={editingItem ? "Edit Item" : "Add Item"}
        description="Track what you're saving for"
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        validateStep={validateStep}
        renderStep={(step) => {
          if (step.id === "basics") {
            return (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="eltiw-name" className="text-sm">What do you want?</Label>
                  <Input
                    id="eltiw-name"
                    placeholder="New shoes"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9"
                  />
                  {fieldErrors.name && (
                    <p className="text-xs text-destructive">{fieldErrors.name}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="eltiw-amount" className="text-sm">Amount (Ksh)</Label>
                  <Input
                    id="eltiw-amount"
                    type="number"
                    placeholder="3000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-9"
                  />
                  {fieldErrors.amount && (
                    <p className="text-xs text-destructive">{fieldErrors.amount}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="eltiw-category" className="text-sm">Category (optional)</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="eltiw-category" className="h-9">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          }

          return (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="eltiw-reason" className="text-sm">Reason (optional)</Label>
                <Textarea
                  id="eltiw-reason"
                  placeholder="Because I deserve it!"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eltiw-link" className="text-sm">Link (optional)</Label>
                <Input
                  id="eltiw-link"
                  type="url"
                  placeholder="https://example.com/product"
                  value={link}
                  onChange={(e) => {
                    setLink(e.target.value);
                    if (!selectedSource && e.target.value) {
                      const url = e.target.value.toLowerCase();
                      if (url.includes("tiktok.com")) setSelectedSource("tiktok");
                      else if (url.includes("instagram.com")) setSelectedSource("instagram");
                      else if (url.includes("jumia.")) setSelectedSource("jumia");
                      else if (url.includes("kilimall.")) setSelectedSource("kilimall");
                      else if (url.includes("amazon.")) setSelectedSource("amazon");
                      else if (url.includes("aliexpress.")) setSelectedSource("aliexpress");
                      else if (url.includes("facebook.com")) setSelectedSource("facebook");
                    }
                  }}
                  className="h-9"
                />
              </div>
              {link && (
                <div className="space-y-1.5">
                  <Label className="text-sm">Source (optional)</Label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {SOURCE_OPTIONS.map((source) => (
                      <Button
                        key={source.value}
                        type="button"
                        variant={selectedSource === source.value ? "default" : "outline"}
                        size="sm"
                        className="flex flex-col h-auto py-1.5 px-1"
                        onClick={() => setSelectedSource(source.value)}
                      >
                        <span className="text-xl mb-0.5">{source.emoji}</span>
                        <span className="text-[9px] leading-tight">{source.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="eltiw-deadline" className="text-sm">Deadline (optional)</Label>
                <Input
                  id="eltiw-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          );
        }}
        onSubmit={handleAdd}
        isSubmitting={isSubmitting}
        showSkipButton={false}
      />
    </div>
  );
}