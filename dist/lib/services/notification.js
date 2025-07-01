"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserNotifications = getUserNotifications;
exports.getUnreadNotificationCount = getUnreadNotificationCount;
exports.markNotificationAsRead = markNotificationAsRead;
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
exports.deleteNotification = deleteNotification;
exports.createNotification = createNotification;
exports.generateNotificationMessage = generateNotificationMessage;
exports.generateActionUrl = generateActionUrl;
// lib/services/notification.ts
var axios_1 = __importDefault(require("../axios"));
// Get all notifications for the current user
function getUserNotifications(filters) {
    return __awaiter(this, void 0, void 0, function () {
        var params, response, error_1, errorMessage, message;
        var _a, _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    _h.trys.push([0, 2, , 3]);
                    params = new URLSearchParams();
                    if ((filters === null || filters === void 0 ? void 0 : filters.isRead) !== undefined) {
                        params.append("isRead", filters.isRead.toString());
                    }
                    if (filters === null || filters === void 0 ? void 0 : filters.type) {
                        params.append("type", filters.type);
                    }
                    if (filters === null || filters === void 0 ? void 0 : filters.limit) {
                        params.append("limit", filters.limit.toString());
                    }
                    if (filters === null || filters === void 0 ? void 0 : filters.offset) {
                        params.append("offset", filters.offset.toString());
                    }
                    return [4 /*yield*/, axios_1.default.get("/notifications?".concat(params.toString()), {
                            withCredentials: true,
                            headers: {
                                "Cache-Control": "no-cache",
                                Pragma: "no-cache",
                                Expires: "0",
                            },
                        })];
                case 1:
                    response = _h.sent();
                    return [2 /*return*/, response.data];
                case 2:
                    error_1 = _h.sent();
                    errorMessage = ((_b = (_a = error_1.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) ||
                        ((_d = (_c = error_1.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.message) ||
                        error_1.message ||
                        "";
                    if (((_e = error_1.response) === null || _e === void 0 ? void 0 : _e.status) === 500 &&
                        (errorMessage.includes("doesn't exist") ||
                            errorMessage.includes("relation") ||
                            errorMessage.includes("P2021") ||
                            errorMessage.includes("table") ||
                            errorMessage.includes("Notification"))) {
                        // Return empty state for missing table instead of throwing error
                        console.warn("Notification table not found - returning empty state");
                        return [2 /*return*/, {
                                notifications: [],
                                total: 0,
                                unreadCount: 0,
                            }];
                    }
                    message = ((_g = (_f = error_1.response) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.error) || "Failed to fetch notifications.";
                    throw new Error(message);
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Get unread notification count
function getUnreadNotificationCount() {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_2, errorMessage, message;
        var _a, _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    _h.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1.default.get("/notifications/count", {
                            withCredentials: true,
                            headers: {
                                "Cache-Control": "no-cache",
                                Pragma: "no-cache",
                                Expires: "0",
                            },
                        })];
                case 1:
                    response = _h.sent();
                    return [2 /*return*/, response.data.unreadCount];
                case 2:
                    error_2 = _h.sent();
                    errorMessage = ((_b = (_a = error_2.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) ||
                        ((_d = (_c = error_2.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.message) ||
                        error_2.message ||
                        "";
                    if (((_e = error_2.response) === null || _e === void 0 ? void 0 : _e.status) === 500 &&
                        (errorMessage.includes("doesn't exist") ||
                            errorMessage.includes("relation") ||
                            errorMessage.includes("P2021") ||
                            errorMessage.includes("table") ||
                            errorMessage.includes("Notification"))) {
                        // Return 0 for missing table instead of throwing error
                        console.warn("Notification table not found - returning 0 count");
                        return [2 /*return*/, 0];
                    }
                    message = ((_g = (_f = error_2.response) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.error) || "Failed to fetch notification count.";
                    throw new Error(message);
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Mark a specific notification as read
function markNotificationAsRead(notificationId) {
    return __awaiter(this, void 0, void 0, function () {
        var error_3, message;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1.default.patch("/notifications/".concat(notificationId), { isRead: true }, {
                            withCredentials: true,
                        })];
                case 1:
                    _c.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _c.sent();
                    message = ((_b = (_a = error_3.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || "Failed to mark notification as read.";
                    throw new Error(message);
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Mark all notifications as read
function markAllNotificationsAsRead() {
    return __awaiter(this, void 0, void 0, function () {
        var error_4, message;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1.default.post("/notifications/mark-all-read", {}, {
                            withCredentials: true,
                        })];
                case 1:
                    _c.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_4 = _c.sent();
                    message = ((_b = (_a = error_4.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) ||
                        "Failed to mark all notifications as read.";
                    throw new Error(message);
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Delete a specific notification
function deleteNotification(notificationId) {
    return __awaiter(this, void 0, void 0, function () {
        var error_5, message;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1.default.delete("/notifications/".concat(notificationId), {
                            withCredentials: true,
                        })];
                case 1:
                    _c.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_5 = _c.sent();
                    message = ((_b = (_a = error_5.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || "Failed to delete notification.";
                    throw new Error(message);
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Create a new notification (typically called from server-side)
function createNotification(data) {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_6, message;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1.default.post("/notifications", data, {
                            withCredentials: true,
                        })];
                case 1:
                    response = _c.sent();
                    return [2 /*return*/, response.data];
                case 2:
                    error_6 = _c.sent();
                    message = ((_b = (_a = error_6.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || "Failed to create notification.";
                    throw new Error(message);
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Helper function to generate notification messages based on type
function generateNotificationMessage(type, data) {
    switch (type) {
        case "TICKET_ASSIGNED":
            return {
                title: "New Ticket Assigned",
                message: "You have been assigned to ticket \"".concat(data.ticketTitle, "\" (").concat(data.ticketId, ")"),
            };
        case "TICKET_STATUS_CHANGED":
            return {
                title: "Ticket Status Updated",
                message: "Ticket \"".concat(data.ticketTitle, "\" (").concat(data.ticketId, ") status changed from ").concat(data.oldStatus, " to ").concat(data.newStatus),
            };
        case "TICKET_COMMENTED":
            return {
                title: "New Comment on Ticket",
                message: "".concat(data.commenterName, " commented on ticket \"").concat(data.ticketTitle, "\" (").concat(data.ticketId, ")"),
            };
        case "TICKET_DUE_DATE_APPROACHING":
            return {
                title: "Ticket Due Date Approaching",
                message: "Ticket \"".concat(data.ticketTitle, "\" (").concat(data.ticketId, ") is due soon"),
            };
        case "WORK_STAGE_UPDATED":
            return {
                title: "Work Stage Updated",
                message: "Work stage updated for ticket \"".concat(data.ticketTitle, "\" (").concat(data.ticketId, ")"),
            };
        default:
            return {
                title: "Notification",
                message: "You have a new notification",
            };
    }
}
// Helper function to generate action URL for notifications
function generateActionUrl(ticketId) {
    if (ticketId) {
        return "/dashboard/ticket/".concat(ticketId);
    }
    return undefined;
}
