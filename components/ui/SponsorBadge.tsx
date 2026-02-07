'use client';

import Image from 'next/image';

const LANDING_URL = '/lkporras';

export default function SponsorBadge() {
  return (
    <a
      href={LANDING_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group block animate-breathe hover:opacity-90 hover:drop-shadow-[0_0_16px_rgba(147,197,253,0.4)] transition-all duration-300 cursor-pointer"
      aria-label="LK Porras"
    >
      <Image
        src="/sponsors/lk-porras-logo-white.svg"
        alt="LK Porras"
        width={100}
        height={36}
        className="pointer-events-none select-none"
        priority={false}
      />
    </a>
  );
}
