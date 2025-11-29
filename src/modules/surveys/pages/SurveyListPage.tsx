// src/modules/surveys/pages/SurveyListPage.tsx
import { Link } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { useSurveys } from '../hooks/useSurveys'
import { useAuth } from '../../../context/AuthContext'
import { SurveyChart } from '../components/SurveyChart'
import './SurveyListPage.css'

export function SurveyListPage() {
  const { status, data, error } = useSurveys()
  const { user } = useAuth()

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
                      disabled
                    >
                      Ver resultados
                    </button>
                    <button
                      type="button"
                      className="surveys-card-btn"
                      disabled
                    >
                      Editar encuesta
                    </button>
                  </div>

                  {/* Gráficos de la encuesta */}
                  <div className="surveys-card-charts">
                    <SurveyChart surveyId={survey.id} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}