// src/modules/auth/pages/LoginPage.tsx
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import './LoginPage.css'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Si venimos desde un QR, habrá un ?returnTo=/s/slug
  const searchParams = new URLSearchParams(location.search)
  const returnTo = searchParams.get('returnTo') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    console.log('Attempting login for:', email)

    try {
      await signIn(email, password)
      console.log('Login successful, navigating to:', returnTo)
      navigate(returnTo, { replace: true })
    } catch (err) {
      console.error('Login failed:', err)

      let errorMessage = 'No se pudo iniciar sesión.'
      
      if (err instanceof Error) {
        // Mostrar mensaje más específico según el tipo de error
        if (err.message.includes('Email o contraseña incorrectos')) {
          errorMessage = '❌ Email o contraseña incorrectos. Verifica tus datos.'
        } else if (err.message.includes('Email no confirmado')) {
          errorMessage = '📧 Email no confirmado. Revisa tu bandeja de entrada.'
        } else if (err.message.includes('Error cargando perfil')) {
          errorMessage = '👤 Error cargando el perfil de usuario. Contacta al administrador.'
        } else {
          errorMessage = err.message
        }
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
      console.log('Login process finished')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Iniciar sesión</h1>
        <p className="auth-subtitle">
          Usa el correo y contraseña del usuario creado en Supabase.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="auth-label">
            Correo electrónico
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="auth-label">
            Contraseña
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <p className="auth-global-error">{error}</p>}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={{ fontSize: 12, marginTop: 12 }}>
          ¿No tienes cuenta?{' '}
          <Link to="/register" style={{ color: '#22c55e' }}>
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  )
}