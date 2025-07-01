export interface TicketWithRelations {
  id: string;
  ticketId: string;
  Quotation: {
    id: string;
    grandTotal: number;
    expectedExpense?: number;
    rateCardDetails?: {
      rateCardId: string;
      quantity: number;
      gstPercentage: number;
      description: string;
      unit: string;
      rate: number;
      bankName: string;
    }[];
  } | null;
  expenses: {
    amount: number;
  }[];
  dueDate: Date | null;
  status: string;
  billGenerated: boolean;
  jcrDocument: {
    id: string;
  } | null;
  purchaseOrder: {
    id: string;
  } | null;
  workStage: {
    jcrStatus?: boolean;
    poStatus?: boolean;
    poFilePath?: string;
    jcrFilePath?: string;
    client?: {
      id: string;
      name: string;
    };
    assignee?: {
      id: string;
      name: string;
    };
  };
  createdAt: Date;
  title: string;
  branch: string;
  priority: string;
  scheduledDate: Date | null;
  photosUploaded: boolean;
}
