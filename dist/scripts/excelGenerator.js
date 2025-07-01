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
exports.generateExcel = generateExcel;
var exceljs_1 = __importDefault(require("exceljs"));
var path_1 = __importDefault(require("path"));
function generateExcel(tickets) {
    return __awaiter(this, void 0, void 0, function () {
        var workbook, newSheet, now, formattedTimestamp, firstSheet, safeTimestamp, filePath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    workbook = new exceljs_1.default.Workbook();
                    newSheet = workbook.addWorksheet('NEW STATUS TICKET');
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
                        var _a, _b, _c, _d, _e, _f;
                        var quotation = ticket.Quotation;
                        var expenseTotal = ticket.expenses.reduce(function (sum, e) { return sum + (e.amount || 0); }, 0);
                        var row = newSheet.addRow({
                            clientName: ((_b = (_a = ticket.workStage) === null || _a === void 0 ? void 0 : _a.client) === null || _b === void 0 ? void 0 : _b.name) || '',
                            agent: ((_d = (_c = ticket.workStage) === null || _c === void 0 ? void 0 : _c.assignee) === null || _d === void 0 ? void 0 : _d.name) || '',
                            quotationId: (quotation === null || quotation === void 0 ? void 0 : quotation.id) || '',
                            quoteAmount: (quotation === null || quotation === void 0 ? void 0 : quotation.grandTotal) || 0,
                            expense: expenseTotal,
                            expectedExpense: (quotation === null || quotation === void 0 ? void 0 : quotation.expectedExpense) || 0,
                            expectedAmountLeft: ((quotation === null || quotation === void 0 ? void 0 : quotation.expectedExpense) || 0) - expenseTotal,
                            poStatus: '', // will set below
                        });
                        // Set PO Status as clickable link if path exists
                        if ((_e = ticket.workStage) === null || _e === void 0 ? void 0 : _e.poFilePath) {
                            var link = ticket.workStage.poFilePath.startsWith('http') ? ticket.workStage.poFilePath : "file://".concat(ticket.workStage.poFilePath);
                            row.getCell('poStatus').value = { text: 'View', hyperlink: link };
                        }
                        else {
                            row.getCell('poStatus').value = ((_f = ticket.workStage) === null || _f === void 0 ? void 0 : _f.poStatus) ? 'Yes' : 'No';
                        }
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
                    filePath = path_1.default.join(__dirname, "business-insights-".concat(safeTimestamp, ".xlsx"));
                    return [4 /*yield*/, workbook.xlsx.writeFile(filePath)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, filePath];
            }
        });
    });
}
