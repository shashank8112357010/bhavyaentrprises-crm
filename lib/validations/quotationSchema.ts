// validations/quotationSchema.ts
import { z } from "zod";

// Define a schema for each rate card detail object
const rateCardDetailSchema = z.object({
  rateCardId: z.string(),
  quantity: z.number().min(1),
  gstType: z.number().min(18).max(28), // Assuming GST types are 18 and 28
});

// Define the main quotation schema used for CREATION
export const quotationSchema = z.object({
  name: z.string().min(1, "Quotation name/title is required."),
  clientId: z.string().uuid("Valid client ID is required."),
  rateCardDetails: z.array(rateCardDetailSchema).min(1, "At least one item is required in rateCardDetails."),
  ticketId: z.string().uuid().optional().nullable(),

  // New fields based on frontend and subtask description
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "ARCHIVED"]).optional(),
  expiryDate: z.coerce.date().optional().nullable(),
  currency: z.string().optional(), // Should ideally have a default on backend if not provided
  notes: z.string().optional().nullable(),

  // Totals sent by frontend - backend should verify or recalculate
  subTotal: z.number().optional(), // Make optional as backend should ideally recalculate
  gst: z.number().optional(),      // Make optional
  grandTotal: z.number().optional(),// Make optional

  // Serial and Quote numbers: frontend might send them, but backend should generate the authoritative ones.
  // Making them optional here if they are part of the payload from client.
  serialNo: z.number().optional(), 
  quoteNo: z.string().optional(),
});

// Define the schema for updating a quotation (all fields optional)
export const updateQuotationSchema = z.object({
  name: z.string().min(1).optional(),
  clientId: z.string().uuid().optional(),
  rateCardDetails: z.array(rateCardDetailSchema).min(1).optional(),
  ticketId: z.string().uuid().optional().nullable(), // Allow null to remove ticket association
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "ARCHIVED"]).optional(),
  expiryDate: z.coerce.date().optional().nullable(), // coerce to date, allow null
  currency: z.string().optional(),
  notes: z.string().optional().nullable(),
  // For PDF regeneration logic, we don't explicitly list fields here,
  // but the API handler will check if any PDF-affecting field is present in the payload.
  // Fields like subtotal, gst, grandTotal are calculated, so they are not part of the update schema directly.
  // pdfUrl will be updated internally if PDF is regenerated.
});
