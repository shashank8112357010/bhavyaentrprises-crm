import axios from "axios"

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // important for cookies cross-origin
});

// Request interceptor: logs current cookies before sending request
axiosInstance.interceptors.request.use(
  (config) => {
 
    // If you want to add custom headers with cookie info:
    // config.headers['X-Client-Cookies'] = document.cookie;

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: just logs that response was received
axiosInstance.interceptors.response.use(
  (response) => {
    // You cannot access Set-Cookie headers here due to browser security
    // But you can check if cookies exist client-side after the response
   
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
