// lib/services/quotations.ts
import APIService from "@/lib/services/api-service";

interface RateCardDetail {
  rateCardId: string;
  quantity: number;
  gstPercentage: number; // Changed from gstType to gstPercentage to match form
  totalValue?: number; // Add totalValue as optional
}

interface CreateQuotationParams {
  name: string;
  clientId: string;
  rateCardDetails: RateCardDetail[];
  ticketId?: string;
  salesType: string;
  date: string;
  quotationNumber: string;
  validUntil?: string;
  expectedExpense?: number;
  discount?: string;
  serialNumber?: string;
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
  ticketId?: string;
  expectedExpense?: number;
  subtotal?: number; // Make optional since it's calculated
  gst?: number; // Make optional since it's calculated
  grandTotal?: number; // Make optional since it's calculated
  // Include other fields that can be updated, matching the PUT route's Zod schema
}

interface GetAllQuotationsParams {
  page?: number;
  limit?: number;
  searchQuery?: string;
}

export async function createQuotation(params: CreateQuotationParams) {
  return APIService.createQuotation(params);
}

export async function updateQuotation(id: string, data: UpdateQuotationParams) {
  return APIService.updateQuotation(id, data);
}

export async function getAllQuotations(params: GetAllQuotationsParams = {}) {
  return APIService.getQuotations({
    page: params.page,
    limit: params.limit,
    search: params.searchQuery
  });
}

// Optional: Fetch single
export async function getQuotationById(id: string) {
  return APIService.getQuotationById(id);
}

// Wrapper exports for consistency with APIService pattern
export const getQuotations = (params: any) => APIService.getQuotations(params);
export const createQuotationViaAPI = (data: any) => APIService.createQuotation(data);
export const updateQuotationViaAPI = (id: string, data: any) => APIService.updateQuotation(id, data);
