import dotenv from "dotenv";
dotenv.config();

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to, subject, html) => {
  await resend.emails.send({
    from: "Mahakal <onboarding@resend.dev>",
    to,
    subject,
    html,
  });
};
