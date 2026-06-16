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
    <main className="max-w-md mx-auto px-5 pb-12">
      <header className="py-8 border-b border-stone-100">
        <p className="text-xs font-medium tracking-widest text-stone-400 uppercase mb-2">
          {new Date(evento.fecha).toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <h1 className="text-2xl font-bold text-stone-800 leading-snug">{evento.nombre}</h1>
        <div className="flex gap-5 mt-4">
          <Link
            href={`/${codigo}/galeria`}
            className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
          >
            <Images className="w-4 h-4" strokeWidth={1.5} />
            Ver galería
          </Link>
          <Link
            href={`/${codigo}/tv`}
            className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
          >
            <Monitor className="w-4 h-4" strokeWidth={1.5} />
            Modo pantalla
          </Link>
        </div>
      </header>

      <section className="py-8">
        <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-4">
          Compartir foto
        </p>
        <SubirFoto evento={evento} />
      </section>

      <section>
        <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-5">
          Fotos del evento
        </p>
        <GaleriaRealtime fotosIniciales={fotosIniciales} eventoId={evento.id} />
      </section>
    </main>
  )
}
