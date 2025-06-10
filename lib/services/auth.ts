import axios from "@/lib/axios";
import { verify } from "jsonwebtoken";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function login(payload: LoginPayload) {
  try {
    const response = await axios.post("/login", payload, {
      withCredentials: true, // ✅ important for setting HttpOnly cookies
      maxRedirects: 0, // ✅ disable auto-following redirects
      validateStatus: (status) => status < 400 || status === 302, // allow manual redirect
    });

    // If the backend redirects manually (e.g., via 302), do it on client
    if (response.status === 302) {
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard"; // ⬅️ or use value from response.headers.location
      }
    }

    return response;
  } catch (error: any) {
    const message =
      error.response?.data?.message || "Login failed. Please try again.";
    throw new Error(message);
  }
}

export async function logout() {
  try {
    await axios.get("/logout", {
      withCredentials: true, // Required to clear HttpOnly cookie
    });

    // Optional: Clear any localStorage/sessionStorage
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/"; // Or wherever you want to redirect
    }

    return { success: true };
  } catch (error: any) {
    console.error("Logout failed:", error);
    throw new Error("Logout failed. Please try again.");
  }
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const payload = verify(token, secret) as TokenPayload;
    return payload;
  } catch (error: any) {
    console.error("Token verification failed:", error);
    return null;
  }
}
