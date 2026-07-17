import { createClient } from "@/lib/supabase/server";
import { createEvent } from "@/app/organizer/actions";
import { EventForm } from "@/app/organizer/events/event-form";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">New event</h1>
      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      <EventForm
        action={createEvent}
        categories={categories ?? []}
        submitLabel="Create event"
      />
    </main>
  );
}
