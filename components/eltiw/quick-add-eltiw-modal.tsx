"use client";

import { useState } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

interface QuickAddEltiwModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export function QuickAddEltiwModal({
  open,
  onOpenChange,
}: QuickAddEltiwModalProps) {
  const user = db.useUser();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [link, setLink] = useState("");
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;

    const sourceOption = SOURCE_OPTIONS.find((s) => s.value === selectedSource);

    setIsSubmitting(true);
    try {
      await db.transact(
        db.tx.eltiw_items[id()]
          .update({
            name: name.trim(),
            amount: parseFloat(amount),
            link: link.trim() || undefined,
            source: sourceOption?.name,
            sourceEmoji: sourceOption?.emoji,
            gotIt: false,
            createdAt: Date.now(),
          })
          .link({ user: user.id })
      );

      // Reset and close
      setName("");
      setAmount("");
      setLink("");
      setSelectedSource("");
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-detect source from link
  const handleLinkChange = (value: string) => {
    setLink(value);
    if (!selectedSource && value) {
      if (value.includes("tiktok.com")) setSelectedSource("tiktok");
      else if (value.includes("instagram.com")) setSelectedSource("instagram");
      else if (value.includes("jumia.")) setSelectedSource("jumia");
      else if (value.includes("kilimall.")) setSelectedSource("kilimall");
      else if (value.includes("amazon.")) setSelectedSource("amazon");
      else if (value.includes("aliexpress.")) setSelectedSource("aliexpress");
      else if (value.includes("facebook.com")) setSelectedSource("facebook");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Quick Add to Wishlist
          </DialogTitle>
          <DialogDescription>
            What do you want? Add it in seconds!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-name">What do you want?</Label>
            <Input
              id="quick-name"
              placeholder="New shoes, headphones..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-amount">Price (Ksh)</Label>
            <Input
              id="quick-amount"
              type="number"
              placeholder="3000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-link">Link (optional)</Label>
            <Input
              id="quick-link"
              type="url"
              placeholder="https://..."
              value={link}
              onChange={(e) => handleLinkChange(e.target.value)}
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
                    variant={
                      selectedSource === source.value ? "default" : "outline"
                    }
                    size="sm"
                    className="flex flex-col h-auto py-2 px-1"
                    onClick={() => setSelectedSource(source.value)}
                  >
                    <span className="text-2xl mb-1">{source.emoji}</span>
                    <span className="text-[10px] leading-tight">
                      {source.name}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Adding..." : "Add to Wishlist"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
