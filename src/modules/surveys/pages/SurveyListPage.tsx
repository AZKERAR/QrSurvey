// src/modules/surveys/pages/SurveyListPage.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { useSurveys } from '../hooks/useSurveys'
import { useAuth } from '../../../context/AuthContext'
import { SurveyChart } from '../components/SurveyChart'
import { supabase } from '../../../lib/supabaseClient'
import './SurveyListPage.css'

export function SurveyListPage() {
  const { status, data, error } = useSurveys()
  const { user } = useAuth()
  const [expandedSurveys, setExpandedSurveys] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState<string | null>(null)

  const loading = status === 'loading'
  const hasError = status === 'error'
  const surveys = data ?? []
  const isAdmin = user?.role === 'admin'

  // Debug: verificar usuario y rol
  console.log('SurveyListPage - User:', {
    email: user?.email,
    role: user?.role,
    isAdmin,
  })

  const toggleResults = (surveyId: string) => {
    setExpandedSurveys((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(surveyId)) {
        newSet.delete(surveyId)
      } else {
        newSet.add(surveyId)
      }
      return newSet
    })
  }

  const handleDelete = async (surveyId: string, title: string) => {
    console.log('🗑️ Iniciando eliminación:', { surveyId, title })
    
    if (!confirm(`¿Estás seguro de eliminar la encuesta "${title}"?\n\nEsto eliminará todas las preguntas y respuestas asociadas.`)) {
      console.log('❌ Usuario canceló la eliminación')
      return
    }

    console.log('✅ Usuario confirmó, procediendo a eliminar...')
    setDeleting(surveyId)
    
    try {
      console.log('📡 Ejecutando DELETE en Supabase...', { table: 'surveys', id: surveyId })
      
      const { data, error } = await supabase
        .from('surveys')
        .delete()
        .eq('id', surveyId)
        .select()

      console.log('📊 Respuesta de Supabase:', { data, error: error?.message })

      if (error) {
        console.error('💥 Error de Supabase:', error)
        throw error
      }

      console.log('✅ Eliminación exitosa, recargando página...')
      // Recargar la página para actualizar la lista
      window.location.reload()
    } catch (err) {
      console.error('💥 Error eliminando encuesta:', err)
      alert('Error al eliminar la encuesta. Intenta de nuevo.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="surveys-page">
      {/* HEADER */}
      <header className="surveys-header">
        <div>
          <h1 className="surveys-title">Mis encuestas</h1>
          <p className="surveys-subtitle">
            Aquí verás todas las encuestas creadas en el sistema.
          </p>
        </div>

        {isAdmin ? (
          <Link to="/surveys/new" className="surveys-create-btn">
            + Nueva encuesta
          </Link>
        ) : (
          <button className="surveys-create-btn" type="button" disabled>
            Solo administradores pueden crear encuestas
          </button>
        )}
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="surveys-main">
        {loading && (
          <p className="surveys-info">Cargando encuestas...</p>
        )}

        {hasError && (
          <div className="surveys-error">
            Ocurrió un error al cargar las encuestas:{' '}
            <strong>{String(error)}</strong>
          </div>
        )}

        {!loading && !hasError && surveys.length === 0 && (
          <div className="surveys-empty">
            <p>
              Todavía no tienes encuestas creadas. Más adelante aquí
              podrás crear y gestionar tus encuestas.
            </p>

            <p className="surveys-back-link">
              <Link to="/dashboard">← Volver al panel</Link>
            </p>
          </div>
        )}

        {!loading && !hasError && surveys.length > 0 && (
          <ul className="surveys-list">
            {surveys.map((survey) => {
              const publicUrl = `${window.location.origin}/s/${survey.public_slug}`

              return (
                <li key={survey.id} className="surveys-card">
                  <div className="surveys-card-main">
                    <h2 className="surveys-card-title">{survey.title}</h2>

                    {survey.description && (
                      <p className="surveys-card-desc">
                        {survey.description}
                      </p>
                    )}

                    <p className="surveys-card-meta">
                      Creada el{' '}
                      {new Date(survey.created_at).toLocaleDateString()}
                    </p>

                    {survey.public_slug && (
                      <p className="surveys-card-meta">
                        Link público:{' '}
                        <code className="surveys-public-link">
                          {publicUrl}
                        </code>
                      </p>
                    )}
                  </div>

                  <div className="surveys-card-actions">
                    {survey.public_slug && (
                      <div className="surveys-qr-box">
                        <QRCodeCanvas value={publicUrl} size={80} />
                      </div>
                    )}

                    <button
                      type="button"
                      className="surveys-card-btn"
                      onClick={() => toggleResults(survey.id)}
                    >
                      {expandedSurveys.has(survey.id) ? 'Ocultar resultados' : 'Ver resultados'}
                    </button>
                    
                    <button
                      type="button"
                      className="surveys-card-btn"
                      onClick={() => handleDelete(survey.id, survey.title)}
                      disabled={deleting === survey.id}
                      style={{
                        backgroundColor: '#ef4444',
                        opacity: deleting === survey.id ? 0.5 : 1,
                      }}
                    >
                      {deleting === survey.id ? 'Eliminando...' : 'Eliminar encuesta'}
                    </button>
                  </div>

                  {/* Gráficos de la encuesta */}
                  {expandedSurveys.has(survey.id) && (
                    <div className="surveys-card-charts">
                      <SurveyChart surveyId={survey.id} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}