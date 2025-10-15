"use client";

import { updateUserAction } from "@/app/(protected)/(super-admin)/orgs/[orgId]/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Role } from "@/generated/prisma";
import { useActionState, useEffect } from "react";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

type EditUserDialogProps = {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function EditUserDialog({
  user,
  open,
  onOpenChange,
}: EditUserDialogProps) {
  const updateUserWithId = updateUserAction.bind(null, user.id);
  const [state, formAction, isPending] = useActionState(
    updateUserWithId,
    undefined
  );

  // Close dialog on success
  useEffect(() => {
    if (state?.success) {
      onOpenChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user details.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {/* General form error */}
          {state?.errors?._form && (
            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
              {state.errors._form.join(", ")}
            </div>
          )}

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter user name"
              disabled={isPending}
              defaultValue={state?.data?.name || user.name || ""}
              aria-describedby={state?.errors?.name ? "name-error" : undefined}
              className={state?.errors?.name ? "border-destructive" : ""}
            />
            {state?.errors?.name && (
              <p id="name-error" className="text-sm text-destructive">
                {state.errors.name.join(", ")}
              </p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              name="role"
              defaultValue={state?.data?.role || user.role}
              disabled={isPending}
            >
              <SelectTrigger
                className={state?.errors?.role ? "border-destructive" : ""}
              >
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Role.USER}>User</SelectItem>
                <SelectItem value={Role.ORG_ADMIN}>Org Admin</SelectItem>
              </SelectContent>
            </Select>
            {state?.errors?.role && (
              <p id="role-error" className="text-sm text-destructive">
                {state.errors.role.join(", ")}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : "Update User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
