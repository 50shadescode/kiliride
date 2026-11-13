import "server-only";
import nodemailer from "nodemailer";
import { getEnv } from "./env";
import { identityDeliveryAllowed } from "./runtime-config";

export async function sendIdentityMail(to: string, subject: string, url: string) {
  const env = getEnv();
  if (!identityDeliveryAllowed(env, to, url)) throw new Error("Identity email delivery is not authorized.");
  const transport = nodemailer.createTransport(env.smtp);
  try { await transport.sendMail({
    from: env.MAIL_FROM, to, subject,
    text: `${subject}\n\nOpen this link to continue:\n${url}\n\nIf you did not request this, ignore this message.`,
  }); } catch { throw new Error("Identity email delivery failed."); }
  finally { transport.close(); }
}
