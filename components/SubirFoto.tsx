'use client'

import { useState, useRef, useTransition } from 'react'
import { Camera, X, CheckCircle, Upload } from 'lucide-react'
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
      setTimeout(() => {
        cancelar()
      }, 3000)
    } catch (err) {
      setEstado('error')
      setErrorMsg(err instanceof Error ? err.message : 'Error al subir la foto')
    }
  }

  if (estado === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle className="w-7 h-7 text-green-500" strokeWidth={1.5} />
        </div>
        <p className="text-base font-medium text-gray-800">Foto compartida</p>
        <p className="text-sm text-gray-400">Ya aparece en la galería</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {!preview ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 border border-gray-200 rounded-2xl p-10 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors cursor-pointer bg-gray-50"
        >
          <Camera className="w-8 h-8" strokeWidth={1.5} />
          <span className="text-sm font-medium">Elegir foto o video</span>
          <span className="text-xs text-gray-400">Máximo 20 MB</span>
        </button>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt="Vista previa"
            className="w-full rounded-2xl object-cover max-h-80"
          />
          <button
            onClick={cancelar}
            className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
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
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
          />

          {errorMsg && (
            <p className="text-red-500 text-xs">{errorMsg}</p>
          )}

          {estado === 'uploading' && (
            <div className="w-full bg-gray-100 rounded-full h-1">
              <div
                className="bg-gray-800 h-1 rounded-full transition-all duration-300"
                style={{ width: `${progreso}%` }}
              />
            </div>
          )}

          <button
            onClick={subir}
            disabled={estado === 'uploading'}
            className="flex items-center justify-center gap-2 bg-gray-900 text-white font-medium rounded-xl py-3.5 text-sm hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            <Upload className="w-4 h-4" strokeWidth={1.5} />
            {estado === 'uploading' ? 'Subiendo...' : 'Compartir foto'}
          </button>
        </>
      )}
    </div>
  )
}
