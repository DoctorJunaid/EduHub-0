import nodemailer from "nodemailer";
import { getResetPasswordTemplate, sendVerificationTemplate } from "./emailTemplates.js";

// We require dotenv to ensure environment variables are loaded if this file is tested standalone.
// Typically in a node project it's loaded at entry, but safe to include if not already loaded.
import dotenv from "dotenv";
dotenv.config();

const MAIL_USER = process.env.MAIL_USER || "naseebnoman39@gmail.com";
const MAIL_PASS = process.env.MAIL_PASS;
const MAIL_HOST = process.env.MAIL_HOST || "smtp.gmail.com";
const MAIL_PORT = parseInt(process.env.MAIL_PORT || "587", 10);
const MAIL_FROM = process.env.MAIL_FROM || `"EduHub App" <${MAIL_USER}>`;

const transporter = nodemailer.createTransport({
  host: MAIL_HOST,
  port: MAIL_PORT,
  secure: process.env.MAIL_SECURE === "true", // Use true for port 465, false for port 587
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },
});

export const sendMail = async (senderMail, subject, Message, resetLink) => {
  try {
    console.log(`[EMAIL DISPATCH] Attempting to send email to "${senderMail}" with subject: "${subject}"`);
    const info = await transporter.sendMail({
      from: MAIL_FROM,
      to: senderMail,
      subject: subject,
      text: Message,
      html: getResetPasswordTemplate(resetLink),
    });
    console.log(`[EMAIL SUCCESS] Successfully sent email to "${senderMail}". MessageId: ${info.messageId}`);
    return info.messageId;
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send email to "${senderMail}":`, err.message || err);
    throw err;
  }
};

export const sendVerificationMail = async (senderMail, subject, Message, verificationLink) => {
  const info = await transporter.sendMail({
    from: '"EduHub App" <naseebnoman39@gmail.com>',
    to: senderMail,
    subject: subject,
    text: Message,
    html: sendVerificationTemplate(verificationLink),
  });

  return info.messageId;
};

/**
 * Send generic notification or ticket update email
 * Non-blocking, safe execution.
 */
export const sendNotificationEmail = async ({ to, subject, html, text }) => {
  if (!to) return null;
  try {
    console.log(`[EMAIL DISPATCH] Sending notification email to "${to}" -> "${subject}"`);
    const info = await transporter.sendMail({
      from: MAIL_FROM,
      to,
      subject,
      text: text || subject,
      html,
    });
    console.log(`[EMAIL SUCCESS] Notification email sent to "${to}". MessageId: ${info.messageId}`);
    return info.messageId;
  } catch (err) {
    console.warn(`[EMAIL WARNING] Failed to send notification email to "${to}":`, err.message || err);
    return null;
  }
};

