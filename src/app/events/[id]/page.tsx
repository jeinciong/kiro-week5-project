import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/categories";
import { RsvpButton } from "@/app/events/[id]/rsvp-button";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title, description, starts_at, ends_at, timezone, location_type, location_address, location_url, capacity, cover_image_url, status, categories(name, color), profiles!events_organizer_id_fkey(full_name)"
    )
    .eq("id", id)
    .single();

  if (!event || event.status === "cancelled") {
    notFound();
  }

  const { count: confirmedCount } = await supabase
    .from("rsvps")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id)
    .eq("status", "confirmed");

  const { data: userData } = await supabase.auth.getUser();
  let myRsvpStatus: "confirmed" | "waitlisted" | "cancelled" | null = null;

  if (userData.user) {
    const { data: rsvp } = await supabase
      .from("rsvps")
      .select("status")
      .eq("event_id", id)
      .eq("attendee_id", userData.user.id)
      .maybeSingle();
    myRsvpStatus = rsvp?.status ?? null;
  }

  const remaining = Math.max(event.capacity - (confirmedCount ?? 0), 0);
  const categoryInfo = Array.isArray(event.categories)
    ? event.categories[0]
    : event.categories;
  const organizer = Array.isArray(event.profiles)
    ? event.profiles[0]
    : event.profiles;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {categoryInfo && (
        <span
          className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-medium text-white"
          style={{ backgroundColor: categoryInfo.color ?? "#71717a" }}
        >
          {categoryInfo.name}
        </span>
      )}
      <h1 className="text-3xl font-semibold">{event.title}</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Hosted by {organizer?.full_name ?? "an organizer"}
      </p>

      <div className="mt-6 grid gap-2 text-sm">
        <p>
          <strong>When:</strong> {formatDateTime(event.starts_at, event.timezone)} &ndash;{" "}
          {formatDateTime(event.ends_at, event.timezone)}
        </p>
        <p>
          <strong>Where:</strong>{" "}
          {event.location_type === "online"
            ? event.location_url ?? "Online (link shared after RSVP)"
            : event.location_address ?? "Location TBD"}
        </p>
        <p>
          <strong>Seats:</strong> {remaining} of {event.capacity} remaining
        </p>
      </div>

      <p className="mt-6 whitespace-pre-line text-zinc-700 dark:text-zinc-300">
        {event.description}
      </p>

      <div className="mt-8">
        <RsvpButton eventId={event.id} initialRsvpStatus={myRsvpStatus} />
      </div>
    </main>
  );
}
