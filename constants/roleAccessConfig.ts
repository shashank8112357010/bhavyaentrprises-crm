// lib/roleAccessConfig.ts

export type Role = 'ADMIN' | 'BACKEND' | 'RM' | 'MST' | 'ACCOUNTS';

// Define the role-based access configuration for navigation items
export const navRoleAccess: Record<Role, string[]> = {
  ADMIN: [
    "Dashboard",
    "Kanban Board",
    "Clients",
    "Agents",
    "Finances",
    "Rate Card",
    "Calls",
    "Email Templates",
    "Settings",
  ],
  BACKEND: ["Dashboard", "Settings"],
  RM: ["Dashboard", "Kanban Board", "Clients", "Agents", "Calls", "Email Templates"],
  MST: ["Dashboard", "Kanban Board", "Agents", "Calls"],
  ACCOUNTS: ["Dashboard", "Finances", "Rate Card"],
};

// Define the role-based access configuration for paths
export const pathRoleAccess: Record<Role, string[]> = {
  ADMIN: [
    "/dashboard",
    "/dashboard/kanban",
    "/dashboard/clients",
    "/dashboard/agents",
    "/dashboard/finances",
    "/dashboard/rate-card",
    "/dashboard/calls",
    "/dashboard/email-template",
    "/dashboard/settings",
    "/admin",
  ],
  BACKEND: ["/dashboard", "/dashboard/settings"],
  RM: ["/dashboard", "/dashboard/kanban", "/dashboard/clients", "/dashboard/agents", "/dashboard/calls", "/dashboard/email-template"],
  MST: ["/dashboard", "/dashboard/kanban", "/dashboard/agents", "/dashboard/calls"],
  ACCOUNTS: ["/dashboard", "/dashboard/finances", "/dashboard/rate-card"],
};
