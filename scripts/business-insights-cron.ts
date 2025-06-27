// scripts/business-insights-cron.ts
const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const { sendMail } = require('../lib/mailer');
const fs = require('fs');
const cron = require('node-cron');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const INDIA_6AM_CRON = '0 0 0 * * *'; // for node-cron, IST 6AM

async function fetchTickets() {
  // Fetch tickets with status: new, completed, billing_pending, billing_completed
  const tickets = await prisma.ticket.findMany({
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
  });
  return tickets;
}

function getPoStatusLink(poStatus: boolean | null | undefined, poFilePath: string | null | undefined) {
  if (poStatus && poFilePath) {
    return `View: ${poFilePath}`;
  }
  return poStatus ? 'Yes' : 'No';
}

function getJcrStatusLink(jcrStatus: boolean | null | undefined, jcrFilePath: string | null | undefined) {
  if (jcrStatus && jcrFilePath) {
    return `View: ${jcrFilePath}`;
  }
  return jcrStatus ? 'Yes' : 'No';
}

async function generateExcel(tickets: any[]) {
  const workbook = new ExcelJS.Workbook();

  // Sheet 1: NEW STATUS TICKET
  const newSheet = workbook.addWorksheet('NEW STATUS TICKET');

  // Sheet 3: BILLING PENDING
  const billingPendingSheet = workbook.addWorksheet('BILLING PENDING');
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

  tickets.filter(t => t.status === 'billing_pending').forEach(ticket => {
    const quotation = ticket.Quotation[0];
    const expenseTotal = ticket.expenses.reduce((sum: number, e: { amount?: number }) => sum + (e.amount || 0), 0);
    const row = billingPendingSheet.addRow({
      clientName: ticket.client?.name || '',
      agent: ticket.workStage?.agentName || ticket.assignee?.name || '',
      quotationId: quotation?.quoteNo || quotation?.id || '',
      quoteAmount: quotation?.grandTotal || '',
      expense: expenseTotal,
      expectedExpense: quotation?.expectedExpense || '',
      expectedAmountLeft: (quotation?.expectedExpense || 0) - expenseTotal,
      poStatus: '', // will set below
    });
    if (ticket.workStage?.poFilePath) {
      let poPath = ticket.workStage.poFilePath;
      if (!poPath.startsWith('http')) {
        if (!poPath.startsWith('/Users/shashank/')) {
          poPath = `/Users/shashank/${poPath.replace(/^\/+/, '')}`;
        }
        poPath = `file://${poPath}`;
      }
      row.getCell('poStatus').value = { text: 'View', hyperlink: poPath };
    } else {
      row.getCell('poStatus').value = ticket.workStage?.poStatus ? 'Yes' : 'No';
    }
  });

  // Sheet 2: AGENT INSIGHTS (CLIENT VIEW)
  const agentInsightsSheet = workbook.addWorksheet('AGENT INSIGHTS');
  agentInsightsSheet.columns = [
    { header: 'Agent Name', key: 'agentName', width: 20 },
    { header: 'Quotation Id', key: 'quotationId', width: 20 },
    { header: 'Quotation Amount', key: 'quotationAmount', width: 18 },
    { header: 'Expected Expense Amount', key: 'expectedExpense', width: 22 },
    { header: 'Total Expense Done Till Now', key: 'totalExpenseDone', width: 26 },
    { header: 'Amount Required Now', key: 'amountRequiredNow', width: 22 },
  ];

  tickets.filter(t => t.status === 'new' || t.status === 'in_progress').forEach(ticket => {
    const quotation = ticket.Quotation[0];
    const quotationId = quotation?.quoteNo || quotation?.id || '';
    const quotationAmount = quotation?.grandTotal || 0;
    const expectedExpense = quotation?.expectedExpense || 0;
    const totalExpenseDone = ticket.expenses.reduce((sum: number, e: { amount?: number }) => sum + (e.amount || 0), 0);
    const amountRequiredNow = expectedExpense - totalExpenseDone;
    agentInsightsSheet.addRow({
      agentName: ticket.workStage?.agentName || ticket.assignee?.name || '',
      quotationId,
      quotationAmount,
      expectedExpense,
      totalExpenseDone,
      amountRequiredNow,
    });
  });

  // Sheet 4: BILLING COMPLETED
  const billingCompletedSheet = workbook.addWorksheet('BILLING COMPLETED');
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

  tickets.filter(t => t.status === 'billing_completed').forEach(ticket => {
    const quotation = ticket.Quotation[0];
    const expenseTotal = ticket.expenses.reduce((sum: number, e: { amount?: number }) => sum + (e.amount || 0), 0);
    const row = billingCompletedSheet.addRow({
      clientName: ticket.client?.name || '',
      agent: ticket.workStage?.agentName || ticket.assignee?.name || '',
      quotationId: quotation?.quoteNo || quotation?.id || '',
      quoteAmount: quotation?.grandTotal || '',
      expense: expenseTotal,
      expectedExpense: quotation?.expectedExpense || '',
      expectedAmountLeft: (quotation?.expectedExpense || 0) - expenseTotal,
      poStatus: '', // will set below
    });
    if (ticket.workStage?.poFilePath) {
      let poPath = ticket.workStage.poFilePath;
      if (!poPath.startsWith('http')) {
        if (!poPath.startsWith('/Users/shashank/')) {
          poPath = `/Users/shashank/${poPath.replace(/^\/+/, '')}`;
        }
        poPath = `file://${poPath}`;
      }
      row.getCell('poStatus').value = { text: 'View', hyperlink: poPath };
    } else {
      row.getCell('poStatus').value = ticket.workStage?.poStatus ? 'Yes' : 'No';
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

  tickets.filter(t => t.status === 'new').forEach(ticket => {
    const quotation = ticket.Quotation[0];
    const expenseTotal = ticket.expenses.reduce((sum: number, e: { amount?: number }) => sum + (e.amount || 0), 0);
    const row = newSheet.addRow({
      clientName: ticket.client?.name || '',
      agent: ticket.workStage?.agentName || ticket.assignee?.name || '',
      quotationId: quotation?.quoteNo || quotation?.id || '',
      quoteAmount: quotation?.grandTotal || '',
      expense: expenseTotal,
      expectedExpense: quotation?.expectedExpense || '',
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

  // Sheet 2: COMPLETED STATUS TICKET
  const completedSheet = workbook.addWorksheet('COMPLETED STATUS TICKET');
  completedSheet.columns = [
    { header: 'Quotation Id', key: 'quotationId', width: 20 },
    { header: 'QUOTE AMOUNT', key: 'quoteAmount', width: 15 },
    { header: 'WORK STATUS', key: 'workStatus', width: 15 },
    { header: 'APPROVAL', key: 'approval', width: 15 },
    { header: 'PO STATUS (VIEW CLICK LINK)', key: 'poStatus', width: 25 },
    { header: 'JCR STATUS', key: 'jcrStatus', width: 15 },
  ];

  tickets.filter(t => t.status === 'completed').forEach(ticket => {
    const quotation = ticket.Quotation[0];
    const row = completedSheet.addRow({
      quotationId: quotation?.quoteNo || quotation?.id || '',
      quoteAmount: quotation?.grandTotal || '',
      workStatus: ticket.workStage?.workStatus || '',
      approval: ticket.approvedByAccountant || 'Pending',
      poStatus: ticket.workStage.poFilePath, // will set below
      jcrStatus: ticket.workStage.jcrFilePath, // will set below
    });
    // Set PO Status as clickable link if path exists
    if (ticket.workStage?.poFilePath) {
      let link = ticket.workStage.poFilePath.startsWith('http') ? ticket.workStage.poFilePath : `file://${ticket.workStage.poFilePath}`;
      row.getCell('poStatus').value = { text: 'View', hyperlink: link };
    } else {
      row.getCell('poStatus').value = ticket.workStage?.poStatus ? 'Yes' : 'No';
    }
    // Set JCR Status as clickable link if path exists
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

interface Ticket {
  Quotation: { expectedExpense?: number; grandTotal?: number }[];
  expenses: { amount?: number }[];
  createdAt?: Date;
  ticketId?: string;
  id?: string;
  client?: { name?: string };
}

async function main() {
  try {
    const tickets: Ticket[] = await fetchTickets();
    const filePath = await generateExcel(tickets);
    // Calculate summary
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    let totalLoss = 0;
    let spendToday = 0;
    let ticketBreakdown: string[] = [];
    let profitTickets: string[] = [];
    let lossTickets: string[] = [];
    tickets.forEach(ticket => {
      const quotation = ticket.Quotation[0];
      const expected = quotation?.expectedExpense || 0;
      const quoteAmount = quotation?.grandTotal || 0;
      const expense = ticket.expenses.reduce((sum: number, e: { amount?: number }) => sum + (e.amount || 0), 0);
      const diff = expected - expense;
      const breakdownLine =
        `Ticket: ${ticket.ticketId || ticket.id}\n` +
        `Client: ${ticket.client?.name || ''}\n` +
        `Quotation Amount: ₹${quoteAmount}\n` +
        `Expected: ₹${expected}\n` +
        `Expense: ₹${expense}\n` +
        `Diff: ₹${diff}`;
      if (diff >= 0) {
        profitTickets.push(breakdownLine, ''); // add spacing
      } else {
        lossTickets.push(breakdownLine, ''); // add spacing
      }
      totalLoss += diff;
      if (ticket.createdAt && ticket.createdAt.toISOString().slice(0, 10) === todayStr) {
        spendToday += expense;
      }
    });
    ticketBreakdown.push('--- PROFIT TICKETS ---');
    ticketBreakdown.push(...profitTickets);
    ticketBreakdown.push('--- LOSS TICKETS ---');
    ticketBreakdown.push(...lossTickets);
    const summaryText = `Total Loss: ₹${totalLoss}\nSpend Today: ₹${spendToday}\nBreakdown by Ticket:\n${ticketBreakdown.join('\n')}`;
    const summaryHtml = `<h3>Business Insights Summary</h3><ul><li><b>Total Loss:</b> ₹${totalLoss}</li><li><b>Spend Today:</b> ₹${spendToday}</li></ul><b>Breakdown by Ticket:</b><ul>${ticketBreakdown.map(l => `<li>${l}</li>`).join('')}</ul>`;

    const mailOptions = {
<<<<<<< HEAD
      to: 'girish@bhavyaenterprises.com',
=======
      to: 'girish@bhavyaentrprises.com',
>>>>>>> bbf780d014edbcfa5794ba2e9c9c2f813b27b0b6
      subject: `Business Insights - ${new Date().toLocaleDateString('en-IN')}`,
      text: `Good Morning\n\n${summaryText}\n\nPlease find attached the latest business insight report.`,
      html: `<p>Good Morning</p>${summaryHtml}<p>Please find attached the latest business insight report.</p>`,
    };
    const attachment = fs.readFileSync(filePath);
    await sendMail({
      ...mailOptions,
      // @ts-ignore
      attachments: [{
        filename: 'business-insights.xlsx',
        content: attachment,
      }],
    });
    fs.unlinkSync(filePath);
    console.log('Business insights email sent!');
  } catch (err) {
    console.error('Error sending business insights:', err);
  } finally {
    await prisma.$disconnect();
  }
}



// Schedule for 6 AM IST every day
cron.schedule('0 6 * * *', async () => {
  console.log('Running scheduled business insights at 6 AM IST...');
  await main();
}, {
  timezone: 'Asia/Kolkata',
});

if (require.main === module) {
  main();
}

// To schedule with node-cron, add this to your main server file:
// import cron from 'node-cron';
// cron.schedule('0 6 * * *', () => { require('./scripts/business-insights-cron'); });
