import { z } from "zod";
import { isValidDateString, isValidMonthString } from "./date.js";

// +998XXXXXXXXX - country code 998 followed by exactly 9 digits.
const PHONE_RE = /^\+998\d{9}$/;

export const studentCreateSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  phone: z.string().regex(PHONE_RE, "phone must look like +998XXXXXXXXX"),
  group: z.string().trim().min(1, "group is required"),
  monthlyFee: z.coerce.number().int().positive("monthlyFee must be a positive integer"),
});

export const studentUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "name is required"),
    phone: z.string().regex(PHONE_RE, "phone must look like +998XXXXXXXXX"),
    group: z.string().trim().min(1, "group is required"),
    monthlyFee: z.coerce.number().int().positive("monthlyFee must be a positive integer"),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "at least one field must be provided");

export const paymentCreateSchema = z.object({
  studentId: z.coerce.number().int().positive("studentId must be a positive integer"),
  amount: z.coerce.number().int().positive("amount must be a positive integer"),
  date: z
    .string()
    .refine(isValidDateString, "date must be a real date in YYYY-MM-DD format")
    .optional(),
});

export const monthQuerySchema = z
  .string({ required_error: "month query parameter is required" })
  .refine(isValidMonthString, "month must be in YYYY-MM format with a valid month 01-12");

export function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join("; ");
}
