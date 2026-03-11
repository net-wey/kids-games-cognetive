import { useEffect, useRef, useState } from 'react'
import { Hands } from '@mediapipe/hands'
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils'
import { HAND_CONNECTIONS } from '@mediapipe/hands'

/**
 * Легкая версия MediaPipe Hands для мобильных устройств
 * Использует старый API @mediapipe/hands который легче и стабильнее
 */
export const useHandDetectionLegacy = (videoRef, canvasRef) => {
  const [isReady, setIsReady] = useState(false)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [detectedFingers, setDetectedFingers] = useState(0)
  const handsRef = useRef(null)
  const animationFrameRef = useRef(null)
  const lastProcessTimeRef = useRef(0)
  const isProcessingRef = useRef(false)

  useEffect(() => {
    // НЕ ТРЕБУЕМ videoRef на этапе загрузки модели
    if (!canvasRef?.current) return

    let mounted = true
    console.log('📱 Шаг 1/2: Загрузка модели MediaPipe Hands...')

    const initHands = async () => {
      try {
        // Создаем MediaPipe Hands с оптимизированными настройками для мобильных
        const hands = new Hands({
          locateFile: (file) => {
            console.log('📥 Загружаем файл:', file)
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
          }
        })

        hands.setOptions({
          maxNumHands: 2, // 2 руки для точности
          modelComplexity: 0, // Легкая модель
          minDetectionConfidence: 0.6, // Повысили для точности
          minTrackingConfidence: 0.5,
          selfieMode: false
        })

        console.log('⚙️ Настройки MediaPipe Hands:', {
          maxNumHands: 2,
          modelComplexity: 0,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.5
        })

        hands.onResults((results) => {
          if (!mounted) return
          processResults(results)
        })

        handsRef.current = hands
        
        // Отправляем пустой кадр для инициализации модели
        console.log('🔄 Инициализация модели...')
        const dummyCanvas = document.createElement('canvas')
        dummyCanvas.width = 640
        dummyCanvas.height = 480
        await hands.send({ image: dummyCanvas })
        
        setIsModelLoaded(true)
        console.log('✅ Модель MediaPipe Hands загружена!')
        console.log('📱 Шаг 2/2: Ожидание видео...')
      } catch (error) {
        console.error('❌ Ошибка инициализации MediaPipe Hands:', error)
      }
    }

    const processResults = (results) => {
      const canvas = canvasRef.current
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Очищаем canvas
      ctx.save()
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Рисуем руки
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        console.log('✅ Рука обнаружена! Количество рук:', results.multiHandLandmarks.length)

        for (const landmarks of results.multiHandLandmarks) {
          // Рисуем соединения (зеленые линии)
          drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
            color: '#00FF00',
            lineWidth: 4
          })

          // Рисуем точки (красные точки)
          drawLandmarks(ctx, landmarks, {
            color: '#FF0000',
            fillColor: '#FF0000',
            lineWidth: 2,
            radius: 5
          })
        }

        // Считаем пальцы
        const fingerCount = countFingers(results.multiHandLandmarks, results.multiHandedness)
        console.log('🖐️ Пальцев обнаружено:', fingerCount, 'Handedness:', results.multiHandedness?.map(h => h.label).join(', '))
        setDetectedFingers(fingerCount)
      } else {
        console.log('👻 Рука не обнаружена')
        setDetectedFingers(0)
      }

      ctx.restore()
      isProcessingRef.current = false
    }

    const detectHands = async () => {
      if (!mounted || !videoRef?.current || !handsRef.current || !canvasRef.current) {
        animationFrameRef.current = requestAnimationFrame(detectHands)
        return
      }

      const video = videoRef.current
      const canvas = canvasRef.current

      // Проверяем готовность видео
      if (video.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(detectHands)
        return
      }

      // Устанавливаем размер canvas
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        console.log('📐 Canvas размер:', canvas.width, 'x', canvas.height)
        
        // Отмечаем что готовы
        if (!isReady) {
          setIsReady(true)
          console.log('✅ Видео готово! Начинаем детекцию!')
        }
      }

      // Ограничиваем частоту обработки (каждые 100ms = 10 FPS)
      const now = performance.now()
      if (now - lastProcessTimeRef.current < 100) {
        animationFrameRef.current = requestAnimationFrame(detectHands)
        return
      }
      
      // Пропускаем если уже обрабатываем
      if (isProcessingRef.current) {
        animationFrameRef.current = requestAnimationFrame(detectHands)
        return
      }
      
      lastProcessTimeRef.current = now
      isProcessingRef.current = true

      try {
        // Отправляем кадр в MediaPipe
        await handsRef.current.send({ image: video })
      } catch (error) {
        console.error('❌ Ошибка обработки кадра:', error)
        isProcessingRef.current = false
      }

      if (mounted) {
        animationFrameRef.current = requestAnimationFrame(detectHands)
      }
    }

    initHands()

    return () => {
      mounted = false
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (handsRef.current) {
        handsRef.current.close()
      }
    }
  }, [canvasRef])
  
  // Отдельный эффект для запуска детекции когда видео готово
  useEffect(() => {
    if (!isModelLoaded || !videoRef?.current) return
    
    console.log('🎬 Модель загружена и видео готово - запускаем детекцию!')
    
    let mounted = true
    const detectHands = async () => {
      if (!mounted || !videoRef?.current || !handsRef.current || !canvasRef.current) {
        if (mounted) {
          requestAnimationFrame(detectHands)
        }
        return
      }

      const video = videoRef.current
      const canvas = canvasRef.current

      if (video.readyState < 2) {
        requestAnimationFrame(detectHands)
        return
      }

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        console.log('📐 Canvas размер:', canvas.width, 'x', canvas.height)
        
        if (!isReady) {
          setIsReady(true)
          console.log('✅ Все готово! Начинаем определение рук!')
        }
      }

      const now = performance.now()
      if (now - lastProcessTimeRef.current < 100) {
        requestAnimationFrame(detectHands)
        return
      }
      
      if (isProcessingRef.current) {
        requestAnimationFrame(detectHands)
        return
      }
      
      lastProcessTimeRef.current = now
      isProcessingRef.current = true

      try {
        await handsRef.current.send({ image: video })
      } catch (error) {
        console.error('❌ Ошибка:', error)
        isProcessingRef.current = false
      }

      if (mounted) {
        requestAnimationFrame(detectHands)
      }
    }
    
    detectHands()
    
    return () => {
      mounted = false
    }
  }, [isModelLoaded, videoRef, canvasRef, isReady])

  return { isReady: isReady && isModelLoaded, detectedFingers, isModelLoaded }
}

