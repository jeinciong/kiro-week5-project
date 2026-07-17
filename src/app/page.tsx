import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Find your next tech workshop
      </h1>
      <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
        TechRSVP helps you discover workshops in web dev, AI/ML, cloud,
        security, and more &mdash; then RSVP in one click.
      </p>
      <div className="flex gap-4">
        <Link
          href="/events"
          className="rounded-md bg-zinc-900 px-5 py-2.5 font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
        >
          Browse events
        </Link>
        <Link
          href="/signup"
          className="rounded-md border border-zinc-300 px-5 py-2.5 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
