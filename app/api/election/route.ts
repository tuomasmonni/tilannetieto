import { NextRequest, NextResponse } from 'next/server';
import { fetchElectionMapData } from '@/lib/data/election';

export const revalidate = 86400; // 24h - staattinen data

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || '2023';

  try {
    const data = await fetchElectionMapData(year);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Election API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch election data' },
      { status: 500 }
    );
  }
}
