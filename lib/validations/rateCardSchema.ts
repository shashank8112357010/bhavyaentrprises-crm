import { z } from "zod";

export const rateCardSchema = z.object({
  srNo: z.number().int().nonnegative(),
  description: z.string().min(1),
  unit: z.string().min(1),
  rate: z.number().positive(),
  bankName: z.string().min(1),
  bankRcNo: z.string().min(1),
});
