"use client";

import { createForecastAction as orgAdminCreateAction } from "@/app/(protected)/(org-admin)/forecasts/actions";
import { createForecastAction as superAdminCreateAction } from "@/app/(protected)/(super-admin)/orgs/[orgId]/forecasts/actions";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ForecastType } from "@/generated/prisma";
import { AlertCircle, Calendar, Info, Plus, Settings, X } from "lucide-react";
import { useActionState, useState } from "react";

type CreateForecastModalProps = {
  orgId: string;
  orgName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Whether this is for org admin context (if true, orgId is ignored) */
  isOrgAdmin?: boolean;
};

export default function CreateForecastModal({
  orgId,
  orgName,
  open,
  onOpenChange,
  isOrgAdmin = false,
}: CreateForecastModalProps) {
  // Use different action based on context
  const [state, formAction, isPending] = useActionState(
    isOrgAdmin
      ? orgAdminCreateAction
      : superAdminCreateAction.bind(null, orgId),
    undefined
  );

  const [selectedType, setSelectedType] = useState<ForecastType>(
    state?.data?.type ? (state.data.type as ForecastType) : ForecastType.BINARY
  );

  const [options, setOptions] = useState<string[]>(state?.data?.options || []);

  const [newOption, setNewOption] = useState("");

  const [dueDate, setDueDate] = useState<Date | undefined>(
    state?.data?.dueDate ? new Date(state.data.dueDate) : undefined
  );

  // Handler to change type and clear options if switching away from CATEGORICAL
  const handleTypeChange = (value: ForecastType) => {
    setSelectedType(value);
    // Clear options if switching away from CATEGORICAL
    if (value !== ForecastType.CATEGORICAL) {
      setOptions([]);
      setNewOption("");
    }
  };

  const addOption = () => {
    if (newOption.trim()) {
      const trimmedOption = newOption.trim();
      // Check for duplicates
      if (!options.includes(trimmedOption)) {
        setOptions([...options, trimmedOption]);
      }
      setNewOption("");
    }
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Forecast</DialogTitle>
          <DialogDescription className="text-base">
            Create a new forecast for{" "}
            <span className="font-medium text-foreground">{orgName}</span>
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-2" />

        <form action={formAction} className="space-y-6">
          {state?.errors?._form && (
            <div className="flex items-start gap-3 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>{state.errors._form.join(", ")}</div>
            </div>
          )}

          {/* Basic Information Section */}
          <div className="space-y-5">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Info className="h-4 w-4" />
                Basic Information
              </h3>
              <Separator />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Forecast Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                defaultValue={state?.data?.title || ""}
                placeholder="e.g., Will we exceed Q1 revenue targets?"
                aria-invalid={!!state?.errors?.title}
                disabled={isPending}
                className="text-base"
              />
              {state?.errors?.title && (
                <p className="text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {state.errors.title.join(", ")}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description{" "}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={state?.data?.description || ""}
                placeholder="Provide additional context or details about this forecast..."
                aria-invalid={!!state?.errors?.description}
                disabled={isPending}
                className="min-h-[100px] resize-none"
              />
              {state?.errors?.description && (
                <p className="text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {state.errors.description.join(", ")}
                </p>
              )}
            </div>
          </div>

          {/* Forecast Configuration Section */}
          <div className="space-y-5">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Forecast Configuration
              </h3>
              <Separator />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium">
                Forecast Type <span className="text-destructive">*</span>
              </Label>
              <Select
                name="type"
                value={selectedType}
                onValueChange={(value) =>
                  handleTypeChange(value as ForecastType)
                }
                disabled={isPending}
              >
                <SelectTrigger
                  aria-invalid={!!state?.errors?.type}
                  className="text-base"
                >
                  <SelectValue placeholder="Select forecast type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ForecastType.BINARY}>Binary</SelectItem>
                  <SelectItem value={ForecastType.CONTINUOUS}>
                    Continuous
                  </SelectItem>
                  <SelectItem value={ForecastType.CATEGORICAL}>
                    Categorical
                  </SelectItem>
                </SelectContent>
              </Select>
              {state?.errors?.type && (
                <p className="text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {state.errors.type.join(", ")}
                </p>
              )}
              <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                {selectedType === ForecastType.BINARY &&
                  "📊 Participants will predict True or False outcomes"}
                {selectedType === ForecastType.CONTINUOUS &&
                  "📈 Participants will provide numerical predictions"}
                {selectedType === ForecastType.CATEGORICAL &&
                  "📋 Participants will choose from predefined options"}
              </div>
            </div>

            {/* Categorical Options */}
            {selectedType === ForecastType.CATEGORICAL && (
              <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <Label className="text-sm font-medium">
                  Categorical Options{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div
                      key={`${option}-${index}`}
                      className="flex items-center gap-2"
                    >
                      <div className="flex items-center gap-2 flex-1 rounded-md border bg-background px-3 py-2">
                        <span className="text-muted-foreground text-xs font-medium w-6">
                          {index + 1}.
                        </span>
                        <Input
                          name="options"
                          value={option}
                          readOnly
                          disabled={isPending}
                          className="border-0 shadow-none p-0 h-auto focus-visible:ring-0"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        disabled={isPending}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-2">
                    <Input
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      placeholder="Type a new option and press Enter or click +"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addOption();
                        }
                      }}
                      disabled={isPending}
                      className="text-base"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      onClick={addOption}
                      disabled={isPending}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {state?.errors?.options && (
                  <p className="text-sm text-destructive flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {state.errors.options.join(", ")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  💡 Add at least 2 options. Each option should be clear and
                  distinct.
                </p>
              </div>
            )}
          </div>

          {/* Schedule Section */}
          <div className="space-y-5">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </h3>
              <Separator />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-sm font-medium">
                Due Date <span className="text-destructive">*</span>
              </Label>
              <DatePicker
                date={dueDate}
                onSelect={setDueDate}
                placeholder="Select when this forecast is due"
                disabled={isPending}
              />
              {/* Hidden input to submit the date value */}
              <input
                type="hidden"
                name="dueDate"
                value={dueDate ? dueDate.toISOString().split("T")[0] : ""}
              />
              {state?.errors?.dueDate && (
                <p className="text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {state.errors.dueDate.join(", ")}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                The date when predictions will be evaluated
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              size="lg"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} size="lg">
              {isPending ? "Creating..." : "Create Forecast"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
