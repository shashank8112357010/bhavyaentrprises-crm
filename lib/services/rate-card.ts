import axios from "@/lib/axios";
import { z } from "zod";
import { rateCardSchema } from "@/lib/validations/rateCardSchema"; // Import the schema

// Define the type for the input data based on the schema
// This effectively matches Omit<RateCard, 'id' | 'uploadedAt'> if RateCard is the Prisma model
export type CreateRateCardData = z.infer<typeof rateCardSchema>;

export async function createRateCard(file: File) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
      "/rate-cards/create-rate-cards",
      formData,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message || "Failed to upload rate card CSV.";
    throw new Error(message);
  }
}

export async function deleteRateCard(id: string) {
  try {
    const response = await axios.delete(`/api/rate-cards/${id}`, {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.error || "Failed to delete rate card.";
    throw new Error(message);
  }
}

interface GetAllRateCardsParams {
  page?: number;
  limit?: number;
  searchQuery?: string;
}

export async function getAllRateCards(params: GetAllRateCardsParams = {}) {
  try {
    const { page = 1, limit = 5, searchQuery = "" } = params;

    const response = await axios.get("/rate-cards", {
      withCredentials: true,
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Expires: "0",
      },
      params: { page, limit, search: searchQuery },
    });
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.error || "Failed to fetch rate cards.";
    throw new Error(message);
  }
}

/**
 * Creates a single rate card entry.
 * @param rateCardData The data for the new rate card, matching the rateCardSchema.
 * @returns The created rate card object.
 */
export async function createSingleRateCard(rateCardData: CreateRateCardData) {
  try {
    const response = await axios.post("/api/rate-cards/create", rateCardData, {
      withCredentials: true, // Assuming this is needed like other requests in this file
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data; // Assuming the API returns the created RateCard
  } catch (error: any) {
    const message =
      error.response?.data?.error ||
      error.response?.data?.details ||
      error.message ||
      "Failed to create rate card.";
    throw new Error(message);
  }
}
