export interface Evento {
  id: string
  nombre: string
  fecha: string
  fecha_expiracion: string
  codigo_unico: string
  id_organizador: string | null
  estado: 'activo' | 'expirado' | 'pausado'
  plan: string
  max_fotos: number
  creado_en: string
}

export interface Foto {
  id: string
  id_evento: string
  url_archivo: string
  storage_path: string
  nombre_invitado: string | null
  mensaje: string | null
  fecha_subida: string
  aprobada: boolean
}
