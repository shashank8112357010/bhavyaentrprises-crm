import axios from "@/lib/axios";

export interface LoginPayload {
  email: string;
  password: string;
}

export async function login(payload: LoginPayload) {
  try {
    const response = await axios.post("/login", payload, {
      withCredentials: true,           // ✅ important for setting HttpOnly cookies
      maxRedirects: 0,                 // ✅ disable auto-following redirects
      validateStatus: (status) => status < 400 || status === 302, // allow manual redirect
    });

    // If the backend redirects manually (e.g., via 302), do it on client
    if (response.status === 302) {
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard"; // ⬅️ or use value from response.headers.location
      }
    }

    return { success: true };
  } catch (error: any) {
    const message =
      error.response?.data?.message || "Login failed. Please try again.";
    throw new Error(message);
  }
}
