"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelEvent, duplicateEvent } from "@/app/organizer/actions";

export function EventActions({ eventId }: { eventId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <button
        onClick={() =>
          startTransition(async () => {
            await duplicateEvent(eventId);
          })
        }
        disabled={isPending}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        Duplicate
      </button>
      <button
        onClick={() =>
          startTransition(async () => {
            const result = await cancelEvent(eventId);
            if (!result?.error) {
              router.refresh();
            }
          })
        }
        disabled={isPending}
        className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
      >
        {isPending ? "Working..." : "Cancel event"}
      </button>
    </div>
  );
}
