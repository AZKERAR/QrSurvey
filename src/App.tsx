// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { ReactElement } from 'react'

import { AuthProvider, useAuth } from './context/AuthContext'
import { LoginPage } from './modules/auth/pages/LoginPage'
import { RegisterPage } from './modules/auth/pages/RegisterPage'
import { DashboardPage } from './modules/dashboard/pages/DashboardPage'
import { SurveyListPage } from './modules/surveys/pages/SurveyListPage'
import { SurveyCreatePage } from './modules/surveys/pages/SurveyCreatePage'
import { SurveyQuestionsPage } from './modules/surveys/pages/SurveyQuestionsPage'
import { PublicSurveyPage } from './modules/surveys/pages/PublicSurveyPage'

function PrivateRoute({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="page-center">
        <p>Verificando sesión...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Rutas privadas */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/surveys"
            element={
              <PrivateRoute>
                <SurveyListPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/surveys/new"
            element={
              <PrivateRoute>
                <SurveyCreatePage />
              </PrivateRoute>
            }
          />

          <Route
            path="/surveys/:slug/questions"
            element={
              <PrivateRoute>
                <SurveyQuestionsPage />
              </PrivateRoute>
            }
          />

          {/* Ruta pública de encuesta (por QR) */}
          <Route path="/s/:slug" element={<PublicSurveyPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App