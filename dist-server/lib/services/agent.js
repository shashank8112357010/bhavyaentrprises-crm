"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgent = createAgent;
exports.getAllAgents = getAllAgents;
exports.getAllAgentsUnpaginated = getAllAgentsUnpaginated;
exports.deleteAgent = deleteAgent;
exports.getAgentById = getAgentById;
exports.updateAgent = updateAgent;
const axios_1 = __importDefault(require("@/lib/axios"));
async function createAgent(payload) {
    try {
        const response = await axios_1.default.post("/agent/create-agent", payload, {
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
        const message = error.response?.data?.message || "Failed to create agent.";
        throw new Error(message);
    }
}
async function getAllAgents(params = {}) {
    try {
        const { page = 1, limit = 10, searchQuery = "" } = params;
        const response = await axios_1.default.get("/agent", {
            params: { page, limit, searchQuery },
            withCredentials: true,
            headers: {
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
                Expires: "0",
            },
        });
        return response.data; // Should now be the paginated response
    }
    catch (error) {
        const message = error.response?.data?.message || // Use message from API error if available
            error.response?.data?.error ||
            "Failed to fetch agents.";
        throw new Error(message);
    }
}
// Fetch all agents (no pagination, for dropdowns/forms)
async function getAllAgentsUnpaginated() {
    try {
        const response = await axios_1.default.get("/agent", {
            params: { all: true },
            withCredentials: true,
            headers: {
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
                Expires: "0",
            },
        });
        return response.data.data;
    }
    catch (error) {
        const message = error.response?.data?.message ||
            error.response?.data?.error ||
            "Failed to fetch all agents.";
        throw new Error(message);
    }
}
async function deleteAgent(id) {
    try {
        const response = await axios_1.default.delete(`/agent/${id}`, {
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
        const message = error.response?.data?.error || "Failed to delete agent.";
        throw new Error(message);
    }
}
async function getAgentById(id) {
    try {
        const response = await axios_1.default.get(`/agent/${id}`, {
            withCredentials: true,
            headers: {
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
                Expires: "0",
            },
        });
        // Handle the API response wrapper
        return response.data.agent || response.data;
    }
    catch (error) {
        const message = error.response?.data?.message ||
            error.response?.data?.error ||
            "Failed to fetch agent.";
        throw new Error(message);
    }
}
async function updateAgent(id, updatedAgent) {
    try {
        const response = await axios_1.default.patch(`/agent/${id}`, updatedAgent, {
            withCredentials: true,
            headers: {
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
                Expires: "0",
            },
        });
        // Handle the API response wrapper
        return response.data.agent || response.data;
    }
    catch (error) {
        const message = error.response?.data?.message ||
            error.response?.data?.error ||
            "Failed to update agent.";
        throw new Error(message);
    }
}
