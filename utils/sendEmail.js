import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";



const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "darkpanda44788@gmail.com",
    pass: "ktwexceatvqesthx",
  },
});

export const sendEmail = async (to, subject, html) => {
  console.log("function is hitting ")
  try {
    const emailuser = "darkpanda44788@gmail.com";
    const result = await transporter.sendMail({
      from: `"OTP Service" <${emailuser}>`,
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
