'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { Foto } from '@/types/database'

interface Props {
  fotosIniciales: Foto[]
  eventoId: string
  mostrarNombre?: boolean
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
      <div className="py-14 text-center">
        <p className="text-sm text-stone-400">Todavía no hay fotos. ¡Sé el primero en compartir!</p>
      </div>
    )
  }

  return (
    <div className="columns-2 md:columns-3 gap-2 space-y-2">
      {fotos.map((foto) => (
        <div key={foto.id} className="relative break-inside-avoid overflow-hidden rounded-xl group">
          <img
            src={foto.url_archivo}
            alt={foto.nombre_invitado || 'Foto del evento'}
            className="w-full object-cover"
            loading="lazy"
          />
          {mostrarNombre && foto.nombre_invitado && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-sm font-medium truncate">{foto.nombre_invitado}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
