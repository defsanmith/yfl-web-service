"use client";

import { createUserAction } from "@/app/(protected)/(super-admin)/orgs/[orgId]/actions";
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
import { useActionState, useEffect, useRef } from "react";

type CreateUserDialogProps = {
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CreateUserDialog({
  organizationId,
  open,
  onOpenChange,
}: CreateUserDialogProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    createUserAction,
    undefined
  );

  // Close dialog and reset form on success
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      onOpenChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to this organization.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          {/* Hidden organization ID */}
          <input type="hidden" name="organizationId" value={organizationId} />

          {/* General form error */}
          {state?.errors?._form && (
            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
              {state.errors._form.join(", ")}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter user name"
              required
              disabled={isPending}
              defaultValue={state?.success ? "" : state?.data?.name || ""}
              aria-describedby={state?.errors?.name ? "name-error" : undefined}
              className={state?.errors?.name ? "border-destructive" : ""}
            />
            {state?.errors?.name && (
              <p id="name-error" className="text-sm text-destructive">
                {state.errors.name.join(", ")}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter user email"
              required
              disabled={isPending}
              defaultValue={state?.success ? "" : state?.data?.email || ""}
              aria-describedby={
                state?.errors?.email ? "email-error" : undefined
              }
              className={state?.errors?.email ? "border-destructive" : ""}
            />
            {state?.errors?.email && (
              <p id="email-error" className="text-sm text-destructive">
                {state.errors.email.join(", ")}
              </p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">
              Role <span className="text-destructive">*</span>
            </Label>
            <Select
              name="role"
              defaultValue={
                state?.success ? Role.USER : state?.data?.role || Role.USER
              }
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
              {isPending ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
