"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = __importDefault(require("axios"));
var axiosInstance = axios_1.default.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // important for cookies cross-origin
});
// Request interceptor: logs current cookies before sending request
axiosInstance.interceptors.request.use(function (config) {
    config.headers["Cache-Control"] = "no-cache";
    config.headers["Pragma"] = "no-cache";
    config.headers["Expires"] = "0";
    return config;
}, function (error) { return Promise.reject(error); });
// Response interceptor
axiosInstance.interceptors.response.use(function (response) {
    return response;
}, function (error) {
    return Promise.reject(error);
});
exports.default = axiosInstance;
