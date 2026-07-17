import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/categories";

export default async function MyEventsPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data: rsvps } = await supabase
    .from("rsvps")
    .select(
      "status, events(id, title, starts_at, timezone, location_type, status)"
    )
    .eq("attendee_id", userData.user.id)
    .neq("status", "cancelled");

  const now = Date.now();
  const upcoming =
    rsvps?.filter((r) => {
      const event = Array.isArray(r.events) ? r.events[0] : r.events;
      return event && new Date(event.starts_at).getTime() >= now;
    }) ?? [];
  const past =
    rsvps?.filter((r) => {
      const event = Array.isArray(r.events) ? r.events[0] : r.events;
      return event && new Date(event.starts_at).getTime() < now;
    }) ?? [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">My Events</h1>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-medium">Upcoming</h2>
        {upcoming.length === 0 && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No upcoming RSVPs. <Link href="/events" className="underline">Browse events</Link>.
          </p>
        )}
        <ul className="flex flex-col gap-3">
          {upcoming.map((r) => {
            const event = Array.isArray(r.events) ? r.events[0] : r.events;
            if (!event) return null;
            return (
              <li
                key={event.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div>
                  <Link href={`/events/${event.id}`} className="font-medium hover:underline">
                    {event.title}
                  </Link>
                  <p className="text-sm text-zinc-500">
                    {formatDateTime(event.starts_at, event.timezone)}
                  </p>
                </div>
                <span className="text-xs font-medium capitalize">
                  {r.status}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Past</h2>
        {past.length === 0 && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No past events yet.
          </p>
        )}
        <ul className="flex flex-col gap-3">
          {past.map((r) => {
            const event = Array.isArray(r.events) ? r.events[0] : r.events;
            if (!event) return null;
            return (
              <li
                key={event.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 opacity-70 dark:border-zinc-800"
              >
                <div>
                  <span className="font-medium">{event.title}</span>
                  <p className="text-sm text-zinc-500">
                    {formatDateTime(event.starts_at, event.timezone)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
