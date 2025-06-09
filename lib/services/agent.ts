import axios from "@/lib/axios";
import { Agent, CreateAgentPayload } from "@/components/agent/types";

interface GetAllAgentsParams {
  page?: number;
  limit?: number;
  searchQuery?: string;
}

// Make sure the return type matches the API response structure
interface PaginatedAgentsResponse {
  data: Agent[]; // Assuming Agent type is defined
  total: number;
  page: number;
  limit: number;
}

export async function createAgent(payload: CreateAgentPayload) {
  try {
    const response = await axios.post("/agent/create-agent", payload, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    console.log(error);

    const message = error.response?.data?.message || "Failed to create agent.";
    throw new Error(message);
  }
}

export async function getAllAgents(
  params: GetAllAgentsParams = {},
): Promise<PaginatedAgentsResponse> {
  try {
    const { page = 1, limit = 10, searchQuery = "" } = params;
    const response = await axios.get("/agent", {
      withCredentials: true,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Expires: "0",
      },
      params: { page, limit, search: searchQuery }, // Pass params to API
    });
    return response.data; // Should now be the paginated response
  } catch (error: any) {
    const message =
      error.response?.data?.message || // Use message from API error if available
      error.response?.data?.error ||
      "Failed to fetch agents.";
    throw new Error(message);
  }
}

export async function deleteAgent(id: string) {
  try {
    const response = await axios.delete(`/agent/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to delete agent.";
    throw new Error(message);
  }
}

export async function getAgentById(id: string) {
  try {
    const response = await axios.get(`/agent/${id}`, {
      withCredentials: true,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
    // Handle the API response wrapper
    return response.data.agent || response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Failed to fetch agent.";
    throw new Error(message);
  }
}

export async function updateAgent(id: string, updatedAgent: Agent) {
  try {
    const response = await axios.patch(`/agent/${id}`, updatedAgent, {
      withCredentials: true,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error || "Failed to fetch agent.";
    throw new Error(message);
  }
}
