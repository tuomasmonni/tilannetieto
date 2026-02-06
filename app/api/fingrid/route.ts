import { NextResponse } from 'next/server';
import { fetchEnergyOverview } from '@/lib/data/fingrid/client';

export const revalidate = 300; // ISR: 5 min cache

/**
 * GET /api/fingrid
 *
 * Palauttaa Suomen sähköjärjestelmän reaaliaikaisen yleiskatsauksen.
 * Piilottaa API-avaimen selaimelta.
 */
export async function GET() {
  const apiKey = process.env.FINGRID_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'FINGRID_API_KEY not configured' },
      { status: 503 }
    );
  }

  try {
    const data = await fetchEnergyOverview(apiKey);

    if (!data) {
      return NextResponse.json(
        { error: 'Failed to fetch energy data' },
        { status: 502 }
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Fingrid API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
