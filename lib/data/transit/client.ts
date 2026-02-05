/**
 * HSL joukkoliikenne - ajoneuvosijainnit
 * Käyttää HSL GTFS-RT protobuf feediä
 */

import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

const HSL_VEHICLE_POSITIONS_URL = 'https://realtime.hsl.fi/realtime/vehicle-positions/v2/hsl';

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

function getVehicleType(routeId: string): 'bus' | 'tram' | 'metro' | 'train' {
  if (!routeId) return 'bus';
  if (routeId.startsWith('31M') || routeId.toLowerCase().includes('metro')) return 'metro';
  if (/^300[12]/.test(routeId)) return 'train';
  if (/^10[0-9]{2}$/.test(routeId)) return 'tram';
  return 'bus';
}

/**
 * Hakee ajoneuvosijainnit HSL GTFS-RT protobuf feedistä
 */
export async function fetchHslVehiclePositions(): Promise<HslVehiclePosition[]> {
  try {
    const response = await fetch(HSL_VEHICLE_POSITIONS_URL, {
      headers: {
        'Accept-Encoding': 'gzip',
        'User-Agent': 'tilannekuva.online/1.0',
      },
    });

    if (!response.ok) {
      console.error(`HSL GTFS-RT fetch failed: ${response.status} ${response.statusText}`);
      return [];
    }

    const buffer = await response.arrayBuffer();
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(buffer)
    );

    console.log(`[Transit] Decoded ${feed.entity.length} entities from protobuf feed`);

    const vehicles: HslVehiclePosition[] = [];

    for (const entity of feed.entity) {
      const vp = entity.vehicle;
      if (!vp?.position?.latitude || !vp?.position?.longitude) continue;

      const routeId = vp.trip?.routeId || '';
      const label = vp.vehicle?.label || routeId || entity.id;

      vehicles.push({
        id: entity.id,
        routeShortName: label,
        vehicleType: getVehicleType(routeId),
        lat: vp.position.latitude,
        lon: vp.position.longitude,
        speed: vp.position.speed ?? null,
        heading: vp.position.bearing ?? null,
        timestamp: vp.timestamp
          ? new Date(Number(vp.timestamp) * 1000).toISOString()
          : new Date().toISOString(),
      });
    }

    console.log(`[Transit] Parsed ${vehicles.length} vehicle positions`);
    return vehicles;
  } catch (error) {
    console.error('HSL vehicle positions fetch failed:', error);
    return [];
  }
}
