import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateEvent } from "@/app/organizer/actions";
import { EventForm } from "@/app/organizer/events/event-form";

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title, description, category_id, location_type, location_address, location_url, starts_at, ends_at, timezone, capacity, cover_image_url, status, organizer_id"
    )
    .eq("id", id)
    .single();

  if (!event || event.organizer_id !== userData.user.id) {
    notFound();
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  const updateAction = updateEvent.bind(null, id);

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Edit event</h1>
      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      <EventForm
        action={updateAction}
        categories={categories ?? []}
        defaults={event}
        submitLabel="Save changes"
      />
    </main>
  );
}
