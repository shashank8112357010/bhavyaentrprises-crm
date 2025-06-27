"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.logout = logout;
exports.verifyToken = verifyToken;
const axios_1 = __importDefault(require("@/lib/axios"));
const jsonwebtoken_1 = require("jsonwebtoken");
async function login(payload) {
    try {
        const response = await axios_1.default.post("/login", payload, {
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
    }
    catch (error) {
        const message = error.response?.data?.message || "Login failed. Please try again.";
        throw new Error(message);
    }
}
async function logout() {
    try {
        await axios_1.default.get("/logout", {
            withCredentials: true, // Required to clear HttpOnly cookie
        });
        // Optional: Clear any localStorage/sessionStorage
        if (typeof window !== "undefined") {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "/"; // Or wherever you want to redirect
        }
        return { success: true };
    }
    catch (error) {
        console.error("Logout failed:", error);
        throw new Error("Logout failed. Please try again.");
    }
}
async function verifyToken(token) {
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("JWT_SECRET is not configured");
        }
        const payload = (0, jsonwebtoken_1.verify)(token, secret);
        return payload;
    }
    catch (error) {
        console.error("Token verification failed:", error);
        return null;
    }
}
