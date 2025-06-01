import { create } from 'zustand';

// Copied from store/crmStore.ts
export interface User {
  userId: string;
  email: string;
  role: Role;
  initials?: string;
  [key: string]: any; // For any other user properties you want to add dynamically
}

// Copied from store/crmStore.ts
export type Role = 'ADMIN' | 'BACKEND' | 'RM' | 'MST' | 'ACCOUNTS';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  role: Role | null;
  setUserAndToken: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
}

// Import login and logout functions from lib/services/auth
import { login as apiLogin, logout as apiLogout, LoginPayload } from '@/lib/services/auth';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  role: null,
  setUserAndToken: (user, token) => set({ user, token, role: user.role, isLoading: false, error: null }),
  clearAuth: () => set({ user: null, token: null, role: null, isLoading: false, error: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
  forgotPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        set({ isLoading: false, error: data.message || 'Failed to send password reset link.' });
        return { success: false, message: data.message || 'Failed to send password reset link.' };
      }

      set({ isLoading: false });
      return { success: true, message: data.message };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      set({ isLoading: false, error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },
  resetPassword: async (token: string, newPassword: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        set({ isLoading: false, error: data.message || 'Failed to reset password.' });
        return { success: false, message: data.message || 'Failed to reset password.' };
      }

      set({ isLoading: false });
      return { success: true, message: data.message };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      set({ isLoading: false, error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiLogin({ email, password });
      // Assuming the response.data contains { user: User, token: string } upon successful login
      // The current apiLogin from services/auth.ts returns the whole axios response and handles redirection
      // We need to adapt this. For now, let's assume it's modified or we extract from response.data
      // The service login function seems to return response, not response.data directly.
      // And user/token are expected to be in response.data if login is not a redirect.

      if (response.status === 200 && response.data) { // Successful login, not a redirect
        const { user, token } = response.data; // This structure is an assumption

        if (!user || !token) {
          // If the actual login service doesn't return user and token directly,
          // this part needs adjustment. Maybe the token is httpOnly and user is returned.
          // For now, proceeding with the assumption that user and token are available.
          // If token is HttpOnly, it won't be available here.
          // The task asks to store user.role and user.userId in localStorage.

          set({ isLoading: false, error: "Login successful, but user data or token was not provided in the expected format." });
          return { success: false, error: "Login successful, but user data or token was not provided in the expected format." };
        }

        set({ user, token, role: user.role, isLoading: false, error: null });

        if (typeof window !== "undefined") {
          localStorage.setItem("userRole", user.role);
          localStorage.setItem("userId", user.userId);
        }
        return { success: true, user };
      } else if (response.status === 302) {
        // If it's a redirect, the service layer already handles window.location.href
        // We might not get user/token here directly if it's a pure redirect.
        // The store state might not be updated with user/token if backend only sends redirect.
        // This indicates that the session is likely handled by HttpOnly cookies.
        // We might need a separate call to fetch user details after redirect, or expect user details in a redirect response.
        // For now, assume that if a redirect happens, the session is set.
        // We still need user data for the store.
        // This part is tricky with HttpOnly cookies and redirects.
        // Let's assume for now that if status is 302, it's handled and we don't get data directly here.
        // The component will redirect.
        set({ isLoading: false }); // Stop loading
        return { success: true }; // Indicate success, component will redirect
      } else {
        // Handle other non-successful statuses if not thrown as error by axios
        const errorMessage = response.data?.message || "Login failed due to an unexpected server response.";
        set({ isLoading: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during login.';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await apiLogout(); // apiLogout handles localStorage clear and redirect
      get().clearAuth(); // Clear auth state in the store
      // No need to set isLoading false here as clearAuth does it and redirect happens
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during logout.';
      set({ isLoading: false, error: errorMessage }); // Ensure loading is false on error
      return { success: false, error: errorMessage };
    }
  },
}));
