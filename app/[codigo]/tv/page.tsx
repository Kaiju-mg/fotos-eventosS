import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-server'
import { TVSlideshow } from '@/components/TVSlideshow'
import type { Evento, Foto } from '@/types/database'

export default async function TVPage(props: PageProps<'/[codigo]/tv'>) {
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
    .order('fecha_subida', { ascending: true })

  const fotosIniciales: Foto[] = fotos ?? []

  return <TVSlideshow fotosIniciales={fotosIniciales} evento={evento} />
}
