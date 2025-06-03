// lib/services/quotationService.ts
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

// Import the comprehensive payload type
import { CreateQuotationPayload } from "../validations/quotationSchema"; // Adjust path as needed

export async function getPreviewPdf(payload: CreateQuotationPayload) {
  try {
    const response = await axios.post("/quotations/preview-pdf", payload, {
      withCredentials: true,
      responseType: "blob", // Important for file download
    });

    // Create a URL for the blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    // Suggest a filename for the download
    // The actual filename will be set by the Content-Disposition header from the server if available
    link.setAttribute("download", `quotation-preview-${Date.now()}.pdf`);
    document.body.appendChild(link);
    link.click();

    // Clean up by revoking the object URL and removing the link
    window.URL.revokeObjectURL(url);
    link.parentNode?.removeChild(link);

    return { success: true, message: "PDF downloaded successfully." };
  } catch (error: any) {
    console.error("PDF Preview Error:", error);
    // Attempt to read error message from blob if request failed but returned blob data
    if (error.response && error.response.data instanceof Blob) {
      try {
        const errorText = await error.response.data.text();
        const errorJson = JSON.parse(errorText);
        const message = errorJson.message || "Failed to generate PDF preview.";
        throw new Error(message);
      } catch (parseError) {
        // Fallback if blob is not JSON or not readable
        throw new Error("Failed to generate PDF preview and could not parse error response.");
      }
    }
    const message = error.response?.data?.message || error.message || "Failed to generate PDF preview.";
    throw new Error(message);
  }
}


interface GetAllQuotationsParams {
  page?: number;
  limit?: number;
  searchQuery?: string;
  status?: string; // Added status filter
}

export async function getAllQuotations(params: GetAllQuotationsParams = {}) {
  try {
    const { page = 1, limit = 10, searchQuery = "", status = "" } = params;
    const queryParams: any = { page, limit };
    if (searchQuery) queryParams.search = searchQuery;
    if (status) queryParams.status = status;

    const response = await axios.get("/quotations", {
      withCredentials: true,
      params: queryParams,
    });

    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error || "Failed to fetch quotations.";
    throw new Error(message);
  }
}

export async function updateQuotation(id: string, payload: Partial<CreateQuotationPayload>) {
  try {
    const response = await axios.put(`/quotations/${id}`, payload, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    console.error("Quotation Update Error:", error);
    const message = error.response?.data?.message || "Failed to update quotation.";
    throw new Error(message);
  }
}

export async function deleteQuotation(id: string) {
  try {
    const response = await axios.delete(`/quotations/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    console.error("Quotation Delete Error:", error);
    const message = error.response?.data?.message || "Failed to delete quotation.";
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
