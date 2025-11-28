/**
 * useListActions Hook
 *
 * Handles common CRUD actions with dialogs and confirmations
 * Provides consistent UX for edit, delete, and custom actions
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { ListActions } from "@/types/list-config";

interface UseListActionsProps<T> {
  actions?: ListActions<T>;
  itemName?: string;  // e.g., "expense", "debt" - for toast messages
}

interface UseListActionsReturn<T> {
  // State
  editingItem: T | null;
  isEditDialogOpen: boolean;
  deletingItemId: string | null;
  isDeleteDialogOpen: boolean;

  // Actions
  handleEdit: (item: T) => void;
  handleDelete: (id: string, itemName?: string) => void;
  confirmDelete: () => Promise<void>;
  cancelEdit: () => void;
  cancelDelete: () => void;
  setEditingItem: (item: T | null) => void;
  setIsEditDialogOpen: (open: boolean) => void;
}

export function useListActions<T>({
  actions,
  itemName = "item",
}: UseListActionsProps<T>): UseListActionsReturn<T> {
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [deletingItemName, setDeletingItemName] = useState<string>("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleEdit = useCallback(
    (item: T) => {
      if (!actions?.edit) return;
      setEditingItem(item);
      setIsEditDialogOpen(true);
    },
    [actions]
  );

  const handleDelete = useCallback(
    (id: string, name?: string) => {
      setDeletingItemId(id);
      setDeletingItemName(name || itemName);
      setIsDeleteDialogOpen(true);
    },
    [itemName]
  );

  const confirmDelete = useCallback(async () => {
    if (!deletingItemId || !actions?.delete) {
      setIsDeleteDialogOpen(false);
      return;
    }

    try {
      await actions.delete(deletingItemId);
      toast.success(`${deletingItemName} deleted successfully`);
      setIsDeleteDialogOpen(false);
      setDeletingItemId(null);
      setDeletingItemName("");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(`Failed to delete ${deletingItemName}`);
    }
  }, [deletingItemId, deletingItemName, actions]);

  const cancelEdit = useCallback(() => {
    setEditingItem(null);
    setIsEditDialogOpen(false);
  }, []);

  const cancelDelete = useCallback(() => {
    setDeletingItemId(null);
    setDeletingItemName("");
    setIsDeleteDialogOpen(false);
  }, []);

  return {
    editingItem,
    isEditDialogOpen,
    deletingItemId,
    isDeleteDialogOpen,
    handleEdit,
    handleDelete,
    confirmDelete,
    cancelEdit,
    cancelDelete,
    setEditingItem,
    setIsEditDialogOpen,
  };
}
