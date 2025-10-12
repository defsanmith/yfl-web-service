import { ZodSchema } from "zod";

/**
 * Standard action state structure for server actions
 */
export type ActionState<TData = Record<string, unknown>> = {
  success: boolean;
  errors?: Record<string, string[]>;
  data?: TData;
};

/**
 * Extract form data into an object
 * @param formData - FormData from the form submission
 * @param fields - Array of field names to extract
 * @returns Object with extracted form data
 *
 * @example
 * ```typescript
 * const data = extractFormData(formData, ['name', 'email', 'description']);
 * // Returns: { name: 'John', email: 'john@example.com', description: 'Lorem ipsum' }
 * ```
 */
export function extractFormData(
  formData: FormData,
  fields: string[]
): Record<string, FormDataEntryValue | null> {
  return fields.reduce((acc, field) => {
    acc[field] = formData.get(field);
    return acc;
  }, {} as Record<string, FormDataEntryValue | null>);
}

/**
 * Validate form data with a Zod schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with success status, data, and errors
 *
 * @example
 * ```typescript
 * const result = validateFormData(createUserSchema, rawData);
 * if (!result.success) {
 *   return {
 *     success: false,
 *     errors: result.errors,
 *     data: rawData,
 *   };
 * }
 * // Use result.data which is now type-safe
 * await createUser(result.data);
 * ```
 */
export function validateFormData<T>(
  schema: ZodSchema<T>,
  data: unknown
):
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Create an error action state
 * @param errors - Field errors or general form error
 * @param data - Original form data to preserve
 * @returns Action state with error
 *
 * @example
 * ```typescript
 * // Field-specific error
 * return createErrorState(
 *   { email: ["Email already exists"] },
 *   { email: 'john@example.com', name: 'John' }
 * );
 *
 * // General form error
 * return createErrorState(
 *   { _form: ["Failed to create user"] },
 *   formData
 * );
 * ```
 */
export function createErrorState<TData = Record<string, unknown>>(
  errors: Record<string, string[]>,
  data?: TData
): ActionState<TData> {
  return {
    success: false,
    errors,
    data,
  };
}

/**
 * Type guard to check if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Convert FormDataEntryValue to string safely
 */
export function formDataToString(value: FormDataEntryValue | null): string {
  if (value === null) return "";
  if (typeof value === "string") return value;
  return ""; // For File objects, return empty string
}
