import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Roadmap — Tilannetieto.fi', description: 'Äänestä tulevista ominaisuuksista ja ehdota omia ideoita.' };
export default function RoadmapLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
