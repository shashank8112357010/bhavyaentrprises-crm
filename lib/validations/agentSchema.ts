// lib/validations/agentSchema.ts
import { z } from "zod";

export const createAgentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  mobile: z.string()
    .min(10, "Mobile number must be at least 10 digits")
    .max(15, "Mobile number must be at most 15 digits")
    .regex(/^[0-9]+$/, "Mobile number must contain only digits"),
  role: z.enum(["ADMIN", "BACKEND", "RM", "MST", "ACCOUNTS"]),
});
