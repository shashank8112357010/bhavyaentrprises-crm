"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLead = createLead;
exports.getAllLeads = getAllLeads;
exports.reassignLead = reassignLead;
const axios_1 = __importDefault(require("@/lib/axios"));
async function createLead(payload) {
    try {
        const response = await axios_1.default.post("/lead/create-lead", payload, {
            withCredentials: true,
        });
        return response.data;
    }
    catch (error) {
        const message = error.response?.data?.error || "Failed to create lead.";
        throw new Error(message);
    }
}
// ------------ 2. Get All Leads --------------
async function getAllLeads() {
    try {
        const response = await axios_1.default.get("/lead", {
            withCredentials: true,
        });
        return response.data;
    }
    catch (error) {
        const message = error.response?.data?.error || "Failed to fetch leads.";
        throw new Error(message);
    }
}
async function reassignLead(payload) {
    try {
        const response = await axios_1.default.patch("/lead/reassign", payload, {
            withCredentials: true,
        });
        return response.data;
    }
    catch (error) {
        const message = error.response?.data?.error || "Failed to reassign lead.";
        throw new Error(message);
    }
}
