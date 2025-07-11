"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
exports.importClientsFromExcel = importClientsFromExcel;
exports.getAllClients = getAllClients;
exports.updateClient = updateClient;
exports.deleteClient = deleteClient;
exports.getClientById = getClientById;
exports.exportClientsToCsv = exportClientsToCsv;
const axios_1 = __importDefault(require("@/lib/axios"));
const papaparse_1 = __importDefault(require("papaparse"));
async function createClient(payload) {
    try {
        const response = await axios_1.default.post("/client", payload, {
            withCredentials: true,
        });
        return response.data;
    }
    catch (error) {
        const message = error.response?.data?.error || "Failed to create lead.";
        throw new Error(message);
    }
}
// ------------ 7. Import Clients from Excel --------------
async function importClientsFromExcel(file) {
    const formData = new FormData();
    formData.append("file", file);
    try {
        const response = await axios_1.default.post("/client/import", formData, {
            withCredentials: true,
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data; // Contains { message, successCount, skippedCount, errorCount, errors }
    }
    catch (error) {
        console.error("Error importing clients from Excel:", error);
        const message = error.response?.data?.error || "Failed to import clients from Excel. Please try again or check the file format.";
        throw new Error(message);
    }
}
async function getAllClients(params = {}) {
    try {
        const { page = 1, limit = "", searchQuery = "" } = params;
        const response = await axios_1.default.get("/client", {
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
    }
    catch (error) {
        const message = error.response?.data?.error || "Failed to fetch clients.";
        throw new Error(message);
    }
}
async function updateClient(id, updatedAgent) {
    try {
        const response = await axios_1.default.patch(`/agent/${id}`, updatedAgent, {
            withCredentials: true,
            headers: {
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
                Expires: "0",
            },
        });
        return response.data;
    }
    catch (error) {
        const message = error.response?.data?.error || "Failed to fetch agent.";
        throw new Error(message);
    }
}
async function deleteClient(id) {
    try {
        const response = await axios_1.default.delete(`/agent/${id}`, {
            withCredentials: true,
        });
        return response.data;
    }
    catch (error) {
        const message = error.response?.data?.message || "Failed to delete agent.";
        throw new Error(message);
    }
}
async function getClientById(id) {
    try {
        const response = await axios_1.default.get(`/agent/${id}`, {
            withCredentials: true,
            headers: {
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
                Expires: "0",
            },
        });
        return response.data;
    }
    catch (error) {
        const message = error.response?.data?.error || "Failed to fetch agent.";
        throw new Error(message);
    }
}
// ------------ 6. Export Clients to CSV --------------
async function exportClientsToCsv() {
    try {
        // Fetch all clients - modify params if your getAllClients needs specific ones for all data
        const response = await getAllClients({ limit: Number.MAX_SAFE_INTEGER, page: 1 });
        const clientsToExport = response.clients.map((client) => ({
            Name: client.name,
            Type: client.type,
            TotalBranches: client.totalBranches,
            ContactPerson: client.contactPerson,
            ContactEmail: client.contactEmail,
            ContactPhone: client.contactPhone,
            ContractStatus: client.contractStatus,
            LastServiceDate: client.lastServiceDate
                ? (client.lastServiceDate ? client.lastServiceDate?.toString().split('T')[0] : String(client.lastServiceDate).split('T')[0])
                : "", // Handle if date can be null/undefined
            GSTN: client.gstn || "", // Ensure GSTN is string, provide empty if null/undefined
            Initials: client.initials,
        }));
        const csvString = papaparse_1.default.unparse(clientsToExport, {
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
    }
    catch (error) {
        console.error("Error exporting clients to CSV:", error);
        // Optionally, use a toast for error notification
        // e.g., toast({ title: "Export Failed", description: error.message || "Could not export client data.", variant: "destructive" });
        throw new Error(error.message || "Failed to export clients to CSV.");
    }
}
