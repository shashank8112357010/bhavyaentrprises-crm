// validations/quotationSchema.ts
import { z } from "zod";

// Define a schema for each rate card detail object
const rateCardDetailSchema = z.object({
  rateCardId: z.string(),
  quantity: z.number().min(1),
  gstType: z.number().min(18).max(28), // Assuming GST types are 18 and 28
});

import { QuotationStatus } from "@prisma/client";

// Define the main quotation schema
export const quotationSchema = z.object({
  name: z.string().min(1),
  clientId: z.string().uuid(),
  rateCardDetails: z.array(rateCardDetailSchema).min(1), // Array of rate card detail objects
  ticketId: z.string().optional(),
  status: z.nativeEnum(QuotationStatus).optional(),
});
