import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Saakartta — Tilannetieto.fi',
  description:
    'Suomen reaaliaikainen saakartta: lampotilakartta, tuulivisualisointi, sadetutka ja ennuste. Ammattimainen meteorologinen nakyma ~700 havaintoasemalta.',
  keywords: [
    'saakartta',
    'lampotilakartta',
    'saatutka',
    'tuulikartta',
    'saaennuste',
    'Suomi',
    'reaaliaikainen',
    'tilannetieto',
  ],
};

export default function SaakarttaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
