import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, organizer_id, title")
    .eq("id", id)
    .single();

  if (!event || event.organizer_id !== userData.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: rsvps } = await supabase
    .from("rsvps")
    .select("status, created_at, profiles(full_name)")
    .eq("event_id", id)
    .order("created_at", { ascending: true });

  const rows = ["Name,Status,RSVP Date"];
  for (const r of rsvps ?? []) {
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    rows.push(
      [
        csvEscape(profile?.full_name ?? "Unknown"),
        csvEscape(r.status),
        csvEscape(r.created_at),
      ].join(",")
    );
  }

  const csv = rows.join("\n");
  const filename = `${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-rsvps.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
