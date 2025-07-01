"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.businessInsightsCron = void 0;
var mailer_1 = require("../lib/mailer");
var fs_1 = __importDefault(require("fs"));
var node_cron_1 = __importDefault(require("node-cron"));
var path_1 = __importDefault(require("path"));
var client_1 = require("@prisma/client");
var notification_helpers_1 = require("../lib/services/notification-helpers");
var excelGenerator_1 = require("../scripts/excelGenerator");
var pdf_lib_1 = require("pdf-lib");
var reports_1 = require("../lib/utils/reports");
// Constants
var INDIA_6AM_CRON = '0 6 * * *'; // IST 6AM
// Map custom notification types to existing system types
var CUSTOM_TO_SYSTEM_TYPE = {
    'EXPENSE_EXCEEDS_QUOTATION': 'TICKET_STATUS_CHANGED',
    'DELAY_BEYOND_DUE_DATE': 'TICKET_DUE_DATE_APPROACHING',
    'MISSING_JCR': 'TICKET_STATUS_CHANGED',
    'MISSING_PO': 'TICKET_STATUS_CHANGED',
    'BILL_NOT_GENERATED': 'TICKET_STATUS_CHANGED'
};
function mapToSystemType(type) {
    return CUSTOM_TO_SYSTEM_TYPE[type];
}
// Helper function to generate notification title
function getNotificationTitle(type, data) {
    switch (type) {
        case 'EXPENSE_EXCEEDS_QUOTATION':
            return "Expense Exceeds Quotation - Ticket ".concat(data.ticketNumber);
        case 'DELAY_BEYOND_DUE_DATE':
            return "Ticket Delayed - ".concat(data.ticketNumber);
        case 'MISSING_JCR':
            return "Missing JCR Document - ".concat(data.ticketNumber);
        case 'MISSING_PO':
            return "Missing Purchase Order - ".concat(data.ticketNumber);
        case 'BILL_NOT_GENERATED':
            return "Bill Not Generated - ".concat(data.ticketNumber);
        default:
            return 'System Notification';
    }
}
// Helper function to generate notification message
function getNotificationMessage(type, data) {
    switch (type) {
        case 'EXPENSE_EXCEEDS_QUOTATION':
            return "Actual expenses (".concat(data.actualExpenses, ") exceed quoted amount (").concat(data.quotedAmount, ") for ticket ").concat(data.ticketNumber);
        case 'DELAY_BEYOND_DUE_DATE':
            return "Ticket ".concat(data.ticketNumber, " is overdue by ").concat(data.daysOverdue, " days");
        case 'MISSING_JCR':
            return "JCR document is missing for ticket ".concat(data.ticketNumber);
        case 'MISSING_PO':
            return "Purchase Order is missing for ticket ".concat(data.ticketNumber);
        case 'BILL_NOT_GENERATED':
            return "Bill not generated for ticket ".concat(data.ticketNumber, " after due date");
        default:
            return 'Please check the system for details';
    }
}
// Helper function to get notification recipients
function getNotificationRecipients(type) {
    switch (type) {
        case 'EXPENSE_EXCEEDS_QUOTATION':
            return ['finance@bhavyaenterprises.com'];
        case 'DELAY_BEYOND_DUE_DATE':
            return ['management@bhavyaenterprises.com'];
        case 'MISSING_JCR':
            return ['operations@bhavyaenterprises.com'];
        case 'MISSING_PO':
            return ['procurement@bhavyaenterprises.com'];
        case 'BILL_NOT_GENERATED':
            return ['billing@bhavyaenterprises.com'];
        default:
            return ['finance@bhavyaenterprises.com'];
    }
}
// Helper function to generate notification HTML
function getNotificationHtml(type, data) {
    return "\n    <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;\">\n      <h2 style=\"color: #333;\">".concat(getNotificationTitle(type, data), "</h2>\n      <p style=\"color: #666;\">").concat(getNotificationMessage(type, data), "</p>\n      <hr style=\"border: 1px solid #eee; margin: 20px 0;\">\n      <p style=\"color: #888;\">This is an automated notification from Bhavya Enterprises CRM system.</p>\n    </div>\n  ");
}
var prisma = new client_1.PrismaClient();
// Notification types
var EXPENSE_OVERRUN_NOTIFICATION = 'expense_overrun';
var DELAY_NOTIFICATION = 'delay';
var MISSING_DOCUMENT_NOTIFICATION = 'missing_document';
var BILLING_NOTIFICATION = 'billing';
// Helper functions
var checkExpenseOverrun = function (ticket) {
    if (!ticket.Quotation)
        return false;
    var expected = ticket.Quotation.expectedExpense || 0;
    var actual = ticket.expenses.reduce(function (sum, e) { return sum + (e.amount || 0); }, 0);
    return actual > expected;
};
var checkDelay = function (ticket) {
    if (!ticket.scheduledDate)
        return false;
    return new Date() > new Date(ticket.scheduledDate);
};
var checkMissingDocuments = function (ticket) {
    if (!ticket.workStage)
        return false;
    var hasJCR = !!ticket.workStage.jcrStatus;
    var hasPO = !!ticket.workStage.poStatus;
    return !(hasJCR && hasPO);
};
var checkBilling = function (ticket) {
    return ticket.billGenerated;
};
var createNotification = function (ticket, type) { return __awaiter(void 0, void 0, void 0, function () {
    var assigneeId, notification, error_1;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 4, , 5]);
                assigneeId = ((_b = (_a = ticket.workStage) === null || _a === void 0 ? void 0 : _a.assignee) === null || _b === void 0 ? void 0 : _b.id) || 'system';
                return [4 /*yield*/, (0, notification_helpers_1.createNotificationInDB)({
                        userId: assigneeId,
                        type: type,
                        title: "Business Alert: ".concat(type.replace('_', ' ').toUpperCase()),
                        message: "Ticket ".concat(ticket.ticketId, " has a ").concat(type.replace('_', ' '), " issue"),
                        ticketId: ticket.id,
                        actionUrl: "/tickets/".concat(ticket.id)
                    })];
            case 1:
                notification = _c.sent();
                if (!(assigneeId !== 'system')) return [3 /*break*/, 3];
                return [4 /*yield*/, (0, mailer_1.sendMail)({
                        to: assigneeId,
                        subject: notification.title,
                        text: notification.message,
                        html: "<h2>".concat(notification.title, "</h2><p>").concat(notification.message, "</p>")
                    })];
            case 2:
                _c.sent();
                _c.label = 3;
            case 3: return [2 /*return*/, notification];
            case 4:
                error_1 = _c.sent();
                console.error("Error creating notification for ticket ".concat(ticket.ticketId, ":"), error_1);
                throw error_1;
            case 5: return [2 /*return*/];
        }
    });
}); };
// Main function
var main = function () { return __awaiter(void 0, void 0, void 0, function () {
    var tickets, _i, tickets_1, ticket, excelFile, pdfBuffer, page, y, _a, tickets_2, ticket, rateCardDetails, _b, rateCardDetails_1, detail, pdfFile, pdfFilePath, today, todayStr_1, totalLoss_1, spendToday_1, ticketBreakdown, profitTickets_1, lossTickets_1, summaryText, summaryHtml, mailOptions, error_2;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 20, 21, 23]);
                return [4 /*yield*/, prisma.ticket.findMany({
                        where: {
                            status: 'new',
                        },
                        include: {
                            Quotation: true,
                            expenses: true,
                            workStage: {
                                include: {
                                    ticket: true,
                                },
                            },
                            client: true,
                            assignee: true,
                        },
                    })];
            case 1:
                tickets = _c.sent();
                _i = 0, tickets_1 = tickets;
                _c.label = 2;
            case 2:
                if (!(_i < tickets_1.length)) return [3 /*break*/, 11];
                ticket = tickets_1[_i];
                if (!checkExpenseOverrun(ticket)) return [3 /*break*/, 4];
                return [4 /*yield*/, createNotification(ticket, EXPENSE_OVERRUN_NOTIFICATION)];
            case 3:
                _c.sent();
                _c.label = 4;
            case 4:
                if (!checkDelay(ticket)) return [3 /*break*/, 6];
                return [4 /*yield*/, createNotification(ticket, DELAY_NOTIFICATION)];
            case 5:
                _c.sent();
                _c.label = 6;
            case 6:
                if (!checkMissingDocuments(ticket)) return [3 /*break*/, 8];
                return [4 /*yield*/, createNotification(ticket, MISSING_DOCUMENT_NOTIFICATION)];
            case 7:
                _c.sent();
                _c.label = 8;
            case 8:
                if (!checkBilling(ticket)) return [3 /*break*/, 10];
                return [4 /*yield*/, createNotification(ticket, BILLING_NOTIFICATION)];
            case 9:
                _c.sent();
                _c.label = 10;
            case 10:
                _i++;
                return [3 /*break*/, 2];
            case 11: return [4 /*yield*/, (0, excelGenerator_1.generateExcel)(tickets)];
            case 12:
                excelFile = _c.sent();
                return [4 /*yield*/, pdf_lib_1.PDFDocument.create()];
            case 13:
                pdfBuffer = _c.sent();
                page = pdfBuffer.addPage([600, 800]);
                y = 750;
                // Add each ticket's data to the PDF
                for (_a = 0, tickets_2 = tickets; _a < tickets_2.length; _a++) {
                    ticket = tickets_2[_a];
                    if (!ticket.Quotation || !ticket.Quotation.rateCardDetails)
                        continue;
                    // Add ticket header
                    page.drawText("Ticket: ".concat(ticket.title), {
                        x: 50,
                        y: y,
                        size: 20,
                        color: (0, pdf_lib_1.rgb)(0, 0, 0),
                    });
                    y -= 20;
                    // Add quotation details
                    page.drawText("Client ID: ".concat(ticket.ticketId), {
                        x: 50,
                        y: y,
                        size: 12,
                        color: (0, pdf_lib_1.rgb)(0, 0, 0),
                    });
                    y -= 15;
                    page.drawText("Sales Type: ".concat(ticket.priority), {
                        x: 50,
                        y: y,
                        size: 12,
                        color: (0, pdf_lib_1.rgb)(0, 0, 0),
                    });
                    y -= 15;
                    if (ticket.dueDate) {
                        page.drawText("Valid Until: ".concat(ticket.dueDate.toISOString()), {
                            x: 50,
                            y: y,
                            size: 12,
                            color: (0, pdf_lib_1.rgb)(0, 0, 0),
                        });
                        y -= 15;
                    }
                    // Add rate card details
                    page.drawText('Rate Card Details:', {
                        x: 50,
                        y: y,
                        size: 14,
                        color: (0, pdf_lib_1.rgb)(0, 0, 0),
                    });
                    y -= 15;
                    rateCardDetails = ticket.Quotation.rateCardDetails.map(function (detail) { return ({
                        description: detail.description || 'N/A',
                        unit: detail.unit || 'N/A',
                        rate: detail.rate || 0,
                        bankName: detail.bankName || 'N/A'
                    }); });
                    // Add each rate card detail
                    for (_b = 0, rateCardDetails_1 = rateCardDetails; _b < rateCardDetails_1.length; _b++) {
                        detail = rateCardDetails_1[_b];
                        page.drawText("- ".concat(detail.description, " (").concat(detail.unit, "): \u20B9").concat(detail.rate, " (").concat(detail.bankName, ")"), {
                            x: 70,
                            y: y,
                            size: 12,
                            color: (0, pdf_lib_1.rgb)(0, 0, 0),
                        });
                        y -= 15;
                    }
                    // Add spacing between tickets
                    y -= 30;
                }
                return [4 /*yield*/, pdfBuffer.save()];
            case 14:
                pdfFile = _c.sent();
                pdfFilePath = path_1.default.join(__dirname, '../reports/business-insights.pdf');
                return [4 /*yield*/, fs_1.default.promises.writeFile(pdfFilePath, pdfFile)];
            case 15:
                _c.sent();
                // Send reports via email
                return [4 /*yield*/, (0, reports_1.sendReports)(excelFile, pdfFilePath)];
            case 16:
                // Send reports via email
                _c.sent();
                today = new Date();
                todayStr_1 = today.toISOString().slice(0, 10);
                totalLoss_1 = 0;
                spendToday_1 = 0;
                ticketBreakdown = [];
                profitTickets_1 = [];
                lossTickets_1 = [];
                tickets.forEach(function (ticket) {
                    var _a, _b;
                    var quotation = ticket.Quotation;
                    var expected = (quotation === null || quotation === void 0 ? void 0 : quotation.expectedExpense) || 0;
                    var quoteAmount = (quotation === null || quotation === void 0 ? void 0 : quotation.grandTotal) || 0;
                    var expense = ticket.expenses.reduce(function (sum, e) { return sum + (e.amount || 0); }, 0);
                    var diff = expected - expense;
                    var breakdownLine = "Ticket: ".concat(ticket.ticketId || ticket.id, "\n") +
                        "Client: ".concat(((_b = (_a = ticket.workStage) === null || _a === void 0 ? void 0 : _a.client) === null || _b === void 0 ? void 0 : _b.name) || '', "\n") +
                        "Quotation Amount: \u20B9".concat(quoteAmount, "\n") +
                        "Expected: \u20B9".concat(expected, "\n") +
                        "Expense: \u20B9".concat(expense, "\n") +
                        "Diff: \u20B9".concat(diff);
                    if (diff >= 0) {
                        profitTickets_1.push(breakdownLine, ''); // add spacing
                    }
                    else {
                        lossTickets_1.push(breakdownLine, ''); // add spacing
                    }
                    totalLoss_1 += diff;
                    if (ticket.createdAt && ticket.createdAt.toISOString().slice(0, 10) === todayStr_1) {
                        spendToday_1 += expense;
                    }
                });
                ticketBreakdown.push('--- PROFIT TICKETS ---');
                ticketBreakdown.push.apply(ticketBreakdown, profitTickets_1);
                ticketBreakdown.push('--- LOSS TICKETS ---');
                ticketBreakdown.push.apply(ticketBreakdown, lossTickets_1);
                summaryText = "Total Loss: \u20B9".concat(totalLoss_1, "\nSpend Today: \u20B9").concat(spendToday_1, "\nBreakdown by Ticket:\n").concat(ticketBreakdown.join('\n'));
                summaryHtml = "<h3>Business Insights Summary</h3><ul><li><b>Total Loss:</b> \u20B9".concat(totalLoss_1, "</li><li><b>Spend Today:</b> \u20B9").concat(spendToday_1, "</li></ul><b>Breakdown by Ticket:</b><ul>").concat(ticketBreakdown.map(function (l) { return "<li>".concat(l, "</li>"); }).join(''), "</ul>");
                mailOptions = {
                    to: 'girish@bhavyaentrprises.com',
                    subject: "Business Insights - ".concat(new Date().toLocaleDateString('en-IN')),
                    text: "Good Morning\n\n".concat(summaryText, "\n\nPlease find attached the latest business insight report."),
                    html: "<p>Good Morning</p>".concat(summaryHtml, "<p>Please find attached the latest business insight report.</p>"),
                };
                return [4 /*yield*/, (0, mailer_1.sendMail)(__assign(__assign({}, mailOptions), { attachments: [
                            {
                                filename: 'business-insights.xlsx',
                                path: excelFile,
                            },
                            {
                                filename: 'business-insights.pdf',
                                path: pdfFilePath,
                            },
                        ] }))];
            case 17:
                _c.sent();
                // Clean up files
                return [4 /*yield*/, fs_1.default.promises.unlink(excelFile)];
            case 18:
                // Clean up files
                _c.sent();
                return [4 /*yield*/, fs_1.default.promises.unlink(pdfFilePath)];
            case 19:
                _c.sent();
                console.log('Business insights email sent and files cleaned up!');
                return [3 /*break*/, 23];
            case 20:
                error_2 = _c.sent();
                console.error('Error in business insights cron:', error_2);
                return [3 /*break*/, 23];
            case 21: 
            // Close Prisma client
            return [4 /*yield*/, prisma.$disconnect()];
            case 22:
                // Close Prisma client
                _c.sent();
                return [7 /*endfinally*/];
            case 23: return [2 /*return*/];
        }
    });
}); };
// Ensure the cron runs immediately on startup
var businessInsightsCron = function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                console.log('Running business insights cron immediately...');
                return [4 /*yield*/, main()];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('Error running business insights cron:', error_3);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.businessInsightsCron = businessInsightsCron;
// Schedule the cron to run daily at IST 6 AM
var scheduleCron = function () {
    console.log('Scheduling business insights cron...');
    node_cron_1.default.schedule(INDIA_6AM_CRON, function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Running business insights cron at scheduled time...');
                    return [4 /*yield*/, (0, exports.businessInsightsCron)()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
};
// Run immediately and schedule the cron
(0, exports.businessInsightsCron)();
scheduleCron();
if (require.main === module) {
    (0, exports.businessInsightsCron)();
}
exports.default = main;
// To schedule with node-cron, add this to your main server file:
// import { scheduleCron } from './scripts/business-insights-cron';
// scheduleCron();
