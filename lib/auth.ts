import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { db, schema } from "./db";
import { adminEmails } from "./admin-emails";

const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  socialProviders: googleEnabled
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          prompt: "select_account",
        },
      }
    : {},
  account: {
    // Signing in with Google links to an existing account with the same email,
    // as long as that account's email is verified (admins and staff are created verified).
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },
  databaseHooks: {
    user: {
      create: {
        // A Google sign-up whose verified email is listed in ADMIN_EMAIL becomes an admin straight away.
        // Email/password sign-ups are never verified here, so they can't claim the admin email.
        before: async (user) => {
          if (user.emailVerified && adminEmails().includes(user.email.toLowerCase())) {
            return { data: { ...user, role: "admin" } };
          }
        },
      },
    },
  },
  user: {
    additionalFields: {
      // input: false -> users can never set their own role or sneak it into sign-up.
      role: { type: "string", required: false, defaultValue: "customer", input: false },
      phone: { type: "string", required: false, input: true },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  rateLimit: { enabled: true, window: 60, max: 60 },
  plugins: [nextCookies()],
});

export const authFlags = { googleEnabled };
export type AuthSession = typeof auth.$Infer.Session;
