"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transporter = void 0;
exports.sendMail = sendMail;
// lib/mailer.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.NEXT_PUBLIC_EMAIL_USER,
        pass: process.env.NEXT_PUBLIC_EMAIL_PASS,
    },
});
exports.transporter = transporter;
// Reusable mail sender
async function sendMail({ to, subject, text, html, attachments, }) {
    return await transporter.sendMail({
        from: `"Admin" <${process.env.NEXT_PUBLIC_EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
        attachments,
    });
}
