import axios from "@/lib/axios";

export interface CreateAgentPayload {
  id?: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
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

export async function getAllAgents() {
  try {
    const response = await axios.get("/agent", {
      withCredentials: true,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error || "Failed to fetch agents.";
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
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error || "Failed to fetch agent.";
    throw new Error(message);
  }
}
