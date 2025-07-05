import APIService from "@/lib/services/api-service";

// ------------ 1. Create Lead --------------
export interface CreateLeadPayload {
  name: string;
  email?: string;
  phone: string;
  product?: string;
  status?: string;
  source?: string;
  value?: number;
  tags?: string[];
}

export async function createLead(payload: CreateLeadPayload) {
  return APIService.createLead(payload);
}

// ------------ 2. Get All Leads --------------
export async function getAllLeads() {
  return APIService.getLeads();
}

// ------------ 3. Reassign Lead --------------
export interface ReassignLeadPayload {
  leadId: string;
  newAssignedTo: string; 
}

export async function reassignLead(payload: ReassignLeadPayload) {
  return APIService.reassignLead(payload);
}

// Wrapper exports for consistency with APIService pattern
export const getLeads = () => APIService.getLeads();
export const createLeadViaAPI = (data: any) => APIService.createLead(data);
export const reassignLeadViaAPI = (data: any) => APIService.reassignLead(data);
