import axios from "@/lib/axios";
import { Client } from "@/components/clients/types";

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
  avatar?: string;
  initials: string;
  activeTickets?: number;
}

export async function createClient(payload: CreateClientPayload) {
  try {
    const response = await axios.post("/client", payload, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error || "Failed to create lead.";
    throw new Error(message);
  }
}

// ------------ 7. Import Clients from Excel --------------
export async function importClientsFromExcel(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post("/client/import", formData, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data; // Contains { message, successCount, skippedCount, errorCount, errors }
  } catch (error: any) {
    console.error("Error importing clients from Excel:", error);
    const message = error.response?.data?.error || "Failed to import clients from Excel. Please try again or check the file format.";
    throw new Error(message);
  }
}

// ------------ 2. Get All Lead --------------
interface GetAllClientsParams {
  page?: number;
  limit?: number;
  searchQuery?: string;
  type?: string;
}

export async function getAllClients(params: GetAllClientsParams = {}) {
  try {
    const { page = 1, limit = 10, searchQuery = "" } = params;

    const response = await axios.get("/client", {
      withCredentials: true,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Expires: "0",
      },
      params: {
        page,
        limit,
        search: searchQuery,
      },
    });

    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error || "Failed to fetch clients.";
    throw new Error(message);
  }
}

export async function updateClient(id: string, updatedAgent: Client) {
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
export async function deleteClient(id: string) {
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

export async function getClientById(id: string) {
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

// ------------ 6. Export Clients as Excel --------------
export async function exportClientsToExcel() {
  try {
    const response = await axios.get("/client/export", {
      withCredentials: true,
      responseType: "blob", // Important for downloading binary file
    });

    // Trigger file download
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "clients.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();

    return true;
  } catch (error: any) {
    const message = error.response?.data?.error || "Failed to export clients.";
    throw new Error(message);
  }
}
