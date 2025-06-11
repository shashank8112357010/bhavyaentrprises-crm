// lib/roleAccessConfig.ts

export type Role = 'ADMIN' | 'BACKEND' | 'RM' | 'MST' | 'ACCOUNTS';

// Define the role-based access configuration for navigation items
export const navRoleAccess: Record<Role, string[]> = {
  ADMIN: [
    "Dashboard",
    "Kanban Board",
    "Clients",
    "Agents",
    "Quotations",
    "Expenses",
    "Rate Card",
    "Calls",
    "Email Templates",
    "Settings",
  ],
  BACKEND: ["Dashboard", "Settings" , "Kanban Board" ,  "Agents",   "Rate Card"],
  RM: ["Dashboard", "Kanban Board", "Clients", "Agents", "Calls", "Email Templates"],
  MST: ["Dashboard", "Kanban Board", "Agents", "Calls"],
  ACCOUNTS: [
    "Dashboard",
    "Kanban Board",
    "Clients",
    "Agents",
    "Quotations",
    "Expenses",
    "Rate Card",
    "Calls",
    "Email Templates",
    "Settings",
  ],
};

// Define the role-based access configuration for paths
export const pathRoleAccess: Record<Role, string[]> = {
  ADMIN: [
    "/dashboard",
    "/dashboard/kanban",
    "/dashboard/clients",
    "/dashboard/agents",
    "/dashboard/quotations",
    "/dashboard/expenses",
    "/dashboard/rate-card",
    "/dashboard/calls",
    "/dashboard/email-template",
    "/dashboard/settings",
    "/admin",
  ],
  BACKEND: ["/dashboard", "/dashboard/settings" , "/dashboard/kanban" ,   "/dashboard/rate-card",     "/dashboard/agents",],
  RM: ["/dashboard", "/dashboard/kanban", "/dashboard/clients", "/dashboard/agents", "/dashboard/calls", "/dashboard/email-template"],
  MST: ["/dashboard", "/dashboard/kanban", "/dashboard/agents", "/dashboard/calls"],
  ACCOUNTS: [
    "/dashboard",
    "/dashboard/kanban",
    "/dashboard/clients",
    "/dashboard/agents",
    "/dashboard/quotations",
    "/dashboard/expenses",
    "/dashboard/rate-card",
    "/dashboard/calls",
    "/dashboard/email-template",
    "/dashboard/settings",
    "/admin",
  ],
};
