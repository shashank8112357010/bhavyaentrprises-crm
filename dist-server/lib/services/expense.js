"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExpense = createExpense;
exports.getAllExpenses = getAllExpenses;
exports.getExpenseById = getExpenseById;
// lib/services/expenseService.ts
const axios_1 = __importDefault(require("@/lib/axios"));
async function createExpense(params) {
    try {
        const formData = new FormData();
        // Append JSON data as string
        formData.append("data", JSON.stringify({
            amount: params.amount,
            description: params.description,
            category: params.category,
            quotationId: params.quotationId,
            paymentType: params.paymentType,
            requester: params.requester,
            approvalName: params.approvalName,
        }));
        // Append PDF file
        formData.append("file", params.file);
        // Append screenshot file for online payments
        if (params.screenshotFile) {
            formData.append("screenshot", params.screenshotFile);
        }
        const response = await axios_1.default.post("/expense/create-expense", formData, {
            withCredentials: true,
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    }
    catch (error) {
        console.error("Expense Creation Error:", error);
        const message = error.response?.data?.message || "Failed to create expense.";
        throw new Error(message);
    }
}
async function getAllExpenses(params = {}) {
    try {
        const { page = 1, limit = 10, searchQuery = "" } = params;
        const response = await axios_1.default.get("/expense", {
            withCredentials: true,
            params: { page, limit, search: searchQuery },
        });
        return response.data;
    }
    catch (error) {
        const message = error.response?.data?.error || "Failed to fetch expenses.";
        throw new Error(message);
    }
}
// Optional: Fetch single expense by id or customId
async function getExpenseById(id) {
    try {
        const response = await axios_1.default.get(`/expense/${id}`, {
            withCredentials: true,
        });
        return response.data;
    }
    catch (error) {
        const message = error.response?.data?.error || "Failed to fetch expense.";
        throw new Error(message);
    }
}
