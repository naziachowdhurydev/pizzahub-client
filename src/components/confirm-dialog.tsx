"use client";

import type { ReactNode } from "react";
import { AlertTriangle, LoaderCircle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemLabel?: string;
  itemName: string;
  title?: string;
  description?: string;
  confirmLabel?: string;
  pendingLabel?: string;
  pending?: boolean;
  icon?: ReactNode;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  itemLabel = "Product",
  itemName,
  title = "Delete this product?",
  description = "This product will be removed from the menu and no longer be available to customers.",
  confirmLabel = "Delete product",
  pendingLabel = "Deleting product...",
  pending = false,
  icon,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        showCloseButton={!pending}
        className="max-w-md gap-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-2xl"
      >
        <div className="p-6 sm:p-7">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-red-500/15 bg-red-500/10 text-red-600">
            {icon ?? <Trash2 aria-hidden="true" size={25} strokeWidth={2.2} />}
          </div>
          <DialogHeader className="mt-5 gap-2 text-left">
            <DialogTitle className="text-xl font-black tracking-tight text-foreground">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm leading-6">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-muted/60 p-4">
            <AlertTriangle
              aria-hidden="true"
              size={18}
              className="mt-0.5 shrink-0 text-amber-600"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {itemLabel}
              </p>
              <p className="mt-1 break-words font-bold text-foreground">{itemName}</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border bg-muted/40 p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={pending}
            onClick={() => onOpenChange(false)}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            Keep product
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <LoaderCircle aria-hidden="true" size={16} className="animate-spin" />
            ) : (
              <Trash2 aria-hidden="true" size={16} />
            )}
            {pending ? pendingLabel : confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
