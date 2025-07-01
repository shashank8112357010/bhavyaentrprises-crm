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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationInDB = createNotificationInDB;
exports.createTicketAssignmentNotification = createTicketAssignmentNotification;
exports.createTicketStatusChangeNotification = createTicketStatusChangeNotification;
exports.createTicketCommentNotification = createTicketCommentNotification;
exports.createWorkStageUpdateNotification = createWorkStageUpdateNotification;
exports.createDueDateApproachingNotification = createDueDateApproachingNotification;
exports.getTicketAssigneeInfo = getTicketAssigneeInfo;
// lib/services/notification-helpers.ts
var prisma_1 = require("@/lib/prisma");
// Server-side function to create notifications directly in database
function createNotificationInDB(data) {
    return __awaiter(this, void 0, void 0, function () {
        var notification, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, prisma_1.prisma.notification.create({
                            data: {
                                userId: data.userId,
                                type: data.type,
                                title: data.title,
                                message: data.message,
                                ticketId: data.ticketId || null,
                                actionUrl: data.actionUrl || null,
                            },
                            include: {
                                ticket: {
                                    select: {
                                        id: true,
                                        title: true,
                                        ticketId: true,
                                    },
                                },
                            },
                        })];
                case 1:
                    notification = _a.sent();
                    return [2 /*return*/, notification];
                case 2:
                    error_1 = _a.sent();
                    console.error("Error creating notification:", error_1);
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Create notification for ticket assignment
function createTicketAssignmentNotification(assigneeId, ticketId, ticketTitle, ticketDisplayId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, createNotificationInDB({
                    userId: assigneeId,
                    type: "TICKET_ASSIGNED",
                    title: "New Ticket Assigned",
                    message: "You have been assigned to ticket \"".concat(ticketTitle, "\" (").concat(ticketDisplayId, ")"),
                    ticketId: ticketId,
                    actionUrl: "/dashboard/ticket/".concat(ticketId),
                })];
        });
    });
}
// Create notification for ticket status change
function createTicketStatusChangeNotification(assigneeId, ticketId, ticketTitle, ticketDisplayId, oldStatus, newStatus) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, createNotificationInDB({
                    userId: assigneeId,
                    type: "TICKET_STATUS_CHANGED",
                    title: "Ticket Status Updated",
                    message: "Ticket \"".concat(ticketTitle, "\" (").concat(ticketDisplayId, ") status changed from ").concat(oldStatus, " to ").concat(newStatus),
                    ticketId: ticketId,
                    actionUrl: "/dashboard/ticket/".concat(ticketId),
                })];
        });
    });
}
// Create notification for new comment
function createTicketCommentNotification(assigneeId, ticketId, ticketTitle, ticketDisplayId, commenterName, commenterId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // Don't notify the commenter about their own comment
            if (assigneeId === commenterId) {
                return [2 /*return*/];
            }
            return [2 /*return*/, createNotificationInDB({
                    userId: assigneeId,
                    type: "TICKET_COMMENTED",
                    title: "New Comment on Ticket",
                    message: "".concat(commenterName, " commented on ticket \"").concat(ticketTitle, "\" (").concat(ticketDisplayId, ")"),
                    ticketId: ticketId,
                    actionUrl: "/dashboard/ticket/".concat(ticketId),
                })];
        });
    });
}
// Create notification for work stage update
function createWorkStageUpdateNotification(assigneeId, ticketId, ticketTitle, ticketDisplayId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, createNotificationInDB({
                    userId: assigneeId,
                    type: "WORK_STAGE_UPDATED",
                    title: "Work Stage Updated",
                    message: "Work stage updated for ticket \"".concat(ticketTitle, "\" (").concat(ticketDisplayId, ")"),
                    ticketId: ticketId,
                    actionUrl: "/dashboard/ticket/".concat(ticketId),
                })];
        });
    });
}
// Create notification for approaching due date
function createDueDateApproachingNotification(assigneeId, ticketId, ticketTitle, ticketDisplayId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, createNotificationInDB({
                    userId: assigneeId,
                    type: "TICKET_DUE_DATE_APPROACHING",
                    title: "Ticket Due Date Approaching",
                    message: "Ticket \"".concat(ticketTitle, "\" (").concat(ticketDisplayId, ") is due soon"),
                    ticketId: ticketId,
                    actionUrl: "/dashboard/ticket/".concat(ticketId),
                })];
        });
    });
}
// Helper function to get ticket assignee info
function getTicketAssigneeInfo(ticketId) {
    return __awaiter(this, void 0, void 0, function () {
        var ticket;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_1.prisma.ticket.findUnique({
                        where: { id: ticketId },
                        select: {
                            id: true,
                            title: true,
                            ticketId: true,
                            assigneeId: true,
                            assignee: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    })];
                case 1:
                    ticket = _a.sent();
                    return [2 /*return*/, ticket];
            }
        });
    });
}
