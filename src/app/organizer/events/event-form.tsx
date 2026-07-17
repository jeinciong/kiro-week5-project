"use client";

import { useState } from "react";

type Category = { id: string; name: string };

type EventDefaults = {
  title?: string;
  description?: string | null;
  category_id?: string | null;
  location_type?: "online" | "in_person";
  location_address?: string | null;
  location_url?: string | null;
  starts_at?: string;
  ends_at?: string;
  timezone?: string;
  capacity?: number;
  cover_image_url?: string | null;
  status?: "draft" | "published" | "cancelled";
};

export function EventForm({
  action,
  categories,
  defaults,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  categories: Category[];
  defaults?: EventDefaults;
  submitLabel: string;
}) {
  const [locationType, setLocationType] = useState(
    defaults?.location_type ?? "online"
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Title
        <input
          name="title"
          required
          defaultValue={defaults?.title}
          className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Description
        <textarea
          name="description"
          rows={4}
          defaultValue={defaults?.description ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Category
        <select
          name="category_id"
          defaultValue={defaults?.category_id ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">Select a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Starts at
          <input
            type="datetime-local"
            name="starts_at"
            required
            defaultValue={defaults?.starts_at?.slice(0, 16)}
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Ends at
          <input
            type="datetime-local"
            name="ends_at"
            required
            defaultValue={defaults?.ends_at?.slice(0, 16)}
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Timezone
        <input
          name="timezone"
          defaultValue={defaults?.timezone ?? "UTC"}
          className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Location type
        <select
          name="location_type"
          value={locationType}
          onChange={(e) =>
            setLocationType(e.target.value as "online" | "in_person")
          }
          className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="online">Online</option>
          <option value="in_person">In person</option>
        </select>
      </label>

      {locationType === "online" ? (
        <label className="flex flex-col gap-1 text-sm">
          Online link
          <input
            name="location_url"
            defaultValue={defaults?.location_url ?? ""}
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      ) : (
        <label className="flex flex-col gap-1 text-sm">
          Address
          <input
            name="location_address"
            defaultValue={defaults?.location_address ?? ""}
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Capacity
        <input
          type="number"
          name="capacity"
          min={1}
          required
          defaultValue={defaults?.capacity ?? 20}
          className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Cover image URL
        <input
          name="cover_image_url"
          defaultValue={defaults?.cover_image_url ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Visibility
        <select
          name="status"
          defaultValue={defaults?.status ?? "draft"}
          className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>

      <button
        type="submit"
        className="mt-2 rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
      >
        {submitLabel}
      </button>
    </form>
  );
}
