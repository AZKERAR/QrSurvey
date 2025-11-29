// src/modules/surveys/pages/SurveyCreatePage.tsx
import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../context/AuthContext'
import './SurveyListPage.css'

function slugify(str: string) {
  const base = str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
  const random = Math.random().toString(36).slice(2, 7)
  return `${base}-${random}`
}

export function SurveyCreatePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!user) {
      setError('Debes iniciar sesión para crear encuestas.')
      return
    }

    setLoading(true)

    try {
      const slug = slugify(title || 'encuesta')

      const { error } = await supabase
        .from('surveys')
        .insert({
          owner_id: user.id,
          title,
          description,
          public_slug: slug,
          is_active: true,
        })

      if (error) throw error

      // Redirigir a página para agregar preguntas
      navigate(`/surveys/${slug}/questions`)
    } catch (err) {
      console.error('Error creando encuesta:', err)
      const msg =
        err instanceof Error ? err.message : 'No se pudo crear la encuesta.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="surveys-page">
      <header className="surveys-header">
        <div>
          <h1 className="surveys-title">Nueva encuesta</h1>
          <p className="surveys-subtitle">
            Define el título y una descripción breve.
          </p>
        </div>
      </header>

      <main className="surveys-main">
        {!user ? (
          <p className="surveys-error">
            Debes iniciar sesión para crear encuestas.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="surveys-form">
            <label className="auth-label">
              Título de la encuesta
              <input
                className="auth-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>

            <label className="auth-label">
              Descripción (opcional)
              <textarea
                className="auth-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </label>

            {error && <p className="surveys-error">{error}</p>}

            <div style={{ marginTop: 16 }}>
              <button
                type="submit"
                className="surveys-create-btn"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Crear encuesta'}
              </button>
              <span style={{ marginLeft: 12 }}>
                <Link to="/surveys">Cancelar</Link>
              </span>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}