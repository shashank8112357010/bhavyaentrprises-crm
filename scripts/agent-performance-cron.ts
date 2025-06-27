// scripts/agent-performance-cron.ts
import { PrismaClient, Role, User, NotificationType } from '@prisma/client';
import { calculateAgentPerformance } from '../lib/services/performance'; // Adjust path if necessary
// import { sendMail } from '../lib/mailer'; // Assuming for email notifications
import cron from 'node-cron';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file if present (especially for local execution)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

// Function to ensure DATABASE_URL is set for Prisma Client within this script
function ensureDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    // THIS IS A FALLBACK AND SHOULD BE REMOVED OR SECURED IN PRODUCTION
    // It's better to ensure the environment itself has DATABASE_URL set.
    // Replace with your actual database URL if needed for direct script execution
    process.env.DATABASE_URL = "postgresql://admin:praarabdh@financial@god@147.79.68.189:5432/interiorcrm";
    console.warn("Temporarily setting DATABASE_URL for agent-performance-cron. Ensure it's set in the environment for production.");
  }
  if (!process.env.DATABASE_URL) {
    console.error("FATAL: DATABASE_URL is not set. Cron job cannot connect to the database.");
    process.exit(1); // Exit if still not set, as Prisma won't work
  }
}


async function createAgentNotification(agentId: string, performanceData: any) {
  const summary = `Your daily performance summary: Score ${performanceData.score}/100, Rating ${performanceData.rating} stars. Total Incentive: ₹${performanceData.totalIncentive}.`;
  // Could add more details like pending tasks.

  await prisma.notification.create({
    data: {
      userId: agentId,
      type: NotificationType.TICKET_STATUS_CHANGED, // Or a new NotificationType e.g., PERFORMANCE_SUMMARY
      title: 'Daily Performance Update',
      message: summary,
      actionUrl: `/dashboard/performance/agent/${agentId}`, // Link to their performance page
    },
  });
  console.log(`Notification created for agent ${agentId}`);

  // Optional: Send email
  // const agent = await prisma.user.findUnique({ where: { id: agentId } });
  // if (agent?.email) {
  //   try {
  //     await sendMail({
  //       to: agent.email,
  //       subject: 'Your Daily Agent Performance Summary',
  //       text: summary,
  //       html: `<p>${summary.replace(/\n/g, '<br>')}</p><p><a href="[YourAppURL]/dashboard/performance/agent/${agentId}">View Details</a></p>`,
  //     });
  //     console.log(`Performance email sent to agent ${agentId}`);
  //   } catch (emailError) {
  //     console.error(`Failed to send performance email to agent ${agentId}:`, emailError);
  //   }
  // }
}

async function createAdminNotifications(allPerformanceData: Array<{ agentName: string, data: any }>) {
  let adminSummary = 'Agent Performance Cron Run Summary:\n';
  let hasIssues = false;

  allPerformanceData.forEach(perf => {
    adminSummary += `\nAgent: ${perf.agentName} - Score: ${perf.data.score}\n`;
    if (perf.data.adminNotifications.length > 0) {
      hasIssues = true;
      adminSummary += `  Admin Alerts (${perf.data.adminNotifications.length}):\n`;
      perf.data.adminNotifications.slice(0, 3).forEach((note: any) => { // Show first 3 alerts
        adminSummary += `    - Ticket ${note.ticketId}: Status ${note.status}, JCR ${note.jcrUploaded ? '✅' : '❌'}, PO ${note.poUploaded ? '✅' : '❌'}\n`;
      });
    }
  });

  if (!hasIssues) {
    adminSummary += "\nNo critical issues flagged for immediate admin attention in this run.";
  }

  // Find admin users
  const admins = await prisma.user.findMany({
    where: { role: Role.ADMIN },
  });

  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: NotificationType.TICKET_STATUS_CHANGED, // Or a new specific type like ADMIN_PERFORMANCE_DIGEST
        title: 'Agent Performance Daily Digest',
        message: adminSummary.substring(0, 1000), // Truncate if too long for DB
         actionUrl: `/dashboard/reports`, // Or a dedicated admin overview page
      },
    });
    console.log(`Admin digest notification created for admin ${admin.id}`);

    // Optional: Send consolidated email to admins
    // if (admin.email) {
    //   try {
    //     await sendMail({
    //       to: admin.email,
    //       subject: 'Daily Agent Performance Digest',
    //       text: adminSummary,
    //       html: `<pre>${adminSummary}</pre>`,
    //     });
    //     console.log(`Admin digest email sent to ${admin.email}`);
    //   } catch (emailError) {
    //     console.error(`Failed to send admin digest email to ${admin.email}:`, emailError);
    //   }
    // }
  }
}

async function runAgentPerformanceCron() {
  console.log('Starting agent performance cron job...');
  ensureDatabaseUrl(); // Ensure DATABASE_URL is available

  try {
    const agents = await prisma.user.findMany({
      where: {
        // Define which roles are considered for performance tracking
        // Example: RM (Relationship Manager) and MST (May be another agent role)
        // Adjust as per your application's roles
        role: { in: [Role.RM, Role.MST, Role.BACKEND] }, // Added BACKEND as it's a role
        status: 'ACTIVE', // Only active agents
      },
    });

    if (agents.length === 0) {
      console.log('No active agents found for performance calculation.');
      return;
    }

    const allPerformanceResults = [];

    for (const agent of agents) {
      console.log(`Calculating performance for agent: ${agent.name} (ID: ${agent.id})`);
      try {
        const performanceData = await calculateAgentPerformance(agent.id);
        allPerformanceResults.push({ agentName: agent.name, data: performanceData });

        await createAgentNotification(agent.id, performanceData);

        // Optionally update User model with rating or score if desired
        // await prisma.user.update({
        //   where: { id: agent.id },
        //   data: {
        //     rating: parseFloat(performanceData.rating), // Assuming rating is a field on User
        //     // lastPerformanceScore: parseFloat(performanceData.score), // If you add such a field
        //   },
        // });

      } catch (error) {
        console.error(`Error calculating performance for agent ${agent.id} (${agent.name}):`, error);
      }
    }

    if (allPerformanceResults.length > 0) {
      await createAdminNotifications(allPerformanceResults);
    }

    console.log('Agent performance cron job finished successfully.');

  } catch (error) {
    console.error('Error in agent performance cron job:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Schedule the cron job
// Runs daily at 1 AM server time. Adjust as needed.
// Format: 'ss mm hh dd mm ww' (seconds, minutes, hours, day of month, month, day of week)
// cron.schedule('0 1 * * *', () => {
//   console.log('Running scheduled agent performance calculation...');
//   runAgentPerformanceCron();
// }, {
//   scheduled: true,
//   timezone: "Asia/Kolkata", // Set to your server's timezone or desired timezone
// });


// To run this script directly for testing:
// Ensure you have ts-node installed if it's a .ts file: npm install -g ts-node
// Then run: DATABASE_URL="your_db_url_here" ts-node ./scripts/agent-performance-cron.ts
// Or if compiled to JS: DATABASE_URL="your_db_url_here" node ./dist-server/scripts/agent-performance-cron.js

if (require.main === module) {
  console.log('Running agent-performance-cron.ts directly...');
  runAgentPerformanceCron().then(() => {
    console.log("Direct run completed.");
  }).catch(e => {
    console.error("Direct run failed:", e);
    process.exit(1);
  });
}

export { runAgentPerformanceCron };
