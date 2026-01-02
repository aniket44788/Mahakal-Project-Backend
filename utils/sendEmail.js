import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

console.log("Email user:", process.env.EMAIL_USER);

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  throw new Error("❌ EMAIL_USER or EMAIL_PASS missing");
}

const transporter = nodemailer.createTransport({
  service: "gmail", 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (to, subject, html) => {
  try {
    const result = await transporter.sendMail({
      from: `"OTP Service" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent successfully:", result.messageId);
    return result;
  } catch (error) {
    console.error("❌ Email send error:", error);
    throw error;
  }
};
