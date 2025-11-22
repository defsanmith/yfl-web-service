"use server";

import { auth } from "@/auth";
import Router from "@/constants/router";
import { ForecastType, LedgerKind } from "@/generated/prisma"; // [ECONOMY] Added LedgerKind import
import {
  ActionState,
  createErrorState,
  extractFormData,
  formDataToString,
  validateFormData,
} from "@/lib/server-action-utils";
import {
  createPredictionSchema,
  updatePredictionSchema,
} from "@/schemas/predictions";
import {
  createPrediction,
  updatePrediction,
  validatePredictionCreation,
  validatePredictionUpdate,
} from "@/services/predictions";
import { revalidatePath } from "next/cache";

// [ECONOMY] Import finance helpers
import {
  CENTS,
  createLedgerEntry,
  ensureStartingBalancesForUser,
  getUserBalanceCents,
} from "@/services/finance";

type PredictionFormData = {
  value: string;
  confidence: string;
  reasoning: string | null;
  method: string | null;
  estimatedTime: string;
  equityInvestment: string;
  debtFinancing: string;
};

// [ECONOMY] Per-prediction cap (still 20M per investment type)
const MAX_INVEST_PER_PREDICTION = 20_000_000;

export async function createPredictionAction(
  forecastId: string,
  forecastType: ForecastType,
  prevState: ActionState<PredictionFormData> | undefined,
  formData: FormData
): Promise<ActionState<PredictionFormData>> {
  // 1. Verify authentication
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorState({
      _form: ["You must be logged in to submit a prediction"],
    });
  }

  // [ECONOMY] Ensure user has their starting $1B (idempotent)
  await ensureStartingBalancesForUser(session.user.id);

  // 2. Extract form data
  const rawData = extractFormData(formData, [
    "value",
    "confidence",
    "reasoning",
    "method",
    "estimatedTime",
    "equityInvestment",
    "debtFinancing",
  ]);

  // 3. Validate schema
  const validation = validateFormData(createPredictionSchema, {
    forecastId,
    forecastType,
    value: formDataToString(rawData.value),
    confidence: rawData.confidence
      ? formDataToString(rawData.confidence)
      : undefined,
    reasoning: rawData.reasoning
      ? formDataToString(rawData.reasoning)
      : undefined,
    method: rawData.method ? formDataToString(rawData.method) : undefined,
    estimatedTime: rawData.estimatedTime
      ? formDataToString(rawData.estimatedTime)
      : undefined,
    equityInvestment: rawData.equityInvestment
      ? formDataToString(rawData.equityInvestment)
      : undefined,
    debtFinancing: rawData.debtFinancing
      ? formDataToString(rawData.debtFinancing)
      : undefined,
  });

  if (!validation.success) {
    return createErrorState(validation.errors, {
      value: formDataToString(rawData.value),
      confidence: formDataToString(rawData.confidence) || "",
      reasoning: formDataToString(rawData.reasoning) || null,
      method: formDataToString(rawData.method) || null,
      estimatedTime: formDataToString(rawData.estimatedTime) || "",
      equityInvestment: formDataToString(rawData.equityInvestment) || "",
      debtFinancing: formDataToString(rawData.debtFinancing) || "",
    });
  }

  // 4. Validate business rules (domain-level, non-money)
  const businessValidation = await validatePredictionCreation({
    ...validation.data,
    userId: session.user.id,
  });

  if (!businessValidation.valid) {
    return createErrorState(businessValidation.errors, {
      value: validation.data.value,
      confidence: validation.data.confidence?.toString() || "",
      reasoning: validation.data.reasoning || null,
      method: validation.data.method || null,
      estimatedTime: validation.data.estimatedTime?.toString() || "",
      equityInvestment: validation.data.equityInvestment?.toString() || "",
      debtFinancing: validation.data.debtFinancing?.toString() || "",
    });
  }

  // ───────────────────────────────────────────────────────────────
  // [ECONOMY] Money rules & credit line checks
  // ───────────────────────────────────────────────────────────────
  const equityInvestment = validation.data.equityInvestment ?? 0; // dollars
  const debtFinancing = validation.data.debtFinancing ?? 0;       // dollars

  // Non-negative sanity check (in case schema ever changes)
  if (equityInvestment < 0 || debtFinancing < 0) {
    return createErrorState(
      { _form: ["Investments cannot be negative"] },
      {
        value: validation.data.value,
        confidence: validation.data.confidence?.toString() || "",
        reasoning: validation.data.reasoning || null,
        method: validation.data.method || null,
        estimatedTime: validation.data.estimatedTime?.toString() || "",
        equityInvestment: equityInvestment.toString(),
        debtFinancing: debtFinancing.toString(),
      }
    );
  }

  // Per-prediction caps (20M each)
  if (equityInvestment > MAX_INVEST_PER_PREDICTION) {
    return createErrorState(
      {
        _form: [
          `Equity investment cannot exceed $${MAX_INVEST_PER_PREDICTION.toLocaleString()}`,
        ],
      },
      {
        value: validation.data.value,
        confidence: validation.data.confidence?.toString() || "",
        reasoning: validation.data.reasoning || null,
        method: validation.data.method || null,
        estimatedTime: validation.data.estimatedTime?.toString() || "",
        equityInvestment: equityInvestment.toString(),
        debtFinancing: debtFinancing.toString(),
      }
    );
  }

  if (debtFinancing > MAX_INVEST_PER_PREDICTION) {
    return createErrorState(
      {
        _form: [
          `Debt financing cannot exceed $${MAX_INVEST_PER_PREDICTION.toLocaleString()}`,
        ],
      },
      {
        value: validation.data.value,
        confidence: validation.data.confidence?.toString() || "",
        reasoning: validation.data.reasoning || null,
        method: validation.data.method || null,
        estimatedTime: validation.data.estimatedTime?.toString() || "",
        equityInvestment: equityInvestment.toString(),
        debtFinancing: debtFinancing.toString(),
      }
    );
  }

  // Fetch current cash balance in cents
  const balanceCents = await getUserBalanceCents(session.user.id);
  const equityCents = CENTS(equityInvestment);
  const debtCents = CENTS(debtFinancing);

  // Equity must be fully covered by current cash
  if (equityCents > balanceCents) {
    return createErrorState(
      { _form: ["Not enough cash to make this equity investment"] },
      {
        value: validation.data.value,
        confidence: validation.data.confidence?.toString() || "",
        reasoning: validation.data.reasoning || null,
        method: validation.data.method || null,
        estimatedTime: validation.data.estimatedTime?.toString() || "",
        equityInvestment: equityInvestment.toString(),
        debtFinancing: debtFinancing.toString(),
      }
    );
  }

  // Debt line can be 100% of current balance
  const maxBorrowCents = balanceCents; // 100% of balance
  if (debtCents > maxBorrowCents) {
    return createErrorState(
      { _form: ["Debt financing exceeds your available credit limit"] },
      {
        value: validation.data.value,
        confidence: validation.data.confidence?.toString() || "",
        reasoning: validation.data.reasoning || null,
        method: validation.data.method || null,
        estimatedTime: validation.data.estimatedTime?.toString() || "",
        equityInvestment: equityInvestment.toString(),
        debtFinancing: debtFinancing.toString(),
      }
    );
  }

  // 5. Create prediction (domain object)
  await createPrediction({
    ...validation.data,
    userId: session.user.id,
  });

  // ───────────────────────────────────────────────────────────────
  // [ECONOMY] Ledger entries for this prediction
  // ───────────────────────────────────────────────────────────────
  const userId = session.user.id;
  const organizationId = session.user.organizationId ?? null;

  // A. Equity: pure cash out (EXPENSE)
  if (equityInvestment > 0) {
    await createLedgerEntry({
      userId,
      organizationId,
      kind: LedgerKind.EXPENSE,
      amountCents: -equityCents, // negative cash movement
      memo: `Equity investment on forecast ${forecastId}`,
    });
  }

  // B. Debt financing: borrow → invest → track liability
  if (debtFinancing > 0) {
    // 1) Loan proceeds: cash in
    await createLedgerEntry({
      userId,
      organizationId,
      kind: LedgerKind.PAYMENT,
      amountCents: debtCents,
      memo: `Borrowed $${debtFinancing.toLocaleString()} for forecast ${forecastId}`,
    });

    // 2) Invest borrowed funds: cash out
    await createLedgerEntry({
      userId,
      organizationId,
      kind: LedgerKind.EXPENSE,
      amountCents: -debtCents,
      memo: `Invested borrowed funds for forecast ${forecastId}`,
    });

    // 3) Track liability: DEBT, no cash movement
    await createLedgerEntry({
      userId,
      organizationId,
      kind: LedgerKind.DEBT,
      amountCents: 0,
      memo: `Debt opened: $${debtFinancing.toLocaleString()} principal`,
    });
  }

  // 6. Revalidate cache
  revalidatePath(Router.USER_FORECAST_DETAIL(forecastId));

  return { success: true };
}

