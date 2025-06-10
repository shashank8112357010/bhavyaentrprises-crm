import { z } from "zod";

export const rateCardSchema = z.object({
  description: z.string().min(1),
  unit: z.string().min(1),
  rate: z.number().positive(),
  bankName: z.string().min(1),
  srNo: z.number().int().positive().optional(), // Optional for CSV uploads
});

// Schema for inline rate card creation (without serial number - auto-generated in backend)
export const inlineRateCardFormSchema = z.object({
  description: z.string().min(1, "Description is required"),
  unit: z.string().min(1, "Unit is required"),
  rate: z.number().positive("Rate must be positive"),
  bankName: z.string().min(1, "Bank name is required"),
});
