import React, { useState, useEffect, useRef } from 'react'
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import GameLayout from '../GameLayout'
import { useVideoRef } from '../../contexts/VideoContext'
import { useDeviceDetection } from '../../hooks/useDeviceDetection'
import { useHandDetectionLegacy } from '../../hooks/useHandDetectionLegacy'
import './ShowNumberGame.css'

const ShowNumberGame = ({ onComplete, onBack }) => {
  const videoRef = useVideoRef()
  const canvasRef = useRef(null)
  const { isMobile, isDesktop } = useDeviceDetection()
  
  // Для Desktop - MediaPipe Tasks Vision (мощная версия)
  const handLandmarkerRef = useRef(null)
  const animationFrameRef = useRef(null)
  const lastVideoTimeRef = useRef(-1)
  const smoothedLandmarksRef = useRef(null)
  
  // Для Mobile - MediaPipe Hands (легкая версия)
  const legacyDetection = useHandDetectionLegacy(
    isMobile ? videoRef : null,
    isMobile ? canvasRef : null
  )
  
  const [targetNumber, setTargetNumber] = useState(1)
  const [detectedFingers, setDetectedFingers] = useState(0)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const [showCanvas, setShowCanvas] = useState(true) // Показываем сразу
  const [errorMessage, setErrorMessage] = useState('')
  
  const maxRounds = 5
  const stableCountRef = useRef({ count: 0, frames: 0 })

  // Синхронизация с легкой версией для мобильных
  useEffect(() => {
    if (isMobile) {
      // Обновляем количество пальцев
      setDetectedFingers(legacyDetection.detectedFingers)
      
      // Обновляем готовность
      if (legacyDetection.isReady && !isReady) {
        setIsReady(true)
        console.log('🎮 Игра готова! isReady = true')
      }
    }
  }, [isMobile, legacyDetection.detectedFingers, legacyDetection.isReady, isReady])

  // Инициализация MediaPipe Tasks Vision (только для Desktop)
  useEffect(() => {
    // Пропускаем для мобильных - используем легкую версию
    if (isMobile) {
      console.log('📱 Мобильное устройство - используем MediaPipe Hands (легкая версия)')
      return
    }

    if (!videoRef?.current || !canvasRef.current) return

    let mounted = true
    console.log('🖥️ Desktop - инициализация MediaPipe Tasks Vision (полная версия)...')

    const initHandLandmarker = async () => {
      try {
        console.log('📱 Устройство:', navigator.userAgent)
        console.log('🌐 Загрузка WASM файлов...')
        
        // Загружаем WASM файлы
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )
        
        console.log('✅ WASM загружен успешно!')
        console.log('📥 Загрузка модели HandLandmarker...')

        // Создаём HandLandmarker с более мягкими настройками для мобильных
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU' // Пробуем GPU, если не работает - автоматически CPU
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.3, // Снизили для мобильных
          minHandPresenceConfidence: 0.3,
          minTrackingConfidence: 0.3
        })

        if (!mounted) {
          handLandmarker.close()
          return
        }

        handLandmarkerRef.current = handLandmarker
        console.log('✅ HandLandmarker инициализирован успешно!')
        console.log('🎬 Начинаю обработку видео...')
        
        setIsReady(true)
        
        // Запускаем обработку видео
        predictWebcam()
      } catch (error) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА инициализации HandLandmarker:', error)
        console.error('📄 Детали ошибки:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
        
        // Показываем ошибку пользователю
        setErrorMessage(`Ошибка загрузки: ${error.message}`)
        setIsReady(false)
      }
    }

    // Обработка видео
    function predictWebcam() {
      if (!mounted || !videoRef.current || !handLandmarkerRef.current || !canvasRef.current) {
        console.warn('⚠️ Не все ресурсы готовы:', {
          mounted,
          video: !!videoRef.current,
          landmarker: !!handLandmarkerRef.current,
          canvas: !!canvasRef.current
        })
        return
      }
      
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      // Проверка готовности видео
      if (video.readyState < 2) {
        console.warn('⚠️ Видео не готово, readyState:', video.readyState)
        animationFrameRef.current = requestAnimationFrame(predictWebcam)
        return
      }
      
      // Устанавливаем размер canvas равным размеру видео
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        console.log('📐 Canvas размер:', canvas.width, 'x', canvas.height)
      }
      
      // Рисуем видео на canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Определяем руки, только если видео обновилось
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime
        
        try {
          const startTime = performance.now()
          const results = handLandmarkerRef.current.detectForVideo(video, startTime)
          const detectionTime = performance.now() - startTime
          
          // Логируем каждые 30 кадров (примерно раз в секунду)
          if (Math.random() < 0.033) {
            console.log(`⏱️ Детекция заняла: ${detectionTime.toFixed(1)}ms`)
            console.log(`📊 Результаты:`, {
              hasLandmarks: !!results.landmarks,
              landmarksCount: results.landmarks?.length || 0,
              hasHandedness: !!results.handedness
            })
          }
          
          // Обрабатываем результаты
          if (results.landmarks && results.landmarks.length > 0) {
            console.log('✅ Рука обнаружена! Рук:', results.landmarks.length)
            
            // Сглаживаем координаты для плавной отрисовки (избегаем мерцания)
            const smoothedLandmarks = smoothLandmarks(
              results.landmarks,
              smoothedLandmarksRef.current,
              0.5  // Коэффициент сглаживания (0.5 = баланс между плавностью и отзывчивостью)
            )
            smoothedLandmarksRef.current = smoothedLandmarks
            
            // Рисуем руки с сглаженными координатами
            drawHands(ctx, smoothedLandmarks, canvas.width, canvas.height)
            
            // Считаем пальцы на оригинальных координатах (не сглаженных)
            const fingerCount = countFingers(results.landmarks, results.handedness)
            console.log('🖐️ Пальцев определено:', fingerCount)
            
            // Стабилизация результата
            if (stableCountRef.current.count === fingerCount) {
              stableCountRef.current.frames++
              
              if (stableCountRef.current.frames >= 3) {
                setDetectedFingers(fingerCount)
              }
            } else {
              stableCountRef.current = { count: fingerCount, frames: 0 }
            }
          } else {
            // Руки не найдены в текущем кадре
            setDetectedFingers(0)
            stableCountRef.current = { count: 0, frames: 0 }
            smoothedLandmarksRef.current = null
          }
        } catch (error) {
          console.error('❌ Ошибка обработки кадра MediaPipe:', error)
          console.error('📄 Детали:', {
            message: error.message,
            name: error.name
          })
        }
      } else {
        // Видео обновилось но результатов нет
        console.log('⏸️ Кадр пропущен (видео не обновилось)')
      }
      
      if (mounted) {
        animationFrameRef.current = requestAnimationFrame(predictWebcam)
      }
    }

    initHandLandmarker()

    return () => {
      mounted = false
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close()
      }
    }
  }, [videoRef, isMobile])

  // Генерация нового числа при смене раунда
  useEffect(() => {
    setTargetNumber(Math.floor(Math.random() * 10) + 1)
    setDetectedFingers(0)
    stableCountRef.current = { count: 0, frames: 0 }
  }, [round])

  // Автоматическая проверка правильного ответа
  useEffect(() => {
    if (detectedFingers === targetNumber && detectedFingers > 0 && !showSuccess) {
      console.log('✅ Правильно! Засчитываем ответ...')
      
      const timer = setTimeout(() => {
        if (detectedFingers === targetNumber) {
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
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [detectedFingers, targetNumber, round, maxRounds, onComplete, showSuccess])

  const handleSkip = () => {
    if (round + 1 < maxRounds) {
      setRound(round + 1)
    } else {
      onComplete(score)
    }
  }

  return (
    <GameLayout
      title="Покажи число"
      onBack={onBack}
      progress={((round + 1) / maxRounds) * 100}
    >
      <div className="show-number-game">
        {/* Canvas для отрисовки видео и рук */}
        <canvas
          ref={canvasRef}
          className="hands-canvas"
          style={{ 
            display: 'block', // Всегда показываем
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 5,
            pointerEvents: 'none'
          }}
        />

        {/* Загрузка или ошибка */}
        {!isReady && !errorMessage && (
          <div className="loading-detection">
            <p>
              {isMobile ? (
                legacyDetection.isModelLoaded ? 
                  '📹 Шаг 2/2: Ожидание камеры...' : 
                  '📥 Шаг 1/2: Загрузка модели...'
              ) : (
                'Загрузка определения рук...'
              )}
            </p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', lineHeight: '1.4' }}>
              {isMobile ? (
                legacyDetection.isModelLoaded ? (
                  <>
                    Модель загружена! Ожидание видео...<br/>
                    <strong>Камера запускается...</strong>
                  </>
                ) : (
                  <>
                    Загружается <strong>MediaPipe Hands</strong> (легкая версия)...<br/>
                    <strong>5-10 секунд на телефоне</strong>
                  </>
                )
              ) : (
                <>
                  Загружается <strong>MediaPipe Tasks Vision</strong>...<br/>
                  <strong>3-5 секунд</strong>
                </>
              )}
            </p>
            <div className="spinner"></div>
          </div>
        )}

        {/* Ошибка */}
        {errorMessage && (
          <div className="error-detection">
            <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>❌ Ошибка</p>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{errorMessage}</p>
            <p style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
              Попробуйте переключить камеру кнопкой 🔄 вверху справа
            </p>
            <button 
              className="skip-button" 
              onClick={() => window.location.reload()}
              style={{ marginTop: '1rem', position: 'relative', transform: 'none' }}
            >
              🔄 Перезагрузить
            </button>
          </div>
        )}

        {/* Подсказка */}
        {showHint && isReady && round === 0 && (
          <div className="game-hint">
            <p>✋ Покажи руку!</p>
            <button className="hint-close" onClick={() => setShowHint(false)}>
              ОК
            </button>
          </div>
        )}

        {/* Целевое число */}
        {isReady && (
          <div className="number-display">
            <div className="number-card">
              <span className="big-number">{targetNumber}</span>
            </div>
          </div>
        )}

        {/* Счётчик пальцев */}
        {isReady && (
          <div className="finger-counter">
            <p className="counter-text">Вижу пальцев:</p>
            <div className={`counter-number ${detectedFingers === targetNumber && detectedFingers > 0 ? 'correct' : ''}`}>
              {detectedFingers}
            </div>
          </div>
        )}


        {/* Кнопки управления */}
        {isReady && (
          <div className="game-controls-number">
            <button className="skip-button" onClick={handleSkip}>
              ⏭️ Пропустить
            </button>
            <button 
              className="debug-button" 
              onClick={() => setShowCanvas(!showCanvas)}
            >
              {showCanvas ? '👁️ Скрыть' : '👁️ Показать'}
            </button>
          </div>
        )}

        {/* Счётчик раундов */}
        <div className="round-counter">
          Раунд {round + 1} из {maxRounds}
        </div>

        {/* Индикатор технологии (debug) */}
        {isReady && process.env.NODE_ENV === 'development' && (
          <div className="tech-indicator">
            {isMobile ? '📱 Hands (Lite)' : '🖥️ Tasks Vision'}
          </div>
        )}

        {/* Успех */}
        {showSuccess && (
          <div className="success-overlay">
            <div className="success-card">
              <span className="success-icon">🎉</span>
              <p className="success-text">Отлично!</p>
              <p className="success-score">+20 очков</p>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  )
}

// Сглаживание координат между кадрами (убирает мерцание)
function smoothLandmarks(currentLandmarks, previousLandmarks, alpha) {
  if (!previousLandmarks || previousLandmarks.length !== currentLandmarks.length) {
    return currentLandmarks
  }

  const smoothed = []
  
  for (let i = 0; i < currentLandmarks.length; i++) {
    const currentHand = currentLandmarks[i]
    const previousHand = previousLandmarks[i]
    
    const smoothedHand = currentHand.map((point, j) => {
      if (!previousHand[j]) return point
      
      return {
        x: point.x * alpha + previousHand[j].x * (1 - alpha),
        y: point.y * alpha + previousHand[j].y * (1 - alpha),
        z: point.z * alpha + previousHand[j].z * (1 - alpha)
      }
    })
    
    smoothed.push(smoothedHand)
  }
  
  return smoothed
}

// Рисование рук на canvas (без мерцания)
function drawHands(ctx, landmarks, width, height) {
  // Включаем сглаживание для плавных линий
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  
  ctx.strokeStyle = '#00FF00'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.fillStyle = '#FF0000'

  for (const handLandmarks of landmarks) {
    // Рисуем соединения
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17]
    ]

    // Добавляем тень для лучшей видимости
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 3
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1

    for (const [start, end] of connections) {
      const startPoint = handLandmarks[start]
      const endPoint = handLandmarks[end]
      
      ctx.beginPath()
      ctx.moveTo(startPoint.x * width, startPoint.y * height)
      ctx.lineTo(endPoint.x * width, endPoint.y * height)
      ctx.stroke()
    }

    // Рисуем точки
    ctx.shadowBlur = 2
    for (const landmark of handLandmarks) {
      ctx.beginPath()
      ctx.arc(landmark.x * width, landmark.y * height, 5, 0, 2 * Math.PI)
      ctx.fill()
    }
    
    // Сбрасываем тень
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
  }
}

// Подсчёт пальцев (улучшенный алгоритм)
function countFingers(allLandmarks, handedness) {
  let totalFingers = 0

  for (let i = 0; i < allLandmarks.length; i++) {
    const landmarks = allLandmarks[i]
    const hand = handedness[i][0].categoryName  // "Left" или "Right"
    
    let fingers = 0
    
    // БОЛЬШОЙ ПАЛЕЦ - улучшенный алгоритм
    const thumbTip = landmarks[4]
    const thumbIP = landmarks[3]
    const thumbMCP = landmarks[2]
    const indexMCP = landmarks[5]
    
    // Вычисляем расстояние между кончиком большого пальца и основанием указательного
    const distanceThumbToIndex = Math.sqrt(
      Math.pow(thumbTip.x - indexMCP.x, 2) + 
      Math.pow(thumbTip.y - indexMCP.y, 2)
    )
    
    // Если большой палец далеко от указательного - он поднят
    // Также проверяем, что кончик не ниже сустава (для случая когда палец вниз)
    const thumbExtended = distanceThumbToIndex > 0.08 && thumbTip.y < thumbMCP.y + 0.05
    
    if (thumbExtended) {
      fingers++
      console.log('👍 Большой палец поднят (расстояние:', distanceThumbToIndex.toFixed(3), ')')
    } else {
      console.log('👎 Большой палец НЕ поднят (расстояние:', distanceThumbToIndex.toFixed(3), ')')
    }

    // ОСТАЛЬНЫЕ 4 ПАЛЬЦА - проверяем вертикально
    const fingerTips = [8, 12, 16, 20]
    const fingerPIPs = [6, 10, 14, 18]
    const fingerNames = ['Указательный', 'Средний', 'Безымянный', 'Мизинец']
    
    for (let j = 0; j < 4; j++) {
      const tip = landmarks[fingerTips[j]]
      const pip = landmarks[fingerPIPs[j]]
      
      if (tip.y < pip.y - 0.02) {
        fingers++
        console.log(`☝️ ${fingerNames[j]} поднят`)
      }
    }

    console.log(`👋 ${hand} рука: ${fingers} пальцев`)
    totalFingers += fingers
  }

  console.log(`📊 ВСЕГО ПАЛЬЦЕВ: ${totalFingers}`)
  return totalFingers
}

export default ShowNumberGame
