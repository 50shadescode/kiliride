import "server-only";
import nodemailer from "nodemailer";
import { getEnv } from "./env";

export async function sendIdentityMail(to: string, subject: string, url: string) {
  const env = getEnv();
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST, port: env.SMTP_PORT, secure: false,
    ignoreTLS: true, connectionTimeout: 5000, socketTimeout: 5000,
    logger: false, debug: false,
  });
  await transport.sendMail({
    from: env.MAIL_FROM, to, subject,
    text: `${subject}\n\nOpen this link to continue:\n${url}\n\nIf you did not request this, ignore this message.`,
  });
}
