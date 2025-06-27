"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expenseSchema = void 0;
const zod_1 = require("zod");
exports.expenseSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    description: zod_1.z.string().min(1),
    category: zod_1.z.enum(["LABOR", "TRANSPORT", "MATERIAL", "OTHER"]),
    quotationId: zod_1.z.string().optional(),
    ticketId: zod_1.z.string().optional(),
});
