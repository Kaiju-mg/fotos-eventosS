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
    <main className="max-w-lg mx-auto px-4 py-10 flex flex-col gap-10">
      <header className="text-center">
        <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-2">
          {new Date(evento.fecha).toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <h1 className="text-2xl font-semibold text-gray-900">{evento.nombre}</h1>
        <div className="flex justify-center gap-6 mt-4">
          <Link
            href={`/${codigo}/galeria`}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            <Images className="w-3.5 h-3.5" strokeWidth={1.5} />
            Galería completa
          </Link>
          <Link
            href={`/${codigo}/tv`}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            <Monitor className="w-3.5 h-3.5" strokeWidth={1.5} />
            Modo pantalla
          </Link>
        </div>
      </header>

      <section>
        <SubirFoto evento={evento} />
      </section>

      <section>
        <h2 className="text-sm font-medium text-gray-500 mb-4">Fotos del evento</h2>
        <GaleriaRealtime fotosIniciales={fotosIniciales} eventoId={evento.id} />
      </section>
    </main>
  )
}
