import { crearEvento } from '@/app/actions'
import Link from 'next/link'

export default function NuevoEventoPage() {
  const hoy = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-2xl font-bold">Nuevo evento</h1>
      </div>

      <form action={crearEvento} className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del evento *
          </label>
          <input
            name="nombre"
            type="text"
            required
            placeholder="Casamiento de Ana y Lucas"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha del evento *
          </label>
          <input
            name="fecha"
            type="date"
            required
            defaultValue={hoy}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ¿Cuántos días guardar las fotos? *
          </label>
          <select
            name="dias_expiracion"
            defaultValue="7"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          >
            <option value="3">3 días</option>
            <option value="7">7 días</option>
            <option value="14">14 días</option>
            <option value="30">30 días</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Las fotos se borran automáticamente después de este tiempo
          </p>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white font-semibold rounded-lg py-3 hover:bg-blue-700 transition-colors"
        >
          Crear evento
        </button>
      </form>
    </div>
  )
}
