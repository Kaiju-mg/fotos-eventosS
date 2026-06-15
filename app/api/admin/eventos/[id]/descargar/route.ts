import { createClient, createAdminClient } from '@/lib/supabase-server'
import JSZip from 'jszip'
import type { Foto } from '@/types/database'

export async function GET(_req: Request, ctx: RouteContext<'/api/admin/eventos/[id]/descargar'>) {
  const { id } = await ctx.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('No autorizado', { status: 401 })

  const admin = createAdminClient()

  const { data: evento } = await admin
    .from('eventos')
    .select('nombre, codigo_unico')
    .eq('id', id)
    .single()

  if (!evento) return new Response('Evento no encontrado', { status: 404 })

  const { data: fotos } = await admin
    .from('fotos')
    .select('*')
    .eq('id_evento', id)
    .order('fecha_subida', { ascending: true })

  if (!fotos || fotos.length === 0) {
    return new Response('No hay fotos para descargar', { status: 404 })
  }

  const zip = new JSZip()

  await Promise.all(
    (fotos as Foto[]).map(async (foto, i) => {
      try {
        const { data: blob } = await admin.storage
          .from('fotos-eventos')
          .download(foto.storage_path)

        if (blob) {
          const ext = foto.storage_path.split('.').pop() || 'jpg'
          const nombre = foto.nombre_invitado
            ? `${String(i + 1).padStart(3, '0')}-${foto.nombre_invitado.replace(/[^a-z0-9]/gi, '_')}.${ext}`
            : `${String(i + 1).padStart(3, '0')}.${ext}`
          zip.file(nombre, blob.arrayBuffer())
        }
      } catch {
        // Ignorar fotos que no se puedan descargar
      }
    })
  )

  const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })
  const nombreArchivo = evento.nombre.replace(/[^a-z0-9]/gi, '_').toLowerCase()

  return new Response(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="fotos-${nombreArchivo}.zip"`,
    },
  })
}
