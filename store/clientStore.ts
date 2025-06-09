// store/clientStore.ts
import { create } from "zustand";
import { getAllClients } from "@/lib/services/client";

interface Client {
  id: string;
  displayId?: string; // Add displayId field
  name: string;
  type: string;
  totalBranches: number;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  contractStatus: string;
  lastServiceDate: string;
  avatar: string;
  initials: string;
  activeTickets?: number;
  gstn?: string;
  tickets: any[];
}

interface ClientState {
  clients: Client[];
  loading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  addClient: (client: Client) => void;
  updateClient: (id: string, updatedClient: Partial<Client>) => void;
  removeClient: (id: string) => void;
  getClientById: (id: string) => Client | undefined;
}

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  loading: false,
  error: null,

  fetchClients: async () => {
    // Only fetch if clients array is empty to avoid unnecessary API calls
    const currentState = get();
    if (currentState.clients.length > 0 && !currentState.loading) {
      return; // Already have data, no need to fetch again
    }

    set({ loading: true, error: null });
    try {
      const response = await getAllClients();
      const clients = response?.clients || [];
      set({ clients, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addClient: (client: Client) => {
    set((state) => ({
      clients: [...state.clients, client],
    }));
  },

  updateClient: (id: string, updatedClient: Partial<Client>) => {
    set((state) => ({
      clients: state.clients.map((client) =>
        client.id === id ? { ...client, ...updatedClient } : client,
      ),
    }));
  },

  removeClient: (id: string) => {
    set((state) => ({
      clients: state.clients.filter((client) => client.id !== id),
    }));
  },

  getClientById: (id: string) => {
    const state = get();
    return state.clients.find((client) => client.id === id);
  },
}));
