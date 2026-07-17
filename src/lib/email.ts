import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM ?? "TechRSVP <onboarding@resend.dev>";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Sends a transactional email via Resend. Silently no-ops (and logs) if
 * RESEND_API_KEY is not configured, so local development and preview
 * deployments without email configured don't crash the RSVP flow.
 */
async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY not set - skipping email "${subject}" to ${to}`
    );
    return;
  }

  try {
    await resend.emails.send({ from: emailFrom, to, subject, html });
  } catch (error) {
    // Email failures should never break the RSVP/cancel flow.
    console.error("[email] failed to send", error);
  }
}

export async function sendRsvpConfirmationEmail({
  to,
  eventTitle,
  startsAt,
  status,
}: {
  to: string;
  eventTitle: string;
  startsAt: string;
  status: "confirmed" | "waitlisted";
}) {
  const subject =
    status === "waitlisted"
      ? `You're on the waitlist for ${eventTitle}`
      : `You're confirmed for ${eventTitle}`;

  const body =
    status === "waitlisted"
      ? `<p>The event is currently full, but you've been added to the waitlist for <strong>${eventTitle}</strong>. We'll email you if a seat opens up.</p>`
      : `<p>You're confirmed for <strong>${eventTitle}</strong> on ${new Date(
          startsAt
        ).toUTCString()}.</p>`;

  await sendEmail({ to, subject, html: body });
}

export async function sendRsvpCancellationEmail({
  to,
  eventTitle,
}: {
  to: string;
  eventTitle: string;
}) {
  await sendEmail({
    to,
    subject: `Your RSVP for ${eventTitle} was cancelled`,
    html: `<p>Your RSVP for <strong>${eventTitle}</strong> has been cancelled. You can RSVP again anytime before the event if seats are available.</p>`,
  });
}

export async function sendEventCancelledEmail({
  to,
  eventTitle,
}: {
  to: string;
  eventTitle: string;
}) {
  await sendEmail({
    to,
    subject: `${eventTitle} has been cancelled`,
    html: `<p>The organizer has cancelled <strong>${eventTitle}</strong>. We're sorry for the inconvenience.</p>`,
  });
}

export async function sendEventReminderEmail({
  to,
  eventTitle,
  startsAt,
}: {
  to: string;
  eventTitle: string;
  startsAt: string;
}) {
  await sendEmail({
    to,
    subject: `Reminder: ${eventTitle} is coming up`,
    html: `<p><strong>${eventTitle}</strong> starts on ${new Date(
      startsAt
    ).toUTCString()}. See you there!</p>`,
  });
}
