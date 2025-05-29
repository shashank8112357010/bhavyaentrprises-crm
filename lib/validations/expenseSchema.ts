import { z } from "zod";

export const expenseSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  category: z.enum(["LABOR", "TRANSPORT", "MATERIAL", "OTHER"]),
  quotationId: z.string().optional(),
  ticketId: z.string().optional(),
});
