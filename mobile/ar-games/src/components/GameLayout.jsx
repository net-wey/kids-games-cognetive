import React from 'react'
import './GameLayout.css'

const GameLayout = ({ title, children, onBack, progress = 0 }) => {
  // Проверяем, запущены ли мы в iframe (React Native приложение)
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top
  
  return (
    <div className="game-layout">
      {/* Заголовок игры */}
      <div className="game-header">
        {/* Показываем кнопку "Назад" только если НЕ в iframe (там уже есть кнопка в React Native header) */}
        {!isInIframe && (
          <button className="back-button" onClick={onBack}>
            ← Назад
          </button>
        )}
        <h2 className="game-title">{title}</h2>
        <div className="progress-container">
          <div 
            className="progress-bar" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Содержимое игры */}
      <div className="game-content">
        {children}
      </div>
    </div>
  )
}

export default GameLayout


