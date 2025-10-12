"use client";

import { createOrganizationAction } from "@/app/(protected)/(super-admin)/orgs/create/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState } from "react";

export default function CreateOrganizationView() {
  const [state, formAction, isPending] = useActionState(
    createOrganizationAction,
    undefined
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Organization</CardTitle>
        <CardDescription>
          Add a new organization to the system. Only super admins can create
          organizations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {/* General form error */}
          {state?.errors?._form && (
            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
              {state.errors._form.join(", ")}
            </div>
          )}

          {/* Organization Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Organization Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter organization name"
              required
              disabled={isPending}
              defaultValue={state?.data?.name || ""}
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
              defaultValue={state?.data?.description || ""}
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
          <div className="flex gap-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Organization"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
