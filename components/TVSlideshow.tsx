'use client'

import { useEffect, useState, useCallback } from 'react'
import { Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import type { Foto, Evento } from '@/types/database'

const INTERVALO_MS = 6000

interface Props {
  fotosIniciales: Foto[]
  evento: Evento
}

export function TVSlideshow({ fotosIniciales, evento }: Props) {
  const [fotos, setFotos] = useState<Foto[]>(fotosIniciales)
  const [indice, setIndice] = useState(0)
  const [visible, setVisible] = useState(true)

  const avanzar = useCallback(() => {
    setVisible(false)
    setTimeout(() => {
      setIndice((i) => (i + 1) % Math.max(fotos.length, 1))
      setVisible(true)
    }, 500)
  }, [fotos.length])

  useEffect(() => {
    if (fotos.length <= 1) return
    const timer = setInterval(avanzar, INTERVALO_MS)
    return () => clearInterval(timer)
  }, [fotos.length, avanzar])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`tv-evento-${evento.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fotos',
          filter: `id_evento=eq.${evento.id}`,
        },
        (payload) => {
          const nuevaFoto = payload.new as Foto
          if (nuevaFoto.aprobada) {
            setFotos((prev) => [...prev, nuevaFoto])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [evento.id])

  const fotoActual = fotos[indice]

  if (fotos.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Camera className="w-10 h-10 text-gray-600 mx-auto mb-6" strokeWidth={1} />
          <p className="text-3xl font-light">{evento.nombre}</p>
          <p className="text-lg text-gray-500 mt-4">Esperando fotos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {fotoActual && (
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: visible ? 1 : 0 }}
        >
          <img
            src={fotoActual.url_archivo}
            alt=""
            className="w-full h-full object-contain"
          />

          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-2xl font-light">{evento.nombre}</p>
            {fotoActual.nombre_invitado && (
              <p className="text-gray-300 text-lg mt-1">{fotoActual.nombre_invitado}</p>
            )}
          </div>

          {fotos.length > 1 && (
            <div className="absolute bottom-4 right-6 text-gray-400 text-sm">
              {indice + 1} / {fotos.length}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
