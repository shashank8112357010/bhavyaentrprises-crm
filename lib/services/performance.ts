// lib/services/performance.ts
import { Prisma, PrismaClient, Ticket, WorkStage, Expense, Quotation, User, TicketStatus, TicketFeedback } from '@prisma/client';

// Initialize Prisma Client
// It should automatically pick up DATABASE_URL from the environment if set,
// otherwise, we might need to pass it explicitly if issues arise during runtime.
const prisma = new PrismaClient();

interface EnrichedTicket extends Ticket {
  workStage: WorkStage | null;
  expenses: Expense[];
  Quotation: Quotation[]; // Assuming a ticket might have multiple, but we'll likely use the primary one.
  assignee: User;
}

// Helper to get the primary quotation if multiple exist (e.g., the first one or based on some logic)
// For now, assumes the first quotation is the relevant one for grandTotal.
function getPrimaryQuotation(quotations: Quotation[]): Quotation | null {
  if (quotations && quotations.length > 0) {
    return quotations[0];
  }
  return null;
}

export function evaluateTicket(
  ticket: Ticket, // The core ticket object from Prisma
  workStage: WorkStage | null,
  expenses: Expense[],
  quotations: Quotation[]
): number {
  let score = 0;

  // 1. statusProgressedOnTime: Calculate by comparing ticket.completedDate and ticket.dueDate
  if (ticket.completedDate && ticket.dueDate && ticket.completedDate <= ticket.dueDate) {
    score += 25;
  } else if (!ticket.dueDate && ticket.status === TicketStatus.completed) {
    // If no due date but completed, give some points or define behavior
    // For now, let's assume it counts as on time if no due date is set and it's completed.
    score += 25;
  }


  // 2. jcrFilePath and poFilePath: Use from workStage
  if (workStage?.jcrFilePath && workStage?.poFilePath) {
    score += 20;
  }

  // 3. expenseAmount: Sum of expenses.amount
  const expenseAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const primaryQuotation = getPrimaryQuotation(quotations);
  const grandTotal = primaryQuotation?.grandTotal ?? 0;

  if (expenseAmount <= grandTotal) {
    score += 15;
  }

  // 4. feedback: Use ticket.feedback
  if (ticket.feedback === TicketFeedback.POSITIVE) {
    score += 20;
  } else if (ticket.feedback === TicketFeedback.NEUTRAL) {
    score += 10;
  }
  // Negative feedback gives 0 points for this criterion

  // 5. photosUploaded: Use ticket.photosUploaded
  if (ticket.photosUploaded) {
    score += 10;
  }

  // 6. billingStage: Map from ticket.status
  if (ticket.status === TicketStatus.billing_completed) {
    score += 10;
  }

  return score;
}

