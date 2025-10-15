"use client";

import { updateOrganizationAction } from "@/app/(protected)/(super-admin)/orgs/[orgId]/actions";
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
import { useActionState, useEffect } from "react";

type Organization = {
  id: string;
  name: string;
  description: string | null;
};

type EditOrganizationDialogProps = {
  organization: Organization;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function EditOrganizationDialog({
  organization,
  open,
  onOpenChange,
}: EditOrganizationDialogProps) {
  const updateOrganizationWithId = updateOrganizationAction.bind(
    null,
    organization.id
  );
  const [state, formAction, isPending] = useActionState(
    updateOrganizationWithId,
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
          <DialogTitle>Edit Organization</DialogTitle>
          <DialogDescription>
            Update the organization details.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {/* General form error */}
          {state?.errors?._form && (
            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
              {state.errors._form.join(", ")}
            </div>
          )}

          {/* Organization Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter organization name"
              disabled={isPending}
              defaultValue={state?.data?.name || organization.name}
              aria-describedby={state?.errors?.name ? "name-error" : undefined}
              className={state?.errors?.name ? "border-destructive" : ""}
            />
            {state?.errors?.name && (
              <p id="name-error" className="text-sm text-destructive">
                {state.errors.name.join(", ")}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Enter organization description (optional)"
              disabled={isPending}
              defaultValue={
                state?.data?.description || organization.description || ""
              }
              aria-describedby={
                state?.errors?.description ? "description-error" : undefined
              }
              className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${
                state?.errors?.description ? "border-destructive" : ""
              }`}
            />
            {state?.errors?.description && (
              <p id="description-error" className="text-sm text-destructive">
                {state.errors.description.join(", ")}
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
              {isPending ? "Updating..." : "Update Organization"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
