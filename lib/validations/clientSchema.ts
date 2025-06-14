// lib/validations/clientSchema.ts
import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["Bank", "NBFC", "Insurance", "Corporate"]),
  totalBranches: z.number().int().min(0),
  contactPerson: z.string().min(1, "Contact person is required"),
  contactEmail: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === "" || z.string().email().safeParse(val).success,
      {
        message: "Invalid email format",
      },
    ),
  gstn: z.string().optional(),
  contactPhone: z.string().min(1, "Contact phone is required"),
  contractStatus: z.enum(["Active", "Inactive"]),
  lastServiceDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  avatar: z.string().optional(),
  initials: z.string().optional().default(""),
});

export const updateClientSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  type: z.enum(["Bank", "NBFC", "Insurance", "Corporate"]).optional(),
  totalBranches: z.number().int().min(0).optional(),
  contactPerson: z.string().min(1, "Contact person is required").optional(),
  contactEmail: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === "" || z.string().email().safeParse(val).success,
      {
        message: "Invalid email format",
      },
    ),
  gstn: z.string().optional(),
  contactPhone: z.string().min(1, "Contact phone is required").optional(),
  contractStatus: z.enum(["Active", "Inactive"]).optional(),
  lastServiceDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    })
    .optional(),
  avatar: z.string().optional(),
  initials: z.string().optional(),
});
