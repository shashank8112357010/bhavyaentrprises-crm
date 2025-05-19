import axios from "@/lib/axios";

export interface CreateClientPayload {
    id?: string;
    name: string;
    type: string;
    totalBranches: number;
    contactPerson: string;
    contactEmail: string;
    contactPhone: string;
    contractStatus: string;
    lastServiceDate: string;
    avatar: string;
    initials: string;
    activeTickets?: number;
  };



export async function createClient(payload: CreateClientPayload) {
    try {
      const response = await axios.post("/client", payload, {
        withCredentials: true,
      });
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error || "Failed to create lead.";
      throw new Error(message);
    }
  }

// ------------ 2. Get All Lead --------------
export async function getAllClients() {
    try {
      const response = await axios.get("/client", {
        withCredentials: true,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.error || "Failed to fetch clients.";
      throw new Error(message);
    }
  }
  