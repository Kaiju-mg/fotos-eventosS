'use client'

import { eliminarEvento } from '@/app/actions'

export function BtnEliminarEvento({ eventoId }: { eventoId: string }) {
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!confirm('¿Eliminar el evento y todas sus fotos? Esta acción no se puede deshacer.')) return
    await eliminarEvento(eventoId)
  }

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="submit"
        className="w-full border border-red-200 text-red-600 rounded-lg py-3 text-sm hover:bg-red-50 transition-colors"
      >
        Eliminar evento
      </button>
    </form>
  )
}
