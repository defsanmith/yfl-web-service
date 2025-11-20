"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { useState } from "react";

type OrgAdminDeleteUserDialogProps = {
  userId: string;
  userName: string | null;
  userEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (userId: string) => Promise<{ success: boolean; error?: string }>;
};

export default function OrgAdminDeleteUserDialog({
  userId,
  userName,
  userEmail,
  open,
  onOpenChange,
  onDelete,
}: OrgAdminDeleteUserDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    const result = await onDelete(userId);

    if (result.success) {
      onOpenChange(false);
    } else {
      setError(result.error || "Failed to delete user");
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Delete User
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 pt-2">
              <p>
                This will permanently delete the user{" "}
                <span className="font-semibold">{userName || userEmail}</span> (
                {userEmail}).
              </p>
              <p className="text-destructive font-medium">
                This action cannot be undone.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
