// lib/services/quotationService.ts
import axios from "@/lib/axios";

interface CreateQuotationParams {
  name: string;
  clientId: string;
  rateCardIds: string[];
  ticketId?: string;
}

export async function createQuotation(params: CreateQuotationParams) {
  try {
    const response = await axios.post("/quotations/create-quotations", params, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    console.error("Quotation Creation Error:", error);
    const message = error.response?.data?.message || "Failed to create quotation.";
    throw new Error(message);
  }
}

interface GetAllQuotationsParams {
  page?: number;
  limit?: number;
  searchQuery?: string;
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
    const message = error.response?.data?.error || "Failed to fetch quotations.";
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
