import nodemailer from "nodemailer";
import { getResetPasswordTemplate, sendVerificationTemplate } from "./emailTemplates.js";

// We require dotenv to ensure environment variables are loaded if this file is tested standalone.
// Typically in a node project it's loaded at entry, but safe to include if not already loaded.
import dotenv from "dotenv";
dotenv.config();

const MAIL_PASS = process.env.MAIL_PASS;

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use true for port 465, false for port 587
  auth: {
    user: "naseebnoman39@gmail.com",
    pass: MAIL_PASS,
  },
});

export const sendMail = async (senderMail, subject, Message, resetLink) => {
  const info = await transporter.sendMail({
    from: '"EduHub App" <naseebnoman39@gmail.com>',
    to: senderMail,
    subject: subject,
    text: Message,
    html: getResetPasswordTemplate(resetLink),
  });

  return info.messageId;
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
