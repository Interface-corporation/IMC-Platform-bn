import { z } from "zod";

export const commonValidations = {
  resetCode: z
    .string()
    .refine((data) => !Number.isNaN(Number(data)), "ID must be a numeric value")
    .transform(Number)
    .refine((num) => num > 0, "ID must be a positive number"),

  id: z.string(),
  // ... other common validations
};
