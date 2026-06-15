'use client'

import { useState, useRef, useTransition } from 'react'
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
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="text-6xl">🎉</div>
        <p className="text-xl font-semibold text-green-700">¡Foto subida!</p>
        <p className="text-gray-500">Ya aparece en la galería</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {!preview ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-2xl p-12 text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer"
        >
          <span className="text-6xl">📷</span>
          <span className="text-lg font-medium">Tocá para elegir una foto o video</span>
          <span className="text-sm">Máximo 20 MB</span>
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
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg hover:bg-black/80"
          >
            ×
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
            className="border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          {errorMsg && (
            <p className="text-red-600 text-sm">{errorMsg}</p>
          )}

          {estado === 'uploading' && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progreso}%` }}
              />
            </div>
          )}

          <button
            onClick={subir}
            disabled={estado === 'uploading'}
            className="bg-blue-600 text-white font-semibold rounded-xl py-4 text-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {estado === 'uploading' ? 'Subiendo...' : 'Compartir foto'}
          </button>
        </>
      )}
    </div>
  )
}
