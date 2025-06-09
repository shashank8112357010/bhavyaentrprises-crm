// lib/services/quotations.ts
import axios from "@/lib/axios";

interface RateCardDetail {
  rateCardId: string;
  quantity: number;
  gstType: number;
}

interface CreateQuotationParams {
  name: string;
  clientId: string;
  rateCardDetails: RateCardDetail[];
  ticketId?: string;
  salesType: string;
  validUntil?: string;
  expectedExpense?: number; // Add expectedExpense field
  // status: string; // Removed status
}
interface UpdateRateCardDetail {
  rateCardId: string;
  quantity: number;
  gstPercentage: number; // Matches the backend Zod schema
}

export interface UpdateQuotationParams {
  name?: string;
  clientId?: string;
  rateCardDetails?: UpdateRateCardDetail[];
  ticketId: string;
  expectedExpense?: number; // Add expectedExpense field
  // Include other fields that can be updated, matching the PUT route's Zod schema
}

interface GetAllQuotationsParams {
  page?: number;
  limit?: number;
  searchQuery?: string;
}

export async function createQuotation(params: CreateQuotationParams) {
  try {
    const response = await axios.post("/quotations/create-quotations", params, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    console.error("Quotation Creation Error:", error);
    const message =
      error.response?.data?.message || "Failed to create quotation.";
    throw new Error(message);
  }
}

export async function updateQuotation(id: string, data: UpdateQuotationParams) {
  try {
    const response = await axios.put(`/quotations/${id}`, data, {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Quotation Update Error:", error);
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Failed to update quotation.";
    throw new Error(message);
  }
}

export async function getAllQuotations(params: GetAllQuotationsParams = {}) {
  try {
    const { page = 1, limit = 10, searchQuery = "" } = params;

    const response = await axios.get("/quotations", {
      withCredentials: true,
      params: { page, limit, search: searchQuery },
    });

    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.error || "Failed to fetch quotations.";
    throw new Error(message);
  }
}

// Optional: Fetch single
export async function getQuotationById(id: string) {
  try {
    const response = await axios.get(`/quotations/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error || "Failed to fetch quotation.";
    throw new Error(message);
  }
}
