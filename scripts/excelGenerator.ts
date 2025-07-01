import ExcelJS from 'exceljs';
import { TicketWithRelations } from '../lib/types/business-insights';
import fs from 'fs';
import path from 'path';

export async function generateExcel(tickets: TicketWithRelations[]): Promise<string> {
  const workbook = new ExcelJS.Workbook();

  // Sheet 1: NEW STATUS TICKET
  const newSheet = workbook.addWorksheet('NEW STATUS TICKET');
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

  tickets.filter(t => t.status === 'new').forEach(ticket => {
    const quotation = ticket.Quotation;
    const expenseTotal = ticket.expenses.reduce((sum: number, e: { amount?: number }) => sum + (e.amount || 0), 0);
    const row = newSheet.addRow({
      clientName: ticket.workStage?.client?.name || '',
      agent: ticket.workStage?.assignee?.name || '',
      quotationId: quotation?.id || '',
      quoteAmount: quotation?.grandTotal || 0,
      expense: expenseTotal,
      expectedExpense: quotation?.expectedExpense || 0,
      expectedAmountLeft: (quotation?.expectedExpense || 0) - expenseTotal,
      poStatus: '', // will set below
    });
    // Set PO Status as clickable link if path exists
    if (ticket.workStage?.poFilePath) {
      let link = ticket.workStage.poFilePath.startsWith('http') ? ticket.workStage.poFilePath : `file://${ticket.workStage.poFilePath}`;
      row.getCell('poStatus').value = { text: 'View', hyperlink: link };
    } else {
      row.getCell('poStatus').value = ticket.workStage?.poStatus ? 'Yes' : 'No';
    }
  });

  // Add timestamp to the top of the first worksheet
  const now = new Date();
  const formattedTimestamp = now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
  // Insert at the top of the first worksheet
  const firstSheet = workbook.worksheets[0];
  firstSheet.insertRow(1, [`Report generated on: ${formattedTimestamp}`]);
  // Optionally merge cells for better appearance
  firstSheet.mergeCells(1, 1, 1, firstSheet.columnCount);
  firstSheet.getRow(1).font = { bold: true, size: 14 };

  // Save to temp file with timestamp in filename
  const safeTimestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const filePath = path.join(__dirname, `business-insights-${safeTimestamp}.xlsx`);
  await workbook.xlsx.writeFile(filePath);
  return filePath;
}
