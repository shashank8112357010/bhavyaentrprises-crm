// lib/mailer.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.NEXT_PUBLIC_EMAIL_USER,
    pass: process.env.NEXT_PUBLIC_EMAIL_PASS,
  },
});

// Reusable mail sender
/**
 * Sends an email using nodemailer.
 * @param {Object} params
 * @param {string} params.to
 * @param {string} params.subject
 * @param {string} [params.text]
 * @param {string} [params.html]
 * @param {any} [params.attachments]
 */
export function sendMail({
  to,
  subject,
  text,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: any;
}) {
  return transporter.sendMail({
    from: `"Admin" <${process.env.NEXT_PUBLIC_EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
    attachments,
  });
}

export { transporter };


