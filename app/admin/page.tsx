import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-server'
import type { Evento } from '@/types/database'

export default async function AdminDashboard() {
  const supabase = createAdminClient()

  const { data: eventos } = await supabase
    .from('eventos')
    .select('*, fotos(count)')
    .order('creado_en', { ascending: false })

  const lista: (Evento & { fotos: [{ count: number }] })[] = eventos ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Mis eventos</h1>
        <Link
          href="/admin/eventos/nuevo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nuevo evento
        </Link>
      </div>

      {lista.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">🎉</p>
          <p className="text-lg">No tenés eventos todavía</p>
          <Link href="/admin/eventos/nuevo" className="text-blue-600 hover:underline mt-2 inline-block">
            Crear el primero
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {lista.map((evento) => {
            const cantFotos = evento.fotos?.[0]?.count ?? 0
            const expirado = evento.estado === 'expirado' || new Date(evento.fecha_expiracion) < new Date()
            return (
              <Link
                key={evento.id}
                href={`/admin/eventos/${evento.id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-gray-900 group-hover:text-blue-600">
                      {evento.nombre}
                    </h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      expirado ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
                    }`}>
                      {expirado ? 'Finalizado' : 'Activo'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(evento.fecha).toLocaleDateString('es-AR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    {' · '}
                    {cantFotos} {cantFotos === 1 ? 'foto' : 'fotos'}
                  </p>
                </div>
                <span className="text-gray-400 text-2xl">→</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
