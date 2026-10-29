import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins";
import { APIError } from "better-auth/api";
import { z } from "zod";
import { getDb } from "./db";
import { getEnv } from "./env";
import { sendIdentityMail } from "./mail";

function createAuth() {
  const env = getEnv();
  return betterAuth({
    appName: "KiliRide",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.BETTER_AUTH_URL],
    database: prismaAdapter(getDb(), { provider: "postgresql", transaction: true }),
    advanced: { database: { generateId: false } },
    logger: { disabled: true },
    onAPIError: { errorURL: "/verify-email" },
    databaseHooks: {
      user: {
        create: { before: async user => {
          const name = z.string().trim().min(1).max(100).safeParse(user.name);
          if (!name.success) throw new APIError("BAD_REQUEST", { message: "Enter a name of 1 to 100 characters." });
          return { data: { ...user, name: name.data } };
        } },
        update: { before: async user => {
          if (user.name === undefined) return { data: user };
          const name = z.string().trim().min(1).max(100).safeParse(user.name);
          if (!name.success) throw new APIError("BAD_REQUEST", { message: "Enter a name of 1 to 100 characters." });
          return { data: { ...user, name: name.data } };
        } },
      },
    },
    emailAndPassword: {
      enabled: true, requireEmailVerification: true,
      minPasswordLength: 12, maxPasswordLength: 128,
      autoSignIn: false, revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 1800,
      sendResetPassword: async ({ user, url }) => sendIdentityMail(user.email, "Reset your KiliRide password", url),
    },
    emailVerification: {
      sendOnSignUp: true, sendOnSignIn: true, autoSignInAfterVerification: false,
      expiresIn: 3600,
      sendVerificationEmail: async ({ user, url }) => sendIdentityMail(user.email, "Verify your KiliRide email", url),
    },
    session: { expiresIn: 60 * 60 * 24, updateAge: 60 * 60, freshAge: 60 * 15, cookieCache: { enabled: false } },
    verification: { storeIdentifier: "hashed" },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 60 },
    plugins: [twoFactor({ issuer: "KiliRide" })],
  });
}

let auth: ReturnType<typeof createAuth> | undefined;
export function getAuth() { return auth ??= createAuth(); }
