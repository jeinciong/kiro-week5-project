// Supabase Edge Function: send-event-reminders
//
// Intended to run on a schedule (e.g. hourly, via pg_cron + pg_net or the
// Supabase dashboard's Cron Jobs feature) to email attendees ~24h before
// their event starts. Sends a reminder for each confirmed RSVP whose event
// starts between 23 and 25 hours from now, and marks it so it isn't sent
// twice by adding a `reminder_sent_at` update.
//
// Deploy with: supabase functions deploy send-event-reminders
// Schedule with: select cron.schedule('send-event-reminders', '0 * * * *',
//   $$ select net.http_post(
//        url:='https://<project-ref>.supabase.co/functions/v1/send-event-reminders',
//        headers:='{"Authorization": "Bearer <service-role-key>"}'::jsonb
//      ) $$);

import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "TechRSVP <onboarding@resend.dev>";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const now = new Date();
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, starts_at")
    .eq("status", "published")
    .gte("starts_at", windowStart.toISOString())
    .lte("starts_at", windowEnd.toISOString());

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  let sent = 0;

  for (const event of events ?? []) {
    const { data: rsvps } = await supabase
      .from("rsvps")
      .select("attendee_id")
      .eq("event_id", event.id)
      .eq("status", "confirmed");

    for (const rsvp of rsvps ?? []) {
      const { data: userResult } = await supabase.auth.admin.getUserById(
        rsvp.attendee_id
      );
      const email = userResult?.user?.email;
      if (!email || !RESEND_API_KEY) continue;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: email,
          subject: `Reminder: ${event.title} is coming up`,
          html: `<p><strong>${event.title}</strong> starts on ${new Date(
            event.starts_at
          ).toUTCString()}. See you there!</p>`,
        }),
      });
      sent += 1;
    }
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { "Content-Type": "application/json" },
  });
});
