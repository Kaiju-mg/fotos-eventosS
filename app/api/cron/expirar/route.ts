import { createAdminClient } from '@/lib/supabase-server'
import type { Foto } from '@/types/database'

function validarSecreto(req: Request): boolean {
  // Vercel cron: Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get('authorization')
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true

  // Llamada manual con header x-cron-secret
  const secretHeader = req.headers.get('x-cron-secret')
  if (secretHeader === process.env.CRON_SECRET) return true

  return false
}

async function expirarEventos() {
  const admin = createAdminClient()

  const { data: eventosExpirados } = await admin
    .from('eventos')
    .select('id, nombre')
    .eq('estado', 'activo')
    .lt('fecha_expiracion', new Date().toISOString())

  if (!eventosExpirados || eventosExpirados.length === 0) {
    return { procesados: 0, fotosEliminadas: 0 }
  }

  let totalFotosEliminadas = 0

  for (const evento of eventosExpirados) {
    const { data: fotos } = await admin
      .from('fotos')
      .select('storage_path')
      .eq('id_evento', evento.id)

    if (fotos && fotos.length > 0) {
      const paths = (fotos as Pick<Foto, 'storage_path'>[]).map((f) => f.storage_path)
      await admin.storage.from('fotos-eventos').remove(paths)
      totalFotosEliminadas += fotos.length
    }

    await admin.from('eventos').update({ estado: 'expirado' }).eq('id', evento.id)
  }

  return { procesados: eventosExpirados.length, fotosEliminadas: totalFotosEliminadas }
}

export async function GET(req: Request) {
  if (!validarSecreto(req)) return Response.json({ error: 'No autorizado' }, { status: 401 })
  const resultado = await expirarEventos()
  return Response.json(resultado)
}

export async function POST(req: Request) {
  if (!validarSecreto(req)) return Response.json({ error: 'No autorizado' }, { status: 401 })
  const resultado = await expirarEventos()
  return Response.json(resultado)
}
