"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorkStageSchema = exports.updateWorkStageSchema = exports.addQuotationSchema = exports.updateTicketStatusSchema = exports.updateTicketSchema = exports.createTicketSchema = void 0;
// lib/validations/ticketSchema.ts
const zod_1 = require("zod");
const commentSchema = zod_1.z.object({
    text: zod_1.z.string(),
    ticketId: zod_1.z.string().min(1),
    userId: zod_1.z.string().max(28), // Assuming GST types are 18 and 28
});
exports.createTicketSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required"),
    branch: zod_1.z.string().min(1, "Branch is required"),
    priority: zod_1.z.string().min(1, "Priority is required"),
    dueDate: zod_1.z
        .string()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    })
        .optional(),
    scheduledDate: zod_1.z
        .string()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    })
        .optional(),
    description: zod_1.z.string().min(1, "Description is required"),
    comments: zod_1.z.array(commentSchema).optional(), // Array of comments - removed min(1)
    holdReason: zod_1.z.string().optional(),
    assigneeId: zod_1.z.string().min(1, "Assignee ID is required"),
    clientId: zod_1.z.string().min(1, "Client ID is required"),
});
exports.updateTicketSchema = zod_1.z.object({
    id: zod_1.z.string().uuid("Invalid ticket ID format"),
    title: zod_1.z.string().min(1, "Title is required").optional(),
    branch: zod_1.z.string().min(1, "Branch is required").optional(),
    priority: zod_1.z.string().min(1, "Priority is required").optional(),
    dueDate: zod_1.z
        .string()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    })
        .optional(),
    scheduledDate: zod_1.z
        .string()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    })
        .optional(),
    description: zod_1.z.string().min(1, "Description is required").optional(),
    comments: zod_1.z.array(commentSchema).optional(),
    holdReason: zod_1.z.string().optional(),
    assigneeId: zod_1.z.string().min(1, "Assignee ID is required").optional(),
    clientId: zod_1.z.string().min(1, "Client ID is required").optional(),
});
exports.updateTicketStatusSchema = zod_1.z.object({
    status: zod_1.z.enum([
        "new",
        "inProgress",
        "onHold",
        "completed",
        "billing_pending",
        "billing_completed",
    ]),
});
exports.addQuotationSchema = zod_1.z.object({
    quoteNo: zod_1.z.string().min(1, "Quote number is required"),
    dateReceived: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    }),
    quoteTaxable: zod_1.z.number().min(0),
    quoteAmount: zod_1.z.number().min(0),
});
exports.updateWorkStageSchema = zod_1.z.object({
    stateName: zod_1.z.string().min(1, "State name is required").optional(),
    adminName: zod_1.z.string().min(1, "Admin name is required").optional(),
    clientName: zod_1.z.string().min(1, "Client name is required").optional(),
    siteName: zod_1.z.string().min(1, "Site name is required").optional(),
    quoteNo: zod_1.z.string().min(1, "Quote number is required").optional(),
    dateReceived: zod_1.z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    })
        .optional(),
    quoteTaxable: zod_1.z.number().min(0).optional(),
    quoteAmount: zod_1.z.number().min(0).optional(),
    workStatus: zod_1.z.string().min(1, "Work status is required").optional(),
    approval: zod_1.z.string().min(1, "Approval is required").optional(),
    poStatus: zod_1.z.boolean(),
    poNumber: zod_1.z.string().min(1, "PO number is required").optional(),
    jcrStatus: zod_1.z.boolean(),
    agentName: zod_1.z.string().min(1, "Agent name is required").optional(),
});
exports.createWorkStageSchema = zod_1.z.object({
    stateName: zod_1.z.string().min(1, "State name is required"),
    adminName: zod_1.z.string().min(1, "Admin name is required"),
    clientName: zod_1.z.string().min(1, "Client name is required"),
    siteName: zod_1.z.string().min(1, "Site name is required"),
    quoteNo: zod_1.z.string().min(1, "Quote number is required"),
    dateReceived: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    }),
    quoteTaxable: zod_1.z.number().min(0),
    quoteAmount: zod_1.z.number().min(0),
    workStatus: zod_1.z.string().min(1, "Work status is required"),
    approval: zod_1.z.string().min(1, "Approval is required"),
    poStatus: zod_1.z.boolean(),
    poNumber: zod_1.z.string().min(1, "PO number is required"),
    jcrStatus: zod_1.z.boolean(),
    agentName: zod_1.z.string().min(1, "Agent name is required"),
});
