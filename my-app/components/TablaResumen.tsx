'use client';
import { useState, useRef } from 'react';
import { FulbitoData, calcularPromedio, colorPuntaje, fondoPromedio } from '@/lib/calculos';
import html2canvas from 'html2canvas';
import { Download } from 'lucide-react';

export default function TablaResumen({ data }: { data: FulbitoData }) {
  const tableRef = useRef<HTMLDivElement>(null);
  
  const temporadas = Array.from(new Set(data.jornadas.map(j => j.temporada))).sort().reverse();
  const [temporadaActiva, setTemporadaActiva] = useState(temporadas[0] || 'Feb-Jun 2026');

  const jornadasActivas = data.jornadas
    .filter(j => j.temporada === temporadaActiva)
    .sort((a, b) => a.numero - b.numero);
  const jornadasActivasIds = jornadasActivas.map(j => j.id);

  const exportarImagen = async () => {
    if (!tableRef.current) return;
    try {
      const canvas = await html2canvas(tableRef.current, { backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `fulbito-${temporadaActiva.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Error al exportar imagen', e);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-700">Temporada:</label>
          <select 
            className="border border-gray-300 rounded px-3 py-1 bg-white text-gray-900"
            value={temporadaActiva} 
            onChange={(e) => setTemporadaActiva(e.target.value)}
          >
            {temporadas.length > 0 ? (
              temporadas.map(t => <option key={t} value={t}>{t}</option>)
            ) : (
              <option value="Feb-Jun 2026">Feb-Jun 2026</option>
            )}
          </select>
        </div>
        <button 
          onClick={exportarImagen}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors font-medium shadow-sm"
        >
          <Download size={18} />
          <span>Exportar PNG</span>
        </button>
      </div>

      <div className="w-full overflow-x-auto border-[3px] border-black rounded-sm shadow-2xl">
        <div ref={tableRef} className="min-w-max bg-white">
          <table className="w-full text-center border-collapse text-sm">
            <thead>
              <tr>
                <th colSpan={4} className="bg-[#122A5E] text-white uppercase font-black py-4 text-xl tracking-wide">
                  FULBITO PROMIEDOS {temporadaActiva}
                </th>
                {jornadasActivas.map((j, i) => (
                  <th key={j.id} className="bg-white text-white w-12 border-l border-gray-300 text-[0px]">
                    J{j.numero}
                  </th>
                ))}
                <th className="bg-[#D3E4F6] text-[#122A5E] font-bold px-4 border-l border-black">
                  Prom.
                </th>
              </tr>
            </thead>
            <tbody>
              {data.jugadores.map((jugador) => {
                const promedio = calcularPromedio(jugador.id, data.calificaciones, jornadasActivasIds);
                const bgPromedio = fondoPromedio(promedio) === 'amarillo' ? 'bg-[#FFF2CC]' : 'bg-white';
                
                return (
                  <tr key={jugador.id} className="border-t-[3px] border-black hover:bg-gray-50 group">
                    <td className="w-16 h-16 p-0 border-r-[3px] border-black bg-white">
                      <img 
                        src={jugador.avatar} 
                        alt={jugador.nombre} 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + jugador.nombre; }}
                      />
                    </td>
                    <td className="px-4 font-bold text-[#122A5E] border-r border-gray-400 whitespace-nowrap bg-white text-base">
                      {jugador.nombre}
                    </td>
                    <td className="px-4 text-xs text-gray-500 border-r border-gray-400 bg-white">
                      {jugador.apodo}
                    </td>
                    <td className={`px-3 font-bold text-xs border-r-[3px] border-black ${jugador.posicion === 'ARQ' ? 'text-gray-500 bg-white' : jugador.posicion === 'DEF' ? 'text-[#3E70B0] bg-[#D6E3F4]' : 'text-[#A05C55] bg-[#F4E1D1]'}`}>
                      {jugador.posicion}
                    </td>
                    
                    {jornadasActivas.map(j => {
                      const calif = data.calificaciones.find(c => c.jugadorId === jugador.id && c.jornadaId === j.id);
                      const puntajeStr = calif?.puntaje !== null && calif?.puntaje !== undefined ? calif.puntaje.toString() : '';
                      const color = colorPuntaje(calif?.puntaje || null);
                      
                      let colorClass = 'text-black';
                      if (color === 'rojo') colorClass = 'text-red-600';
                      if (color === 'verde') colorClass = 'text-green-600';

                      return (
                        <td key={j.id} className={`font-black text-lg border-r border-gray-300 w-12 bg-white ${colorClass}`}>
                          {puntajeStr}
                        </td>
                      );
                    })}

                    <td className={`font-black text-xl border-l-[3px] border-black px-4 ${bgPromedio}`}>
                      {promedio !== null ? promedio.toFixed(1) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
