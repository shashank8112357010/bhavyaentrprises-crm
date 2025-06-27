"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateClientSchema = exports.createClientSchema = void 0;
// lib/validations/clientSchema.ts
const zod_1 = require("zod");
exports.createClientSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    type: zod_1.z.enum(["Bank", "NBFC", "Insurance", "Corporate"]),
    totalBranches: zod_1.z.number().int().min(0),
    contactPerson: zod_1.z.string().min(1, "Contact person is required"),
    contactEmail: zod_1.z
        .string()
        .optional()
        .refine((val) => !val || val === "" || zod_1.z.string().email().safeParse(val).success, {
        message: "Invalid email format",
    }),
    gstn: zod_1.z.string().optional(),
    contactPhone: zod_1.z.string().min(1, "Contact phone is required"),
    contractStatus: zod_1.z.enum(["Active", "Inactive"]),
    lastServiceDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    }),
    avatar: zod_1.z.string().optional(),
    initials: zod_1.z.string().optional().default(""),
});
exports.updateClientSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required").optional(),
    type: zod_1.z.enum(["Bank", "NBFC", "Insurance", "Corporate"]).optional(),
    totalBranches: zod_1.z.number().int().min(0).optional(),
    contactPerson: zod_1.z.string().min(1, "Contact person is required").optional(),
    contactEmail: zod_1.z
        .string()
        .optional()
        .refine((val) => !val || val === "" || zod_1.z.string().email().safeParse(val).success, {
        message: "Invalid email format",
    }),
    gstn: zod_1.z.string().optional(),
    contactPhone: zod_1.z.string().min(1, "Contact phone is required").optional(),
    contractStatus: zod_1.z.enum(["Active", "Inactive"]).optional(),
    lastServiceDate: zod_1.z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    })
        .optional(),
    avatar: zod_1.z.string().optional(),
    initials: zod_1.z.string().optional(),
});
