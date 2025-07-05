import APIService from "@/lib/services/api-service";
import { Client } from "@/components/clients/types"; // Assuming this type is suitable
import Papa from "papaparse";

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
  state?: string;
}

export async function createClient(payload: CreateClientPayload) {
  return APIService.createClient(payload);
}

// ------------ 7. Import Clients from Excel --------------
export async function importClientsFromExcel(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return APIService.importClientsFromExcel(formData);
}

// ------------ 2. Get All Lead --------------
interface GetAllClientsParams {
  page?: number;
  limit?: number;
  searchQuery?: string;
  type?: string;
}

export async function getAllClients(params: GetAllClientsParams = {}) {
  const response = await APIService.getClients({
    page: params.page,
    limit: params.limit,
    search: params.searchQuery,
    type: params.type
  });
  
  // Ensure compatibility with existing interface - map data to clients
  return {
    ...response,
    clients: response.data
  };
}

export async function updateClient(id: string, updatedAgent: Client) {
  return APIService.updateClient(id, updatedAgent);
}
export async function deleteClient(id: string) {
  return APIService.deleteClient(id);
}

export async function getClientById(id: string) {
  return APIService.getClientById(id);
}

// ------------ 6. Export Clients to CSV --------------
export async function exportClientsToCsv() {
  try {
    // Fetch all clients - modify params if your getAllClients needs specific ones for all data
    const response = await getAllClients({ limit: Number.MAX_SAFE_INTEGER, page: 1 });

    const clientsToExport = (response.clients as Client[]).map((client: Client) => ({
      Name: client.name,
      Type: client.type,
      TotalBranches: client.totalBranches,
      ContactPerson: client.contactPerson,
      ContactEmail: client.contactEmail,
      ContactPhone: client.contactPhone,
      ContractStatus: client.contractStatus,
      LastServiceDate: client.lastServiceDate
        ? (client.lastServiceDate as any ? client.lastServiceDate?.toString().split('T')[0] : String(client.lastServiceDate).split('T')[0])
        : "", // Handle if date can be null/undefined
      GSTN: client.gstn || "", // Ensure GSTN is string, provide empty if null/undefined
      Initials: client.initials,
      State: client.state || "",
    }));

    const csvString = Papa.unparse(clientsToExport, {
        header: true, // Ensure headers are included based on keys of objects in clientsToExport
    });

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "clients_export.csv");
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link); // Clean up
    URL.revokeObjectURL(url);

    // Optionally, you can use a toast notification here for success
    // e.g., toast({ title: "Export Successful", description: "Client data exported to CSV." });
    return true;
  } catch (error: any) {
    console.error("Error exporting clients to CSV:", error);
    // Optionally, use a toast for error notification
    // e.g., toast({ title: "Export Failed", description: error.message || "Could not export client data.", variant: "destructive" });
    throw new Error(error.message || "Failed to export clients to CSV.");
  }
}

// Wrapper exports for consistency with APIService pattern
export const getClients = (params: any) => APIService.getClients(params);
export const createClientViaAPI = (data: any) => APIService.createClient(data);
export const updateClientViaAPI = (id: string, data: any) => APIService.updateClient(id, data);
export const deleteClientViaAPI = (id: string) => APIService.deleteClient(id);
export const getClientByIdViaAPI = (id: string) => APIService.getClientById(id);
