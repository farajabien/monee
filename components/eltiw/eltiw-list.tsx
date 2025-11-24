"use client";

import { useState, useMemo, useCallback } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    amount?: string;
  }>({});
  const [editingItem, setEditingItem] = useState<EltiwItem | null>(null);
  const [selectedSource, setSelectedSource] = useState("");

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
        // Update existing item
        await db.transact(
          db.tx.eltiw_items[editingItem.id].update({
            name: name.trim(),
            amount: parseFloat(amount),
            reason: reason.trim() || undefined,
            link: link.trim() || undefined,
            source: sourceOption?.name,
            sourceEmoji: sourceOption?.emoji,
            deadline: deadlineTimestamp,
          })
        );
      } else {
        // Create new item
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
    // Set source if exists
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
  
  // Format number to compact form (1000 -> 1K, 1000000 -> 1M)
  const formatCompact = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    const activeItems = items.filter((item) => !item.gotIt);
    const completedItems = items.filter((item) => item.gotIt);
    const totalValue = activeItems.reduce((sum, item) => sum + item.amount, 0);
    const completedValue = completedItems.reduce((sum, item) => sum + item.amount, 0);
    
    return {
      activeCount: activeItems.length,
      totalValue,
      completedCount: completedItems.length,
      completedValue,
    };
  }, [items]);
  
  // Get unique sources for filter
  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    items.forEach((item) => {
      if (item.source) sources.add(item.source);
    });
    return Array.from(sources);
  }, [items]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.reason?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter === "active") {
      result = result.filter((item) => !item.gotIt);
    } else if (statusFilter === "completed") {
      result = result.filter((item) => item.gotIt);
    }

    // Source filter
    if (sourceFilter !== "all") {
      result = result.filter((item) => item.source === sourceFilter);
    }

    // Sort
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
  }, [items, searchQuery, statusFilter, sortBy, sourceFilter]);


  const completedItems = filteredAndSortedItems.filter((item: EltiwItem) => item.gotIt);

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
      return `Overdue by ${Math.abs(days)} day${
        Math.abs(days) !== 1 ? "s" : ""
      }`;
    } else if (days === 0) {
      return "Due today";
    } else if (days === 1) {
      return "Due tomorrow";
    } else {
      return `Due in ${days} days`;
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
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-row items-center justify-between">
            <CardTitle>Every Little Thing I Want</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
          
          {/* Metrics Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-sm px-3 py-1.5">
              <Heart className="h-3.5 w-3.5 mr-1.5" />
              {metrics.activeCount} Active
            </Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1.5">
              💰 Ksh {formatCompact(metrics.totalValue)}
            </Badge>
            <Badge variant="default" className="text-sm px-3 py-1.5">
              ✓ {metrics.completedCount} Done
            </Badge>
            {metrics.completedValue > 0 && (
              <Badge variant="outline" className="text-sm px-3 py-1.5">
                🎉 Ksh {formatCompact(metrics.completedValue)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Compact controls row */}
          <div className="flex flex-col gap-3">
            {/* Search + View Toggle */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-9 px-2"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-9 px-2"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Sort + Status Filter + Source Filters in one row */}
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="amount-high">Price ↓</SelectItem>
                  <SelectItem value="amount-low">Price ↑</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Done</SelectItem>
                </SelectContent>
              </Select>

              {uniqueSources.length > 0 && (
                <>
                  <div className="h-4 w-px bg-border" />
                  <Button
                    variant={sourceFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSourceFilter("all")}
                    className="h-9"
                  >
                    All
                  </Button>
                  {uniqueSources.map((source) => {
                    const sourceEmoji = items.find((i) => i.source === source)?.sourceEmoji;
                    return (
                      <Button
                        key={source}
                        variant={sourceFilter === source ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSourceFilter(source)}
                        className="h-9"
                        title={source}
                      >
                        {sourceEmoji && <span className="text-base">{sourceEmoji}</span>}
                        <span className="ml-1.5 hidden sm:inline">{source}</span>
                      </Button>
                    );
                  })}
                </>
              )}
            </div>

            {/* Count */}
            <div className="text-sm text-muted-foreground">
              {filteredAndSortedItems.length === items.length ? (
                <span>{items.length} items</span>
              ) : (
                <span>
                  {filteredAndSortedItems.length} of {items.length} items
                </span>
              )}
            </div>
          </div>

          {filteredAndSortedItems.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              {searchQuery ? (
                <p className="mb-2">No items found matching &quot;{searchQuery}&quot;</p>
              ) : (
                <>
                  <p className="mb-2">Your wishlist is empty.</p>
                  <p className="text-sm">Add something you want for yourself!</p>
                </>
              )}
            </div>
          )}

          {filteredAndSortedItems.length > 0 && viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedItems.map((item: EltiwItem, index: number) => (
                <Card key={item.id} className={item.gotIt ? "opacity-60" : ""}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                      <div className="flex gap-1">
                        {!item.gotIt && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleGotIt(item)}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className={`font-semibold ${item.gotIt ? "line-through" : ""} flex items-center gap-2`}>
                        {item.sourceEmoji && <span className="text-lg">{item.sourceEmoji}</span>}
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={item.gotIt ? "default" : "secondary"}>
                          {formatAmount(item.amount)}
                        </Badge>
                        {item.deadline && !item.gotIt && (
                          <Badge
                            variant={getDeadlineBadgeVariant(item.deadline)}
                            className="flex items-center gap-1"
                          >
                            <Calendar className="h-3 w-3" />
                            {formatDeadline(item.deadline)}
                          </Badge>
                        )}
                      </div>
                      {item.reason && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.reason}
                        </p>
                      )}
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 w-fit"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View link
                        </a>
                      )}
                      {item.gotItDate && (
                        <p className="text-xs text-muted-foreground">
                          Got it on {new Date(item.gotItDate).toLocaleDateString("en-KE")}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredAndSortedItems.length > 0 && viewMode === "list" && (
            <div className="space-y-2">
              {filteredAndSortedItems.map((item: EltiwItem, index: number) => (
                 <Item key={item.id} className={`flex items-start gap-4 ${item.gotIt ? "opacity-60" : ""}`}>
                      <Badge variant="outline" className="text-xs shrink-0">#{index + 1}</Badge>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.sourceEmoji && <span className="text-lg">{item.sourceEmoji}</span>}
                          <span className={`font-semibold ${item.gotIt ? "line-through" : ""}`}>{item.name}</span>
                          <Badge variant="secondary">
                            {formatAmount(item.amount)}
                          </Badge>
                          {item.deadline && (
                            <Badge
                              variant={getDeadlineBadgeVariant(item.deadline)}
                              className="flex items-center gap-1"
                            >
                              <Calendar className="h-3 w-3" />
                              {formatDeadline(item.deadline)}
                            </Badge>
                          )}
                        </div>
                        {item.reason && (
                          <p className="text-sm text-muted-foreground">
                            {item.reason}
                          </p>
                        )}
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 w-fit"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View link
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGotIt(item)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Got it!
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Item>
              ))}
            </div>
          )}

          {completedItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Completed 🎉
              </h3>
              {completedItems.map((item: EltiwItem) => (
                <Item key={item.id} className="opacity-60 flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold line-through">
                        {item.name}
                      </span>
                      <Badge variant="default">
                        {formatAmount(item.amount)}
                      </Badge>
                    </div>
                    {item.reason && (
                      <p className="text-sm text-muted-foreground">
                        {item.reason}
                      </p>
                    )}
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 w-fit opacity-60"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View link
                      </a>
                    )}
                    {item.gotItDate && (
                      <p className="text-xs text-muted-foreground">
                        Got it on{" "}
                        {new Date(item.gotItDate).toLocaleDateString(
                          "en-KE"
                        )}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </Item>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SteppedFormModal
        open={showAddDialog}
        onOpenChange={handleModalChange}
        title={editingItem ? "Edit Wishlist Item" : "Add Wishlist Item"}
        description="Track the little things you're saving for."
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        validateStep={validateStep}
        renderStep={(step) => {
          if (step.id === "basics") {
            return (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="eltiw-name">What do you want?</Label>
                  <Input
                    id="eltiw-name"
                    placeholder="New shoes"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {fieldErrors.name && (
                    <p className="text-sm text-destructive">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eltiw-amount">Amount (Ksh)</Label>
                  <Input
                    id="eltiw-amount"
                    type="number"
                    placeholder="3000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  {fieldErrors.amount && (
                    <p className="text-sm text-destructive">
                      {fieldErrors.amount}
                    </p>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eltiw-reason">Reason (optional)</Label>
                <Textarea
                  id="eltiw-reason"
                  placeholder="Because I deserve it!"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eltiw-link">Link (optional)</Label>
                <Input
                  id="eltiw-link"
                  type="url"
                  placeholder="https://example.com/product"
                  value={link}
                  onChange={(e) => {
                    setLink(e.target.value);
                    // Auto-detect source from link
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
                />
              </div>
              {link && (
                <div className="space-y-2">
                  <Label>Source (optional)</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {SOURCE_OPTIONS.map((source) => (
                      <Button
                        key={source.value}
                        type="button"
                        variant={selectedSource === source.value ? "default" : "outline"}
                        size="sm"
                        className="flex flex-col h-auto py-2 px-1"
                        onClick={() => setSelectedSource(source.value)}
                      >
                        <span className="text-2xl mb-1">{source.emoji}</span>
                        <span className="text-[10px] leading-tight">{source.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="eltiw-deadline">Deadline (optional)</Label>
                <Input
                  id="eltiw-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
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