export async function updatePredictionAction(
  predictionId: string,
  forecastId: string,
  forecastType: ForecastType,
  prevState: ActionState<PredictionFormData> | undefined,
  formData: FormData
): Promise<ActionState<PredictionFormData>> {
  // 1. Verify authentication
  const session = await auth();
  if (!session?.user?.id) {
    return createErrorState({
      _form: ["You must be logged in to update a prediction"],
    });
  }

  // 2. Extract form data
  const rawData = extractFormData(formData, [
    "value",
    "confidence",
    "reasoning",
    "method",
    "estimatedTime",
    "equityInvestment",
    "debtFinancing",
  ]);

  // 3. Validate schema
  const validation = validateFormData(updatePredictionSchema, {
    id: predictionId,
    forecastType,
    value: formDataToString(rawData.value),
    confidence: rawData.confidence
      ? formDataToString(rawData.confidence)
      : undefined,
    reasoning: rawData.reasoning
      ? formDataToString(rawData.reasoning)
      : undefined,
    method: rawData.method ? formDataToString(rawData.method) : undefined,
    estimatedTime: rawData.estimatedTime
      ? formDataToString(rawData.estimatedTime)
      : undefined,
    equityInvestment: rawData.equityInvestment
      ? formDataToString(rawData.equityInvestment)
      : undefined,
    debtFinancing: rawData.debtFinancing
      ? formDataToString(rawData.debtFinancing)
      : undefined,
  });

  if (!validation.success) {
    return createErrorState(validation.errors, {
      value: formDataToString(rawData.value),
      confidence: formDataToString(rawData.confidence) || "",
      reasoning: formDataToString(rawData.reasoning) || null,
      method: formDataToString(rawData.method) || null,
      estimatedTime: formDataToString(rawData.estimatedTime) || "",
      equityInvestment: formDataToString(rawData.equityInvestment) || "",
      debtFinancing: formDataToString(rawData.debtFinancing) || "",
    });
  }

  // 4. Validate business rules
  const businessValidation = await validatePredictionUpdate(validation.data);

  if (!businessValidation.valid) {
    return createErrorState(businessValidation.errors, {
      value: validation.data.value,
      confidence: validation.data.confidence?.toString() || "",
      reasoning: validation.data.reasoning || null,
      method: validation.data.method || null,
      estimatedTime: validation.data.estimatedTime?.toString() || "",
      equityInvestment: validation.data.equityInvestment?.toString() || "",
      debtFinancing: validation.data.debtFinancing?.toString() || "",
    });
  }

  // [ECONOMY-TODO] You might later add logic here to diff old vs new
  // equity/debt and adjust ledger entries accordingly.

  // 5. Update prediction
  await updatePrediction(validation.data);

  // 6. Revalidate cache
  revalidatePath(Router.USER_FORECAST_DETAIL(forecastId));

  return { success: true };
}
