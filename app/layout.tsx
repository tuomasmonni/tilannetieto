import type { Metadata, Viewport } from 'next';
import './globals.css';
import 'mapbox-gl/dist/mapbox-gl.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: 'Tilannetieto.fi - Suomen reaaliaikainen tilannekuva',
  description:
    'Yhdistetty näkymä Suomen uutisiin, rikostilastoihin ja liikennetapahtumiin. Reaaliaikaiset tiedot YLE, IL, MTV, Tilastokeskus ja Fintraffic.',
  keywords: [
    'kartta',
    'liikenne',
    'rikostilastot',
    'uutiset',
    'Suomi',
    'reaaliaikainen',
    'tilannetieto',
  ],
  authors: [{ name: 'Tilannetieto.fi' }],
  creator: 'Foundation System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fi">
      <body className="bg-zinc-950 text-zinc-50">{children}</body>
    </html>
  );
}
