import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";

export async function NavBar() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  let isOrganizer = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_organizer")
      .eq("id", user.id)
      .single();
    isOrganizer = profile?.is_organizer ?? false;
  }

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          TechRSVP
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/events" className="hover:underline">
            Events
          </Link>
          {user ? (
            <>
              <Link href="/my-events" className="hover:underline">
                My Events
              </Link>
              {isOrganizer && (
                <Link href="/organizer" className="hover:underline">
                  Organizer
                </Link>
              )}
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-md border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
