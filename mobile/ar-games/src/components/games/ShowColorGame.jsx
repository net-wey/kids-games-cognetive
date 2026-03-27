import React, { useState, useEffect, useRef } from 'react'
import GameLayout from '../GameLayout'
import { useVideoRef } from '../../contexts/VideoContext'
import './ShowColorGame.css'

const ShowColorGame = ({ onComplete, onBack }) => {
  const videoRef = useVideoRef()
  const canvasRef = useRef(null)
  const animationFrameRef = useRef(null)
  const lastCheckTimeRef = useRef(0)
  
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [matchCount, setMatchCount] = useState(0)
  const [detectedColorRGB, setDetectedColorRGB] = useState(null)
  
  const maxRounds = 6
  
  // Список цветов
  const colors = [
    { name: 'КРАСНЫЙ', hex: '#FF0000', emoji: '❤️' },
    { name: 'СИНИЙ', hex: '#0000FF', emoji: '💙' },
    { name: 'ЗЕЛЁНЫЙ', hex: '#00FF00', emoji: '💚' },
    { name: 'ЖЁЛТЫЙ', hex: '#FFD700', emoji: '💛' },
    { name: 'ОРАНЖЕВЫЙ', hex: '#FF8C00', emoji: '🧡' },
    { name: 'ФИОЛЕТОВЫЙ', hex: '#9400D3', emoji: '💜' },
  ]
  
  const [currentColor, setCurrentColor] = useState(colors[0])
  const [usedColors, setUsedColors] = useState([0])

  // Выбор нового цвета при смене раунда
  useEffect(() => {
    const availableIndices = colors.map((_, i) => i).filter(i => !usedColors.includes(i))
    if (availableIndices.length > 0) {
      const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]
      setCurrentColor(colors[randomIndex])
      setUsedColors([...usedColors, randomIndex])
    }
    setMatchCount(0)
  }, [round])

  // Определение цвета с камеры
  useEffect(() => {
    if (!videoRef?.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    let mounted = true

    const detectColor = (timestamp) => {
      if (!mounted || !videoRef.current || videoRef.current.readyState !== 4) {
        animationFrameRef.current = requestAnimationFrame(detectColor)
        return
      }

      // Ограничиваем проверку: только раз в 100 мс (10 проверок в секунду)
      if (timestamp - lastCheckTimeRef.current < 100) {
        animationFrameRef.current = requestAnimationFrame(detectColor)
        return
      }
      lastCheckTimeRef.current = timestamp

      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Рисуем видео
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Берём цвет из центра
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const size = 100

      try {
        const imageData = ctx.getImageData(
          centerX - size / 2,
          centerY - size / 2,
          size,
          size
        )

        // Получаем средний цвет
        let r = 0, g = 0, b = 0, count = 0
        for (let i = 0; i < imageData.data.length; i += 4) {
          const brightness = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3
          if (brightness > 30 && brightness < 240) {
            r += imageData.data[i]
            g += imageData.data[i + 1]
            b += imageData.data[i + 2]
            count++
          }
        }

        if (count > 0) {
          r = Math.round(r / count)
          g = Math.round(g / count)
          b = Math.round(b / count)
          
          setDetectedColorRGB({ r, g, b })
          
          // Проверяем совпадение
          const targetRGB = hexToRgb(currentColor.hex)
          const match = colorsMatch({ r, g, b }, targetRGB)
          
          if (match) {
            setMatchCount(prev => {
              const newCount = prev + 1
              console.log(`✅ Совпадение! ${newCount}/30 (~${Math.round(newCount / 10)} сек)`)
              
              if (newCount >= 30 && !showSuccess) {
                handleCorrect()
              }
              
              return newCount
            })
          } else {
            setMatchCount(0)
          }
        }
      } catch (err) {
        console.error('Ошибка:', err)
      }

      animationFrameRef.current = requestAnimationFrame(detectColor)
    }

    detectColor()

    return () => {
      mounted = false
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef, currentColor.hex, showSuccess])

  const handleCorrect = () => {
    console.log('🎉 Правильный цвет!')
    setShowSuccess(true)
    setScore(prev => prev + 20)

    setTimeout(() => {
      setShowSuccess(false)
      if (round + 1 < maxRounds) {
        setRound(round + 1)
      } else {
        onComplete(100)
      }
    }, 2000)
  }

  const handleSkip = () => {
    if (round + 1 < maxRounds) {
      setRound(round + 1)
    } else {
      onComplete(score)
    }
  }

  return (
    <GameLayout
      title="Покажи цвет"
      onBack={onBack}
      progress={((round + 1) / maxRounds) * 100}
    >
      <div className="show-color-game-new">
        {/* Canvas (скрыт) */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Целевой цвет - вверху */}
        <div className="target-color-card">
          <div 
            className="target-color-box" 
            style={{ backgroundColor: currentColor.hex }}
          >
            <span className="color-emoji-large">{currentColor.emoji}</span>
          </div>
          <div className="target-color-name">{currentColor.name}</div>
        </div>

        {/* Область определения - по центру */}
        <div className="detection-zone">
          <div className="detection-frame">
            {matchCount > 0 && (
              <div className="match-bar">
                <div 
                  className="match-fill" 
                  style={{ width: `${(matchCount / 30) * 100}%` }}
                />
              </div>
            )}
          </div>
          <div className="detection-hint">Покажи сюда предмет</div>
        </div>


        {/* Счётчик раундов */}
        <div className="round-badge">
          {round + 1} / {maxRounds}
        </div>

        {/* Кнопка пропуска */}
        <button className="skip-button-new" onClick={handleSkip}>
          Пропустить →
        </button>

        {/* Успех */}
        {showSuccess && (
          <div className="success-overlay">
            <div className="success-card">
              <div className="success-icon">🎨</div>
              <div className="success-text">Отлично!</div>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  )
}

// Вспомогательные функции
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

function rgbToHsv(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const diff = max - min

  let h = 0
  const s = max === 0 ? 0 : diff / max
  const v = max

  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff + (g < b ? 6 : 0)) / 6
    } else if (max === g) {
      h = ((b - r) / diff + 2) / 6
    } else {
      h = ((r - g) / diff + 4) / 6
    }
  }

  return { h: h * 360, s, v }
}

