"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transporter = void 0;
exports.sendMail = sendMail;
// lib/mailer.ts
var nodemailer_1 = __importDefault(require("nodemailer"));
var transporter = nodemailer_1.default.createTransport({
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
/**
 * Sends an email using nodemailer.
 * @param {Object} params
 * @param {string} params.to
 * @param {string} params.subject
 * @param {string} [params.text]
 * @param {string} [params.html]
 * @param {any} [params.attachments]
 */
function sendMail(_a) {
    var to = _a.to, subject = _a.subject, text = _a.text, html = _a.html, attachments = _a.attachments;
    return transporter.sendMail({
        from: "\"Admin\" <".concat(process.env.NEXT_PUBLIC_EMAIL_USER, ">"),
        to: to,
        subject: subject,
        text: text,
        html: html,
        attachments: attachments,
    });
}
