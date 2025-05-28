import axios from "@/lib/axios";


export async function createRateCard(file: File) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post("/rate-cards/create-rate-cards", formData, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error: any) {
    console.log(error);
    const message = error.response?.data?.message || "Failed to upload rate card CSV.";
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
    const { page = 1, limit = 10, searchQuery = "" } = params;

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
    const message = error.response?.data?.error || "Failed to fetch rate cards.";
    throw new Error(message);
  }
}
