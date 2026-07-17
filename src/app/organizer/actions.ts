"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EventStatus, LocationType } from "@/lib/supabase/types";

async function requireOrganizer() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login");
  }
  return { supabase, userId: userData.user.id };
}

function eventFieldsFromForm(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    category_id: String(formData.get("category_id") ?? "") || null,
    location_type: String(formData.get("location_type") ?? "online") as LocationType,
    location_address: String(formData.get("location_address") ?? "") || null,
    location_url: String(formData.get("location_url") ?? "") || null,
    starts_at: String(formData.get("starts_at") ?? ""),
    ends_at: String(formData.get("ends_at") ?? ""),
    timezone: String(formData.get("timezone") ?? "UTC"),
    capacity: Number(formData.get("capacity") ?? 0),
    cover_image_url: String(formData.get("cover_image_url") ?? "") || null,
    status: String(formData.get("status") ?? "draft") as EventStatus,
  };
}

export async function createEvent(formData: FormData) {
  const { supabase, userId } = await requireOrganizer();
  const fields = eventFieldsFromForm(formData);

  const { data, error } = await supabase
    .from("events")
    .insert({ ...fields, organizer_id: userId })
    .select("id")
    .single();

  if (error) {
    redirect(`/organizer/events/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/organizer");
  redirect(`/organizer/events/${data!.id}`);
}

export async function updateEvent(eventId: string, formData: FormData) {
  const { supabase, userId } = await requireOrganizer();
  const fields = eventFieldsFromForm(formData);

  const { error } = await supabase
    .from("events")
    .update(fields)
    .eq("id", eventId)
    .eq("organizer_id", userId);

  if (error) {
    redirect(
      `/organizer/events/${eventId}/edit?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/organizer");
  revalidatePath(`/organizer/events/${eventId}`);
  redirect(`/organizer/events/${eventId}`);
}

export async function cancelEvent(eventId: string) {
  const { supabase, userId } = await requireOrganizer();

  const { error } = await supabase
    .from("events")
    .update({ status: "cancelled" })
    .eq("id", eventId)
    .eq("organizer_id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/organizer");
  revalidatePath(`/organizer/events/${eventId}`);
  return { success: true };
}

export async function duplicateEvent(eventId: string) {
  const { supabase, userId } = await requireOrganizer();

  const { data: original, error: fetchError } = await supabase
    .from("events")
    .select(
      "title, description, category_id, location_type, location_address, location_url, starts_at, ends_at, timezone, capacity, cover_image_url"
    )
    .eq("id", eventId)
    .eq("organizer_id", userId)
    .single();

  if (fetchError || !original) {
    return { error: fetchError?.message ?? "Event not found." };
  }

  const { data: created, error: insertError } = await supabase
    .from("events")
    .insert({
      ...original,
      title: `${original.title} (Copy)`,
      organizer_id: userId,
      status: "draft",
    })
    .select("id")
    .single();

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/organizer");
  redirect(`/organizer/events/${created!.id}/edit`);
}
