// File: components/client/types.ts

export interface Client {
  id: string;
  displayId?: string; // Add displayId field
  name: string;
  type: string; // e.g., "Bank"
  totalBranches: number;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  contractStatus: string; // e.g., "Active"
  lastServiceDate: string;
  avatar?: string;
  gstn: string;
  initials: string;
  state?: string;
}

export interface CreateClientPayload {
  name: string;
  type: string;
  totalBranches: number;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  contractStatus: string;
  lastServiceDate: string;
  avatar?: string;
  initials: string;
  state?: string;
}
