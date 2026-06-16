'use client'

import { useState, useRef, useTransition } from 'react'
import { Camera, X, Check, ArrowUp } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { registrarFoto } from '@/app/actions'
import type { Evento } from '@/types/database'

export function SubirFoto({ evento }: { evento: Evento }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [nombre, setNombre] = useState('')
  const [estado, setEstado] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [progreso, setProgreso] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const [, startTransition] = useTransition()

  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 20 * 1024 * 1024) {
      setErrorMsg('El archivo es demasiado grande (máximo 20 MB)')
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setEstado('idle')
    setErrorMsg('')
  }

  function cancelar() {
    setFile(null)
    setPreview(null)
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
      const ext = file.name.split('.').pop() || 'jpg'
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
      setErrorMsg(err instanceof Error ? err.message : 'Error al subir la foto')
    }
  }

  if (estado === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
          <Check className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
        </div>
        <p className="text-sm text-gray-600">Foto compartida</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {!preview ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 border border-gray-200 rounded-xl py-12 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors bg-white"
        >
          <Camera className="w-6 h-6" strokeWidth={1.5} />
          <span className="text-xs">Elegir foto o video</span>
        </button>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt="Vista previa"
            className="w-full rounded-xl object-cover max-h-72"
          />
          <button
            onClick={cancelar}
            className="absolute top-2.5 right-2.5 bg-white/80 backdrop-blur-sm rounded-full w-7 h-7 flex items-center justify-center hover:bg-white transition-colors"
          >
            <X className="w-3.5 h-3.5 text-gray-700" />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
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
            className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400"
          />

          {errorMsg && (
            <p className="text-red-500 text-xs">{errorMsg}</p>
          )}

          {estado === 'uploading' && (
            <div className="w-full bg-gray-100 rounded-full h-px">
              <div
                className="bg-gray-900 h-px rounded-full transition-all duration-500"
                style={{ width: `${progreso}%` }}
              />
            </div>
          )}

          <button
            onClick={subir}
            disabled={estado === 'uploading'}
            className="flex items-center justify-center gap-2 bg-gray-900 text-white text-sm rounded-lg py-3 hover:bg-black disabled:opacity-40 transition-colors"
          >
            <ArrowUp className="w-3.5 h-3.5" strokeWidth={2} />
            {estado === 'uploading' ? 'Subiendo...' : 'Compartir'}
          </button>
        </>
      )}
    </div>
  )
}
