"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTicket = createTicket;
exports.getTicketsForSelection = getTicketsForSelection;
exports.getAllTickets = getAllTickets;
exports.exportTicketsToExcel = exportTicketsToExcel;
exports.deleteTicket = deleteTicket;
exports.getTicketById = getTicketById;
exports.updateTicketStatus = updateTicketStatus;
exports.updateTicket = updateTicket;
exports.getComments = getComments;
exports.addComment = addComment;
// lib/services/ticket.ts
const axios_1 = __importDefault(require("../axios"));
async function createTicket(payload) {
    try {
        const response = await axios_1.default.post("/ticket/create-ticket", payload, {
            withCredentials: true,
        });
        return response.data;
    }
    catch (error) {
        const message = error.response?.data?.message || "Failed to create ticket.";
        throw new Error(message);
    }
}
async function getTicketsForSelection() {
    try {
        const response = await axios_1.default.get("/tickets/selection", {
            // Using /api prefix implicitly from axios config
            withCredentials: true,
            headers: {
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
                Expires: "0",
            },
        });
        return response.data.tickets || response.data;
    }
    catch (error) {
        console.error("Error fetching tickets for selection:", error);
        const message = error.response?.data?.error || "Failed to fetch tickets for selection.";
        throw new Error(message);
    }
}
async function getAllTickets(filters) {
    try {
        const params = new URLSearchParams();
        if (filters?.status)
            params.append("status", filters.status);
        if (filters?.startDate)
            params.append("startDate", filters.startDate);
        if (filters?.endDate)
            params.append("endDate", filters.endDate);
        if (filters?.role)
            params.append("role", filters.role);
        if (filters?.userId)
            params.append("userId", filters.userId);
        const response = await axios_1.default.get(`/ticket?${params.toString()}`, {
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
        const message = error.response?.data?.error || "Failed to fetch tickets.";
        throw new Error(message);
    }
}
async function exportTicketsToExcel(filters) {
    try {
        const params = new URLSearchParams();
        if (filters.status)
            params.append("status", filters.status);
        params.append("startDate", filters.startDate);
        params.append("endDate", filters.endDate);
        const response = await axios_1.default.get(`/ticket/export?${params.toString()}`, {
            withCredentials: true,
            responseType: "blob",
        });
        const blob = new Blob([response.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const fileName = `tickets_${filters.status || "all"}_${filters.startDate}_${filters.endDate}.xlsx`;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    catch (error) {
        const message = error.response?.data?.message || "Failed to export tickets.";
        throw new Error(message);
    }
}
async function deleteTicket(id) {
    try {
        const response = await axios_1.default.delete(`/ticket/${id}`, {
            withCredentials: true,
        });
        return response.data;
    }
    catch (error) {
        const message = error.response?.data?.message || "Failed to delete ticket.";
        throw new Error(message);
    }
}
async function getTicketById(id) {
    try {
        const response = await axios_1.default.get(`/ticket/${id}`, {
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
        const message = error.response?.data?.error || "Failed to fetch ticket.";
        throw new Error(message);
    }
}
async function updateTicketStatus(id, status) {
    try {
        const response = await axios_1.default.patch(`/ticket/${id}`, { status }, {
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
        const message = error.response?.data?.error || "Failed to update ticket status.";
        throw new Error(message);
    }
}
async function updateTicket(updatedTicket) {
    try {
        const response = await axios_1.default.patch(`/ticket/${updatedTicket.id}`, updatedTicket, {
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
        const message = error.response?.data?.error || "Failed to update ticket.";
        throw new Error(message);
    }
}
/**
 * Fetches all comments for a specific ticket.
 * @param id The ID of the ticket.
 * @returns A promise that resolves to an array of comments.
 */
async function getComments(id) {
    if (!id) {
        throw new Error("Ticket ID is required to fetch comments.");
    }
    try {
        const response = await axios_1.default.get(`/ticket/${id}/comment`);
        return response.data;
    }
    catch (error) {
        console.error("Error fetching comments:", error);
        const message = error.response?.data?.message || "Failed to fetch comments.";
        throw new Error(message);
    }
}
/**
 * Adds a new comment to a specific ticket.
 * @param id The ID of the ticket.
 * @param text The text content of the comment.
 * @param userId The ID of the user adding the comment.
 * @returns A promise that resolves to the newly created comment data.
 */
async function addComment(id, text, userId) {
    if (!id || !text || !userId) {
        throw new Error("Ticket ID, comment text, and user ID are required.");
    }
    try {
        const response = await axios_1.default.post(`/ticket/${id}/comment`, {
            text,
            userId,
        });
        return response.data;
    }
    catch (error) {
        console.error("Error adding comment:", error);
        const message = error.response?.data?.message || "Failed to add comment.";
        throw new Error(message);
    }
}
