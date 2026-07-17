"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  sendRsvpCancellationEmail,
  sendRsvpConfirmationEmail,
} from "@/lib/email";

export async function rsvpToEvent(eventId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/login?error=${encodeURIComponent("Please log in to RSVP.")}`);
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("title, starts_at, capacity")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return { error: "Event not found." };
  }

  const { count } = await supabase
    .from("rsvps")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "confirmed");

  const status = (count ?? 0) >= event.capacity ? "waitlisted" : "confirmed";

  const { error } = await supabase.from("rsvps").upsert(
    {
      event_id: eventId,
      attendee_id: userData.user.id,
      status,
    },
    { onConflict: "event_id,attendee_id" }
  );

  if (error) {
    return { error: error.message };
  }

  if (userData.user.email) {
    await sendRsvpConfirmationEmail({
      to: userData.user.email,
      eventTitle: event.title,
      startsAt: event.starts_at,
      status,
    });
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/my-events");
  return { status };
}

export async function cancelRsvp(eventId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("rsvps")
    .update({ status: "cancelled" })
    .eq("event_id", eventId)
    .eq("attendee_id", userData.user.id);

  if (error) {
    return { error: error.message };
  }

  if (userData.user.email) {
    const { data: event } = await supabase
      .from("events")
      .select("title")
      .eq("id", eventId)
      .single();

    if (event) {
      await sendRsvpCancellationEmail({
        to: userData.user.email,
        eventTitle: event.title,
      });
    }
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/my-events");
  return { success: true };
}
