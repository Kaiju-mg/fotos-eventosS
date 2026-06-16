'use client'

import { useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import type { Foto } from '@/types/database'

interface Props {
  fotosIniciales: Foto[]
  eventoId: string
  mostrarNombre?: boolean
}

function esVideo(url: string) {
  return /\.(mp4|mov|webm|avi|m4v|hevc)(\?|$)/i.test(url)
}

function ItemGaleria({ foto, mostrarNombre }: { foto: Foto; mostrarNombre: boolean }) {
  const [expandido, setExpandido] = useState(false)

  if (esVideo(foto.url_archivo)) {
    return (
      <div className="relative group overflow-hidden rounded-2xl bg-stone-900">
        {!expandido ? (
          <>
            <video
              src={foto.url_archivo}
              className="w-full object-cover block"
              muted
              autoPlay
              loop
              playsInline
            />
            <button
              onClick={() => setExpandido(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-md">
                <Play className="w-5 h-5 text-stone-800 fill-stone-800 ml-0.5" />
              </div>
            </button>
          </>
        ) : (
          <video
            src={foto.url_archivo}
            className="w-full block"
            controls
            autoPlay
            playsInline
          />
        )}
        {mostrarNombre && foto.nombre_invitado && (
          <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 bg-gradient-to-t from-black/70 to-transparent">
            <p className="text-white text-xs font-medium truncate">{foto.nombre_invitado}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative group overflow-hidden rounded-2xl">
      <img
        src={foto.url_archivo}
        alt={foto.nombre_invitado || 'Foto del evento'}
        className="w-full object-cover block transition-transform duration-500 group-hover:scale-[1.03]"
        loading="lazy"
      />
      {mostrarNombre && foto.nombre_invitado && (
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-white text-xs font-medium truncate">{foto.nombre_invitado}</p>
        </div>
      )}
    </div>
  )
}

export function GaleriaRealtime({ fotosIniciales, eventoId, mostrarNombre = true }: Props) {
  const [fotos, setFotos] = useState<Foto[]>(fotosIniciales)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`fotos-evento-${eventoId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fotos',
          filter: `id_evento=eq.${eventoId}`,
        },
        (payload) => {
          const nuevaFoto = payload.new as Foto
          if (nuevaFoto.aprobada) {
            setFotos((prev) => [nuevaFoto, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventoId])

  if (fotos.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-stone-400">Todavía no hay fotos. ¡Sé el primero en compartir!</p>
      </div>
    )
  }

  return (
    <div
      style={{ columnCount: 2, columnGap: '8px' }}
      className="md:[column-count:3]"
    >
      {fotos.map((foto) => (
        <div key={foto.id} style={{ breakInside: 'avoid', marginBottom: '8px' }}>
          <ItemGaleria foto={foto} mostrarNombre={mostrarNombre} />
        </div>
      ))}
    </div>
  )
}
