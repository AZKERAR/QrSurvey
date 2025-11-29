// src/modules/surveys/pages/PublicSurveyPage.tsx
import { useEffect, useState, type FormEvent } from 'react'
import { useParams, useLocation, Navigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../context/AuthContext'
import { SurveyChart } from '../components/SurveyChart'
import './SurveyListPage.css'

type Question = {
  id: string
  question_text: string
  type: string
  options: string[] | null
}

type Survey = {
  id: string
  title: string
  description: string | null
}

export function PublicSurveyPage() {
  const { slug } = useParams<{ slug: string }>()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()

  const [survey, setSurvey] = useState<Survey | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 🔁 Cargar encuesta + preguntas
  useEffect(() => {
    if (!slug) return

    const load = async () => {
      setLoading(true)
      setError(null)

      const { data: survey, error: e1 } = await supabase
        .from('surveys')
        .select('id, title, description')
        .eq('public_slug', slug)
        .eq('is_active', true)
        .single()

      if (e1 || !survey) {
        setError('Encuesta no encontrada o inactiva.')
        setLoading(false)
        return
      }

      const { data: questions, error: e2 } = await supabase
        .from('questions')
        .select('id, question_text, type, options')
        .eq('survey_id', survey.id)
        .order('order', { ascending: true })

      if (e2) {
        setError(e2.message)
        setLoading(false)
        return
      }

      setSurvey(survey)
      setQuestions(
        (questions ?? []).map((q) => ({
          ...q,
          options:
            q.options && Array.isArray(q.options)
              ? (q.options as string[])
              : [],
        }))
      )
      setLoading(false)
    }

    load()
  }, [slug])

  // 🔐 Si no hay sesión (y ya terminó de cargar auth), redirigir a login
  if (!authLoading && !user) {
    const returnTo = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!survey || !user) return

    setSaving(true)
    setError(null)

    try {
      // 1. Crear response
      const { data: resp, error: e1 } = await supabase
        .from('responses')
        .insert({
          survey_id: survey.id,
          user_id: user.id,
          device_info: { userAgent: navigator.userAgent },
        })
        .select('id')
        .single()

      if (e1) throw e1

      const responseId = resp!.id

      // 2. Crear response_answers
      const rows = questions.map((q) => ({
        response_id: responseId,
        question_id: q.id,
        answer_value: answers[q.id] ?? null,
      }))

      const { error: e2 } = await supabase
        .from('response_answers')
        .insert(rows)

      if (e2) throw e2

      setDone(true)
    } catch (err) {
      console.error('Error guardando respuestas:', err)
      const msg =
        err instanceof Error
          ? err.message
          : 'No se pudieron guardar las respuestas.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="surveys-page">
        <p className="surveys-info">Cargando encuesta...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="surveys-page">
        <p className="surveys-error">{error}</p>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="surveys-page">
        <p className="surveys-error">Encuesta no encontrada.</p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="surveys-page">
        <h1 className="surveys-title">¡Gracias por responder!</h1>
        <p className="surveys-subtitle">
          Tu feedback ha sido registrado correctamente.
        </p>

        {/* Mostrar gráficos después de responder */}
        {survey && (
          <div style={{ marginTop: 32 }}>
            <SurveyChart surveyId={survey.id} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="surveys-page">
      <header className="surveys-header">
        <div>
          <h1 className="surveys-title">{survey.title}</h1>
          {survey.description && (
            <p className="surveys-subtitle">{survey.description}</p>
          )}
        </div>
      </header>

      <main className="surveys-main">
        <form onSubmit={handleSubmit} className="surveys-form">
          {questions.map((q) => (
            <div key={q.id} style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 8 }}>{q.question_text}</p>

              {q.options && q.options.length > 0 ? (
                <div>
                  {q.options.map((opt) => (
                    <label
                      key={opt}
                      style={{ display: 'block', marginBottom: 4 }}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: opt }))
                        }
                        required
                      />{' '}
                      {opt}
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  className="auth-input"
                  type="text"
                  value={answers[q.id] ?? ''}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [q.id]: e.target.value,
                    }))
                  }
                  required
                />
              )}
            </div>
          ))}

          {error && <p className="surveys-error">{error}</p>}

          <button
            type="submit"
            className="surveys-create-btn"
            disabled={saving}
          >
            {saving ? 'Enviando...' : 'Enviar respuestas'}
          </button>
        </form>
      </main>
    </div>
  )
}