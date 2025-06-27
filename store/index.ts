// Store exports for cleaner imports
export { useTicketStore } from "./ticketStore";
export { useAgentStore } from "./agentStore";
export { useClientStore } from "./clientStore";
export { useAuthStore } from "./authStore";
export { useNotificationStore } from "./notificationStore";
export { useQuotationStore } from "./quotationStore";
// Re-export types
export type {
  Ticket,
  Status,
  TicketState,
  CreateTicketInput,
  FetchTicketsFilters,
  DashboardCounts,
  
  Assignee,
  
  Expense,
  Client,
  Comment,
} from "./ticketStore";
