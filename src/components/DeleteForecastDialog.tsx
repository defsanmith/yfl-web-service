"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";

type DeleteForecastDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forecastId: string;
  forecastTitle: string;
  onDelete: (
    forecastId: string
  ) => Promise<{ success: boolean; error?: string }>;
};

export default function DeleteForecastDialog({
  open,
  onOpenChange,
  forecastId,
  forecastTitle,
  onDelete,
}: DeleteForecastDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    const result = await onDelete(forecastId);

    if (result.success) {
      onOpenChange(false);
    } else {
      setError(result.error || "Failed to delete forecast");
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Forecast?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                This will permanently delete the forecast{" "}
                <span className="font-semibold text-foreground">
                  {forecastTitle}
                </span>{" "}
                and all associated predictions.
              </p>
              <p>This action cannot be undone.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Forecast"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
