// src/modules/auth/pages/RegisterPage.tsx
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import './LoginPage.css'

export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    try {
      await signUp(fullName, email, password)

      setInfo(
        'Registro realizado. Si la confirmación por correo está activada, revisa tu bandeja de entrada y luego inicia sesión.'
      )

      // pequeño delay para que lea el mensaje
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      console.error('Error al registrar usuario:', err)
      const msg =
        err instanceof Error
          ? err.message
          : 'No se pudo registrar al usuario.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Crear cuenta</h1>
        <p className="auth-subtitle">
          Registra un nuevo usuario para responder encuestas.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="auth-label">
            Nombre completo
            <input
              className="auth-input"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </label>

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
          {info && <p className="auth-error-msg">{info}</p>}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  )
}