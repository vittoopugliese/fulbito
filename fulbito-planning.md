# 🟢 Fulbito de los Martes — Planning técnico completo

## Stack elegido

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend + Backend | **Next.js 14 (App Router)** | Full-stack en un solo repo, costo $0 en Vercel |
| Persistencia | **Google Sheets** | DB fácil de editar, visual y gratuita |
| Styling | **Tailwind CSS** | Rápido, sin configuración extra |
| Exportar imagen | **html2canvas** | Captura el DOM como PNG |
| Deploy | **Vercel (free tier)** | CI/CD automático desde GitHub, dominio gratis |

> 💡 **Persistencia de datos**: Usaremos una **Google Sheet** como base de datos. Nos conectaremos mediante la API oficial de Google para leer y escribir los puntajes. Esto permite editar manualmente los datos desde el Excel de Google si alguna vez hace falta, manteniendo todo muy simple.

---

## Arquitectura general

```
fulbito-app/
├── app/
│   ├── page.tsx                  ← Vista principal (tabla resumen)
│   ├── admin/
│   │   └── page.tsx              ← Panel de carga de jornadas
│   └── api/
│       ├── data/route.ts         ← GET: leer Google Sheet
│       └── save/route.ts         ← POST: escribir en Google Sheet
├── lib/
│   ├── calculos.ts               ← Lógica de promedios
│   └── sheets.ts                 ← Helper para conectar con Google Sheets API
├── components/
│   ├── TablaResumen.tsx          ← Tabla estilo imagen
│   ├── FilaJugador.tsx           ← Fila de un jugador
│   ├── InputPuntaje.tsx          ← Input individual por jornada
│   └── ExportarImagen.tsx        ← Botón exportar PNG
└── public/
    └── avatares/                 ← Imágenes de cada jugador
```

---

## Estructura de la Google Sheet

Tendremos 3 solapas (hojas) en nuestra planilla:

1. **`Jugadores`**: `id` | `nombre` | `apodo` | `posicion` | `avatar`
2. **`Jornadas`**: `id` | `numero` | `fecha` | `temporada` *(ej: "Feb-Jun 2026")*
3. **`Calificaciones`**: `jugadorId` | `jornadaId` | `puntaje`

**Manejo de meses ilimitados**: Al tener ~4 martes por mes, una tabla histórica crecería infinitamente hacia la derecha. Para evitarlo, cada jornada pertenecerá a una `temporada`. Next.js agrupará y mostrará solo las columnas de la temporada activa elegida, manteniendo la imagen exportable en un tamaño perfecto.

---

## Lógica de negocio (lib/calculos.ts)

### Calcular promedio de un jugador

```
calificaciones del jugador
    → filtrar solo las que tienen puntaje (no nulas)
    → sumar puntajes
    → dividir por cantidad de registros
    → redondear a 1 decimal
```

```typescript
function calcularPromedio(jugadorId: string, calificaciones: Calificacion[]): number | null {
  const propias = calificaciones.filter(
    c => c.jugadorId === jugadorId && c.puntaje !== null
  )
  if (propias.length === 0) return null
  const suma = propias.reduce((acc, c) => acc + c.puntaje!, 0)
  return Math.round((suma / propias.length) * 10) / 10
}
```

### Reglas de color

```typescript
function colorPuntaje(puntaje: number): 'rojo' | 'verde' | 'normal' {
  if (puntaje <= 4.5) return 'rojo'
  if (puntaje >= 7)   return 'verde'
  return 'normal'
}

function fondoPromedio(promedio: number | null): 'amarillo' | 'normal' {
  if (promedio === null) return 'normal'
  return promedio <= 4.5 ? 'amarillo' : 'normal'
}
```

---

## API Routes (Next.js App Router)

### GET /api/data
Lee los datos de las solapas de la Google Sheet y los devuelve al cliente en formato JSON.

```
Request:  GET /api/data
Response: { jugadores, jornadas, calificaciones }
```

