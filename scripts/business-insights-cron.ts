// scripts/business-insights-cron.ts
import ExcelJS from 'exceljs';
import { sendMail } from '../lib/mailer';
import fs from 'fs';
import cron from 'node-cron';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { createNotificationInDB } from '../lib/services/notification-helpers';
import { NotificationType } from '../lib/services/notification';
import { generateExcel } from '../scripts/excelGenerator';
import { PDFDocument, rgb } from 'pdf-lib';
import { generatePdf } from '../lib/pdf/pdfGenerator';
import { sendReports } from '../lib/utils/reports';
import { TicketWithRelations } from '../lib/types/business-insights';
import { TicketStatus } from '@prisma/client';

// Constants
const INDIA_6AM_CRON = '0 6 * * *'; // IST 6AM

// Define custom notification types
export type CustomNotificationType =
  | 'EXPENSE_EXCEEDS_QUOTATION'
  | 'DELAY_BEYOND_DUE_DATE'
  | 'MISSING_JCR'
  | 'MISSING_PO'
  | 'BILL_NOT_GENERATED';

// Map custom notification types to existing system types
const CUSTOM_TO_SYSTEM_TYPE: Record<CustomNotificationType, NotificationType> = {
  'EXPENSE_EXCEEDS_QUOTATION': 'TICKET_STATUS_CHANGED',
  'DELAY_BEYOND_DUE_DATE': 'TICKET_DUE_DATE_APPROACHING',
  'MISSING_JCR': 'TICKET_STATUS_CHANGED',
  'MISSING_PO': 'TICKET_STATUS_CHANGED',
  'BILL_NOT_GENERATED': 'TICKET_STATUS_CHANGED'
};

function mapToSystemType(type: CustomNotificationType): NotificationType {
  return CUSTOM_TO_SYSTEM_TYPE[type];
}

// Interface for notification data
interface BusinessNotificationData {
  userId: string;
  ticketId: string;
  ticketNumber: string;
  quotedAmount?: number;
  expectedExpense?: number;
  actualExpenses?: number;
  dueDate?: string;
  daysOverdue?: number;
}

// Helper function to generate notification title
function getNotificationTitle(type: CustomNotificationType, data: BusinessNotificationData): string {
  switch (type) {
    case 'EXPENSE_EXCEEDS_QUOTATION':
      return `Expense Exceeds Quotation - Ticket ${data.ticketNumber}`;
    case 'DELAY_BEYOND_DUE_DATE':
      return `Ticket Delayed - ${data.ticketNumber}`;
    case 'MISSING_JCR':
      return `Missing JCR Document - ${data.ticketNumber}`;
    case 'MISSING_PO':
      return `Missing Purchase Order - ${data.ticketNumber}`;
    case 'BILL_NOT_GENERATED':
      return `Bill Not Generated - ${data.ticketNumber}`;
    default:
      return 'System Notification';
  }
}

// Helper function to generate notification message
function getNotificationMessage(type: CustomNotificationType, data: BusinessNotificationData): string {
  switch (type) {
    case 'EXPENSE_EXCEEDS_QUOTATION':
      return `Actual expenses (${data.actualExpenses}) exceed quoted amount (${data.quotedAmount}) for ticket ${data.ticketNumber}`;
    case 'DELAY_BEYOND_DUE_DATE':
      return `Ticket ${data.ticketNumber} is overdue by ${data.daysOverdue} days`;
    case 'MISSING_JCR':
      return `JCR document is missing for ticket ${data.ticketNumber}`;
    case 'MISSING_PO':
      return `Purchase Order is missing for ticket ${data.ticketNumber}`;
    case 'BILL_NOT_GENERATED':
      return `Bill not generated for ticket ${data.ticketNumber} after due date`;
    default:
      return 'Please check the system for details';
  }
}

