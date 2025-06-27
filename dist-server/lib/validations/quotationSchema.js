"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotationFormSchema = exports.quotationSchema = void 0;
// validations/quotationSchema.ts
const zod_1 = require("zod");
const rateCardDetailSchema = zod_1.z.object({
    rateCardId: zod_1.z.string(),
    quantity: zod_1.z.number().min(1),
    gstPercentage: zod_1.z.number().min(0).max(100), // Changed from gstType to gstPercentage
    totalValue: zod_1.z.number().optional(), // Add totalValue as optional since it's calculated
});
exports.quotationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    clientId: zod_1.z.string().uuid(),
    rateCardDetails: zod_1.z.array(rateCardDetailSchema).min(1),
    ticketId: zod_1.z.string().optional(),
    salesType: zod_1.z.string().min(1),
    validUntil: zod_1.z.string().optional(),
    expectedExpense: zod_1.z.number().min(0).optional(),
    // Add other form fields
    serialNumber: zod_1.z.string().optional(),
    date: zod_1.z.string().min(1),
    quotationNumber: zod_1.z.string().min(1),
    discount: zod_1.z.string().optional(),
});
// Form schema for the quotation form component
exports.quotationFormSchema = zod_1.z.object({
    serialNumber: zod_1.z.string().optional(),
    date: zod_1.z.string().min(1, "Date is required"),
    salesType: zod_1.z.string().min(1, "Sales type is required"),
    quotationNumber: zod_1.z.string().min(1, "Quotation number is required"),
    validUntil: zod_1.z.string().optional(),
    discount: zod_1.z.string().optional(),
    expectedExpense: zod_1.z.string().optional(), // Keep as string for form input, will be converted to number
});
