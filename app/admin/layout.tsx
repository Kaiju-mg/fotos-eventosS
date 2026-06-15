import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { logout } from '@/app/actions'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Sin usuario: renderizar solo el children (página de login)
  // El proxy.ts ya redirige al login si intenta acceder a otras rutas admin
  if (!user) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <Link href="/admin" className="font-bold text-lg text-blue-600">
          FotoEventos Admin
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm hidden sm:inline">{user.email}</span>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-gray-600 hover:text-red-600 transition-colors"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </nav>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  )
}
