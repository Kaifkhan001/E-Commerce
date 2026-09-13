import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Nodemailer from "next-auth/providers/nodemailer";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";

// Providers are only registered when their required env vars are present.
// This means the app runs (and other auth methods still work) even before
// every provider is configured — but also means a provider silently won't
// appear in the sign-in UI until its credentials are set. Check
// `/account` and `/auth/login` behavior after adding credentials.
const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    })
  );
}

// Email (magic link) provider requires both SMTP config AND a database
// adapter (NextAuth stores email verification tokens in a database — it
// cannot run this flow purely as JWT). The Drizzle adapter above already
// provides that (backed by DATABASE_URL), so this just checks the SMTP
// side. Until all of these are set, Email sign-in is not registered, so
// it will not appear as an option (rather than appearing and failing at
// runtime).
if (
  process.env.EMAIL_SERVER_HOST &&
  process.env.EMAIL_SERVER_PORT &&
  process.env.EMAIL_SERVER_USER &&
  process.env.EMAIL_SERVER_PASSWORD &&
  process.env.EMAIL_FROM &&
  process.env.DATABASE_URL
) {
  providers.push(
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers,
  pages: {
    signIn: "/auth/login",
  },
  session: {
    // Sessions stay JWT-backed (not database sessions) even with an
    // adapter present — the adapter is used for persisting users/accounts
    // (so OAuth sign-ins get a stable database user id, and future
    // features like a server-synced wishlist have a real userId to key
    // off), while session tokens themselves remain stateless. This is a
    // supported, common combination and preserves the existing JWT
    // behavior for Google/Facebook exactly.
    strategy: "jwt",
  },
});

export const authProvidersConfigured = {
  google: providers.some((p) => p.id === "google"),
  facebook: providers.some((p) => p.id === "facebook"),
  email: providers.some((p) => p.id === "nodemailer"),
};
