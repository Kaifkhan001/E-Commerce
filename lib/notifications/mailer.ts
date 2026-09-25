import "server-only";
import nodemailer from "nodemailer";

// Shared SMTP transport for every transactional email this app sends
// outside of NextAuth's own magic-link flow (owner notifications, customer
// cancellation confirmations) — reuses the SAME credentials already
// configured for magic-link sign-in (EMAIL_SERVER_*, EMAIL_FROM) rather
// than a separate email setup, since this app has exactly one
// transactional email provider (Resend, over SMTP). This is a plain
// nodemailer send, not NextAuth's Nodemailer provider, since that provider
// is wired specifically for magic-link verification emails and has no
// general "send an email" entry point.

export function smtpConfigured(): boolean {
  return Boolean(
    process.env.EMAIL_SERVER_HOST &&
      process.env.EMAIL_SERVER_PORT &&
      process.env.EMAIL_SERVER_USER &&
      process.env.EMAIL_SERVER_PASSWORD &&
      process.env.EMAIL_FROM
  );
}

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });
  }
  return cachedTransporter;
}

export type SendResult = { sent: true } | { sent: false; reason: string };

/** Best-effort send — callers decide what a failure here should and shouldn't block. */
export async function sendPlainTextEmail(params: { to: string; subject: string; text: string }): Promise<SendResult> {
  if (!smtpConfigured()) {
    return { sent: false, reason: "SMTP is not configured" };
  }
  try {
    await getTransporter().sendMail({
      to: params.to,
      from: process.env.EMAIL_FROM,
      subject: params.subject,
      text: params.text,
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : String(err) };
  }
}
