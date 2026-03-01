import { useEffect, useRef, useState } from 'react'
import { Hands } from '@mediapipe/hands'

export const useHandDetection = (videoRef, onDetection) => {
  const [isReady, setIsReady] = useState(false)
  const handsRef = useRef(null)
  const animationFrameRef = useRef(null)
  const lastDetectionTimeRef = useRef(0)
  const isReadyRef = useRef(false)
  const onDetectionRef = useRef(onDetection)

  // Обновляем ref при изменении callback
  useEffect(() => {
    onDetectionRef.current = onDetection
  }, [onDetection])

  useEffect(() => {
    if (!videoRef?.current) return

    let mounted = true

    // Создаем MediaPipe Hands
    const hands = new Hands({
      locateFile: (file) => {
        // Используем unpkg CDN для более стабильной загрузки
        return `https://unpkg.com/@mediapipe/hands@0.4.1675469240/${file}`
      }
    })

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,  // Снизили порог для лучшей чувствительности
      minTrackingConfidence: 0.5
    })
    
    console.log('MediaPipe Hands инициализирован с настройками')

    hands.onResults((results) => {
      if (!mounted) return
      
      try {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const fingerCount = countFingers(results.multiHandLandmarks)
          console.log('Определено пальцев:', fingerCount)
          // Используем ref чтобы всегда вызывать актуальный callback
          onDetectionRef.current(fingerCount)
        } else {
          onDetectionRef.current(0)
        }
      } catch (error) {
        console.error('Ошибка в onResults:', error)
      }
    })

    handsRef.current = hands

    // Функция для обработки кадров из видео (с ограничением частоты)
    const detectHands = async (timestamp) => {
      if (!mounted || !videoRef.current || !handsRef.current) return
      
      const video = videoRef.current
      
      // Ограничиваем частоту обработки до ~15 FPS (66ms между кадрами)
      const timeSinceLastDetection = timestamp - lastDetectionTimeRef.current
      
      if (timeSinceLastDetection >= 66) {
        // Проверяем что видео готово (>=, а не ===)
        if (video.readyState >= video.HAVE_FUTURE_DATA) {
          try {
            await handsRef.current.send({ image: video })
            lastDetectionTimeRef.current = timestamp
          } catch (error) {
            console.error('Ошибка обработки кадра:', error)
          }
        }
      }
      
      // Запрашиваем следующий кадр
      if (mounted) {
        animationFrameRef.current = requestAnimationFrame(detectHands)
      }
    }

    // Ждем пока видео загрузится и начинаем обработку
    const startDetection = () => {
      const video = videoRef.current
      if (!video) {
        console.warn('Видео элемент не найден')
        return
      }

      const onVideoReady = () => {
        if (!mounted) return
        
        console.log('Видео готово, readyState:', video.readyState)
        
        // Начинаем обработку сразу, не ждем
        if (mounted) {
          console.log('Запуск определения рук...')
          isReadyRef.current = true
          setIsReady(true)
          // Начинаем обработку кадров
          detectHands(0)
        }
      }

      // Проверяем разные состояния готовности видео
      if (video.readyState >= video.HAVE_FUTURE_DATA) {
        console.log('Видео уже готово')
        onVideoReady()
      } else {
        console.log('Ждем загрузки видео...')
        // Слушаем несколько событий для надежности
        const handleReady = () => {
          console.log('Видео загружено (событие)')
          onVideoReady()
        }
        
        video.addEventListener('loadeddata', handleReady, { once: true })
        video.addEventListener('canplay', handleReady, { once: true })
        
        // Таймаут на случай если события не сработают
        setTimeout(() => {
          if (mounted && !isReadyRef.current) {
            console.log('Таймаут: принудительный запуск')
            onVideoReady()
          }
        }, 2000)
      }
    }

    startDetection()

    return () => {
      mounted = false
      isReadyRef.current = false
      setIsReady(false)
      
      // Останавливаем анимацию
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      
      // Закрываем Hands
      if (handsRef.current) {
        try {
          handsRef.current.close()
        } catch (error) {
          console.warn('Ошибка закрытия hands:', error)
        }
        handsRef.current = null
      }
    }
  }, [videoRef]) // Убрали onDetection из зависимостей - используем ref

  return isReady
}

// Подсчет поднятых пальцев (упрощенная и более точная версия)
function countFingers(handLandmarks) {
  let totalFingers = 0

  for (const landmarks of handLandmarks) {
    let fingers = 0

    // Определяем какая рука (левая или правая)
    const thumbCmc = landmarks[1]
    const pinkyMcp = landmarks[17]
    
    // Если большой палец слева от мизинца - правая рука
    const isRightHand = thumbCmc.x < pinkyMcp.x

    // БОЛЬШОЙ ПАЛЕЦ - проверяем горизонтальное положение
    const thumbTip = landmarks[4]
    const thumbIp = landmarks[3]
    const thumbMcp = landmarks[2]
    
    // Для правой руки - кончик левее среднего сустава, для левой - правее
    if (isRightHand) {
      // Правая рука - большой палец вытянут влево
      if (thumbTip.x < thumbIp.x && thumbIp.x < thumbMcp.x) {
        fingers++
      }
    } else {
      // Левая рука - большой палец вытянут вправо
      if (thumbTip.x > thumbIp.x && thumbIp.x > thumbMcp.x) {
        fingers++
      }
    }

    // ОСТАЛЬНЫЕ 4 ПАЛЬЦА - проверяем вертикальное положение
    const fingerIndices = [
      { tip: 8, pip: 6, mcp: 5 },   // Указательный
      { tip: 12, pip: 10, mcp: 9 },  // Средний
      { tip: 16, pip: 14, mcp: 13 }, // Безымянный
      { tip: 20, pip: 18, mcp: 17 }  // Мизинец
    ]

    for (const finger of fingerIndices) {
      const tip = landmarks[finger.tip]
      const pip = landmarks[finger.pip]
      const mcp = landmarks[finger.mcp]
      
      // Палец поднят если кончик выше среднего сустава
      // (более мягкое условие, чем раньше)
      if (tip.y < pip.y) {
        fingers++
      }
    }

    totalFingers += fingers
  }

  return totalFingers
}


