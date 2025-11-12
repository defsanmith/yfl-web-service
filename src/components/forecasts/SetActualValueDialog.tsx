"use client";

import { setActualValueAction as orgAdminSetAction } from "@/app/(protected)/(org-admin)/forecasts/[forecastId]/actions";
import { setActualValueAction as superAdminSetAction } from "@/app/(protected)/(super-admin)/orgs/[orgId]/forecasts/[forecastId]/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ForecastType } from "@/generated/prisma";
import { useActionState, useEffect } from "react";

type SetActualValueDialogProps = {
  forecastId: string;
  organizationId: string;
  forecastType: ForecastType;
  forecastTitle: string;
  currentActualValue?: string | null;
  dueDate: Date;
  dataReleaseDate?: Date | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOrgAdmin?: boolean;
};

export default function SetActualValueDialog({
  forecastId,
  organizationId,
  forecastType,
  forecastTitle,
  currentActualValue,
  dueDate,
  dataReleaseDate,
  open,
  onOpenChange,
  isOrgAdmin = false,
}: SetActualValueDialogProps) {
  const action = isOrgAdmin
    ? orgAdminSetAction.bind(null, forecastId)
    : superAdminSetAction.bind(null, organizationId, forecastId);

  const [state, formAction, isPending] = useActionState(action, undefined);

  // Close dialog on success (when redirect doesn't happen immediately)
  useEffect(() => {
    if (state && !state.errors) {
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  const now = new Date();
  const willUpdateDates =
    now < dueDate || (dataReleaseDate && now < dataReleaseDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Actual Value</DialogTitle>
          <DialogDescription>
            Set the actual outcome for &quot;{forecastTitle}&quot;.
            {willUpdateDates && (
              <span className="mt-2 block text-sm font-medium text-amber-600">
                ⚠️ Since you&apos;re setting the actual value before the due
                date or data release date, both dates will be automatically
                updated to the current time.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {state?.errors?._form && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.errors._form.join(", ")}
            </div>
          )}

          {forecastType === ForecastType.BINARY && (
            <div className="space-y-3">
              <Label>Actual Outcome</Label>
              <RadioGroup
                name="actualValue"
                defaultValue={currentActualValue || undefined}
                required
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="true" />
                  <Label htmlFor="true" className="cursor-pointer font-normal">
                    True
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="false" />
                  <Label htmlFor="false" className="cursor-pointer font-normal">
                    False
                  </Label>
                </div>
              </RadioGroup>
              {state?.errors?.actualValue && (
                <p className="text-sm text-destructive">
                  {state.errors.actualValue.join(", ")}
                </p>
              )}
            </div>
          )}

          {forecastType === ForecastType.CONTINUOUS && (
            <div className="space-y-2">
              <Label htmlFor="actualValue">Actual Value</Label>
              <Input
                id="actualValue"
                name="actualValue"
                type="number"
                step="any"
                placeholder="Enter the actual value"
                defaultValue={currentActualValue || ""}
                required
                aria-invalid={!!state?.errors?.actualValue}
              />
              {state?.errors?.actualValue && (
                <p className="text-sm text-destructive">
                  {state.errors.actualValue.join(", ")}
                </p>
              )}
            </div>
          )}

          {forecastType === ForecastType.CATEGORICAL && (
            <div className="space-y-2">
              <Label htmlFor="actualValue">Actual Value</Label>
              <Input
                id="actualValue"
                name="actualValue"
                type="text"
                placeholder="Enter the actual value"
                defaultValue={currentActualValue || ""}
                required
                aria-invalid={!!state?.errors?.actualValue}
              />
              {state?.errors?.actualValue && (
                <p className="text-sm text-destructive">
                  {state.errors.actualValue.join(", ")}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter one of the predefined categorical options.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Setting..." : "Set Actual Value"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
