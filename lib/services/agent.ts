import APIService from "@/lib/services/api-service";
import { Agent, CreateAgentPayload } from "@/components/agent/types";

interface GetAllAgentsParams {
  page?: number;
  limit?: number;
  searchQuery?: string;
}

interface PaginatedAgentsResponse {
  data: Agent[];
  total: number;
  page: number;
  limit: number;
}

export async function createAgent(payload: CreateAgentPayload) {
  return APIService.createAgentAccount(payload);
}

export async function getAllAgents(
  params: GetAllAgentsParams = {},
): Promise<PaginatedAgentsResponse> {
  const response = await APIService.getAgents({
    page: params.page,
    limit: params.limit,
    search: params.searchQuery
  });
  
  // Ensure compatibility with existing interface
  return {
    data: response.data as Agent[],
    total: response.total,
    page: response.page,
    limit: response.limit
  };
}

// Fetch all agents (no pagination, for dropdowns/forms)
export async function getAllAgentsUnpaginated(): Promise<Agent[]> {
  const response = await APIService.getAllAgentsUnpaginated();
  return (response as any).data || response;
}

export async function deleteAgent(id: string) {
  return APIService.deleteAgent(id);
}

export async function getAgentById(id: string) {
  const response = await APIService.getAgentById(id) as any;
  return response.agent || response;
}

export async function updateAgent(id: string, updatedAgent: Agent) {
  const response = await APIService.updateAgent(id, updatedAgent) as any;
  return response.agent || response;
}

// Wrapper exports for consistency with APIService pattern
export const getAgents = (params: any) => APIService.getAgents(params);
export const createAgentViaAPI = (data: any) => APIService.createAgentAccount(data);
export const updateAgentViaAPI = (id: string, data: any) => APIService.updateAgent(id, data);
export const deleteAgentViaAPI = (id: string) => APIService.deleteAgent(id);
export const getAgentByIdViaAPI = (id: string) => APIService.getAgentById(id);
