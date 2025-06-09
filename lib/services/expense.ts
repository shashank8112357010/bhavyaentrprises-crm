// lib/services/expenseService.ts
import axios from "@/lib/axios";

interface CreateExpenseParams {
  amount: number;
  description: string;
  category: "LABOR" | "TRANSPORT" | "MATERIAL" | "OTHER";
  quotationId?: string;
  requester: string;
  paymentType: "VCASH" | "REST" | "ONLINE";
  ticketId?: string;
  file: File; // PDF file to upload
  screenshotFile?: File; // Screenshot for online payments
  approvalName?: string; // Approval name for offline payments
}

export async function createExpense(params: CreateExpenseParams) {
  try {
    const formData = new FormData();
    // Append JSON data as string
    formData.append(
      "data",
      JSON.stringify({
        amount: params.amount,
        description: params.description,
        category: params.category,
        quotationId: params.quotationId,
        paymentType: params.paymentType,
        requester: params.requester,
        approvalName: params.approvalName,
      }),
    );
    // Append PDF file
    formData.append("file", params.file);

    // Append screenshot file for online payments
    if (params.screenshotFile) {
      formData.append("screenshot", params.screenshotFile);
    }

    const response = await axios.post("/expense/create-expense", formData, {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Expense Creation Error:", error);
    const message =
      error.response?.data?.message || "Failed to create expense.";
    throw new Error(message);
  }
}

interface GetAllExpensesParams {
  page?: number;
  limit?: number;
  searchQuery?: string;
}

export async function getAllExpenses(params: GetAllExpensesParams = {}) {
  try {
    const { page = 1, limit = 10, searchQuery = "" } = params;

    const response = await axios.get("/expense", {
      withCredentials: true,
      params: { page, limit, search: searchQuery },
    });

    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error || "Failed to fetch expenses.";
    throw new Error(message);
  }
}

// Optional: Fetch single expense by id or customId
export async function getExpenseById(id: string) {
  try {
    const response = await axios.get(`/expense/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error || "Failed to fetch expense.";
    throw new Error(message);
  }
}
