"use client";

import PredictionForm from "@/components/forecasts/PredictionForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ForecastType } from "@/generated/prisma";
import { Edit, Plus } from "lucide-react";
import { useState } from "react";

type PredictionDialogProps = {
  forecastId: string;
  forecastTitle: string;
  forecastType: ForecastType;
  categoricalOptions?: string[];
  existingPrediction?: {
    id: string;
    value: string;
    confidence: number | null;
    reasoning: string | null;
    method: string | null;
    estimatedTime: number | null;
    equityInvestment: number | null;
    debtFinancing: number | null;
  } | null;
};

export default function PredictionDialog({
  forecastId,
  forecastTitle,
  forecastType,
  categoricalOptions = [],
  existingPrediction,
}: PredictionDialogProps) {
  const [open, setOpen] = useState(false);
  const isUpdate = !!existingPrediction;

  // Close dialog after a delay when success is achieved
  const handleSuccess = () => {
    setTimeout(() => {
      setOpen(false);
    }, 1500); // Give user time to see success message
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          {isUpdate ? (
            <>
              <Edit className="mr-2 h-4 w-4" />
              Update Prediction
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Submit Prediction
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isUpdate ? "Update Your Prediction" : "Submit Your Prediction"}
          </DialogTitle>
          <DialogDescription>
            {isUpdate
              ? `Update your prediction for "${forecastTitle}". You can change your prediction anytime before the deadline.`
              : `Submit your prediction for "${forecastTitle}". You can update it later if needed.`}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <PredictionForm
            forecastId={forecastId}
            forecastType={forecastType}
            categoricalOptions={categoricalOptions}
            existingPrediction={existingPrediction}
            onSuccess={handleSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
