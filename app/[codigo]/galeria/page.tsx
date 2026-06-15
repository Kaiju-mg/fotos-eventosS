import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Camera, Monitor } from 'lucide-react'
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
    <main className="max-w-4xl mx-auto px-4 py-10">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-1">Galería</p>
          <h1 className="text-xl font-semibold text-gray-900">{evento.nombre}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{fotosIniciales.length} {fotosIniciales.length === 1 ? 'foto' : 'fotos'}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/${codigo}`}
            className="flex items-center gap-1.5 border border-gray-200 px-3 py-2 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" strokeWidth={1.5} />
            Subir foto
          </Link>
          <Link
            href={`/${codigo}/tv`}
            className="flex items-center gap-1.5 border border-gray-200 px-3 py-2 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Monitor className="w-3.5 h-3.5" strokeWidth={1.5} />
            Modo TV
          </Link>
        </div>
      </header>

      <GaleriaRealtime fotosIniciales={fotosIniciales} eventoId={evento.id} />
    </main>
  )
}
