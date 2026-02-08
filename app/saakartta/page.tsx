'use client';

import dynamic from 'next/dynamic';

const WeatherMapContainer = dynamic(() => import('@/components/weather-map/WeatherMapContainer'), {
  ssr: false,
});

export default function SaakarttaPage() {
  return <WeatherMapContainer />;
}
