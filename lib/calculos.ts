export interface Jugador {
  id: string;
  nombre: string;
  apodo: string;
  posicion: string;
  avatar: string;
}

export interface Jornada {
  id: string;
  numero: number;
  fecha: string;
  temporada: string;
}

export interface Calificacion {
  jugadorId: string;
  jornadaId: string;
  puntaje: number | null;
}

export interface FulbitoData {
  jugadores: Jugador[];
  jornadas: Jornada[];
  calificaciones: Calificacion[];
}

export function calcularPromedio(jugadorId: string, calificaciones: Calificacion[], jornadasActivasIds: string[]): number | null {
  const propias = calificaciones.filter(
    (c) => c.jugadorId === jugadorId && c.puntaje !== null && jornadasActivasIds.includes(c.jornadaId)
  );
  if (propias.length === 0) return null;
  const suma = propias.reduce((acc, c) => acc + (c.puntaje || 0), 0);
  return Math.round((suma / propias.length) * 10) / 10;
}

export function colorPuntaje(puntaje: number | null): 'rojo' | 'verde' | 'normal' {
  if (puntaje === null) return 'normal';
  if (puntaje <= 4.5) return 'rojo';
  if (puntaje >= 7) return 'verde';
  return 'normal';
}

export function fondoPromedio(promedio: number | null): 'amarillo' | 'normal' {
  if (promedio === null) return 'normal';
  return promedio <= 4.5 ? 'amarillo' : 'normal';
}
