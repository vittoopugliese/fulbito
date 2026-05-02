import { getFulbitoData } from '@/lib/sheets';
import TablaResumen from '@/components/TablaResumen';

export const revalidate = 0;

export default async function Home() {
  const data = await getFulbitoData();

  return (
    <main className="min-h-screen bg-gray-100 py-10 px-4 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-black text-[#122A5E] tracking-tight uppercase">
            ⚽ Fulbito de los Martes
          </h1>
          <p className="text-gray-600 mt-2 font-medium">Estadísticas y promedios</p>
        </header>

        <TablaResumen data={data} />
      </div>
    </main>
  );
}
