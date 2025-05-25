// lib/validations/ticketSchema.ts
import { z } from "zod";

export const createTicketSchema = z.object({
  title: z.string().min(1, "Title is required"),
  branch: z.string().min(1, "Branch is required"),
  priority: z.string().min(1, "Priority is required"),
  dueDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }).optional(),
  scheduledDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }).optional(),
  description: z.string().min(1, "Description is required"),
  comments: z.number().int().min(0),
  holdReason: z.string().optional(),
  assigneeId: z.string().min(1, "Assignee ID is required"),
  clientId: z.string().min(1, "Client ID is required"),
});

export const updateTicketSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  branch: z.string().min(1, "Branch is required").optional(),
  priority: z.string().min(1, "Priority is required").optional(),
  dueDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }).optional(),
  scheduledDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }).optional(),
  description: z.string().min(1, "Description is required").optional(),
  comments: z.number().int().min(0).optional(),
  holdReason: z.string().optional(),
  assigneeId: z.string().min(1, "Assignee ID is required").optional(),
  clientId: z.string().min(1, "Client ID is required").optional(),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(["new", "inProgress", "scheduled", "onHold", "completed"]),
});

export const addQuotationSchema = z.object({
  quoteNo: z.string().min(1, "Quote number is required"),
  dateReceived: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  quoteTaxable: z.number().min(0),
  quoteAmount: z.number().min(0),
});

export const updateWorkStageSchema = z.object({
    stateName: z.string().min(1, "State name is required").optional(),
    adminName: z.string().min(1, "Admin name is required").optional(),
    clientName: z.string().min(1, "Client name is required").optional(),
    siteName: z.string().min(1, "Site name is required").optional(),
    quoteNo: z.string().min(1, "Quote number is required").optional(),
    dateReceived: z.string().refine(val => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }).optional(),
    quoteTaxable: z.number().min(0).optional(),
    quoteAmount: z.number().min(0).optional(),
    workStatus: z.string().min(1, "Work status is required").optional(),
    approval: z.string().min(1, "Approval is required").optional(),
    poStatus: z.string().min(1, "PO status is required").optional(),
    poNumber: z.string().min(1, "PO number is required").optional(),
    jcrStatus: z.string().min(1, "JCR status is required").optional(),
    agentName: z.string().min(1, "Agent name is required").optional(),
  });

  export const createWorkStageSchema = z.object({
    stateName: z.string().min(1, "State name is required"),
    adminName: z.string().min(1, "Admin name is required"),
    clientName: z.string().min(1, "Client name is required"),
    siteName: z.string().min(1, "Site name is required"),
    quoteNo: z.string().min(1, "Quote number is required"),
    dateReceived: z.string().refine(val => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
    quoteTaxable: z.number().min(0),
    quoteAmount: z.number().min(0),
    workStatus: z.string().min(1, "Work status is required"),
    approval: z.string().min(1, "Approval is required"),
    poStatus: z.string().min(1, "PO status is required"),
    poNumber: z.string().min(1, "PO number is required"),
    jcrStatus: z.string().min(1, "JCR status is required"),
    agentName: z.string().min(1, "Agent name is required"),
  });