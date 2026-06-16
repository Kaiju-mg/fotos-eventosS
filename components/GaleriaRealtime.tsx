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
      <div className="py-16 text-center">
        <p className="text-sm text-stone-400">Todavía no hay fotos. ¡Sé el primero en compartir!</p>
      </div>
    )
  }

  return (
    <div
      style={{
        columnCount: 2,
        columnGap: '8px',
      }}
      className="md:[column-count:3]"
    >
      {fotos.map((foto) => (
        <div
          key={foto.id}
          style={{ breakInside: 'avoid', marginBottom: '8px' }}
          className="relative group overflow-hidden rounded-2xl"
        >
          <img
            src={foto.url_archivo}
            alt={foto.nombre_invitado || 'Foto del evento'}
            className="w-full object-cover block transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
          {mostrarNombre && foto.nombre_invitado && (
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
              <span className="m-2.5 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                {foto.nombre_invitado}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
