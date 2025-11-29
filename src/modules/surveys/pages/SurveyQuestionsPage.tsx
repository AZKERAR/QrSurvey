// src/modules/surveys/pages/SurveyQuestionsPage.tsx
import { useState, useEffect, type FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../context/AuthContext'
import './SurveyListPage.css'

type Question = {
  id: string
  question_text: string
  type: string
  options: string[]
  order: number
}

export function SurveyQuestionsPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [surveyId, setSurveyId] = useState<string | null>(null)
  const [surveyTitle, setSurveyTitle] = useState<string>('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Formulario de nueva pregunta
  const [questionText, setQuestionText] = useState('')
  const [optionInput, setOptionInput] = useState('')
  const [options, setOptions] = useState<string[]>([])

  // Cargar encuesta
  useEffect(() => {
    if (!slug) return

    const loadSurvey = async () => {
      setLoading(true)
      const { data: survey, error } = await supabase
        .from('surveys')
        .select('id, title, owner_id')
        .eq('public_slug', slug)
        .single()

      if (error || !survey) {
        setError('Encuesta no encontrada')
        setLoading(false)
        return
      }

      // Verificar que el usuario sea el owner
      if (survey.owner_id !== user?.id) {
        setError('No tienes permisos para editar esta encuesta')
        setLoading(false)
        return
      }

      setSurveyId(survey.id)
      setSurveyTitle(survey.title)

      // Cargar preguntas existentes
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('survey_id', survey.id)
        .order('order', { ascending: true })

      if (questionsData) {
        setQuestions(
          questionsData.map((q) => ({
            ...q,
            options: Array.isArray(q.options) ? q.options : [],
          }))
        )
      }

      setLoading(false)
    }

    loadSurvey()
  }, [slug, user?.id])

  const addOption = () => {
    if (!optionInput.trim()) return
    setOptions([...options, optionInput.trim()])
    setOptionInput('')
  }

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
  }

  const handleAddQuestion = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!surveyId || !questionText.trim() || options.length < 2) {
      setError('La pregunta debe tener al menos 2 opciones')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { error } = await supabase.from('questions').insert({
        survey_id: surveyId,
        question_text: questionText.trim(),
        type: 'single_choice',
        options: options,
        order: questions.length + 1,
      })

      if (error) throw error

      // Recargar preguntas
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('survey_id', surveyId)
        .order('order', { ascending: true })

      if (questionsData) {
        setQuestions(
          questionsData.map((q) => ({
            ...q,
            options: Array.isArray(q.options) ? q.options : [],
          }))
        )
      }

      // Limpiar formulario
      setQuestionText('')
      setOptions([])
    } catch (err) {
      console.error('Error agregando pregunta:', err)
      setError(
        err instanceof Error ? err.message : 'Error agregando pregunta'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleFinish = () => {
    if (questions.length === 0) {
      setError('Debes agregar al menos una pregunta antes de finalizar')
      return
    }
    navigate('/surveys')
  }

  if (loading) {
    return (
      <div className="surveys-page">
        <p className="surveys-info">Cargando...</p>
      </div>
    )
  }

  if (error && !surveyId) {
    return (
      <div className="surveys-page">
        <p className="surveys-error">{error}</p>
        <Link to="/surveys">← Volver a encuestas</Link>
      </div>
    )
  }

  return (
    <div className="surveys-page">
      <header className="surveys-header">
        <div>
          <h1 className="surveys-title">Agregar preguntas</h1>
          <p className="surveys-subtitle">Encuesta: {surveyTitle}</p>
        </div>
      </header>

      <main className="surveys-main">
        {/* Lista de preguntas existentes */}
        {questions.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, marginBottom: 16 }}>
              Preguntas agregadas ({questions.length})
            </h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {questions.map((q, index) => (
                <li
                  key={q.id}
                  style={{
                    background: '#1a1a2e',
                    padding: 16,
                    borderRadius: 8,
                    marginBottom: 12,
                  }}
                >
                  <p style={{ fontWeight: 'bold', marginBottom: 8 }}>
                    {index + 1}. {q.question_text}
                  </p>
                  <p style={{ fontSize: 14, color: '#999' }}>
                    Opciones: {q.options.join(', ')}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Formulario para nueva pregunta */}
        <form onSubmit={handleAddQuestion} className="surveys-form">
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>
            Agregar nueva pregunta
          </h2>

          <label className="auth-label">
            Texto de la pregunta
            <input
              className="auth-input"
              type="text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Ej: ¿Cuál es tu color favorito?"
              required
            />
          </label>

          <label className="auth-label">
            Opciones de respuesta
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                className="auth-input"
                type="text"
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
                placeholder="Escribe una opción"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addOption()
                  }
                }}
              />
              <button
                type="button"
                onClick={addOption}
                className="surveys-create-btn"
                style={{ whiteSpace: 'nowrap' }}
              >
                + Agregar
              </button>
            </div>
          </label>

          {/* Lista de opciones agregadas */}
          {options.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 14, marginBottom: 8, color: '#999' }}>
                Opciones agregadas:
              </p>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {options.map((opt, index) => (
                  <li
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 8,
                      background: '#0f0f1e',
                      borderRadius: 4,
                      marginBottom: 4,
                    }}
                  >
                    <span>{opt}</span>
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ff4444',
                        cursor: 'pointer',
                        fontSize: 16,
                      }}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && <p className="surveys-error">{error}</p>}

          <button
            type="submit"
            className="surveys-create-btn"
            disabled={saving || options.length < 2}
          >
            {saving ? 'Guardando...' : 'Agregar pregunta'}
          </button>
        </form>

        {/* Botón para finalizar */}
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleFinish}
            className="surveys-create-btn"
            disabled={questions.length === 0}
          >
            Finalizar y ver encuestas
          </button>
        </div>
      </main>
    </div>
  )
}
