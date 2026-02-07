import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/lkporras',
        destination: '/lkporras.html',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
              "img-src 'self' data: blob: https://*.mapbox.com https://weathercam.digitraffic.fi https://*.tile.openstreetmap.org",
              "font-src 'self' data:",
              "connect-src 'self' https://*.mapbox.com https://*.digitraffic.fi https://*.stat.fi https://*.supabase.co https://sotkanet.fi https://data.fingrid.fi https://rajapinnat.ymparisto.fi https://feeds.yle.fi https://va.vercel-scripts.com https://geo.stat.fi https://meri.digitraffic.fi",
              "worker-src 'self' blob:",
              "child-src blob:",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
