import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './LoginPage.css'

const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!username || !password) {
      setError('Пожалуйста, заполните все поля')
      return
    }

    setLoading(true)
    
    // Здесь можно добавить реальную авторизацию через API
    // Пока что просто переходим к играм
    try {
      // Демо-авторизация для GitHub Pages
      await new Promise(resolve => setTimeout(resolve, 500))

      if (username !== 'admin' || password !== 'admin') {
        setError('Для демо-входа используйте admin / admin')
        return
      }
      
      // Сохраняем в localStorage
      localStorage.setItem('user', JSON.stringify({ username, role: 'admin' }))
      
      navigate('/games')
    } catch (err) {
      setError('Ошибка входа. Попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-icon">🎓</div>
          <h1 className="login-title">Cognitive Kids</h1>
          <p className="login-subtitle">Развитие когнитивных способностей</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && (
            <div className="login-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="login-input-group">
            <label htmlFor="username">Имя пользователя</label>
            <input
              id="username"
              type="text"
              placeholder="Введите имя пользователя"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setError('')
              }}
              autoComplete="username"
            />
          </div>

          <div className="login-input-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <p className="login-footer">
          Демо-вход для GitHub Pages: admin / admin
        </p>
      </div>
    </div>
  )
}

export default LoginPage
