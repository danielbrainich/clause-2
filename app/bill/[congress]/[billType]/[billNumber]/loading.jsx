export default function Loading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="rounded-2xl border dark:border-neutral-800 p-4 mb-6 animate-pulse">
        <div className="h-4 w-36 bg-neutral-200 dark:bg-neutral-800 rounded mb-3" />
        <div className="h-5 w-full bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
        <div className="h-5 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded" />
      </div>
      <div className="rounded-2xl border dark:border-neutral-800 p-4 animate-pulse">
        <div className="h-4 w-28 bg-neutral-200 dark:bg-neutral-800 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded" />
          <div className="h-4 w-5/6 bg-neutral-200 dark:bg-neutral-800 rounded" />
          <div className="h-4 w-4/6 bg-neutral-200 dark:bg-neutral-800 rounded" />
        </div>
      </div>
    </main>
  );
}
