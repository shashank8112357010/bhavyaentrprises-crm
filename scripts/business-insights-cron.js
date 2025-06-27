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
var _this = this;
// scripts/business-insights-cron.ts
var PrismaClient = require('@prisma/client').PrismaClient;
var ExcelJS = require('exceljs');
var sendMail = require('../lib/mailer').sendMail;
var fs = require('fs');
var path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
var prisma = new PrismaClient();
var INDIA_6AM_CRON = '0 0 0 * * *'; // for node-cron, IST 6AM
function fetchTickets() {
    return __awaiter(this, void 0, void 0, function () {
        var tickets;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.ticket.findMany({
                        where: {
                            status: {
                                in: [
                                    'new',
                                    'completed',
                                    'billing_pending',
                                    'billing_completed',
                                ],
                            },
                        },
                        include: {
                            assignee: true,
                            client: true,
                            Quotation: true,
                            expenses: true,
                            workStage: true,
                        },
                    })];
                case 1:
                    tickets = _a.sent();
                    return [2 /*return*/, tickets];
            }
        });
    });
}
function getPoStatusLink(poStatus, poFilePath) {
    if (poStatus && poFilePath) {
        return "View: ".concat(poFilePath);
    }
    return poStatus ? 'Yes' : 'No';
}
function getJcrStatusLink(jcrStatus, jcrFilePath) {
    if (jcrStatus && jcrFilePath) {
        return "View: ".concat(jcrFilePath);
    }
    return jcrStatus ? 'Yes' : 'No';
}
function generateExcel(tickets) {
    return __awaiter(this, void 0, void 0, function () {
        var workbook, newSheet, billingPendingSheet, agentInsightsSheet, billingCompletedSheet, completedSheet, now, formattedTimestamp, firstSheet, safeTimestamp, filePath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    workbook = new ExcelJS.Workbook();
                    newSheet = workbook.addWorksheet('NEW STATUS TICKET');
                    billingPendingSheet = workbook.addWorksheet('BILLING PENDING');
                    billingPendingSheet.columns = [
                        { header: 'Client Name', key: 'clientName', width: 20 },
                        { header: 'Agent', key: 'agent', width: 20 },
                        { header: 'Quotation Id', key: 'quotationId', width: 20 },
                        { header: 'QUOTE AMOUNT', key: 'quoteAmount', width: 15 },
                        { header: 'EXPENSE', key: 'expense', width: 15 },
                        { header: 'EXPECTED EXPENSE', key: 'expectedExpense', width: 18 },
                        { header: 'EXPECTED AMOUNT LEFT', key: 'expectedAmountLeft', width: 22 },
                        { header: 'PO Status (View Click)', key: 'poStatus', width: 25 },
                    ];
                    tickets.filter(function (t) { return t.status === 'billing_pending'; }).forEach(function (ticket) {
                        var _a, _b, _c, _d, _e;
                        var quotation = ticket.Quotation[0];
                        var expenseTotal = ticket.expenses.reduce(function (sum, e) { return sum + (e.amount || 0); }, 0);
                        var row = billingPendingSheet.addRow({
                            clientName: ((_a = ticket.client) === null || _a === void 0 ? void 0 : _a.name) || '',
                            agent: ((_b = ticket.workStage) === null || _b === void 0 ? void 0 : _b.agentName) || ((_c = ticket.assignee) === null || _c === void 0 ? void 0 : _c.name) || '',
                            quotationId: (quotation === null || quotation === void 0 ? void 0 : quotation.quoteNo) || (quotation === null || quotation === void 0 ? void 0 : quotation.id) || '',
                            quoteAmount: (quotation === null || quotation === void 0 ? void 0 : quotation.grandTotal) || '',
                            expense: expenseTotal,
                            expectedExpense: (quotation === null || quotation === void 0 ? void 0 : quotation.expectedExpense) || '',
                            expectedAmountLeft: ((quotation === null || quotation === void 0 ? void 0 : quotation.expectedExpense) || 0) - expenseTotal,
                            poStatus: '', // will set below
                        });
                        if ((_d = ticket.workStage) === null || _d === void 0 ? void 0 : _d.poFilePath) {
                            var poPath = ticket.workStage.poFilePath;
                            if (!poPath.startsWith('http')) {
                                if (!poPath.startsWith('/Users/shashank/')) {
                                    poPath = "/Users/shashank/".concat(poPath.replace(/^\/+/, ''));
                                }
                                poPath = "file://".concat(poPath);
                            }
                            row.getCell('poStatus').value = { text: 'View', hyperlink: poPath };
                        }
                        else {
                            row.getCell('poStatus').value = ((_e = ticket.workStage) === null || _e === void 0 ? void 0 : _e.poStatus) ? 'Yes' : 'No';
                        }
                    });
                    agentInsightsSheet = workbook.addWorksheet('AGENT INSIGHTS');
                    agentInsightsSheet.columns = [
                        { header: 'Agent Name', key: 'agentName', width: 20 },
                        { header: 'Quotation Id', key: 'quotationId', width: 20 },
                        { header: 'Quotation Amount', key: 'quotationAmount', width: 18 },
                        { header: 'Expected Expense Amount', key: 'expectedExpense', width: 22 },
                        { header: 'Total Expense Done Till Now', key: 'totalExpenseDone', width: 26 },
                        { header: 'Amount Required Now', key: 'amountRequiredNow', width: 22 },
                    ];
                    tickets.filter(function (t) { return t.status === 'new' || t.status === 'in_progress'; }).forEach(function (ticket) {
                        var _a, _b;
                        var quotation = ticket.Quotation[0];
                        var quotationId = (quotation === null || quotation === void 0 ? void 0 : quotation.quoteNo) || (quotation === null || quotation === void 0 ? void 0 : quotation.id) || '';
                        var quotationAmount = (quotation === null || quotation === void 0 ? void 0 : quotation.grandTotal) || 0;
                        var expectedExpense = (quotation === null || quotation === void 0 ? void 0 : quotation.expectedExpense) || 0;
                        var totalExpenseDone = ticket.expenses.reduce(function (sum, e) { return sum + (e.amount || 0); }, 0);
                        var amountRequiredNow = expectedExpense - totalExpenseDone;
                        agentInsightsSheet.addRow({
                            agentName: ((_a = ticket.workStage) === null || _a === void 0 ? void 0 : _a.agentName) || ((_b = ticket.assignee) === null || _b === void 0 ? void 0 : _b.name) || '',
                            quotationId: quotationId,
                            quotationAmount: quotationAmount,
                            expectedExpense: expectedExpense,
                            totalExpenseDone: totalExpenseDone,
                            amountRequiredNow: amountRequiredNow,
                        });
                    });
                    billingCompletedSheet = workbook.addWorksheet('BILLING COMPLETED');
                    billingCompletedSheet.columns = [
                        { header: 'Client Name', key: 'clientName', width: 20 },
                        { header: 'Agent', key: 'agent', width: 20 },
                        { header: 'Quotation Id', key: 'quotationId', width: 20 },
                        { header: 'QUOTE AMOUNT', key: 'quoteAmount', width: 15 },
                        { header: 'EXPENSE', key: 'expense', width: 15 },
                        { header: 'EXPECTED EXPENSE', key: 'expectedExpense', width: 18 },
                        { header: 'EXPECTED AMOUNT LEFT', key: 'expectedAmountLeft', width: 22 },
                        { header: 'PO Status (View Click)', key: 'poStatus', width: 25 },
                    ];
                    tickets.filter(function (t) { return t.status === 'billing_completed'; }).forEach(function (ticket) {
                        var _a, _b, _c, _d, _e;
                        var quotation = ticket.Quotation[0];
                        var expenseTotal = ticket.expenses.reduce(function (sum, e) { return sum + (e.amount || 0); }, 0);
                        var row = billingCompletedSheet.addRow({
                            clientName: ((_a = ticket.client) === null || _a === void 0 ? void 0 : _a.name) || '',
                            agent: ((_b = ticket.workStage) === null || _b === void 0 ? void 0 : _b.agentName) || ((_c = ticket.assignee) === null || _c === void 0 ? void 0 : _c.name) || '',
                            quotationId: (quotation === null || quotation === void 0 ? void 0 : quotation.quoteNo) || (quotation === null || quotation === void 0 ? void 0 : quotation.id) || '',
                            quoteAmount: (quotation === null || quotation === void 0 ? void 0 : quotation.grandTotal) || '',
                            expense: expenseTotal,
                            expectedExpense: (quotation === null || quotation === void 0 ? void 0 : quotation.expectedExpense) || '',
                            expectedAmountLeft: ((quotation === null || quotation === void 0 ? void 0 : quotation.expectedExpense) || 0) - expenseTotal,
                            poStatus: '', // will set below
                        });
                        if ((_d = ticket.workStage) === null || _d === void 0 ? void 0 : _d.poFilePath) {
                            var poPath = ticket.workStage.poFilePath;
                            if (!poPath.startsWith('http')) {
                                if (!poPath.startsWith('/Users/shashank/')) {
                                    poPath = "/Users/shashank/".concat(poPath.replace(/^\/+/, ''));
                                }
                                poPath = "file://".concat(poPath);
                            }
                            row.getCell('poStatus').value = { text: 'View', hyperlink: poPath };
                        }
                        else {
                            row.getCell('poStatus').value = ((_e = ticket.workStage) === null || _e === void 0 ? void 0 : _e.poStatus) ? 'Yes' : 'No';
                        }
                    });
                    newSheet.columns = [
                        { header: 'Client Name', key: 'clientName', width: 20 },
                        { header: 'Agent', key: 'agent', width: 20 },
                        { header: 'Quotation Id', key: 'quotationId', width: 20 },
                        { header: 'QUOTE AMOUNT', key: 'quoteAmount', width: 15 },
                        { header: 'EXPENSE', key: 'expense', width: 15 },
                        { header: 'EXPECTED EXPENSE', key: 'expectedExpense', width: 18 },
                        { header: 'EXPECTED AMOUNT LEFT', key: 'expectedAmountLeft', width: 22 },
                        { header: 'PO Status (View Click)', key: 'poStatus', width: 25 },
                    ];
                    tickets.filter(function (t) { return t.status === 'new'; }).forEach(function (ticket) {
                        var _a, _b, _c, _d, _e;
                        var quotation = ticket.Quotation[0];
                        var expenseTotal = ticket.expenses.reduce(function (sum, e) { return sum + (e.amount || 0); }, 0);
                        var row = newSheet.addRow({
                            clientName: ((_a = ticket.client) === null || _a === void 0 ? void 0 : _a.name) || '',
                            agent: ((_b = ticket.workStage) === null || _b === void 0 ? void 0 : _b.agentName) || ((_c = ticket.assignee) === null || _c === void 0 ? void 0 : _c.name) || '',
                            quotationId: (quotation === null || quotation === void 0 ? void 0 : quotation.quoteNo) || (quotation === null || quotation === void 0 ? void 0 : quotation.id) || '',
                            quoteAmount: (quotation === null || quotation === void 0 ? void 0 : quotation.grandTotal) || '',
                            expense: expenseTotal,
                            expectedExpense: (quotation === null || quotation === void 0 ? void 0 : quotation.expectedExpense) || '',
                            expectedAmountLeft: ((quotation === null || quotation === void 0 ? void 0 : quotation.expectedExpense) || 0) - expenseTotal,
                            poStatus: '', // will set below
                        });
                        // Set PO Status as clickable link if path exists
                        if ((_d = ticket.workStage) === null || _d === void 0 ? void 0 : _d.poFilePath) {
                            var link = ticket.workStage.poFilePath.startsWith('http') ? ticket.workStage.poFilePath : "file://".concat(ticket.workStage.poFilePath);
                            row.getCell('poStatus').value = { text: 'View', hyperlink: link };
                        }
                        else {
                            row.getCell('poStatus').value = ((_e = ticket.workStage) === null || _e === void 0 ? void 0 : _e.poStatus) ? 'Yes' : 'No';
                        }
                    });
                    completedSheet = workbook.addWorksheet('COMPLETED STATUS TICKET');
                    completedSheet.columns = [
                        { header: 'Quotation Id', key: 'quotationId', width: 20 },
                        { header: 'QUOTE AMOUNT', key: 'quoteAmount', width: 15 },
                        { header: 'WORK STATUS', key: 'workStatus', width: 15 },
                        { header: 'APPROVAL', key: 'approval', width: 15 },
                        { header: 'PO STATUS (VIEW CLICK LINK)', key: 'poStatus', width: 25 },
                        { header: 'JCR STATUS', key: 'jcrStatus', width: 15 },
                    ];
                    tickets.filter(function (t) { return t.status === 'completed'; }).forEach(function (ticket) {
                        var _a, _b, _c;
                        var quotation = ticket.Quotation[0];
                        var row = completedSheet.addRow({
                            quotationId: (quotation === null || quotation === void 0 ? void 0 : quotation.quoteNo) || (quotation === null || quotation === void 0 ? void 0 : quotation.id) || '',
                            quoteAmount: (quotation === null || quotation === void 0 ? void 0 : quotation.grandTotal) || '',
                            workStatus: ((_a = ticket.workStage) === null || _a === void 0 ? void 0 : _a.workStatus) || '',
                            approval: ticket.approvedByAccountant || 'Pending',
                            poStatus: ticket.workStage.poFilePath, // will set below
                            jcrStatus: ticket.workStage.jcrFilePath, // will set below
                        });
                        // Set PO Status as clickable link if path exists
                        if ((_b = ticket.workStage) === null || _b === void 0 ? void 0 : _b.poFilePath) {
                            var link = ticket.workStage.poFilePath.startsWith('http') ? ticket.workStage.poFilePath : "file://".concat(ticket.workStage.poFilePath);
                            row.getCell('poStatus').value = { text: 'View', hyperlink: link };
                        }
                        else {
                            row.getCell('poStatus').value = ((_c = ticket.workStage) === null || _c === void 0 ? void 0 : _c.poStatus) ? 'Yes' : 'No';
                        }
                        // Set JCR Status as clickable link if path exists
                    });
                    now = new Date();
                    formattedTimestamp = now.toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                        timeZone: 'Asia/Kolkata',
                    });
                    firstSheet = workbook.worksheets[0];
                    firstSheet.insertRow(1, ["Report generated on: ".concat(formattedTimestamp)]);
                    // Optionally merge cells for better appearance
                    firstSheet.mergeCells(1, 1, 1, firstSheet.columnCount);
                    firstSheet.getRow(1).font = { bold: true, size: 14 };
                    safeTimestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 16);
                    filePath = path.join(__dirname, "business-insights-".concat(safeTimestamp, ".xlsx"));
                    return [4 /*yield*/, workbook.xlsx.writeFile(filePath)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, filePath];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var tickets, filePath, today, todayStr_1, totalLoss_1, spendToday_1, ticketBreakdown, profitTickets_1, lossTickets_1, summaryText, summaryHtml, mailOptions, attachment, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, 5, 7]);
                    return [4 /*yield*/, fetchTickets()];
                case 1:
                    tickets = _a.sent();
                    return [4 /*yield*/, generateExcel(tickets)];
                case 2:
                    filePath = _a.sent();
                    today = new Date();
                    todayStr_1 = today.toISOString().slice(0, 10);
                    totalLoss_1 = 0;
                    spendToday_1 = 0;
                    ticketBreakdown = [];
                    profitTickets_1 = [];
                    lossTickets_1 = [];
                    tickets.forEach(function (ticket) {
                        var _a;
                        var quotation = ticket.Quotation[0];
                        var expected = (quotation === null || quotation === void 0 ? void 0 : quotation.expectedExpense) || 0;
                        var quoteAmount = (quotation === null || quotation === void 0 ? void 0 : quotation.grandTotal) || 0;
                        var expense = ticket.expenses.reduce(function (sum, e) { return sum + (e.amount || 0); }, 0);
                        var diff = expected - expense;
                        var breakdownLine = "Ticket: ".concat(ticket.ticketId || ticket.id, "\n") +
                            "Client: ".concat(((_a = ticket.client) === null || _a === void 0 ? void 0 : _a.name) || '', "\n") +
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
                        to: 'ershashank05@gmail.com',
                        subject: "Business Insights - ".concat(new Date().toLocaleDateString('en-IN')),
                        text: "Good Morning\n\n".concat(summaryText, "\n\nPlease find attached the latest business insight report."),
                        html: "<p>Good Morning</p>".concat(summaryHtml, "<p>Please find attached the latest business insight report.</p>"),
                    };
                    attachment = fs.readFileSync(filePath);
                    return [4 /*yield*/, sendMail(__assign(__assign({}, mailOptions), { 
                            // @ts-ignore
                            attachments: [{
                                    filename: 'business-insights.xlsx',
                                    content: attachment,
                                }] }))];
                case 3:
                    _a.sent();
                    fs.unlinkSync(filePath);
                    console.log('Business insights email sent!');
                    return [3 /*break*/, 7];
                case 4:
                    err_1 = _a.sent();
                    console.error('Error sending business insights:', err_1);
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, prisma.$disconnect()];
                case 6:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}
var cron = require('node-cron');
// Schedule for 6 AM IST every day
cron.schedule('0 6 * * *', function () { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log('Running scheduled business insights at 6 AM IST...');
                return [4 /*yield*/, main()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); }, {
    timezone: 'Asia/Kolkata',
});
if (require.main === module) {
    main();
}
// To schedule with node-cron, add this to your main server file:
// import cron from 'node-cron';
// cron.schedule('0 6 * * *', () => { require('./scripts/business-insights-cron'); });
