// lib/services/expenseService.ts
import APIService from "@/lib/services/api-service";

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

  return APIService.createExpense(formData);
}

interface GetAllExpensesParams {
  page?: number;
  limit?: number;
  searchQuery?: string;
}

export async function getAllExpenses(params: GetAllExpensesParams = {}) {
  return APIService.getExpenses({
    page: params.page,
    limit: params.limit,
    search: params.searchQuery
  });
}

// Optional: Fetch single expense by id or customId
export async function getExpenseById(id: string) {
  return APIService.getExpenseById(id);
}

// Wrapper exports for consistency with APIService pattern
export const getExpenses = (params: any) => APIService.getExpenses(params);
export const createExpenseViaAPI = (data: FormData) => APIService.createExpense(data);
