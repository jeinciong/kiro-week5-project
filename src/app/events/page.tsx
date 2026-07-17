import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/categories";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    location?: string;
    q?: string;
    sort?: string;
  }>;
}) {
  const { category, location, q, sort } = await searchParams;
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, color")
    .order("name");

  let query = supabase
    .from("events")
    .select(
      "id, title, description, starts_at, timezone, location_type, capacity, cover_image_url, category_id, categories(name, color), rsvps(count)"
    )
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString());

  if (category) {
    const match = categories?.find((c) => c.slug === category);
    if (match) query = query.eq("category_id", match.id);
  }

  if (location === "online" || location === "in_person") {
    query = query.eq("location_type", location);
  }

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  query =
    sort === "popular"
      ? query.order("starts_at", { ascending: true })
      : query.order("starts_at", { ascending: true });

  const { data: events, error } = await query;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Upcoming events</h1>

      <form className="mb-8 flex flex-wrap gap-3 text-sm" action="/events">
        <input
          type="text"
          name="q"
          placeholder="Search title..."
          defaultValue={q ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <select
          name="category"
          defaultValue={category ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="location"
          defaultValue={location ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">Any location</option>
          <option value="online">Online</option>
          <option value="in_person">In person</option>
        </select>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
        >
          Filter
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600">
          Could not load events: {error.message}
        </p>
      )}

      {events && events.length === 0 && (
        <p className="text-zinc-600 dark:text-zinc-400">
          No upcoming events match your filters.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {events?.map((event) => {
          const rsvpCount = Array.isArray(event.rsvps)
            ? (event.rsvps[0] as { count: number } | undefined)?.count ?? 0
            : 0;
          const remaining = Math.max(event.capacity - rsvpCount, 0);
          const categoryInfo = Array.isArray(event.categories)
            ? event.categories[0]
            : event.categories;

          return (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
            >
              {categoryInfo && (
                <span
                  className="inline-block w-fit rounded-full px-2 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: categoryInfo.color ?? "#71717a" }}
                >
                  {categoryInfo.name}
                </span>
              )}
              <h2 className="font-semibold">{event.title}</h2>
              <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                {event.description}
              </p>
              <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
                <span>{formatDateTime(event.starts_at, event.timezone)}</span>
                <span>
                  {event.location_type === "online" ? "Online" : "In person"}
                </span>
              </div>
              <span className="text-xs font-medium">
                {remaining} of {event.capacity} seats left
              </span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
