"use client";

import {
  createPredictionAction,
  updatePredictionAction,
} from "@/app/(protected)/(user)/f/[forecastId]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ForecastType } from "@/generated/prisma";
import { useActionState } from "react";

type PredictionFormProps = {
  forecastId: string;
  forecastType: ForecastType;
  categoricalOptions?: string[];
  existingPrediction?: {
    id: string;
    value: string;
    confidence: number | null;
    reasoning: string | null;
  } | null;
  isReadOnly?: boolean;
  onSuccess?: () => void;
};

export default function PredictionForm({
  forecastId,
  forecastType,
  categoricalOptions = [],
  existingPrediction,
  isReadOnly = false,
  onSuccess,
}: PredictionFormProps) {
  const isUpdate = !!existingPrediction;

  const [state, formAction, isPending] = useActionState(
    isUpdate
      ? updatePredictionAction.bind(
          null,
          existingPrediction.id,
          forecastId,
          forecastType
        )
      : createPredictionAction.bind(null, forecastId, forecastType),
    undefined
  );

  // Show success message if submission was successful
  if (state?.success) {
    // Call onSuccess callback if provided (e.g., to close dialog)
    if (onSuccess) {
      onSuccess();
    }

    return (
      <div className="rounded-lg border border-green-500 bg-green-50 p-4">
        <h3 className="font-semibold text-green-900">
          {isUpdate ? "Prediction Updated!" : "Prediction Submitted!"}
        </h3>
        <p className="text-sm text-green-700 mt-1">
          {isUpdate
            ? "Your prediction has been successfully updated."
            : "Your prediction has been successfully recorded."}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.errors?._form && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            {state.errors._form.join(", ")}
          </p>
        </div>
      )}

      {/* Value Input - varies by forecast type */}
      <div className="space-y-2">
        <Label htmlFor="value">
          Your Prediction <span className="text-destructive">*</span>
        </Label>

        {forecastType === ForecastType.BINARY && (
          <Select
            name="value"
            defaultValue={state?.data?.value || existingPrediction?.value || ""}
            disabled={isReadOnly || isPending}
          >
            <SelectTrigger
              className={state?.errors?.value ? "border-destructive" : ""}
            >
              <SelectValue placeholder="Select your prediction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        )}

        {forecastType === ForecastType.CONTINUOUS && (
          <Input
            type="number"
            step="any"
            id="value"
            name="value"
            placeholder="Enter a numerical value"
            defaultValue={state?.data?.value || existingPrediction?.value || ""}
            disabled={isReadOnly || isPending}
            aria-invalid={!!state?.errors?.value}
            className={state?.errors?.value ? "border-destructive" : ""}
          />
        )}

        {forecastType === ForecastType.CATEGORICAL && (
          <Select
            name="value"
            defaultValue={state?.data?.value || existingPrediction?.value || ""}
            disabled={isReadOnly || isPending}
          >
            <SelectTrigger
              className={state?.errors?.value ? "border-destructive" : ""}
            >
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {categoricalOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {state?.errors?.value && (
          <p className="text-sm text-destructive">
            {state.errors.value.join(", ")}
          </p>
        )}
      </div>

      {/* Confidence Level (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="confidence">
          Confidence Level (0-100){" "}
          <span className="text-muted-foreground">(Optional)</span>
        </Label>
        <Input
          type="number"
          id="confidence"
          name="confidence"
          min="0"
          max="100"
          placeholder="e.g., 75"
          defaultValue={
            state?.data?.confidence ||
            existingPrediction?.confidence?.toString() ||
            ""
          }
          disabled={isReadOnly || isPending}
          aria-invalid={!!state?.errors?.confidence}
          className={state?.errors?.confidence ? "border-destructive" : ""}
        />
        {state?.errors?.confidence && (
          <p className="text-sm text-destructive">
            {state.errors.confidence.join(", ")}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          How confident are you in this prediction? (0 = not confident, 100 =
          very confident)
        </p>
      </div>

      {/* Reasoning (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="reasoning">
          Reasoning <span className="text-muted-foreground">(Optional)</span>
        </Label>
        <Textarea
          id="reasoning"
          name="reasoning"
          placeholder="Explain your reasoning..."
          rows={4}
          maxLength={1000}
          defaultValue={
            state?.data?.reasoning || existingPrediction?.reasoning || ""
          }
          disabled={isReadOnly || isPending}
          aria-invalid={!!state?.errors?.reasoning}
          className={state?.errors?.reasoning ? "border-destructive" : ""}
        />
        {state?.errors?.reasoning && (
          <p className="text-sm text-destructive">
            {state.errors.reasoning.join(", ")}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Share your thought process (max 1000 characters)
        </p>
      </div>

      {/* Submit Button */}
      {!isReadOnly && (
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending
            ? isUpdate
              ? "Updating..."
              : "Submitting..."
            : isUpdate
            ? "Update Prediction"
            : "Submit Prediction"}
        </Button>
      )}
    </form>
  );
}