### POST /api/save
Recibe las nuevas calificaciones / jornadas y las inserta o actualiza en la Google Sheet.

```
Request:  POST /api/save
Body:     { jornadasNuevas, calificacionesNuevas }
Response: { ok: true } | { error: string }
```

> La API de Google Sheets requiere credenciales de **Service Account** (gratuitas) para autenticarse, guardadas en variables de entorno.

---

## Flujo de actualización de datos

```
Admin carga puntajes en el panel
        ↓
POST /api/save con los nuevos datos
        ↓
Next.js llama a Google Sheets API → append/update de filas en la planilla
        ↓
Los datos se guardan instantáneamente
        ↓
Al refrescar la vista pública, se leen los datos frescos desde Sheets (o se invalidan de caché)
```

> ⚡ Los cambios se verán inmediatamente al recargar la página, a diferencia del sistema anterior basado en git.

---

## Páginas y componentes

### / (Vista pública — todos pueden ver)
- **Selector de Temporada**: Dropdown superior para elegir qué periodo ver (ej: "Feb-Jun 2026", "Jul-Dic 2026"). Carga la actual por defecto.
- Contenedor de la tabla con **scroll horizontal** (overflow-x-auto) para navegar cómodamente en celulares si el semestre tiene muchas jornadas.
- Tabla con todos los jugadores.
- Columnas: avatar, nombre, apodo, posición, puntaje por jornada (solo las de la temporada seleccionada), promedio (calculado sobre la temporada visible).
- Colores automáticos según reglas.
- Botón "Exportar imagen" (genera PNG *solamente* de la temporada visible en la tabla).
- Sin login requerido.

### /admin (Vista de carga — protegida con password simple)
- Password hardcodeado en `.env` (sin auth compleja)
- Selector de **Temporada** y **Jornada** (permite crear una nueva temporada, agregar nueva jornada al mes, o editar existente)
- Grilla de inputs: una fila por jugador, una columna por jornada activa
- Botón guardar → llama a POST /api/save
- Preview del promedio calculado en tiempo real mientras se tipea

---

## Exportar como imagen

```typescript
// Usando html2canvas
async function exportarTabla() {
  const elemento = document.getElementById('tabla-resumen')
  const canvas = await html2canvas(elemento)
  const link = document.createElement('a')
  link.download = 'fulbito-promedios.png'
  link.href = canvas.toDataURL()
  link.click()
}
```

---

## Variables de entorno necesarias

```bash
# .env.local
GOOGLE_SHEET_ID=1X2Y3Z...                  # ID de la planilla (está en la URL)
GOOGLE_CLIENT_EMAIL=tu-service-account@... # Email de la cuenta de servicio de Google Cloud
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE..." # Clave privada de la cuenta de servicio
ADMIN_PASSWORD=fulbito2026                 # Password simple del panel admin
```

---

## Pasos de implementación (orden sugerido)

| # | Tarea | Detalle |
|---|---|---|
| 1 | Setup proyecto | `npx create-next-app fulbito --typescript --tailwind` |
| 2 | Crear Google Sheet | Configurar solapas y compartir con service account |
| 3 | lib/calculos.ts | Promedio, colores, helpers puros |
| 4 | GET /api/data | Conectar Google Sheets API (leer solapas) |
| 5 | POST /api/save | Conectar Google Sheets API (guardar datos) |
| 6 | TablaResumen | Vista pública con datos reales |
| 7 | Panel /admin | Inputs + guardar jornada |
| 8 | Exportar imagen | html2canvas + botón descarga |
| 9 | Deploy Vercel | Configurar env vars de Google en Vercel |

---

## Costo total

| Servicio | Costo |
|---|---|
| Vercel (hosting + CI/CD) | **$0** |
| Google Sheets API | **$0** |
| Dominio (vercel.app) | **$0** |
| **Total** | **$0** |

---

## Lo que queda fuera de scope v1

- Auth real (solo password simple en admin)
- Múltiples grupos/equipos
- Historial de ediciones / audit log
- Notificaciones cuando se carga una jornada nueva
