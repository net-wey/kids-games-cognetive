import React from 'react'
import './FarmHome.css'

const FarmHome = ({ onGameSelect, gameScores }) => {
  const games = [
    {
      id: 'showNumber',
      title: 'Покажи число',
      icon: '✋',
      description: 'Покажи пальчиками число от 1 до 10',
      color: '#FF6B6B'
    },
    {
      id: 'showColor',
      title: 'Покажи цвет',
      icon: '🎨',
      description: 'Найди предмет нужного цвета',
      color: '#4ECDC4'
    },
    {
      id: 'findPig',
      title: 'Найди свинку',
      icon: '🐷',
      description: 'Свинка спряталась! Найди ее!',
      color: '#FFB6C1'
    },
    {
      id: 'countFruits',
      title: 'Посчитай фрукты',
      icon: '🍎',
      description: 'Посчитай фрукты над головой',
      color: '#95E1D3'
    }
  ]

  return (
    <div className="farm-home">
      {/* Декоративные облака */}
      <div className="clouds">
        <div className="cloud cloud-1">☁️</div>
        <div className="cloud cloud-2">☁️</div>
        <div className="cloud cloud-3">☁️</div>
      </div>

      {/* Заголовок */}
      <div className="farm-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ flex: 1 }}>
            <h1 className="farm-title">
              <span className="title-icon">🎮</span>
              AR Игры
              <span className="title-icon">✨</span>
            </h1>
            <p className="farm-subtitle">Играй и учись с дополненной реальностью!</p>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('user')
              window.location.href = import.meta.env.BASE_URL
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '2px solid white',
              borderRadius: '8px',
              padding: '8px 16px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Сетка игр */}
      <div className="games-grid">
        {games.map((game) => (
          <button
            key={game.id}
            className="game-card"
            onClick={() => onGameSelect(game.id)}
            style={{ '--card-color': game.color }}
          >
            <div className="game-icon">{game.icon}</div>
            <h3 className="game-name">{game.title}</h3>
            <p className="game-description">{game.description}</p>
            
            {/* Показываем звездочки за прогресс */}
            {gameScores[game.id] > 0 && (
              <div className="game-stars">
                {Array.from({ length: Math.min(3, Math.floor(gameScores[game.id] / 33)) }).map((_, i) => (
                  <span key={i} className="star">⭐</span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>

        {/* Декоративные элементы внизу */}
        <div className="farm-decorations">
          <span className="decoration">⭐</span>
          <span className="decoration">🎨</span>
          <span className="decoration">🎯</span>
          <span className="decoration">🎪</span>
          <span className="decoration">⭐</span>
        </div>
    </div>
  )
}

export default FarmHome
