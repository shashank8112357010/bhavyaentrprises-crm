import APIService from "@/lib/services/api-service";
import { z } from "zod";
import { rateCardSchema } from "@/lib/validations/rateCardSchema"; // Import the schema

// Define the type for the input data based on the schema
// This effectively matches Omit<RateCard, 'id' | 'uploadedAt'> if RateCard is the Prisma model
export type CreateRateCardData = z.infer<typeof rateCardSchema>;

export async function createRateCard(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return APIService.createRateCard(formData);
}

export async function deleteRateCard(id: string) {
  return APIService.deleteRateCard(id);
}

interface GetAllRateCardsParams {
  page?: number;
  limit?: number;
  searchQuery?: string;
}

export async function getAllRateCards(params: GetAllRateCardsParams = {}) {
  return APIService.getRateCards({
    page: params.page,
    limit: params.limit,
    search: params.searchQuery
  });
}

/**
 * Creates a single rate card entry.
 * @param rateCardData The data for the new rate card, matching the rateCardSchema.
 * @returns The created rate card object.
 */
export async function createSingleRateCard(rateCardData: CreateRateCardData) {
  return APIService.createSingleRateCard(rateCardData);
}

// Wrapper exports for consistency with APIService pattern
export const getRateCards = (params: any) => APIService.getRateCards(params);
export const createRateCardViaAPI = (data: FormData) => APIService.createRateCard(data);
export const deleteRateCardViaAPI = (id: string) => APIService.deleteRateCard(id);
