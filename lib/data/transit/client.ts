/**
 * HSL joukkoliikenne - ajoneuvosijainnit
 * Käyttää Digitransit GraphQL API:a (HSL endpoint)
 */

const DIGITRANSIT_API_URL = 'https://api.digitransit.fi/routing/v2/hsl/gtfs/v1';

export interface HslVehiclePosition {
  id: string;
  routeShortName: string;
  vehicleType: 'bus' | 'tram' | 'metro' | 'train';
  lat: number;
  lon: number;
  speed: number | null;
  heading: number | null;
  timestamp: string;
}

// HSL route mode → vehicle type mapping
function getVehicleType(mode: string | undefined, routeShortName: string): 'bus' | 'tram' | 'metro' | 'train' {
  if (!mode) return 'bus';
  const m = mode.toUpperCase();
  if (m === 'TRAM') return 'tram';
  if (m === 'SUBWAY' || m === 'METRO') return 'metro';
  if (m === 'RAIL' || m === 'TRAIN') return 'train';
  return 'bus';
}

/**
 * Hakee ajoneuvosijainnit Digitransit GraphQL API:sta
 * Käytetään feeds-endpointtia joka palauttaa reaaliaikaiset pysäkkiaikataulut
 * ja niiden kautta ajoneuvojen sijainnit
 */
export async function fetchHslVehiclePositions(): Promise<HslVehiclePosition[]> {
  // Try the Digitransit GTFS-RT JSON endpoint first
  // This is a known working endpoint for vehicle positions
  const gtfsRtUrl = 'https://cdn.digitransit.fi/out/helsinki-gtfsrt/VehiclePositions.json';

  try {
    const response = await fetch(gtfsRtUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'tilannekuva.online/1.0',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.entity && Array.isArray(data.entity)) {
        return data.entity
          .filter((e: any) => e.vehicle?.position?.latitude && e.vehicle?.position?.longitude)
          .map((entity: any) => {
            const pos = entity.vehicle.position;
            const routeId = entity.vehicle?.trip?.routeId || '';
            const label = entity.vehicle?.vehicle?.label || routeId || entity.id;

            let vehicleType: 'bus' | 'tram' | 'metro' | 'train' = 'bus';
            if (routeId.startsWith('31M') || routeId.includes('metro')) vehicleType = 'metro';
            else if (/^300[12]/.test(routeId)) vehicleType = 'train';
            else if (/^10[0-9]{2}$/.test(routeId)) vehicleType = 'tram';

            return {
              id: entity.id,
              routeShortName: label,
              vehicleType,
              lat: pos.latitude,
              lon: pos.longitude,
              speed: pos.speed ?? null,
              heading: pos.bearing ?? null,
              timestamp: entity.vehicle?.timestamp
                ? new Date(entity.vehicle.timestamp * 1000).toISOString()
                : new Date().toISOString(),
            };
          });
      }
    }
  } catch (error) {
    console.warn('GTFS-RT JSON endpoint failed, trying fallback:', error);
  }

  // Fallback: use the realtime protobuf endpoint with JSON accept header
  try {
    const pbUrl = 'https://realtime.hsl.fi/realtime/vehicle-positions/v2/hsl';
    const response = await fetch(pbUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'tilannekuva.online/1.0',
      },
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('json')) {
        const data = await response.json();
        if (data.entity && Array.isArray(data.entity)) {
          return data.entity
            .filter((e: any) => e.vehicle?.position?.latitude && e.vehicle?.position?.longitude)
            .map((entity: any) => ({
              id: entity.id || String(Math.random()),
              routeShortName: entity.vehicle?.vehicle?.label || entity.vehicle?.trip?.routeId || 'N/A',
              vehicleType: 'bus' as const,
              lat: entity.vehicle.position.latitude,
              lon: entity.vehicle.position.longitude,
              speed: entity.vehicle.position.speed ?? null,
              heading: entity.vehicle.position.bearing ?? null,
              timestamp: new Date().toISOString(),
            }));
        }
      }
    }
  } catch (error) {
    console.warn('HSL realtime endpoint failed:', error);
  }

  // Return empty if both endpoints fail — graceful degradation
  console.warn('All HSL vehicle position endpoints failed, returning empty');
  return [];
}
