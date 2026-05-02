import { google } from 'googleapis';
import { Jugador, Jornada, Calificacion, FulbitoData } from './calculos';

export async function getGoogleSheetsClient() {
  const target = ['https://www.googleapis.com/auth/spreadsheets'];
  const jwt = new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    undefined,
    (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    target
  );
  
  const sheets = google.sheets({ version: 'v4', auth: jwt });
  return sheets;
}

export async function getFulbitoData(): Promise<FulbitoData> {
  if (!process.env.GOOGLE_SHEET_ID) {
    return {
      jugadores: [
        { id: 'cabezon', nombre: 'Cabezón', apodo: 'Fallado', posicion: 'ARQ', avatar: '/avatares/cabezon.png' },
        { id: 'javi', nombre: 'Javi', apodo: 'Ninja de Gerli', posicion: 'ARQ', avatar: '/avatares/javi.png' },
        { id: 'topo', nombre: 'Topo', apodo: 'Anótamelo!', posicion: 'DEF', avatar: '/avatares/topo.png' },
        { id: 'gato', nombre: 'Gato', apodo: 'Sushiman', posicion: 'DEF', avatar: '/avatares/gato.png' },
      ],
      jornadas: [
        { id: 'j1', numero: 1, fecha: '2026-02-04', temporada: 'Feb-Jun 2026' },
        { id: 'j2', numero: 2, fecha: '2026-02-11', temporada: 'Feb-Jun 2026' },
      ],
      calificaciones: [
        { jugadorId: 'cabezon', jornadaId: 'j1', puntaje: 6 },
        { jugadorId: 'javi', jornadaId: 'j1', puntaje: 4.5 },
        { jugadorId: 'topo', jornadaId: 'j1', puntaje: 4 },
        { jugadorId: 'gato', jornadaId: 'j1', puntaje: 6.5 },
        { jugadorId: 'cabezon', jornadaId: 'j2', puntaje: 6 },
        { jugadorId: 'javi', jornadaId: 'j2', puntaje: 4.5 },
        { jugadorId: 'topo', jornadaId: 'j2', puntaje: 2 },
        { jugadorId: 'gato', jornadaId: 'j2', puntaje: 5 },
      ]
    };
  }

  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  const [jugadoresRes, jornadasRes, califRes] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId, range: 'Jugadores!A2:E' }),
    sheets.spreadsheets.values.get({ spreadsheetId, range: 'Jornadas!A2:D' }),
    sheets.spreadsheets.values.get({ spreadsheetId, range: 'Calificaciones!A2:C' }),
  ]);

  const jugadores: Jugador[] = (jugadoresRes.data.values || []).map(row => ({
    id: row[0], nombre: row[1], apodo: row[2], posicion: row[3], avatar: row[4] || '/avatares/default.png'
  }));

  const jornadas: Jornada[] = (jornadasRes.data.values || []).map(row => ({
    id: row[0], numero: Number(row[1]), fecha: row[2], temporada: row[3]
  }));

  const calificacionesRaw = (califRes.data.values || []).map(row => ({
    jugadorId: row[0], jornadaId: row[1], puntaje: row[2] && row[2].trim() !== '' ? Number(row[2].replace(',', '.')) : null
  }));

  const calificacionesMap = new Map<string, Calificacion>();
  calificacionesRaw.forEach(c => {
    calificacionesMap.set(`${c.jugadorId}-${c.jornadaId}`, c);
  });
  const calificaciones = Array.from(calificacionesMap.values());

  return { jugadores, jornadas, calificaciones };
}

export async function saveJornadaYCalificaciones(jornada: Jornada, calificacionesNuevas: Calificacion[]) {
  if (!process.env.GOOGLE_SHEET_ID) {
    console.log("Mock saved:", jornada, calificacionesNuevas);
    return;
  }

  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  const jornadasRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Jornadas!A:A' });
  const jornadaExists = (jornadasRes.data.values || []).some(row => row[0] === jornada.id);

  if (!jornadaExists) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Jornadas!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[jornada.id, jornada.numero, jornada.fecha, jornada.temporada]]
      }
    });
  }

  const valuesToAppend = calificacionesNuevas
    .filter(c => c.puntaje !== null)
    .map(c => [c.jugadorId, c.jornadaId, c.puntaje]);

  if (valuesToAppend.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Calificaciones!A:C',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: valuesToAppend
      }
    });
  }
}
