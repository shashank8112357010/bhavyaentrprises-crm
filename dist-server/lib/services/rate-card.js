"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRateCard = createRateCard;
exports.deleteRateCard = deleteRateCard;
exports.getAllRateCards = getAllRateCards;
exports.createSingleRateCard = createSingleRateCard;
const axios_1 = __importDefault(require("@/lib/axios"));
async function createRateCard(file) {
    try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await axios_1.default.post("/rate-cards/create-rate-cards", formData, {
            withCredentials: true,
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    }
    catch (error) {
        const message = error.response?.data?.message || "Failed to upload rate card CSV.";
        throw new Error(message);
    }
}
async function deleteRateCard(id) {
    try {
        const response = await axios_1.default.delete(`/api/rate-cards/${id}`, {
            withCredentials: true,
            headers: {
                "Content-Type": "application/json",
            },
        });
        return response.data;
    }
    catch (error) {
        const message = error.response?.data?.error || "Failed to delete rate card.";
        throw new Error(message);
    }
}
async function getAllRateCards(params = {}) {
    try {
        const { page = 1, limit = 5, searchQuery = "" } = params;
        const response = await axios_1.default.get("/rate-cards", {
            withCredentials: true,
            headers: {
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
                Expires: "0",
            },
            params: { page, limit, search: searchQuery },
        });
        return response.data;
    }
    catch (error) {
        const message = error.response?.data?.error || "Failed to fetch rate cards.";
        throw new Error(message);
    }
}
/**
 * Creates a single rate card entry.
 * @param rateCardData The data for the new rate card, matching the rateCardSchema.
 * @returns The created rate card object.
 */
async function createSingleRateCard(rateCardData) {
    try {
        const response = await axios_1.default.post("/api/rate-cards/create", rateCardData, {
            withCredentials: true, // Assuming this is needed like other requests in this file
            headers: {
                "Content-Type": "application/json",
            },
        });
        return response.data; // Assuming the API returns the created RateCard
    }
    catch (error) {
        const message = error.response?.data?.error ||
            error.response?.data?.details ||
            error.message ||
            "Failed to create rate card.";
        throw new Error(message);
    }
}
