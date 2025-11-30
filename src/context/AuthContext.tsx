// src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'

type Role = 'admin' | 'respondent' | string | null

export type AuthUser = {
  id: string
  email: string
  fullName: string | null
  role: Role
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (fullName: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function loadCurrentUser(): Promise<AuthUser | null> {
  console.log('loadCurrentUser: starting...')
  
  // 1. Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('getUser result:', { hasUser: !!user, id: user?.id, email: user?.email })

  if (!user) {
    console.log('No authenticated user found')
    return null
  }

  // 2. Leer su perfil en la tabla profiles
  console.log('Querying profile for user:', user.id)
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  console.log('Profile query result:', { profile, error: error?.message, code: error?.code })

  if (error) {
    console.error('Error cargando perfil:', error)
  }

  // 3. Devolver objeto AuthUser
  return {
    id: user.id,
    email: user.email ?? '',
    fullName: profile?.full_name ?? null,
    role: (profile?.role as Role) ?? null,
  }
}

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Cargar sesión inicial + suscripción a cambios de auth
  useEffect(() => {
    console.log('AuthProvider initializing...')
    let isMounted = true

    const init = async () => {
      setLoading(true)
      const u = await loadCurrentUser()
      if (isMounted) {
        setUser(u)
        setLoading(false)
        console.log('Initial user loaded:', u?.email)
      }
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      console.log('Auth state changed:', event)
      
      // SIGNED_OUT: limpiar usuario
      if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null)
          setLoading(false)
        }
        return
      }
      
      // TOKEN_REFRESHED: actualizar datos del usuario
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        const u = await loadCurrentUser()
        if (isMounted) {
          setUser(u)
          setLoading(false)
        }
        return
      }
      
      // SIGNED_IN: IGNORAR porque signIn() ya maneja setUser
      // Esto evita el bucle infinito
      if (event === 'SIGNED_IN') {
        console.log('SIGNED_IN event ignored - handled by signIn() function')
        return
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    console.log('Login attempt for:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    console.log('signInWithPassword result:', {
      hasSession: !!data.session,
      hasUser: !!data.user,
      userId: data.user?.id,
      error: error?.message
    })
    
    if (error) {
      console.error('Login error:', error.message)
      // Personalizar mensaje de error
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Email o contraseña incorrectos')
      } else if (error.message.includes('Email not confirmed')) {
        throw new Error('Email no confirmado. Revisa tu bandeja de entrada.')
      } else {
        throw new Error(`Error de autenticación: ${error.message}`)
      }
    }

    console.log('Login successful, loading profile...')
    // Después de loguear, recargo usuario + perfil
    const u = await loadCurrentUser()
    setUser(u)
    console.log('User loaded:', u?.email, 'Role:', u?.role)
  }

  async function signUp(fullName: string, email: string, password: string) {
    // Importante: mandamos full_name en metadata
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (error) throw error
    // El trigger se encargará de crear el perfil.
    // Y según tu config, el usuario confirmará por correo.
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
  }

  const value: AuthContextValue = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return ctx
}