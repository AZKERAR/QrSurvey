// src/modules/dashboard/pages/DashboardPage.tsx
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useSurveys } from '../../surveys/hooks/useSurveys'
import { SurveyChart } from '../../surveys/components/SurveyChart'
import './DashboardPage.css'

export function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const { status, data: surveys } = useSurveys()

  const handleLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
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
            <h2 style={{ marginBottom: 16 }}>Tus encuestas</h2>
            {surveys.map((survey) => (
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
                <SurveyChart surveyId={survey.id} />
              </div>
            ))}
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