import React, { useState, useEffect } from 'react'
import FarmHome from './components/FarmHome'
import GameContainer from './components/GameContainer'
import './App.css'

function App() {
  const [currentGame, setCurrentGame] = useState(null)
  const [gameScore, setGameScore] = useState({
    showNumber: 0,
    showColor: 0,
    findPig: 0,
    countFruits: 0
  })

  // Проверяем, запущены ли мы в React Native WebView
  const isReactNativeWebView = typeof window !== 'undefined' && window.ReactNativeWebView

  // Отправка сообщений в React Native
  const sendMessageToRN = (type, data) => {
    if (isReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type,
        data
      }))
    }
  }

  useEffect(() => {
    // Уведомляем React Native, что приложение загружено
    sendMessageToRN('APP_READY', { ready: true })
  }, [])

  const handleGameSelect = (gameId) => {
    setCurrentGame(gameId)
    // Уведомляем React Native о выборе игры
    sendMessageToRN('GAME_SELECTED', { gameId })
  }

  const handleGameComplete = (gameId, score) => {
    const newScore = Math.max(gameScore[gameId], score)
    setGameScore(prev => ({
      ...prev,
      [gameId]: newScore
    }))
    
    // Отправляем результаты в React Native для сохранения в БД
    sendMessageToRN('GAME_COMPLETED', {
      gameId,
      score: newScore,
      maxScore: 100,
      timestamp: new Date().toISOString()
    })
    
    setCurrentGame(null)
  }

  const handleBackToHome = () => {
    setCurrentGame(null)
    // Уведомляем о возврате на главную
    sendMessageToRN('BACK_TO_HOME', {})
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    window.location.href = '/cognetive-kids/'
  }

  return (
    <div className="app">
      {!currentGame ? (
        <FarmHome 
          onGameSelect={handleGameSelect}
          gameScores={gameScore}
        />
      ) : (
        <GameContainer
          gameId={currentGame}
          onComplete={handleGameComplete}
          onBack={handleBackToHome}
        />
      )}
    </div>
  )
}

export default App

