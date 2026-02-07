'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="max-w-md text-center">
        <h2 className="mb-4 text-xl font-semibold text-zinc-100">
          Jokin meni pieleen
        </h2>
        <p className="mb-6 text-sm text-zinc-400">
          Sovelluksessa tapahtui odottamaton virhe. Yrit&auml; ladata sivu uudelleen.
        </p>
        <button
          onClick={() => reset()}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Yrit&auml; uudelleen
        </button>
      </div>
    </div>
  );
}
