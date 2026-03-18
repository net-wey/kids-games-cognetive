import React, { useState, useEffect, useRef } from 'react'
import GameLayout from '../GameLayout'
import './FindPigGame.css'

const FindPigGame = ({ onComplete, onBack }) => {
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [showPig, setShowPig] = useState(false)
  const [found, setFound] = useState(false)
  const [pigPosition, setPigPosition] = useState({ x: 50, y: 50 })
  const [showHint, setShowHint] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [hasGyroscope, setHasGyroscope] = useState(true)
  const [rotationIndicator, setRotationIndicator] = useState(0)
  const [isPigVisible, setIsPigVisible] = useState(false)
  
  const lastMotionRef = useRef({ alpha: null, beta: null, gamma: null })
  const motionDetectedRef = useRef(false)
  const searchTimerRef = useRef(null)
  const totalRotationRef = useRef(0)
  const pigDirectionRef = useRef(null) // Направление где свинка в пространстве
  
  const maxRounds = 5

  // Генерируем случайную позицию для свинки
  const generatePigPosition = () => {
    return {
      x: 15 + Math.random() * 70, // 15-85%
      y: 15 + Math.random() * 70  // 15-85%
    }
  }

  // Детекция движения устройства
  useEffect(() => {
    let gyroDetected = false
    let noMotionTimer = null

    const handleOrientation = (event) => {
      const { alpha, beta, gamma } = event

      // Проверяем что гироскоп работает
      if (alpha !== null && beta !== null && gamma !== null) {
        if (!gyroDetected) {
          gyroDetected = true
          setHasGyroscope(true)
          console.log('🎮 Гироскоп обнаружен!')
        }

        // Первая инициализация
        if (lastMotionRef.current.alpha === null) {
          lastMotionRef.current = { alpha, beta, gamma }
          return
        }

        // Проверяем изменение ориентации
        const deltaAlpha = Math.abs(alpha - lastMotionRef.current.alpha)
        const deltaBeta = Math.abs(beta - lastMotionRef.current.beta)
        const deltaGamma = Math.abs(gamma - lastMotionRef.current.gamma)

        // Накапливаем общее вращение
        totalRotationRef.current += deltaAlpha
        setRotationIndicator(Math.min(totalRotationRef.current, 360))

        // Если есть значительное движение
        if (deltaAlpha > 5 || deltaBeta > 5 || deltaGamma > 5) {
          motionDetectedRef.current = true
          
          if (!showPig && !found) {
            setIsSearching(true)
            
            // Сбрасываем таймер
            if (searchTimerRef.current) {
              clearTimeout(searchTimerRef.current)
            }

            // Свинка появляется только после вращения на 90+ градусов
            if (totalRotationRef.current > 90) {
              searchTimerRef.current = setTimeout(() => {
                if (!showPig && !found) {
                  // Запоминаем направление (угол alpha) где появилась свинка
                  pigDirectionRef.current = alpha
                  console.log('🐷 Свинка размещена в направлении:', alpha.toFixed(0), '°')
                  setPigPosition(generatePigPosition())
                  setShowPig(true)
                  setIsPigVisible(true)
                  setIsSearching(false)
                  totalRotationRef.current = 0
                  setRotationIndicator(0)
                }
              }, 800)
            }
          }
        }

        // Если свинка уже размещена - проверяем видна ли она
        if (showPig && !found && pigDirectionRef.current !== null) {
          const angleDiff = Math.abs(alpha - pigDirectionRef.current)
          const normalizedDiff = angleDiff > 180 ? 360 - angleDiff : angleDiff
          
          // Свинка видна только если смотрим в её направлении (±40°)
          if (normalizedDiff < 40) {
            setIsPigVisible(true)
          } else {
            setIsPigVisible(false)
          }
        }

        lastMotionRef.current = { alpha, beta, gamma }
      }
    }

    // Проверяем наличие гироскопа через 2 секунды
    noMotionTimer = setTimeout(() => {
      if (!gyroDetected) {
        console.log('⚠️ Гироскоп не обнаружен - fallback режим')
        setHasGyroscope(false)
      }
    }, 2000)

    // Пытаемся получить доступ к датчикам ориентации
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ требует разрешения
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation)
          } else {
            setHasGyroscope(false)
          }
        })
        .catch(() => {
          setHasGyroscope(false)
        })
    } else {
      // Другие устройства
      window.addEventListener('deviceorientation', handleOrientation)
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current)
      }
      if (noMotionTimer) {
        clearTimeout(noMotionTimer)
      }
    }
  }, [showPig, found])

  // Сброс состояния при смене раунда
  useEffect(() => {
    setShowPig(false)
    setFound(false)
    setIsPigVisible(false)
    motionDetectedRef.current = false
    totalRotationRef.current = 0
    setRotationIndicator(0)
    pigDirectionRef.current = null
    lastMotionRef.current = { alpha: null, beta: null, gamma: null }
  }, [round])

  const handlePigFound = () => {
    console.log('🐷 Свинка поймана!')
    setFound(true)
    setScore(prev => prev + 20)
    setShowPig(false)
    setIsPigVisible(false)
    pigDirectionRef.current = null
    
    setTimeout(() => {
      setFound(false)
      if (round + 1 < maxRounds) {
        setRound(round + 1)
      } else {
        onComplete(100)
      }
    }, 2000)
  }

  return (
    <GameLayout
      title="Найди свинку"
      onBack={onBack}
      progress={((round + 1) / maxRounds) * 100}
    >
      <div className="find-pig-game">
        {/* Инструкция */}
        {showHint && round === 0 && (
          <div className="game-hint-pig">
            <p className="hint-title">Покрутись вокруг! 🔄</p>
            <p className="hint-text">
              Медленно поворачивайся с телефоном на 90°,<br/>
              и свинка появится на экране! 🐷
            </p>
            <button className="hint-close-btn" onClick={() => setShowHint(false)}>
              Начать!
            </button>
          </div>
        )}

        {/* Индикатор вращения */}
        {!showPig && !found && !showHint && hasGyroscope && (
          <div className="rotation-indicator">
            <div className="rotation-text">
              Поверни телефон: {Math.round(rotationIndicator)}° / 90°
            </div>
            <div className="rotation-bar">
              <div 
                className="rotation-fill" 
                style={{ width: `${Math.min((rotationIndicator / 90) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Индикатор поиска */}
        {isSearching && !showPig && (
          <div className="searching-indicator">
            <p className="searching-text">🔍 Ищу свинку...</p>
          </div>
        )}

        {/* Fallback без гироскопа */}
        {!showPig && !found && !showHint && !hasGyroscope && (
          <div className="no-gyro-message">
            <p className="no-gyro-text">
              ⚠️ Гироскоп не обнаружен
            </p>
            <p className="no-gyro-subtext">
              Игра работает на мобильных устройствах с гироскопом
            </p>
            <button className="manual-spawn-btn" onClick={() => {
              setPigPosition(generatePigPosition())
              setShowPig(true)
            }}>
              🐷 Показать свинку
            </button>
          </div>
        )}

        {/* Подсказка где искать */}
        {showPig && !isPigVisible && !found && hasGyroscope && (
          <div className="pig-direction-hint">
            <p className="direction-text">
              🔄 Покрутись! Свинка в другом направлении!
            </p>
          </div>
        )}

        {/* Свинка (видна только если смотрим в её направление) */}
        {showPig && isPigVisible && !found && (
          <div 
            className="ar-pig"
            style={{
              left: `${pigPosition.x}%`,
              top: `${pigPosition.y}%`
            }}
            onClick={handlePigFound}
          >
            <div className="pig-emoji">🐷</div>
            <div className="pig-glow"></div>
          </div>
        )}

        {/* Найдено! */}
        {found && (
          <div className="success-overlay-pig">
            <div className="success-card-pig">
              <span className="success-icon-pig">🎉</span>
              <p className="success-text-pig">Нашёл!</p>
              <p className="success-subtext-pig">+20 очков! 🐷</p>
            </div>
          </div>
        )}

        {/* Счетчик */}
        <div className="round-badge-pig">
          {round + 1} / {maxRounds}
        </div>
      </div>
    </GameLayout>
  )
}

export default FindPigGame
