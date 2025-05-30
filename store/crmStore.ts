import { create } from 'zustand';

export interface User {
  userId: string;
  email: string;
  role: string;
  initials?: string;
  [key: string]: any; // For any other user properties you want to add dynamically
}

interface UserState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,

  setUser: (user) => set({ user }),

  clearUser: () => set({ user: null }),
}));
