'use client'

import { useState, useRef, useTransition } from 'react'
import { Camera, X, Check, ArrowUp, Play } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { registrarFoto } from '@/app/actions'
import type { Evento } from '@/types/database'

const MAX_DURACION_VIDEO_SEG = 60
const MAX_TAMANIO_BYTES = 20 * 1024 * 1024

function esArchivoVideo(file: File) {
  return file.type.startsWith('video/')
}

function getDuracionVideo(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src)
      resolve(video.duration)
    }
    video.onerror = reject
    video.src = URL.createObjectURL(file)
  })
}

export function SubirFoto({ evento }: { evento: Evento }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [esVideo, setEsVideo] = useState(false)
  const [nombre, setNombre] = useState('')
  const [estado, setEstado] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [progreso, setProgreso] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const [, startTransition] = useTransition()

  async function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return

    setErrorMsg('')

    if (f.size > MAX_TAMANIO_BYTES) {
      setErrorMsg('El archivo es demasiado grande (máximo 20 MB)')
      return
    }

    const video = esArchivoVideo(f)

    if (video) {
      try {
        const duracion = await getDuracionVideo(f)
        if (duracion > MAX_DURACION_VIDEO_SEG) {
          setErrorMsg(`El video es demasiado largo (máximo ${MAX_DURACION_VIDEO_SEG} segundos)`)
          return
        }
      } catch {
        setErrorMsg('No se pudo leer el video')
        return
      }
    }

    setFile(f)
    setEsVideo(video)
    setPreview(URL.createObjectURL(f))
    setEstado('idle')
  }

  function cancelar() {
    setFile(null)
    setPreview(null)
    setEsVideo(false)
    setEstado('idle')
    setErrorMsg('')
    setProgreso(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function subir() {
    if (!file) return
    setEstado('uploading')
    setProgreso(10)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() || (esVideo ? 'mp4' : 'jpg')
      const storagePath = `${evento.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos-eventos')
        .upload(storagePath, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError
      setProgreso(70)

      const { data: { publicUrl } } = supabase.storage
        .from('fotos-eventos')
        .getPublicUrl(uploadData.path)

      startTransition(async () => {
        await registrarFoto({
          id_evento: evento.id,
          url_archivo: publicUrl,
          storage_path: uploadData.path,
          nombre_invitado: nombre.trim() || null,
          mensaje: null,
        })
      })

      setProgreso(100)
      setEstado('success')
      setTimeout(cancelar, 3000)
    } catch (err) {
      setEstado('error')
      setErrorMsg(err instanceof Error ? err.message : 'Error al subir el archivo')
    }
  }

  if (estado === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-14 text-center">
        <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center">
          <Check className="w-6 h-6 text-stone-600" strokeWidth={2} />
        </div>
        <div>
          <p className="text-base font-semibold text-stone-800">
            {esVideo ? 'Video compartido' : 'Foto compartida'}
          </p>
          <p className="text-sm text-stone-500 mt-1">Ya aparece en la galería</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {!preview ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-4 bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl py-14 hover:bg-stone-100 hover:border-stone-300 active:bg-stone-200 transition-colors"
        >
          <Camera className="w-9 h-9 text-stone-400" strokeWidth={1.5} />
          <div className="text-center">
            <p className="text-base font-semibold text-stone-700">Subir foto o video</p>
            <p className="text-sm text-stone-400 mt-1">Fotos · Videos hasta 60 seg · Live Photos</p>
          </div>
        </button>
      ) : (
        <div className="relative">
          {esVideo ? (
            <video
              src={preview}
              controls
              className="w-full rounded-2xl max-h-80 bg-black"
            />
          ) : (
            <img
              src={preview}
              alt="Vista previa"
              className="w-full rounded-2xl object-cover max-h-80"
            />
          )}
          {esVideo && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
              <Play className="w-3 h-3 text-white fill-white" />
              <span className="text-white text-xs font-medium">Video</span>
            </div>
          )}
          <button
            onClick={cancelar}
            className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          >
            <X className="w-4 h-4 text-stone-700" />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,image/heic,image/heif,video/*"
        onChange={onFileSelect}
        className="hidden"
      />

      {preview && (
        <>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre (opcional)"
            maxLength={50}
            className="border border-stone-200 rounded-xl px-4 py-4 text-base text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 bg-white"
          />

          {errorMsg && (
            <p className="text-red-500 text-sm">{errorMsg}</p>
          )}

          {estado === 'uploading' && (
            <div className="w-full bg-stone-100 rounded-full h-1.5">
              <div
                className="bg-stone-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progreso}%` }}
              />
            </div>
          )}

          <button
            onClick={subir}
            disabled={estado === 'uploading'}
            className="flex items-center justify-center gap-2.5 bg-stone-700 text-white text-base font-semibold rounded-xl py-4 hover:bg-stone-800 active:bg-stone-900 disabled:opacity-50 transition-colors"
          >
            <ArrowUp className="w-5 h-5" strokeWidth={2} />
            {estado === 'uploading' ? 'Subiendo...' : 'Compartir'}
          </button>
        </>
      )}

      {errorMsg && !preview && (
        <p className="text-red-500 text-sm text-center">{errorMsg}</p>
      )}
    </div>
  )
}
