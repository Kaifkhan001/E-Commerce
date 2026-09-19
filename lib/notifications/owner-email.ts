import "server-only";
import nodemailer from "nodemailer";

// Sends store-owner notifications for order cancellations and cancellation
// requests, reusing the SAME SMTP credentials already configured for
// magic-link sign-in (EMAIL_SERVER_*, EMAIL_FROM) rather than a separate
// email setup — this app already has exactly one transactional email
// provider (Resend, over SMTP). This is a plain nodemailer send, not
// NextAuth's Nodemailer provider, since that provider is wired specifically
// for magic-link verification emails and has no general "send an email"
// entry point.

function smtpConfigured(): boolean {
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

export type OwnerNotificationParams = {
  kind: "cancelled" | "cancellation_requested";
  orderName: string;
  customerEmail: string;
  reason: string;
  totalDisplay: string;
  timestamp: Date;
};

/**
 * Best-effort: a failed owner notification should never block the
 * cancellation itself (the customer's order is already cancelled in
 * Shopify by the time this is called) or be reported to the customer as
 * their action having failed. Callers should log the return value, not
 * throw it upstream.
 */
export async function sendOwnerCancellationNotification(
  params: OwnerNotificationParams
): Promise<{ sent: true } | { sent: false; reason: string }> {
  const recipient = process.env.OWNER_NOTIFICATION_EMAIL;
  if (!recipient) {
    return { sent: false, reason: "OWNER_NOTIFICATION_EMAIL is not set" };
  }
  if (!smtpConfigured()) {
    return { sent: false, reason: "SMTP is not configured" };
  }

  const subject =
    params.kind === "cancelled"
      ? `Order ${params.orderName} cancelled by customer`
      : `Cancellation requested for order ${params.orderName}`;

  const actionLine =
    params.kind === "cancelled"
      ? "The customer cancelled this order themselves (it was unfulfilled, so it was cancelled automatically)."
      : "The customer asked to cancel this order. It was NOT cancelled automatically because it's already fulfilled or partially fulfilled — please follow up with them directly.";

  const text = [
    actionLine,
    "",
    `Order: ${params.orderName}`,
    `Customer email: ${params.customerEmail}`,
    `Reason given: ${params.reason}`,
    `Order total: ${params.totalDisplay}`,
    `Timestamp: ${params.timestamp.toISOString()}`,
  ].join("\n");

  try {
    await getTransporter().sendMail({
      to: recipient,
      from: process.env.EMAIL_FROM,
      subject,
      text,
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : String(err) };
  }
}
