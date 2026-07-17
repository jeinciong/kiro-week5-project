import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/categories";
import { requestOrganizerRole } from "@/app/(auth)/actions";

export default async function OrganizerDashboardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_organizer")
    .eq("id", userData.user.id)
    .single();

  if (!profile?.is_organizer) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="mb-3 text-2xl font-semibold">Become an organizer</h1>
        <p className="mb-6 text-zinc-600 dark:text-zinc-400">
          Request organizer access to start publishing your own workshops.
        </p>
        <form action={requestOrganizerRole}>
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-5 py-2.5 font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
          >
            Request organizer access
          </button>
        </form>
      </main>
    );
  }

  const { data: events } = await supabase
    .from("events")
    .select("id, title, starts_at, timezone, status, capacity, rsvps(count)")
    .eq("organizer_id", userData.user.id)
    .order("starts_at", { ascending: false });

  const now = Date.now();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your events</h1>
        <Link
          href="/organizer/events/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
        >
          New event
        </Link>
      </div>

      {events && events.length === 0 && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          You haven&apos;t created any events yet.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {events?.map((event) => {
          const rsvpCount = Array.isArray(event.rsvps)
            ? (event.rsvps[0] as { count: number } | undefined)?.count ?? 0
            : 0;
          const isPast = new Date(event.starts_at).getTime() < now;
          const derivedStatus =
            event.status === "cancelled"
              ? "cancelled"
              : isPast
              ? "past"
              : event.status;

          return (
            <li
              key={event.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div>
                <Link
                  href={`/organizer/events/${event.id}`}
                  className="font-medium hover:underline"
                >
                  {event.title}
                </Link>
                <p className="text-sm text-zinc-500">
                  {formatDateTime(event.starts_at, event.timezone)} &middot;{" "}
                  {rsvpCount}/{event.capacity} RSVPs
                </p>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium capitalize dark:bg-zinc-800">
                {derivedStatus}
              </span>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
