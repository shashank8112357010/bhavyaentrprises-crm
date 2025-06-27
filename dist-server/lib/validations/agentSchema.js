"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgentSchema = void 0;
// lib/validations/agentSchema.ts
const zod_1 = require("zod");
exports.createAgentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    email: zod_1.z.string().email("Invalid email address"),
    mobile: zod_1.z.string()
        .min(10, "Mobile number must be at least 10 digits")
        .max(15, "Mobile number must be at most 15 digits")
        .regex(/^[0-9]+$/, "Mobile number must contain only digits"),
    role: zod_1.z.enum(["ADMIN", "BACKEND", "RM", "MST", "ACCOUNTS"]),
});
