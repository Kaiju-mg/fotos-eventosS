import { notFound } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'qrcode'
import { createAdminClient } from '@/lib/supabase-server'
import { BtnEliminarEvento } from '@/components/BtnEliminarEvento'
import type { Evento, Foto } from '@/types/database'

export default async function EventoDetalleAdmin(props: PageProps<'/admin/eventos/[id]'>) {
  const { id } = await props.params
  const supabase = createAdminClient()

  const { data: evento } = await supabase
    .from('eventos')
    .select('*')
    .eq('id', id)
    .single<Evento>()

  if (!evento) notFound()

  const { data: fotos, count } = await supabase
    .from('fotos')
    .select('*', { count: 'exact' })
    .eq('id_evento', id)
    .order('fecha_subida', { ascending: false })
    .limit(12)

  const fotosRecientes: Foto[] = fotos ?? []
  const cantFotos = count ?? 0

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const urlEvento = `${appUrl}/${evento.codigo_unico}`
  const qrDataUrl = await QRCode.toDataURL(urlEvento, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  })

  const expirado = evento.estado === 'expirado' || new Date(evento.fecha_expiracion) < new Date()

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600">←</Link>
        <div>
          <h1 className="text-2xl font-bold">{evento.nombre}</h1>
          <p className="text-gray-500 text-sm">
            {new Date(evento.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* QR y links */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center gap-4">
          <img src={qrDataUrl} alt="QR del evento" className="w-48 h-48" />
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">URL del evento</p>
            <a
              href={urlEvento}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 text-sm hover:underline break-all"
            >
              {urlEvento}
            </a>
          </div>
          <div className="flex gap-2 w-full">
            <a
              href={`/${evento.codigo_unico}`}
              target="_blank"
              className="flex-1 text-center border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50"
            >
              Abrir
            </a>
            <a
              href={`/${evento.codigo_unico}/tv`}
              target="_blank"
              className="flex-1 text-center border border-gray-300 rounded-lg py-2 text-sm hover:bg-gray-50"
            >
              Modo TV
            </a>
          </div>
        </div>

        {/* Estadísticas y acciones */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-bold text-blue-600">{cantFotos}</p>
                <p className="text-sm text-gray-500">{cantFotos === 1 ? 'foto' : 'fotos'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    expirado ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                  }`}>
                    {expirado ? 'Finalizado' : 'Activo'}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Expira: {new Date(evento.fecha_expiracion).toLocaleDateString('es-AR', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {cantFotos > 0 && (
            <a
              href={`/api/admin/eventos/${id}/descargar`}
              className="bg-green-600 text-white text-center font-medium rounded-lg py-3 hover:bg-green-700 transition-colors"
            >
              Descargar todas las fotos (ZIP)
            </a>
          )}

          <BtnEliminarEvento eventoId={id} />
        </div>
      </div>

      {/* Preview de fotos recientes */}
      {fotosRecientes.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Fotos recientes</h2>
            {cantFotos > 12 && (
              <Link
                href={`/${evento.codigo_unico}/galeria`}
                className="text-blue-600 text-sm hover:underline"
                target="_blank"
              >
                Ver todas →
              </Link>
            )}
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {fotosRecientes.map((foto) => (
              <div key={foto.id} className="aspect-square rounded-lg overflow-hidden">
                <img
                  src={foto.url_archivo}
                  alt={foto.nombre_invitado || ''}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
