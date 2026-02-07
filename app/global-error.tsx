'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fi">
      <body className="bg-zinc-950 text-zinc-50">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md text-center">
            <h2 className="mb-4 text-xl font-semibold text-zinc-100">
              Kriittinen virhe
            </h2>
            <p className="mb-6 text-sm text-zinc-400">
              Sovellus kohtasi vakavan virheen. Yrit&auml; ladata sivu uudelleen.
            </p>
            <button
              onClick={() => reset()}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Lataa uudelleen
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
