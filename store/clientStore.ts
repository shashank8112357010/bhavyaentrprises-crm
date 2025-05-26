import { create } from "zustand";
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from "@/lib/services/client";
import { Client, CreateClientPayload } from "@/components/clients/types";

interface ClientState {
  clients: Client[];
  loading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  fetchClientById: (id: string) => Promise<Client | undefined>;
  addClient: (client: CreateClientPayload) => Promise<void>;
  editClient: (id: string, updatedClient: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
}

export const useClientStore = create<ClientState>((set) => ({
  clients: [],
  loading: false,
  error: null,

  fetchClients: async () => {
    set({ loading: true, error: null });
    try {
      const response = await getAllClients();
      set({ clients: response.clients, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchClientById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const client = await getClientById(id);
      set({ loading: false });
      return client;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return undefined;
    }
  },

  addClient: async (client: CreateClientPayload) => {
    try {
      const newClient = await createClient(client);
      set((state) => ({
        clients: [...state.clients, newClient],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || "Failed to create client" });
      throw error;
    }
  },

  editClient: async (id: string, updatedClient: Client) => {
    set({ loading: true, error: null });
    try {
      await updateClient(id, updatedClient);
      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === id ? updatedClient : client
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteClient: async (id: string) => {
    try {
      await deleteClient(id);
      set((state) => ({
        clients: state.clients.filter((client) => client.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));
