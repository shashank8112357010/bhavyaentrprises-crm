// validations/quotationSchema.ts
import { z } from "zod";

const rateCardDetailSchema = z.object({
  rateCardId: z.string(),
  quantity: z.number().min(1),
  gstPercentage: z.number().min(0).max(100), // Changed from gstType to gstPercentage
  totalValue: z.number().optional(), // Add totalValue as optional since it's calculated
});

export const quotationSchema = z.object({
  name: z.string().min(1),
  clientId: z.string().uuid(),
  rateCardDetails: z.array(rateCardDetailSchema).min(1),
  ticketId: z.string().optional(),
  salesType: z.string().min(1),
  validUntil: z.string().optional(),
  expectedExpense: z.number().min(0).optional(),
  // Add other form fields
  serialNumber: z.string().optional(),
  date: z.string().min(1),
  quotationNumber: z.string().min(1),
  discount: z.string().optional(),
});

// Form schema for the quotation form component
export const quotationFormSchema = z.object({
  serialNumber: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  salesType: z.string().min(1, "Sales type is required"),
  quotationNumber: z.string().min(1, "Quotation number is required"),
  validUntil: z.string().optional(),
  discount: z.string().optional(),
  expectedExpense: z.string().optional(), // Keep as string for form input, will be converted to number
});
