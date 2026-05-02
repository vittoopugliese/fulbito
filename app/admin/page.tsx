'use client';
import { useState, useEffect } from 'react';
import { FulbitoData, Jugador, Jornada, Calificacion } from '@/lib/calculos';

export default function AdminPage() {
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState('');
  
  const [data, setData] = useState<FulbitoData | null>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [temporada, setTemporada] = useState('Feb-Jun 2026');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [numero, setNumero] = useState(1);
  const [calificacionesForm, setCalificacionesForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (auth) {
      setLoading(true);
      fetch('/api/data')
        .then(res => res.json())
        .then((d: FulbitoData) => {
          setData(d);
          // Set default next numero
          if (d.jornadas.length > 0) {
            const tempJornadas = d.jornadas.filter(j => j.temporada === temporada);
            setNumero(tempJornadas.length > 0 ? Math.max(...tempJornadas.map(j => j.numero)) + 1 : 1);
          }
          setLoading(false);
        });
    }
  }, [auth, temporada]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // En v1 usamos un password hardcodeado para la demo
    if (password === 'fulbito2026' || process.env.NEXT_PUBLIC_ADMIN_PASSWORD === password) {
      setAuth(true);
    } else {
      alert('Password incorrecto');
    }
  };

  const handleSave = async () => {
    if (!data) return;
    setLoading(true);

    const jornadaId = `j_${Date.now()}`;
    const nuevaJornada: Jornada = {
      id: jornadaId,
      numero: Number(numero),
      fecha,
      temporada
    };

    const nuevasCalificaciones: Calificacion[] = data.jugadores.map(j => ({
      jugadorId: j.id,
      jornadaId: jornadaId,
      puntaje: calificacionesForm[j.id] ? Number(calificacionesForm[j.id].replace(',', '.')) : null
    }));

    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jornada: nuevaJornada, calificaciones: nuevasCalificaciones })
      });
      
      if (res.ok) {
        alert('Datos guardados correctamente!');
        setCalificacionesForm({});
        setNumero(n => Number(n) + 1);
      } else {
        alert('Error al guardar');
      }
    } catch (e) {
      console.error(e);
      alert('Error en la conexión');
    } finally {
      setLoading(false);
    }
  };

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold mb-6 text-center">Panel Admin</h2>
          <input 
            type="password" 
            placeholder="Contraseña" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-2 rounded mb-4"
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Ingresar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6 text-blue-900 border-b pb-4">Cargar Nueva Jornada</h1>
        
        {loading && !data && <p>Cargando datos...</p>}

        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div>
                <label className="block text-sm font-semibold mb-1">Temporada</label>
                <input 
                  type="text" 
                  value={temporada} 
                  onChange={(e) => setTemporada(e.target.value)}
                  className="w-full border p-2 rounded"
                  placeholder="Ej: Feb-Jun 2026"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">N° de Jornada (del semestre)</label>
                <input 
                  type="number" 
                  value={numero} 
                  onChange={(e) => setNumero(Number(e.target.value))}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Fecha</label>
                <input 
                  type="date" 
                  value={fecha} 
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
            </div>

            <h2 className="text-xl font-bold mb-4">Puntajes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {data.jugadores.map(jugador => (
                <div key={jugador.id} className="flex items-center justify-between bg-gray-100 p-3 rounded border">
                  <div className="flex items-center gap-3">
                    <img src={jugador.avatar} alt="" className="w-10 h-10 rounded-full bg-white object-cover" />
                    <div>
                      <p className="font-bold text-sm leading-tight">{jugador.nombre}</p>
                      <p className="text-xs text-gray-500">{jugador.posicion}</p>
                    </div>
                  </div>
                  <input 
                    type="number"
                    step="0.1"
                    placeholder="-"
                    value={calificacionesForm[jugador.id] || ''}
                    onChange={(e) => setCalificacionesForm({ ...calificacionesForm, [jugador.id]: e.target.value })}
                    className="w-16 border p-1 rounded text-center font-bold"
                  />
                </div>
              ))}
            </div>

            <button 
              onClick={handleSave} 
              disabled={loading}
              className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700 disabled:opacity-50 transition"
            >
              {loading ? 'Guardando...' : 'Guardar Jornada'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
