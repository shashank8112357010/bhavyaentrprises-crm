"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQuotation = createQuotation;
exports.updateQuotation = updateQuotation;
exports.getAllQuotations = getAllQuotations;
exports.getQuotationById = getQuotationById;
// lib/services/quotations.ts
const axios_1 = __importDefault(require("@/lib/axios"));
async function createQuotation(params) {
    try {
        const response = await axios_1.default.post("/quotations/create-quotations", params, {
            withCredentials: true,
        });
        return response.data;
    }
    catch (error) {
        console.error("Quotation Creation Error:", error);
        const message = error.response?.data?.message || "Failed to create quotation.";
        throw new Error(message);
    }
}
async function updateQuotation(id, data) {
    try {
        const response = await axios_1.default.put(`/quotations/${id}`, data, {
            withCredentials: true,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
                Expires: "0",
            },
        });
        return response.data;
    }
    catch (error) {
        console.error("Quotation Update Error:", error);
        const message = error.response?.data?.message ||
            error.response?.data?.error ||
            "Failed to update quotation.";
        throw new Error(message);
    }
}
async function getAllQuotations(params = {}) {
    try {
        const { page = 1, limit = 10, searchQuery = "" } = params;
        const response = await axios_1.default.get("/quotations", {
            withCredentials: true,
            params: { page, limit, search: searchQuery },
        });
        return response.data;
    }
    catch (error) {
        const message = error.response?.data?.error || "Failed to fetch quotations.";
        throw new Error(message);
    }
}
// Optional: Fetch single
async function getQuotationById(id) {
    try {
        const response = await axios_1.default.get(`/quotations/${id}`, {
            withCredentials: true,
        });
        return response.data;
    }
    catch (error) {
        const message = error.response?.data?.error || "Failed to fetch quotation.";
        throw new Error(message);
    }
}
