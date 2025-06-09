import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // important for cookies cross-origin
});

// Request interceptor: logs current cookies before sending request
axiosInstance.interceptors.request.use(
  (config) => {
    config.headers["Cache-Control"] = "no-cache";
    config.headers["Pragma"] = "no-cache";
    config.headers["Expires"] = "0";
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: just logs that response was received
axiosInstance.interceptors.response.use(
  (response) => {
    // You cannot access Set-Cookie headers here due to browser security
    // But you can check if cookies exist client-side after the response

    // Debug logging for login requests
    if (response.config.url?.includes("/login")) {
      console.log("Axios interceptor - Login response:", {
        status: response.status,
        data: response.data,
        url: response.config.url,
      });
    }

    return response;
  },
  (error) => {
    console.log("Axios interceptor - Error:", {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    return Promise.reject(error);
  },
);

export default axiosInstance;
