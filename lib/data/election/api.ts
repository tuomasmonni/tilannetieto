/**
 * Eduskuntavaalit - Data API
 * Lataa staattinen vaalitulos-JSON ja yhdistää kuntarajoihin
 */

import { getOrFetch } from '@/lib/cache/redis';
import { fetchMunicipalityBoundaries } from '@/lib/data/crime/api';
import type { MunicipalityGeoJSON } from '@/lib/data/crime/api';
import electionDataJson from '@/data/static/election-results.json';

export interface ElectionPartyResult {
  votes: number;
  share: number;
}

export interface ElectionMunicipalityData {
  [partyCode: string]: ElectionPartyResult | string | number;
  winningParty: string;
  totalVotes: number;
  turnout: number;
}

export interface ElectionStaticData {
  metadata: {
    source: string;
    years: string[];
    fetchedAt: string;
  };
  partyInfo: Record<string, { name: string; color: string }>;
  electionData: Record<string, Record<string, ElectionMunicipalityData>>;
}

const staticData = electionDataJson as unknown as ElectionStaticData;

export function getElectionYears(): string[] {
  return staticData.metadata.years;
}

export function getPartyInfo(): Record<string, { name: string; color: string }> {
  return staticData.partyInfo;
}

/**
 * Hae vaalitulokset GeoJSON-muodossa kartalle
 */
export async function fetchElectionMapData(year: string = '2023'): Promise<GeoJSON.FeatureCollection> {
  const yearData = staticData.electionData[year];
  if (!yearData) {
    throw new Error(`Election data not available for year ${year}`);
  }

  // Hae kuntarajat (cached 24h)
  const boundaries: MunicipalityGeoJSON = await getOrFetch(
    `boundaries:${year}`,
    () => fetchMunicipalityBoundaries(parseInt(year)),
    86400
  );

  const features: GeoJSON.Feature[] = [];

  for (const boundary of boundaries.features) {
    const kuntaCode = boundary.properties.kunta;
    const munData = yearData[kuntaCode];

    if (!munData) continue;

    // Kokoa puoluetulokset tooltip-dataksi
    const partyResults: Array<{ code: string; name: string; votes: number; share: number }> = [];
    for (const [key, value] of Object.entries(munData)) {
      if (key === 'winningParty' || key === 'totalVotes' || key === 'turnout') continue;
      const result = value as ElectionPartyResult;
      if (result && typeof result === 'object' && 'votes' in result) {
        const info = staticData.partyInfo[key];
        partyResults.push({
          code: key,
          name: info?.name || key,
          votes: result.votes,
          share: result.share,
        });
      }
    }
    // Järjestä ääniosuuden mukaan
    partyResults.sort((a, b) => b.share - a.share);

    features.push({
      type: 'Feature',
      geometry: boundary.geometry as GeoJSON.Geometry,
      properties: {
        kunta: kuntaCode,
        nimi: boundary.properties.nimi,
        category: munData.winningParty as string,
        totalVotes: munData.totalVotes,
        turnout: munData.turnout,
        winningParty: munData.winningParty,
        partyResults: JSON.stringify(partyResults.slice(0, 5)),
        year,
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}
