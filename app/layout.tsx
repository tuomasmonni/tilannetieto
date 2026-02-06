import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/react';
import Providers from './providers';
import './globals.css';
import 'mapbox-gl/dist/mapbox-gl.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: 'Tilannetieto.fi - Suomen reaaliaikainen kartta',
  description:
    'Yhdistetty näkymä Suomen rikostilastoihin ja liikennetapahtumiin. Reaaliaikaiset tiedot Tilastokeskukselta ja Fintrafficilta.',
  keywords: [
    'kartta',
    'liikenne',
    'rikostilastot',
    'Suomi',
    'reaaliaikainen',
    'tilannetieto',
  ],
  authors: [{ name: 'Tilannetieto.fi' }],
  creator: 'IMPERIUM AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fi">
      <body className="bg-zinc-950 text-zinc-50">
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
