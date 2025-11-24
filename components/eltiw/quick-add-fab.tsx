"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickAddEltiwModal } from "./quick-add-eltiw-modal";

export function QuickAddFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 md:bottom-8 md:right-8"
        onClick={() => setOpen(true)}
        aria-label="Quick add to wishlist"
      >
        <Plus className="h-6 w-6" />
      </Button>
      <QuickAddEltiwModal open={open} onOpenChange={setOpen} />
    </>
  );
}