// Helper function to get notification recipients
function getNotificationRecipients(type: CustomNotificationType): string[] {
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
function getNotificationHtml(type: CustomNotificationType, data: BusinessNotificationData): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">${getNotificationTitle(type, data)}</h2>
      <p style="color: #666;">${getNotificationMessage(type, data)}</p>
      <hr style="border: 1px solid #eee; margin: 20px 0;">
      <p style="color: #888;">This is an automated notification from Bhavya Enterprises CRM system.</p>
    </div>
  `;
}

const prisma = new PrismaClient();

// Notification types
const EXPENSE_OVERRUN_NOTIFICATION = 'expense_overrun' as NotificationType;
const DELAY_NOTIFICATION = 'delay' as NotificationType;
const MISSING_DOCUMENT_NOTIFICATION = 'missing_document' as NotificationType;
const BILLING_NOTIFICATION = 'billing' as NotificationType;

// Helper functions
const checkExpenseOverrun = (ticket: TicketWithRelations) => {
  if (!ticket.Quotation) return false;
  const expected = ticket.Quotation.expectedExpense || 0;
  const actual = ticket.expenses.reduce((sum: number, e: { amount?: number }) => sum + (e.amount || 0), 0);
  return actual > expected;
};

const checkDelay = (ticket: TicketWithRelations) => {
  if (!ticket.scheduledDate) return false;
  return new Date() > new Date(ticket.scheduledDate);
};

const checkMissingDocuments = (ticket: TicketWithRelations) => {
  if (!ticket.workStage) return false;
  const hasJCR = !!ticket.workStage.jcrStatus;
  const hasPO = !!ticket.workStage.poStatus;
  return !(hasJCR && hasPO);
};

const checkBilling = (ticket: TicketWithRelations) => {
  return ticket.billGenerated;
};

const createNotification = async (ticket: TicketWithRelations, type: NotificationType) => {
  try {
    // Get assignee info if available
    const assigneeId = ticket.workStage?.assignee?.id || 'system';
    
    // Create notification
    const notification = await createNotificationInDB({
      userId: assigneeId,
      type: type,
      title: `Business Alert: ${type.replace('_', ' ').toUpperCase()}`,
      message: `Ticket ${ticket.ticketId} has a ${type.replace('_', ' ')} issue`,
      ticketId: ticket.id,
      actionUrl: `/tickets/${ticket.id}`
    });
    
    // Send email notification if needed
    if (assigneeId !== 'system') {
      await sendMail({
        to: assigneeId,
        subject: notification.title,
        text: notification.message,
        html: `<h2>${notification.title}</h2><p>${notification.message}</p>`
      });
    }
    
    return notification;
  } catch (error) {
    console.error(`Error creating notification for ticket ${ticket.ticketId}:`, error);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    // Get all tickets with proper Prisma model names and relations
    const tickets = await prisma.ticket.findMany({
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
    }) as unknown as TicketWithRelations[];

    // Check and send notifications directly
    for (const ticket of tickets) {
      if (checkExpenseOverrun(ticket)) {
        await createNotification(ticket, EXPENSE_OVERRUN_NOTIFICATION);
      }
      if (checkDelay(ticket)) {
        await createNotification(ticket, DELAY_NOTIFICATION);
      }
      if (checkMissingDocuments(ticket)) {
        await createNotification(ticket, MISSING_DOCUMENT_NOTIFICATION);
      }
      if (checkBilling(ticket)) {
        await createNotification(ticket, BILLING_NOTIFICATION);
      }
    }

    // Generate Excel report
    const excelFile = await generateExcel(tickets);
    
    // Generate PDF report
    const pdfBuffer = await PDFDocument.create();
    const page = pdfBuffer.addPage([600, 800]);
    let y = 750;
    
    // Add each ticket's data to the PDF
    for (const ticket of tickets) {
      if (!ticket.Quotation || !ticket.Quotation.rateCardDetails) continue;
      
      // Add ticket header
      page.drawText(`Ticket: ${ticket.title}`, {
        x: 50,
        y: y,
        size: 20,
        color: rgb(0, 0, 0),
      });
      y -= 20;
      
      // Add quotation details
      page.drawText(`Client ID: ${ticket.ticketId}`, {
        x: 50,
        y: y,
        size: 12,
        color: rgb(0, 0, 0),
      });
      y -= 15;
      
      page.drawText(`Sales Type: ${ticket.priority}`, {
        x: 50,
        y: y,
        size: 12,
        color: rgb(0, 0, 0),
      });
      y -= 15;
      
      if (ticket.dueDate) {
        page.drawText(`Valid Until: ${ticket.dueDate.toISOString()}`, {
          x: 50,
          y: y,
          size: 12,
          color: rgb(0, 0, 0),
        });
        y -= 15;
      }
      
      // Add rate card details
      page.drawText('Rate Card Details:', {
        x: 50,
        y: y,
        size: 14,
        color: rgb(0, 0, 0),
      });
      y -= 15;
      
      // Format rate card details for display
      const rateCardDetails = ticket.Quotation.rateCardDetails.map(detail => ({
        description: detail.description || 'N/A',
        unit: detail.unit || 'N/A',
        rate: detail.rate || 0,
        bankName: detail.bankName || 'N/A'
      }));
      
      // Add each rate card detail
      for (const detail of rateCardDetails) {
        page.drawText(`- ${detail.description} (${detail.unit}): ₹${detail.rate} (${detail.bankName})`, {
          x: 70,
          y: y,
          size: 12,
          color: rgb(0, 0, 0),
        });
        y -= 15;
      }
      
      // Add spacing between tickets
      y -= 30;
    }
    
    const pdfFile = await pdfBuffer.save();
    const pdfFilePath = path.join(__dirname, '../reports/business-insights.pdf');
    await fs.promises.writeFile(pdfFilePath, pdfFile);

    // Send reports via email
    await sendReports(excelFile, pdfFilePath);

    // Calculate summary
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    let totalLoss = 0;
    let spendToday = 0;
    const ticketBreakdown: string[] = [];
    const profitTickets: string[] = [];
    const lossTickets: string[] = [];
    tickets.forEach(ticket => {
      const quotation = ticket.Quotation;
      const expected = quotation?.expectedExpense || 0;
      const quoteAmount = quotation?.grandTotal || 0;
      const expense = ticket.expenses.reduce((sum: number, e: { amount?: number }) => sum + (e.amount || 0), 0);
      const diff = expected - expense;
      const breakdownLine =
        `Ticket: ${ticket.ticketId || ticket.id}\n` +
        `Client: ${ticket.workStage?.client?.name || ''}\n` +
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
      to: 'girish@bhavyaentrprises.com',
      subject: `Business Insights - ${new Date().toLocaleDateString('en-IN')}`,
      text: `Good Morning\n\n${summaryText}\n\nPlease find attached the latest business insight report.`,
      html: `<p>Good Morning</p>${summaryHtml}<p>Please find attached the latest business insight report.</p>`,
    };
    await sendMail({
      ...mailOptions,
      attachments: [
        {
          filename: 'business-insights.xlsx',
          path: excelFile,
        },
        {
          filename: 'business-insights.pdf',
          path: pdfFilePath,
        },
      ],
    });
    
    // Clean up files
    await fs.promises.unlink(excelFile);
    await fs.promises.unlink(pdfFilePath);
    console.log('Business insights email sent and files cleaned up!');
  } catch (error) {
    console.error('Error in business insights cron:', error);
  } finally {
    // Close Prisma client
    await prisma.$disconnect();
  }
};

// Ensure the cron runs immediately on startup
export const businessInsightsCron = async () => {
  try {
    console.log('Running business insights cron immediately...');
    await main();
  } catch (error) {
    console.error('Error running business insights cron:', error);
  }
};

// Schedule the cron to run daily at IST 6 AM
const scheduleCron = () => {
  console.log('Scheduling business insights cron...');
  cron.schedule(INDIA_6AM_CRON, async () => {
    console.log('Running business insights cron at scheduled time...');
    await businessInsightsCron();
  });
};

// Run immediately and schedule the cron
businessInsightsCron();
scheduleCron();

if (require.main === module) {
  businessInsightsCron();
}


export default main
// To schedule with node-cron, add this to your main server file:
// import { scheduleCron } from './scripts/business-insights-cron';
// scheduleCron();
