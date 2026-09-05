"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useDesigner } from "@/lib/store";

export function HistoryHotkeys() {
  const undo = useDesigner((s) => s.undo);
  const redo = useDesigner((s) => s.redo);
  const deleteSelected = useDesigner((s) => s.deleteSelected);
  const duplicateSelected = useDesigner((s) => s.duplicateSelected);
  const playMode = useDesigner((s) => s.playMode);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (meta && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if (playMode || typing) return;
      if (meta && event.key.toLowerCase() === "d") {
        event.preventDefault();
        const message = duplicateSelected();
        if (message) toast.message(message);
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        const message = deleteSelected();
        if (message) toast.message(message);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, deleteSelected, duplicateSelected, playMode]);

  return null;
}
