import axiosInstance from "@/lib/axios";
import { create } from "zustand";

// Define your User interface and Role type
export interface User {
  userId: string;
  email: string;
  role: Role;
  initials: string;
  name?: string;
  [key: string]: any;
}

export type Role = "ADMIN" | "BACKEND" | "RM" | "MST" | "ACCOUNTS";

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
  forgotPassword: (
    email: string,
  ) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (
    token: string,
    newPassword: string,
  ) => Promise<{ success: boolean; message?: string }>;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  fetchCurrentUser: () => Promise<{ success: boolean; user?: User }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  role: null,

  setUserAndToken: (user, token) =>
    set({ user, token, role: user.role, isLoading: false, error: null }),
  clearAuth: () =>
    set({ user: null, token: null, role: null, isLoading: false, error: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),

  forgotPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.post("/auth/forgot-password", {
        email,
      });
      set({ isLoading: false });
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";
      set({ isLoading: false, error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  resetPassword: async (token: string, newPassword: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.post("/auth/reset-password", {
        token,
        newPassword,
      });
      set({ isLoading: false });
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";
      set({ isLoading: false, error: errorMessage });
      return { success: false, message: errorMessage };
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.post("/login", { email, password });

      // Log the response for debugging
      console.log("Login response status:", response.status);
      console.log("Login response data:", response.data);
      console.log("Response data type:", typeof response.data);
      console.log("Response data keys:", Object.keys(response.data || {}));
      console.log("Raw response:", JSON.stringify(response.data, null, 2));

      const { user, token, success } = response.data;

      // Check if login was successful
      if (success === false) {
        const errorMsg = response.data.message || "Login was not successful";
        console.error("Login failed:", errorMsg);
        set({ isLoading: false, error: errorMsg });
        return { success: false, error: errorMsg };
      }

      // Validate user and token
      if (!user || !token) {
        console.error("Missing user or token in response:", {
          hasUser: !!user,
          hasToken: !!token,
          userKeys: user ? Object.keys(user) : [],
          responseKeys: Object.keys(response.data),
        });
        const errorMsg =
          "Login successful, but user data or token was not provided in the expected format.";
        set({ isLoading: false, error: errorMsg });
        return { success: false, error: errorMsg };
      }

      // Validate required user fields
      if (!user.userId || !user.email || !user.role) {
        console.error("Missing required user fields:", {
          userId: user.userId,
          email: user.email,
          role: user.role,
          fullUser: user,
        });
        const errorMsg = `User data is missing required fields. Missing: ${[
          !user.userId && "userId",
          !user.email && "email",
          !user.role && "role",
        ]
          .filter(Boolean)
          .join(", ")}`;
        set({ isLoading: false, error: errorMsg });
        return { success: false, error: errorMsg };
      }

      set({ user, token, role: user.role, isLoading: false, error: null });

      if (typeof window !== "undefined") {
        localStorage.setItem("userRole", user.role);
        localStorage.setItem("userId", user.userId);
      }

      return { success: true, user };
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "An unexpected error occurred during login.";

      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = "No response from server. Please check your connection.";
      } else {
        // Something else happened
        errorMessage = error.message || errorMessage;
      }

      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.post("/auth/logout");
      get().clearAuth();
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during logout.";
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  fetchCurrentUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get("/auth/me");
      const { user } = response.data;

      set({ user, role: user.role, isLoading: false, error: null });

      if (typeof window !== "undefined" && user) {
        localStorage.setItem("userRole", user.role);
        localStorage.setItem("userId", user.userId);
      }

      return { success: true, user };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";
      set({ isLoading: false, error: errorMessage });
      return { success: false };
    }
  },
}));
