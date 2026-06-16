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
    <main className="max-w-5xl mx-auto px-4 pb-12">
      <header className="py-8 border-b border-stone-100 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-1.5">Galería</p>
          <h1 className="text-xl font-bold text-stone-800">{evento.nombre}</h1>
          <p className="text-sm text-stone-500 mt-1">
            {fotosIniciales.length} {fotosIniciales.length === 1 ? 'foto' : 'fotos'}
          </p>
        </div>
        <div className="flex gap-2 pb-1">
          <Link
            href={`/${codigo}`}
            className="flex items-center gap-2 border border-stone-200 bg-stone-50 px-4 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <Camera className="w-4 h-4" strokeWidth={1.5} />
            Subir foto
          </Link>
          <Link
            href={`/${codigo}/tv`}
            className="flex items-center gap-2 border border-stone-200 bg-stone-50 px-4 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <Monitor className="w-4 h-4" strokeWidth={1.5} />
            Modo TV
          </Link>
        </div>
      </header>

      <div className="py-6">
        <GaleriaRealtime fotosIniciales={fotosIniciales} eventoId={evento.id} />
      </div>
    </main>
  )
}
