import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-server'
import { GaleriaRealtime } from '@/components/GaleriaRealtime'
import type { Evento, Foto } from '@/types/database'

export default async function GaleriaPage(props: PageProps<'/[codigo]/galeria'>) {
  const { codigo } = await props.params
  const supabase = createAdminClient()

  const { data: evento } = await supabase
    .from('eventos')
    .select('*')
    .eq('codigo_unico', codigo)
    .eq('estado', 'activo')
    .single<Evento>()

  if (!evento) notFound()

  const { data: fotos } = await supabase
    .from('fotos')
    .select('*')
    .eq('id_evento', evento.id)
    .eq('aprobada', true)
    .order('fecha_subida', { ascending: false })

  const fotosIniciales: Foto[] = fotos ?? []

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{evento.nombre}</h1>
          <p className="text-gray-500 text-sm mt-1">{fotosIniciales.length} fotos</p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/${codigo}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            Subir foto
          </Link>
          <Link
            href={`/${codigo}/tv`}
            className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-100"
          >
            Modo TV
          </Link>
        </div>
      </header>

      <GaleriaRealtime fotosIniciales={fotosIniciales} eventoId={evento.id} />
    </main>
  )
}
