'use client';

export default function SaakarttaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="max-w-lg text-center">
        <h2 className="mb-4 text-xl font-semibold text-zinc-100">Saakartta — Virhe</h2>
        <pre className="mb-4 rounded-lg bg-zinc-900 p-4 text-left text-xs text-red-400 overflow-auto max-h-48">
          {error.message}
          {error.stack && `\n\n${error.stack}`}
        </pre>
        <button
          onClick={() => reset()}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Yrita uudelleen
        </button>
      </div>
    </div>
  );
}