export async function calculateAgentPerformance(agentId: string) {
  const agent = await prisma.user.findUnique({
    where: { id: agentId },
  });

  if (!agent) {
    throw new Error(`Agent with ID ${agentId} not found.`);
  }

  const tickets = await prisma.ticket.findMany({
    where: { assigneeId: agentId },
    include: {
      workStage: true,
      expenses: true,
      Quotation: true, // Fetches all related quotations
      assignee: true, // Already have agent, but good for consistency if ticket passed around
      client: true, // For region, if not directly on agent
    },
  });

  const totalTickets = tickets.length;
  if (totalTickets === 0) {
    return {
      region: agent.department || 'N/A', // Assuming department can be used as region
      agent: agent.name,
      score: (0).toFixed(2),
      rating: (0).toFixed(1),
      jobs: 0,
      incentivePerJob: 0,
      bonus: 0,
      totalIncentive: 0,
      jcrPending: [],
      poPending: [],
      billingReadyNotSubmitted: [],
      pendingClientAction: [],
      expectedExpenses: 0,
      adminNotifications: [],
    };
  }

  let totalScore = 0;
  let bonus = 0;
  let incentivePerJob = 0;
  let allJcrPoOnTime = true; // This was based on "statusProgressedOnTime" for JCR/PO in original, re-evaluating
  let hasLoss = false; // Based on negative feedback in original
  const jcrPending: Array<Partial<EnrichedTicket>> = [];
  const poPending: Array<Partial<EnrichedTicket>> = [];
  const billingReadyNotSubmitted: Array<Partial<EnrichedTicket>> = [];
  const pendingClientAction: Array<Partial<EnrichedTicket>> = [];
  let expectedExpensesSum = 0; // Sum of grandTotal for inProgress tickets
  const adminNotifications: any[] = [];


  for (const ticket of tickets) {
    const ticketScore = evaluateTicket(ticket, ticket.workStage, ticket.expenses, ticket.Quotation);
    totalScore += ticketScore;

    const primaryQuotation = getPrimaryQuotation(ticket.Quotation);
    const grandTotal = primaryQuotation?.grandTotal ?? 0;
    const expenseAmount = ticket.expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const jcrUploaded = !!ticket.workStage?.jcrFilePath;
    const poUploaded = !!ticket.workStage?.poFilePath;

    // Re-evaluating `allJcrPoOnTime` logic. Original JS: `if (!(jcrUploaded && poUploaded)) allJcrPoOnTime = false;`
    // This seems to check if ALL tickets have JCR/PO.
    if (!jcrUploaded || !poUploaded) {
      allJcrPoOnTime = false;
    }

    if (ticket.feedback === TicketFeedback.NEGATIVE) {
      hasLoss = true; // Or if expenseAmount > grandTotal, depending on definition of "loss"
    }
    if (!jcrUploaded) {
      jcrPending.push({
        ticketId: ticket.ticketId,
        title: ticket.title,
        Quotation: ticket.Quotation,
        expenses: ticket.expenses,
      });
    }
    if (!poUploaded) {
      poPending.push({
        ticketId: ticket.ticketId,
        title: ticket.title,
        Quotation: ticket.Quotation,
        expenses: ticket.expenses,
      });
    }
    if (ticket.status === TicketStatus.billing_pending) {
      billingReadyNotSubmitted.push({
        ticketId: ticket.ticketId,
        title: ticket.title,
        Quotation: ticket.Quotation,
        expenses: ticket.expenses,
        status: ticket.status,
      });
    }
    if (ticket.feedback === TicketFeedback.NEUTRAL) {
      pendingClientAction.push({
        ticketId: ticket.ticketId,
        title: ticket.title,
        feedback: ticket.feedback,
      });
    }
    if (ticket.status === TicketStatus.inProgress) {
      expectedExpensesSum += grandTotal;
    }

    // Admin notifications logic from original JS
    if (
      ticket.status === TicketStatus.inProgress ||
      ticket.status === TicketStatus.billing_pending || // If completed but not billed
      (ticket.status === TicketStatus.completed && ticket.status !== TicketStatus.billing_completed) || // another way for not billed
      (ticket.status === TicketStatus.completed && (!jcrUploaded || !poUploaded)) // completed but docs missing
    ) {
      adminNotifications.push({
        ticketId: ticket.ticketId,
        region: agent.department || ticket.client?.type || 'N/A', // Example: taking region from agent's department or client type
        agent: agent.name,
        status: ticket.status,
        billingStage: ticket.status, // Map to a more specific billing stage if needed
        quotationAmount: grandTotal,
        expenseAmount: expenseAmount,
        jcrUploaded,
        poUploaded,
        feedback: ticket.feedback || TicketFeedback.PENDING,
      });
    }
  }

  const avgScore = totalScore / totalTickets;

  if (avgScore >= 90) {
    incentivePerJob = 300;
    if (allJcrPoOnTime) bonus = 1000; // If all tickets had JCR/PO
  } else if (avgScore >= 80) {
    incentivePerJob = 200;
    if (!hasLoss) bonus = 500; // No negative feedback tickets
  } else if (avgScore >= 70) {
    incentivePerJob = 100;
  }

  const totalIncentive = incentivePerJob * totalTickets + bonus;

  return {
    region: agent.department || 'N/A',
    agent: agent.name,
    score: avgScore.toFixed(2),
    rating: (avgScore / 20).toFixed(1), // Max score 100 / 20 = 5 star rating
    jobs: totalTickets,
    incentivePerJob,
    bonus,
    totalIncentive,
    jcrPending,
    poPending,
    billingReadyNotSubmitted,
    pendingClientAction,
    expectedExpenses: expectedExpensesSum,
    adminNotifications,
  };
}

// Example usage (for testing, remove later or place in a test file)
/*
async function testPerformance() {
  // Replace with an actual agent ID from your database
  const agentIdToTest = "some-agent-uuid";
  // Ensure DATABASE_URL is set in your environment when running this
  if (!process.env.DATABASE_URL) {
     process.env.DATABASE_URL = "postgresql://admin:praarabdh@financial@god@147.79.68.189:5432/interiorcrm";
  }
  try {
    const performanceData = await calculateAgentPerformance(agentIdToTest);
    console.log(JSON.stringify(performanceData, null, 2));
  } catch (error) {
    console.error("Error calculating performance:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// testPerformance();
*/

export default {
  evaluateTicket,
  calculateAgentPerformance,
};

// Make sure to handle environment variables for DATABASE_URL properly in your deployment.
// Prisma client will need it. For local dev, .env file is usually sufficient.
// For production/staging, it should be set in the environment.