/**
 * Подсчет пальцев из landmarks MediaPipe Hands
 */
function countFingers(multiHandLandmarks, multiHandedness) {
  if (!multiHandLandmarks || multiHandLandmarks.length === 0) return 0

  let totalFingers = 0

  multiHandLandmarks.forEach((landmarks, idx) => {
    if (landmarks.length < 21) return

    let fingers = 0
    const handedness = multiHandedness?.[idx]?.label || 'Right'
    
    console.log(`Рука ${idx + 1} (${handedness}):`)

    // Большой палец - проверяем расстояние по оси X
    const thumbTip = landmarks[4]
    const thumbIP = landmarks[3]
    const thumbMCP = landmarks[2]
    const wrist = landmarks[0]

    // Вычисляем направление руки
    const palmWidth = Math.abs(landmarks[5].x - landmarks[17].x)
    const threshold = palmWidth * 0.3 // Адаптивный порог

    // Для правой руки: tip левее чем IP, для левой: tip правее
    const thumbExtended = handedness === 'Right' 
      ? thumbTip.x < thumbIP.x - threshold
      : thumbTip.x > thumbIP.x + threshold
    
    if (thumbExtended) {
      fingers++
      console.log('  👍 Большой палец: ПОДНЯТ')
    } else {
      console.log('  👎 Большой палец: опущен')
    }

    // Остальные пальцы (указательный, средний, безымянный, мизинец)
    const fingerNames = ['Указательный', 'Средний', 'Безымянный', 'Мизинец']
    const fingerTips = [8, 12, 16, 20]
    const fingerPIPs = [6, 10, 14, 18]
    const fingerMCPs = [5, 9, 13, 17]

    fingerTips.forEach((tipIdx, i) => {
      const tip = landmarks[tipIdx]
      const pip = landmarks[fingerPIPs[i]]
      const mcp = landmarks[fingerMCPs[i]]

      // Вычисляем расстояние от кончика до PIP и от PIP до MCP
      const tipToPip = Math.abs(tip.y - pip.y)
      const pipToMcp = Math.abs(pip.y - mcp.y)
      
      // Палец поднят если:
      // 1. Кончик выше PIP
      // 2. Расстояние tip-pip больше чем pip-mcp (палец прямой)
      const isExtended = tip.y < pip.y - 0.03 && tipToPip > pipToMcp * 0.5

      if (isExtended) {
        fingers++
        console.log(`  ☝️ ${fingerNames[i]}: ПОДНЯТ`)
      } else {
        console.log(`  👎 ${fingerNames[i]}: опущен`)
      }
    })

    console.log(`  ✋ Итого пальцев: ${fingers}`)
    totalFingers += fingers
  })

  console.log(`🖐️ ВСЕГО пальцев на всех руках: ${totalFingers}`)
  return Math.min(totalFingers, 10)
}

