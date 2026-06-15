'use server'

import { createClient, createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { randomBytes } from 'crypto'

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(prevState: { error: string | null }, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: 'Email o contraseña incorrectos' }

  redirect('/admin')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

// ── Eventos ───────────────────────────────────────────────────────────────────

export async function crearEvento(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const nombre = formData.get('nombre') as string
  const fecha = formData.get('fecha') as string
  const diasExpiracion = parseInt(formData.get('dias_expiracion') as string) || 7

  const fechaExpiracion = new Date()
  fechaExpiracion.setDate(fechaExpiracion.getDate() + diasExpiracion)

  let codigoUnico = randomBytes(4).toString('hex')
  const admin = createAdminClient()

  // Reintentar si ya existe el código
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await admin
      .from('eventos')
      .select('id')
      .eq('codigo_unico', codigoUnico)
      .maybeSingle()
    if (!existing) break
    codigoUnico = randomBytes(4).toString('hex')
  }

  const { data, error } = await admin.from('eventos').insert({
    nombre,
    fecha,
    fecha_expiracion: fechaExpiracion.toISOString(),
    codigo_unico: codigoUnico,
    estado: 'activo',
    plan: 'basico',
    max_fotos: 200,
  }).select().single()

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  redirect(`/admin/eventos/${data.id}`)
}

export async function eliminarEvento(eventoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()

  // Obtener fotos para eliminar del storage
  const { data: fotos } = await admin
    .from('fotos')
    .select('storage_path')
    .eq('id_evento', eventoId)

  if (fotos && fotos.length > 0) {
    const paths = fotos.map((f: { storage_path: string }) => f.storage_path)
    await admin.storage.from('fotos-eventos').remove(paths)
  }

  await admin.from('eventos').delete().eq('id', eventoId)

  revalidatePath('/admin')
  redirect('/admin')
}

// ── Fotos ─────────────────────────────────────────────────────────────────────

export async function registrarFoto(data: {
  id_evento: string
  url_archivo: string
  storage_path: string
  nombre_invitado: string | null
  mensaje: string | null
}) {
  const admin = createAdminClient()

  // Verificar que el evento existe y está activo
  const { data: evento } = await admin
    .from('eventos')
    .select('id, max_fotos')
    .eq('id', data.id_evento)
    .eq('estado', 'activo')
    .single()

  if (!evento) throw new Error('Evento no encontrado o inactivo')

  // Verificar límite de fotos
  const { count } = await admin
    .from('fotos')
    .select('id', { count: 'exact', head: true })
    .eq('id_evento', data.id_evento)

  if (count && count >= evento.max_fotos) {
    throw new Error('Se alcanzó el límite de fotos para este evento')
  }

  const { data: foto, error } = await admin.from('fotos').insert({
    id_evento: data.id_evento,
    url_archivo: data.url_archivo,
    storage_path: data.storage_path,
    nombre_invitado: data.nombre_invitado,
    mensaje: data.mensaje,
    aprobada: true,
  }).select().single()

  if (error) throw new Error(error.message)
  return foto
}
