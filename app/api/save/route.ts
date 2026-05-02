import { NextResponse } from 'next/server';
import { saveJornadaYCalificaciones } from '@/lib/sheets';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jornada, calificaciones } = body;
    
    if (!jornada || !calificaciones) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    await saveJornadaYCalificaciones(jornada, calificaciones);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error saving data", error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
