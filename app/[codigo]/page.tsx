import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Images, Monitor } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-server'
import { SubirFoto } from '@/components/SubirFoto'
import { GaleriaRealtime } from '@/components/GaleriaRealtime'
import type { Evento, Foto } from '@/types/database'

export default async function PaginaInvitado(props: PageProps<'/[codigo]'>) {
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
    .limit(50)

  const fotosIniciales: Foto[] = fotos ?? []

  return (
    <main className="max-w-md mx-auto px-5">
      <header className="py-10 border-b border-gray-100">
        <p className="text-[11px] tracking-widest text-gray-400 uppercase mb-2">
          {new Date(evento.fecha).toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <h1 className="text-xl font-medium text-gray-900 leading-snug">{evento.nombre}</h1>
        <div className="flex gap-5 mt-4">
          <Link
            href={`/${codigo}/galeria`}
            className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Images className="w-3.5 h-3.5" strokeWidth={1.5} />
            Ver galería
          </Link>
          <Link
            href={`/${codigo}/tv`}
            className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Monitor className="w-3.5 h-3.5" strokeWidth={1.5} />
            Modo pantalla
          </Link>
        </div>
      </header>

      <section className="py-8">
        <SubirFoto evento={evento} />
      </section>

      {fotosIniciales.length > 0 && (
        <section className="pb-12">
          <p className="text-[11px] tracking-widest text-gray-400 uppercase mb-5">Fotos</p>
          <GaleriaRealtime fotosIniciales={fotosIniciales} eventoId={evento.id} />
        </section>
      )}

      {fotosIniciales.length === 0 && (
        <section className="pb-12">
          <GaleriaRealtime fotosIniciales={fotosIniciales} eventoId={evento.id} />
        </section>
      )}
    </main>
  )
}
