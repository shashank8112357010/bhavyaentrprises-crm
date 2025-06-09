// validations/quotationSchema.ts
import { z } from "zod";

const rateCardDetailSchema = z.object({
  rateCardId: z.string(),
  quantity: z.number().min(1),
  gstType: z.number().min(0).max(100), // Allow 0-100% GST range
});

export const quotationSchema = z.object({
  name: z.string().min(1),
  clientId: z.string().uuid(),
  rateCardDetails: z.array(rateCardDetailSchema).min(1),
  ticketId: z.string().optional(),
  salesType: z.string().min(1),
  validUntil: z.string().optional(),
  expectedExpense: z.number().min(0).optional(),
});
