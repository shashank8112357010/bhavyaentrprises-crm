// lib/mailer.ts
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.NEXT_PUBLIC_EMAIL_USER,
      pass: process.env.NEXT_PUBLIC_EMAIL_PASS,
    },
});

// Reusable mail sender
export async function sendMail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  return await transporter.sendMail({
    from: `"Admin" <${process.env.NEXT_PUBLIC_EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
}
