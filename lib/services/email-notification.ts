// lib/services/email-notification.ts
import { sendMail } from "@/lib/mailer";

export async function sendTicketAssignmentEmail(
  assigneeEmail: string,
  assigneeName: string,
  ticketTitle: string,
  ticketId: string,
  clientName: string,
  priority: string,
  dueDate?: string,
) {
  const subject = `New Ticket Assigned: ${ticketTitle} (${ticketId})`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #1f2937; margin-bottom: 10px;">New Ticket Assignment</h2>
        <p style="color: #6b7280; margin: 0;">You have been assigned a new maintenance ticket.</p>
      </div>
      
      <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h3 style="color: #1f2937; margin-top: 0;">Ticket Details</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Ticket ID:</td>
            <td style="padding: 8px 0; color: #6b7280;">${ticketId}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Title:</td>
            <td style="padding: 8px 0; color: #6b7280;">${ticketTitle}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Client:</td>
            <td style="padding: 8px 0; color: #6b7280;">${clientName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Priority:</td>
            <td style="padding: 8px 0;">
              <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; 
                           background-color: ${priority.toLowerCase() === "high" ? "#fee2e2" : priority.toLowerCase() === "medium" ? "#fef3c7" : "#f0f9ff"};
                           color: ${priority.toLowerCase() === "high" ? "#dc2626" : priority.toLowerCase() === "medium" ? "#d97706" : "#2563eb"};">
                ${priority.toUpperCase()}
              </span>
            </td>
          </tr>
          ${
            dueDate
              ? `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Due Date:</td>
            <td style="padding: 8px 0; color: #6b7280;">${new Date(dueDate).toLocaleDateString()}</td>
          </tr>
          `
              : ""
          }
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Assigned To:</td>
            <td style="padding: 8px 0; color: #6b7280;">${assigneeName}</td>
          </tr>
        </table>
        
        <div style="margin-top: 20px; padding: 16px; background-color: #f0f9ff; border-radius: 6px; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; color: #1e40af; font-weight: 500;">Next Steps:</p>
          <ul style="margin: 8px 0 0 0; color: #1e40af;">
            <li>Review the ticket details in the CRM system</li>
            <li>Contact the client if needed</li>
            <li>Update the ticket status as work progresses</li>
          </ul>
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/ticket/${ticketId}" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            View Ticket Details
          </a>
        </div>
      </div>
      
      <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
        <p>This is an automated message from Bhavya Enterprises CRM</p>
        <p>If you have any questions, please contact your administrator</p>
      </div>
    </div>
  `;

  const text = `
New Ticket Assignment

Hello ${assigneeName},

You have been assigned a new maintenance ticket:

Ticket ID: ${ticketId}
Title: ${ticketTitle}
Client: ${clientName}
Priority: ${priority}
${dueDate ? `Due Date: ${new Date(dueDate).toLocaleDateString()}` : ""}

Please log into the CRM system to view full ticket details and begin work.

View ticket: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/ticket/${ticketId}

Best regards,
Bhavya Enterprises CRM
  `;

  try {
    await sendMail({
      to: assigneeEmail,
      subject,
      text,
      html,
    });
  } catch (error) {
    throw error;
  }
}

export async function sendTicketStatusChangeEmail(
  assigneeEmail: string,
  assigneeName: string,
  ticketTitle: string,
  ticketId: string,
  oldStatus: string,
  newStatus: string,
) {
  const subject = `Ticket Status Updated: ${ticketTitle} (${ticketId})`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #1f2937; margin-bottom: 10px;">Ticket Status Update</h2>
        <p style="color: #6b7280; margin: 0;">The status of your assigned ticket has been updated.</p>
      </div>
      
      <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h3 style="color: #1f2937; margin-top: 0;">Status Change Details</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Ticket ID:</td>
            <td style="padding: 8px 0; color: #6b7280;">${ticketId}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Title:</td>
            <td style="padding: 8px 0; color: #6b7280;">${ticketTitle}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">Previous Status:</td>
            <td style="padding: 8px 0; color: #6b7280;">${oldStatus}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #374151;">New Status:</td>
            <td style="padding: 8px 0;">
              <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; 
                           background-color: #dcfce7; color: #166534;">
                ${newStatus.toUpperCase()}
              </span>
            </td>
          </tr>
        </table>
        
        <div style="margin-top: 20px; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/ticket/${ticketId}" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            View Ticket Details
          </a>
        </div>
      </div>
      
      <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
        <p>This is an automated message from Bhavya Enterprises CRM</p>
      </div>
    </div>
  `;

  const text = `
Ticket Status Update

Hello ${assigneeName},

The status of your assigned ticket has been updated:

Ticket ID: ${ticketId}
Title: ${ticketTitle}
Previous Status: ${oldStatus}
New Status: ${newStatus}

View ticket: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/ticket/${ticketId}

Best regards,
Bhavya Enterprises CRM
  `;

  try {
    await sendMail({
      to: assigneeEmail,
      subject,
      text,
      html,
    });
  } catch (error) {
    throw error;
  }
}
