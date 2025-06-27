"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inlineRateCardFormSchema = exports.rateCardSchema = void 0;
const zod_1 = require("zod");
exports.rateCardSchema = zod_1.z.object({
    description: zod_1.z.string().min(1),
    unit: zod_1.z.string().min(1),
    rate: zod_1.z.number().positive(),
    bankName: zod_1.z.string().min(1),
    srNo: zod_1.z.number().int().positive().optional(), // Optional for CSV uploads
});
// Schema for inline rate card creation (without serial number - auto-generated in backend)
exports.inlineRateCardFormSchema = zod_1.z.object({
    description: zod_1.z.string().min(1, "Description is required"),
    unit: zod_1.z.string().min(1, "Unit is required"),
    rate: zod_1.z.number().positive("Rate must be positive"),
    bankName: zod_1.z.string().min(1, "Bank name is required"),
});
