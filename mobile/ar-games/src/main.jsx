import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import LoginPage from './LoginPage'
import './index.css'

// Проверка авторизации
const ProtectedRoute = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = React.useState(false)
  const [checking, setChecking] = React.useState(true)

  React.useEffect(() => {
    // Проверяем наличие пользователя в localStorage
    const user = localStorage.getItem('user')
    if (user) {
      try {
        const userData = JSON.parse(user)
        // Проверяем, что данные валидны
        if (userData && userData.username) {
          setIsAuthorized(true)
        } else {
          localStorage.removeItem('user')
        }
      } catch (e) {
        localStorage.removeItem('user')
      }
    }
    setChecking(false)
  }, [])

  if (checking) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontSize: '18px'
    }}>Загрузка...</div>
  }

  return isAuthorized ? children : <Navigate to="/cognetive-kids/" replace />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/cognetive-kids">
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route 
          path="/games" 
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)


