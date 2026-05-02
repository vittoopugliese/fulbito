import { NextResponse } from 'next/server';
import { getFulbitoData } from '@/lib/sheets';

export async function GET() {
  try {
    const data = await getFulbitoData();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching sheets data", error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
