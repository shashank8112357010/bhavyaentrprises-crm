import { sendMail } from '../mailer';
import fs from 'fs';
import path from 'path';

export async function sendReports(excelFilePath: string, pdfFilePath: string): Promise<void> {
  try {
    // Read file contents to verify they exist
    await fs.promises.access(excelFilePath);
    await fs.promises.access(pdfFilePath);

    // Send email with attachments
    await sendMail({
      to: 'management@bhavyaenterprises.com',
      subject: 'Daily Business Insights Report',
      text: 'Please find attached the daily business insights report.',
      attachments: [
        {
          filename: path.basename(excelFilePath),
          path: excelFilePath,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        {
          filename: path.basename(pdfFilePath),
          path: pdfFilePath,
          contentType: 'application/pdf'
        }
      ]
    });

    // Report sent successfully
  } catch (error) {
    throw error;
  }
}
