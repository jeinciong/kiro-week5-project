"use client";

import { useState, useTransition } from "react";
import { rsvpToEvent, cancelRsvp } from "@/app/events/actions";

export function RsvpButton({
  eventId,
  initialRsvpStatus,
}: {
  eventId: string;
  initialRsvpStatus: "confirmed" | "waitlisted" | "cancelled" | null;
}) {
  const [status, setStatus] = useState(initialRsvpStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRsvp() {
    startTransition(async () => {
      const result = await rsvpToEvent(eventId);
      if (result?.error) {
        setMessage(result.error);
        return;
      }
      if (result?.status) {
        setStatus(result.status as "confirmed" | "waitlisted");
        setMessage(
          result.status === "waitlisted"
            ? "Event is full — you've been added to the waitlist."
            : "You're RSVP'd! Check your email for confirmation."
        );
      }
    });
  }

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelRsvp(eventId);
      if (result?.error) {
        setMessage(result.error);
        return;
      }
      setStatus("cancelled");
      setMessage("Your RSVP has been cancelled.");
    });
  }

  const isActive = status === "confirmed" || status === "waitlisted";

  return (
    <div className="flex flex-col gap-2">
      {isActive ? (
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="rounded-md border border-red-300 px-4 py-2 font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
        >
          {isPending
            ? "Cancelling..."
            : status === "waitlisted"
            ? "Leave waitlist"
            : "Cancel RSVP"}
        </button>
      ) : (
        <button
          onClick={handleRsvp}
          disabled={isPending}
          className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {isPending ? "Submitting..." : "RSVP"}
        </button>
      )}
      {status === "confirmed" && (
        <span className="text-sm font-medium text-green-700 dark:text-green-400">
          You&apos;re confirmed for this event.
        </span>
      )}
      {status === "waitlisted" && (
        <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
          You&apos;re on the waitlist.
        </span>
      )}
      {message && <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>}
    </div>
  );
}