function colorsMatch(detected, target) {
  const detectedHSV = rgbToHsv(detected.r, detected.g, detected.b)
  const targetHSV = rgbToHsv(target.r, target.g, target.b)

  console.log(`🎨 Обнаружен: H=${detectedHSV.h.toFixed(0)}° S=${detectedHSV.s.toFixed(2)} V=${detectedHSV.v.toFixed(2)}`)
  console.log(`🎯 Целевой: H=${targetHSV.h.toFixed(0)}° S=${targetHSV.s.toFixed(2)} V=${targetHSV.v.toFixed(2)}`)

  // Проверка оттенка
  let hueDiff = Math.abs(detectedHSV.h - targetHSV.h)
  if (hueDiff > 180) hueDiff = 360 - hueDiff

  // Более строгая проверка для желтого и оранжевого
  const isYellowOrOrange = targetHSV.h >= 30 && targetHSV.h <= 60 // Желтый/оранжевый
  
  let hueThreshold = 40
  let satThreshold = 0.2
  let valThreshold = 0.3
  
  if (isYellowOrOrange) {
    hueThreshold = 30 // Строже для желтого/оранжевого
    satThreshold = 0.4 // Требуем больше насыщенности (бежевый менее насыщен)
    valThreshold = 0.4 // Требуем больше яркости
  }

  const hueMatch = hueDiff < hueThreshold
  const satMatch = detectedHSV.s > satThreshold
  const valMatch = detectedHSV.v > valThreshold && detectedHSV.v < 0.95

  console.log(`🔍 Проверки: hue(${hueDiff.toFixed(1)}° < ${hueThreshold}?) = ${hueMatch}, sat(${detectedHSV.s.toFixed(2)} > ${satThreshold}) = ${satMatch}, val(${detectedHSV.v.toFixed(2)} > ${valThreshold}) = ${valMatch}`)

  return hueMatch && satMatch && valMatch
}

export default ShowColorGame
