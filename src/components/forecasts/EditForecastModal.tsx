"use client";

import { updateForecastAction as orgAdminUpdateAction } from "@/app/(protected)/(org-admin)/forecasts/[forecastId]/actions";
import { updateForecastAction as superAdminUpdateAction } from "@/app/(protected)/(super-admin)/orgs/[orgId]/forecasts/[forecastId]/actions";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/datetime-picker";
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
import { DataType, Forecast, ForecastType } from "@/generated/prisma";
import { Plus, X } from "lucide-react";
import { useActionState, useState } from "react";

type ForecastWithOrg = Forecast & {
  organization: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
};

type Category = {
  id: string;
  name: string;
  color: string | null;
};

type EditForecastModalProps = {
  forecast: ForecastWithOrg;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Whether this is for org admin context */
  isOrgAdmin?: boolean;
  /** Available categories for the organization */
  categories?: Category[];
};

export default function EditForecastModal({
  forecast,
  open,
  onOpenChange,
  isOrgAdmin = false,
  categories = [],
}: EditForecastModalProps) {
  // Use different action based on context
  const [state, formAction, isPending] = useActionState(
    isOrgAdmin
      ? orgAdminUpdateAction.bind(null, forecast.id)
      : superAdminUpdateAction.bind(null, forecast.organizationId, forecast.id),
    undefined
  );

  const [selectedType, setSelectedType] = useState<ForecastType>(
    state?.data?.type ? (state.data.type as ForecastType) : forecast.type
  );

  const [selectedDataType, setSelectedDataType] = useState<DataType | "">(
    (state?.data?.dataType as DataType) || forecast.dataType || ""
  );

  const [options, setOptions] = useState<string[]>(
    state?.data?.options ||
      (forecast.type === ForecastType.CATEGORICAL && forecast.options
        ? (forecast.options as string[])
        : [])
  );

  const [newOption, setNewOption] = useState("");

  const [dueDate, setDueDate] = useState<Date | undefined>(
    state?.data?.dueDate
      ? new Date(state.data.dueDate)
      : new Date(forecast.dueDate)
  );

  const [dataReleaseDate, setDataReleaseDate] = useState<Date | undefined>(
    state?.data?.dataReleaseDate
      ? new Date(state.data.dataReleaseDate)
      : forecast.dataReleaseDate
      ? new Date(forecast.dataReleaseDate)
      : undefined
  );

  // Handler to change type and clear options if switching away from CATEGORICAL
  const handleTypeChange = (value: ForecastType) => {
    setSelectedType(value);
    // Clear options if switching away from CATEGORICAL
    if (value !== ForecastType.CATEGORICAL) {
      setOptions([]);
      setNewOption("");
    }
    // Clear dataType if switching away from CONTINUOUS
    if (value !== ForecastType.CONTINUOUS) {
      setSelectedDataType("");
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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Forecast</DialogTitle>
          <DialogDescription>
            Update the forecast details for {forecast.organization.name}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-6">
          {state?.errors?._form && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {state.errors._form.join(", ")}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              defaultValue={state?.data?.title || forecast.title}
              placeholder="Enter forecast title"
              aria-invalid={!!state?.errors?.title}
              disabled={isPending}
            />
            {state?.errors?.title && (
              <p className="text-sm text-destructive">
                {state.errors.title.join(", ")}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              defaultValue={
                state?.data?.description || forecast.description || ""
              }
              placeholder="Enter forecast description (optional)"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              aria-invalid={!!state?.errors?.description}
              disabled={isPending}
            />
            {state?.errors?.description && (
              <p className="text-sm text-destructive">
                {state.errors.description.join(", ")}
              </p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">
              Forecast Type <span className="text-destructive">*</span>
            </Label>
            <Select
              name="type"
              value={selectedType}
              onValueChange={(value) => handleTypeChange(value as ForecastType)}
              disabled={isPending}
            >
              <SelectTrigger aria-invalid={!!state?.errors?.type}>
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
              <p className="text-sm text-destructive">
                {state.errors.type.join(", ")}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {selectedType === ForecastType.BINARY &&
                "Binary forecasts have true/false outcomes"}
              {selectedType === ForecastType.CONTINUOUS &&
                "Continuous forecasts accept numerical values"}
              {selectedType === ForecastType.CATEGORICAL &&
                "Categorical forecasts have predefined options"}
            </p>
          </div>

          {/* Data Type - Only for Continuous */}
          {selectedType === ForecastType.CONTINUOUS && (
            <div className="space-y-2">
              <Label htmlFor="dataType">
                Data Type <span className="text-destructive">*</span>
              </Label>
              <Select
                name="dataType"
                value={selectedDataType}
                onValueChange={(value) =>
                  setSelectedDataType(value as DataType)
                }
                disabled={isPending}
              >
                <SelectTrigger aria-invalid={!!state?.errors?.dataType}>
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DataType.NUMBER}>Number</SelectItem>
                  <SelectItem value={DataType.CURRENCY}>Currency</SelectItem>
                  <SelectItem value={DataType.PERCENT}>Percent</SelectItem>
                  <SelectItem value={DataType.DECIMAL}>Decimal</SelectItem>
                  <SelectItem value={DataType.INTEGER}>Integer</SelectItem>
                </SelectContent>
              </Select>
              {state?.errors?.dataType && (
                <p className="text-sm text-destructive">
                  {state.errors.dataType.join(", ")}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Specify the type of numerical data for proper formatting
              </p>
            </div>
          )}

          {/* Category */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select
                name="categoryId"
                defaultValue={forecast.categoryId || ""}
                disabled={isPending}
              >
                <SelectTrigger aria-invalid={!!state?.errors?.categoryId}>
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        {category.color && (
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                        )}
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state?.errors?.categoryId && (
                <p className="text-sm text-destructive">
                  {state.errors.categoryId.join(", ")}
                </p>
              )}
            </div>
          )}

          {/* Categorical Options */}
          {selectedType === ForecastType.CATEGORICAL && (
            <div className="space-y-2">
              <Label>
                Options <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div
                    key={`${option}-${index}`}
                    className="flex items-center gap-2"
                  >
                    <Input
                      name="options"
                      value={option}
                      readOnly
                      disabled={isPending}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                      disabled={isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add new option"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addOption();
                      }
                    }}
                    disabled={isPending}
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
                <p className="text-sm text-destructive">
                  {state.errors.options.join(", ")}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Add at least 2 options for categorical forecasts
              </p>
            </div>
          )}

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">
              Due Date & Time <span className="text-destructive">*</span>
            </Label>
            <DateTimePicker
              date={dueDate}
              onSelect={setDueDate}
              placeholder="Select due date and time"
              disabled={isPending}
            />
            {/* Hidden input to submit the datetime value */}
            <input
              type="hidden"
              name="dueDate"
              value={dueDate ? dueDate.toISOString() : ""}
            />
            {state?.errors?.dueDate && (
              <p className="text-sm text-destructive">
                {state.errors.dueDate.join(", ")}
              </p>
            )}
          </div>

          {/* Data Release Date */}
          <div className="space-y-2">
            <Label htmlFor="dataReleaseDate">Data Release Date & Time</Label>
            <DateTimePicker
              date={dataReleaseDate}
              onSelect={setDataReleaseDate}
              placeholder="Select data release date and time (optional)"
              disabled={isPending}
            />
            {/* Hidden input to submit the datetime value */}
            <input
              type="hidden"
              name="dataReleaseDate"
              value={dataReleaseDate ? dataReleaseDate.toISOString() : ""}
            />
            {state?.errors?.dataReleaseDate && (
              <p className="text-sm text-destructive">
                {state.errors.dataReleaseDate.join(", ")}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              When the actual data will be released (must be on or after due
              date)
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
