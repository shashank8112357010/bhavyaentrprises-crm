// validations/quotationSchema.ts
import { z } from "zod";

const rateCardDetailSchema = z.object({
  rateCardId: z.string(),
  quantity: z.coerce.number().min(1), // Accept string or number
  gstPercentage: z.coerce.number().min(0).max(100), // Accept string or number
  totalValue: z.coerce.number().optional(), // Accept string or number
  srNo: z.coerce.number(), // Accept string or number
  description: z.string(),
  unit: z.string(),
  rate: z.coerce.number(), // Accept string or number
  bankName: z.string(),
});



export const quotationSchema = z.object({
  name: z.string().min(1),
  clientId: z.string().uuid(),
  rateCardDetails: z.array(rateCardDetailSchema).min(1),
  ticketId: z.string().optional(),
  subtotal: z.coerce.number().min(0), // Accept string or number
  gst: z.coerce.number().min(0), // Accept string or number
  grandTotal: z.coerce.number().min(0), // Accept string or number
  salesType: z.string().min(1),
  // Allow validUntil to be a valid string, empty string, or null
  validUntil: z.union([
    z.string(),
    z.literal(''),
    z.null()
  ]).optional(),
  expectedExpense: z.coerce.number().min(0).optional(), // Accept string or number
  client : z.object({
    name: z.string().min(1),
    contactPerson: z.string().min(1),
    contactEmail: z.string().optional(),
    contactPhone: z.string().min(1),
    gstn: z.string().optional(),
  }),

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
