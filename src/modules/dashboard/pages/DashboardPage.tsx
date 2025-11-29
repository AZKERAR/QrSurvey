// src/modules/dashboard/pages/DashboardPage.tsx
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import './DashboardPage.css'

export function DashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const isAdmin = user?.role === 'admin'

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
        <p className="dashboard-text">
          Aquí luego mostraremos las encuestas, respuestas y métricas.
        </p>

        {isAdmin ? (
          <p className="dashboard-link-row">
            <Link to="/surveys">Ir a la lista de encuestas →</Link>
          </p>
        ) : (
          <p className="dashboard-text">
            Tu rol actual es{' '}
            <strong>{user?.role ?? 'respondent'}</strong>. Podrás responder
            encuestas mediante códigos QR.
          </p>
        )}
      </main>
    </div>
  )
}