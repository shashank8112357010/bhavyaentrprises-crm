// store/quotationStore.ts
import { create } from "zustand";
import {
  getAllQuotations,
  getQuotationById,
  updateQuotation,
  createQuotation,
} from "@/lib/services/quotations";

interface Quotation {
  id: string;
  name: string;
  quoteNo: string;
  createdAt: string;
  client: {
    id: string;
    name: string;
  } | null;
  ticket: {
    id: string;
    title: string;
  } | null;
  subtotal: number;
  gst: number;
  grandTotal: number;
  pdfUrl: string;
}

interface QuotationState {
  quotations: Quotation[];
  currentQuotation: any | null;
  loading: boolean;
  error: string | null;
  totalQuotations: number;
  currentPage: number;
  itemsPerPage: number;

  // Actions
  fetchQuotations: (params?: {
    page?: number;
    limit?: number;
    searchQuery?: string;
  }) => Promise<void>;
  fetchQuotationById: (id: string) => Promise<void>;
  addQuotation: (quotation: Quotation) => void;
  updateQuotationInStore: (
    id: string,
    updatedQuotation: Partial<Quotation>,
  ) => void;
  removeQuotation: (id: string) => void;
  setCurrentQuotation: (quotation: any) => void;
  clearCurrentQuotation: () => void;
  refreshQuotations: () => Promise<void>;
}

export const useQuotationStore = create<QuotationState>((set, get) => ({
  quotations: [],
  currentQuotation: null,
  loading: false,
  error: null,
  totalQuotations: 0,
  currentPage: 1,
  itemsPerPage: 10,

  fetchQuotations: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await getAllQuotations(params);
      set({
        quotations: response.quotations || [],
        totalQuotations: response.pagination?.total || 0,
        currentPage: response.pagination?.page || 1,
        itemsPerPage: response.pagination?.limit || 10,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchQuotationById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const quotation = await getQuotationById(id);
      set({ currentQuotation: quotation, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addQuotation: (quotation: Quotation) => {
    set((state) => ({
      quotations: [quotation, ...state.quotations],
      totalQuotations: state.totalQuotations + 1,
    }));
  },

  updateQuotationInStore: (
    id: string,
    updatedQuotation: Partial<Quotation>,
  ) => {
    set((state) => ({
      quotations: state.quotations.map((quotation) =>
        quotation.id === id ? { ...quotation, ...updatedQuotation } : quotation,
      ),
      currentQuotation:
        state.currentQuotation?.id === id
          ? { ...state.currentQuotation, ...updatedQuotation }
          : state.currentQuotation,
    }));
  },

  removeQuotation: (id: string) => {
    set((state) => ({
      quotations: state.quotations.filter((quotation) => quotation.id !== id),
      totalQuotations: state.totalQuotations - 1,
      currentQuotation:
        state.currentQuotation?.id === id ? null : state.currentQuotation,
    }));
  },

  setCurrentQuotation: (quotation: any) => {
    set({ currentQuotation: quotation });
  },

  clearCurrentQuotation: () => {
    set({ currentQuotation: null });
  },

  refreshQuotations: async () => {
    const state = get();
    await state.fetchQuotations({
      page: state.currentPage,
      limit: state.itemsPerPage,
    });
  },
}));
