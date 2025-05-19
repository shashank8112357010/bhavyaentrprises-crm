import axios from "@/lib/axios";

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
  try {
    const response = await axios.post("/lead/create-lead", payload, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.error || "Failed to create lead.";
    throw new Error(message);
  }
}

// ------------ 2. Get All Leads --------------
export async function getAllLeads() {
  try {
    const response = await axios.get("/lead", {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.error || "Failed to fetch leads.";
    throw new Error(message);
  }
}

// ------------ 3. Reassign Lead --------------
export interface ReassignLeadPayload {
  leadId: string;
  newAssignedTo: string; 
}

export async function reassignLead(payload: ReassignLeadPayload) {
  try {
    const response = await axios.patch("/lead/reassign", payload, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.error || "Failed to reassign lead.";
    throw new Error(message);
  }
}
