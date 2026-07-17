import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/categories";
import { EventActions } from "@/app/organizer/events/[id]/cancel-button";

export default async function OrganizerEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title, starts_at, timezone, status, capacity, organizer_id, categories(name)"
    )
    .eq("id", id)
    .single();

  if (!event || event.organizer_id !== userData.user.id) {
    notFound();
  }

  const { data: rsvps } = await supabase
    .from("rsvps")
    .select("id, status, created_at, profiles(full_name)")
    .eq("event_id", id)
    .order("created_at", { ascending: true });

  const confirmed = rsvps?.filter((r) => r.status === "confirmed") ?? [];
  const waitlisted = rsvps?.filter((r) => r.status === "waitlisted") ?? [];
  const categoryInfo = Array.isArray(event.categories)
    ? event.categories[0]
    : event.categories;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{event.title}</h1>
          <p className="text-sm text-zinc-500">
            {formatDateTime(event.starts_at, event.timezone)} &middot;{" "}
            {categoryInfo?.name ?? "Uncategorized"} &middot;{" "}
            <span className="capitalize">{event.status}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/organizer/events/${event.id}/edit`}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Edit
          </Link>
          <EventActions eventId={event.id} />
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-medium">
          RSVPs ({confirmed.length}/{event.capacity} confirmed
          {waitlisted.length > 0 ? `, ${waitlisted.length} waitlisted` : ""})
        </h2>
        <a
          href={`/organizer/events/${event.id}/export`}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Export CSV
        </a>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
            <th className="py-2">Name</th>
            <th className="py-2">Status</th>
            <th className="py-2">RSVP date</th>
          </tr>
        </thead>
        <tbody>
          {rsvps?.map((r) => {
            const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
            return (
              <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="py-2">{profile?.full_name ?? "Unknown"}</td>
                <td className="py-2 capitalize">{r.status}</td>
                <td className="py-2">
                  {formatDateTime(r.created_at, event.timezone)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {rsvps && rsvps.length === 0 && (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          No RSVPs yet.
        </p>
      )}
    </main>
  );
}
