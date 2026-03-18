import React, { useState, useEffect, useMemo } from 'react'
import GameLayout from '../GameLayout'
import './CountFruitsGame.css'

const CountFruitsGame = ({ onComplete, onBack, videoRef }) => {
  const fruits = ['🍎', '🍊', '🍋', '🍌', '🍇', '🍓', '🍒', '🍑', '🍍', '🥝']
  
  const [currentFruit, setCurrentFruit] = useState('🍎')
  const [count, setCount] = useState(0)
  const [correctAnswer, setCorrectAnswer] = useState(0)
  const [round, setRound] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [score, setScore] = useState(0)
  
  const maxRounds = 5

  // Генерируем случайные позиции фруктов
  const fruitPositions = useMemo(() => {
    const positions = []
    for (let i = 0; i < correctAnswer; i++) {
      const angle = (i / correctAnswer) * 360
      const radius = 150 + Math.random() * 50
      const x = 50 + radius * Math.cos((angle * Math.PI) / 180) / 5
      const y = 20 + radius * Math.sin((angle * Math.PI) / 180) / 8
      positions.push({ x, y, delay: i * 0.1 })
    }
    return positions
  }, [correctAnswer])

  useEffect(() => {
    // Генерируем новое задание
    const randomFruit = fruits[Math.floor(Math.random() * fruits.length)]
    const randomCount = Math.floor(Math.random() * 7) + 3 // от 3 до 9
    setCurrentFruit(randomFruit)
    setCorrectAnswer(randomCount)
    setCount(0)
  }, [round])

  const handleNumberSelect = (number) => {
    const correct = number === correctAnswer
    setIsCorrect(correct)
    setShowResult(true)
    
    if (correct) {
      setScore(score + 20)
    }
    
    setTimeout(() => {
      setShowResult(false)
      if (round + 1 < maxRounds) {
        setRound(round + 1)
      } else {
        onComplete(score + (correct ? 20 : 0))
      }
    }, 2000)
  }

  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  return (
    <GameLayout
      title="Посчитай фрукты"
      onBack={onBack}
      progress={((round + 1) / maxRounds) * 100}
    >
      <div className="count-fruits-game">
        {/* Фрукты над головой (имитация AR) */}
        <div className="fruits-container">
          <div className="head-indicator">
            <span className="head-emoji">👤</span>
            <p className="head-text">Твоя голова здесь</p>
          </div>
          
          {fruitPositions.map((pos, index) => (
            <div
              key={index}
              className="floating-fruit"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                animationDelay: `${pos.delay}s`
              }}
            >
              {currentFruit}
            </div>
          ))}
        </div>

        {/* Вопрос */}
        <div className="question-box">
          <p className="question-text">
            Сколько {currentFruit}?
          </p>
        </div>

        {/* Панель с числами */}
        <div className="numbers-panel">
          <div className="numbers-grid">
            {numbers.map((num) => (
              <button
                key={num}
                className="number-btn"
                onClick={() => handleNumberSelect(num)}
                disabled={showResult}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Результат */}
        {showResult && (
          <div className={`result-overlay ${isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="result-card">
              <span className="result-icon">
                {isCorrect ? '🎉' : '❌'}
              </span>
              <p className="result-text">
                {isCorrect ? 'Правильно!' : 'Неправильно!'}
              </p>
              {!isCorrect && (
                <p className="result-answer">
                  Было {correctAnswer} {currentFruit}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Счетчик */}
        <div className="round-indicator">
          {round + 1} / {maxRounds}
        </div>
      </div>
    </GameLayout>
  )
}

export default CountFruitsGame

