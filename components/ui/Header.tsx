'use client';

export default function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 p-2 sm:p-4 bg-zinc-950/50 backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        {/* Logo + Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-lg sm:text-xl">📍</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold truncate text-white">Tilannekuva</h1>
            <p className="text-xs hidden sm:block text-zinc-400">Suomen reaaliaikainen kartta</p>
          </div>
        </div>
      </div>
    </header>
  );
}
