// validations/quotationSchema.ts
import { z } from "zod";

export const quotationSchema = z.object({
  name: z.string().min(1),
  clientId: z.string(),
  rateCardIds: z.array(z.string().uuid()).min(1),
  ticketId: z.string().uuid().optional(),
});
