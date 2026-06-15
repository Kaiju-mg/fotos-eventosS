import { notFound } from 'next/navigation'
import Link from 'next/link'
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
    <main className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-8">
      <header className="text-center">
        <h1 className="text-2xl font-bold">{evento.nombre}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date(evento.fecha).toLocaleDateString('es-AR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <div className="flex justify-center gap-4 mt-3">
          <Link
            href={`/${codigo}/galeria`}
            className="text-blue-600 text-sm hover:underline"
          >
            Ver galería completa
          </Link>
          <Link
            href={`/${codigo}/tv`}
            className="text-blue-600 text-sm hover:underline"
          >
            Modo pantalla
          </Link>
        </div>
      </header>

      <section>
        <SubirFoto evento={evento} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Fotos del evento</h2>
        <GaleriaRealtime fotosIniciales={fotosIniciales} eventoId={evento.id} />
      </section>
    </main>
  )
}
