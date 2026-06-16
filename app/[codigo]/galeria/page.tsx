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
    <main className="max-w-4xl mx-auto px-5">
      <header className="py-8 border-b border-gray-100 flex items-end justify-between">
        <div>
          <p className="text-[11px] tracking-widest text-gray-400 uppercase mb-1.5">Galería</p>
          <h1 className="text-lg font-medium text-gray-900">{evento.nombre}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{fotosIniciales.length} {fotosIniciales.length === 1 ? 'foto' : 'fotos'}</p>
        </div>
        <div className="flex gap-2 pb-0.5">
          <Link
            href={`/${codigo}`}
            className="flex items-center gap-1.5 border border-gray-200 px-3 py-2 rounded-lg text-[11px] text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            <Camera className="w-3 h-3" strokeWidth={1.5} />
            Subir foto
          </Link>
          <Link
            href={`/${codigo}/tv`}
            className="flex items-center gap-1.5 border border-gray-200 px-3 py-2 rounded-lg text-[11px] text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            <Monitor className="w-3 h-3" strokeWidth={1.5} />
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
