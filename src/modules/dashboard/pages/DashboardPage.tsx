// src/modules/dashboard/pages/DashboardPage.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useSurveys } from '../../surveys/hooks/useSurveys'
import { SurveyChart } from '../../surveys/components/SurveyChart'
import './DashboardPage.css'

export function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const [refreshKey, setRefreshKey] = useState(0)
  const { status, data: surveys } = useSurveys(refreshKey)

  const handleLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const handleRefresh = () => {
    console.log('🔄 Refresh button clicked, incrementing refreshKey')
    setRefreshKey(prev => prev + 1)
  }

  const isAdmin = user?.role === 'admin'
  const surveysLoading = status === 'loading'

  return (
    <div className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <h1 className="dashboard-title">Panel de encuestas</h1>

        <div className="dashboard-user-box">
          <span className="dashboard-user-email">
            Sesión: <strong>{user?.email}</strong>
            {user?.role && (
              <>
                {' '}
                — Rol: <strong>{user.role}</strong>
              </>
            )}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="dashboard-logout-btn"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="dashboard-main">
        {loading ? (
          <p className="dashboard-text">Cargando...</p>
        ) : isAdmin && surveysLoading ? (
          <p className="dashboard-text">Cargando encuestas...</p>
        ) : isAdmin && surveys && surveys.length > 0 ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Tus encuestas</h2>
              <button
                onClick={handleRefresh}
                style={{
                  padding: '8px 16px',
                  background: '#22c55e',
                  color: '#022c22',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                🔄 Actualizar resultados
              </button>
            </div>
            {surveys.map((survey) => {
              console.log('🎯 Dashboard rendering survey:', { id: survey.id, title: survey.title, slug: survey.public_slug })
              return (
                <div
                  key={survey.id}
                  style={{
                    background: '#1a1a2e',
                    padding: 20,
                    borderRadius: 8,
                    marginBottom: 20,
                  }}
                >
                  <h3 style={{ color: '#22c55e', marginBottom: 8 }}>
                    {survey.title}
                  </h3>
                  {survey.description && (
                    <p style={{ color: '#999', marginBottom: 16 }}>
                      {survey.description}
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>ID: {survey.id}</p>
                  <SurveyChart key={`${survey.id}-${refreshKey}`} surveyId={survey.id} />
                </div>
              )
            })}
          </div>
        ) : isAdmin ? (
          <div>
            <p className="dashboard-text">
              Aún no tienes encuestas creadas.
            </p>
            <p className="dashboard-link-row">
              <Link to="/surveys">Ir a crear tu primera encuesta →</Link>
            </p>
          </div>
        ) : (
          <div>
            <p className="dashboard-text">
              Tu rol actual es{' '}
              <strong>{user?.role ?? 'respondent'}</strong>. Podrás responder
              encuestas mediante códigos QR.
            </p>
          </div>
        )}

        {isAdmin && (
          <p className="dashboard-link-row" style={{ marginTop: 24 }}>
            <Link to="/surveys">Ver todas las encuestas →</Link>
          </p>
        )}
      </main>
    </div>
  )
}