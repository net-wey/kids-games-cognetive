import { useEffect, useRef, useState } from 'react'
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection'
import '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'

export const useHandDetectionTF = (videoRef, onDetection) => {
  const [isReady, setIsReady] = useState(false)
  const detectorRef = useRef(null)
  const animationFrameRef = useRef(null)
  const lastDetectionTimeRef = useRef(0)
  const onDetectionRef = useRef(onDetection)

  // Обновляем ref при изменении callback
  useEffect(() => {
    onDetectionRef.current = onDetection
  }, [onDetection])

  useEffect(() => {
    console.log('🔄 useHandDetectionTF useEffect запущен')
    console.log('📹 videoRef:', videoRef)
    console.log('📹 videoRef.current:', videoRef?.current)
    
    if (!videoRef?.current) {
      console.warn('⚠️ videoRef или videoRef.current отсутствует!')
      return
    }

    let mounted = true

    const initDetector = async () => {
      try {
        console.log('🚀 Инициализация TensorFlow.js HandPose...')
        console.log('📹 videoRef:', videoRef?.current)
        
        // Создаем детектор рук с MediaPipe runtime (более стабильный)
        const model = handPoseDetection.SupportedModels.MediaPipeHands
        const detectorConfig = {
          runtime: 'mediapipe',
          solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
          modelType: 'full',
          maxNumHands: 2,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        }
        
        console.log('⚙️ Конфигурация детектора:', detectorConfig)
        console.log('⏳ Загрузка модели MediaPipe...')
        const detector = await handPoseDetection.createDetector(model, detectorConfig)
        console.log('✅ Модель загружена!')
        detectorRef.current = detector
        
        console.log('✅ TensorFlow.js HandPose инициализирован успешно!')
        console.log('🔍 Детектор:', detector)
        
        // Ждем готовности видео
        await waitForVideo()
        
        if (mounted) {
          console.log('✅ Устанавливаем isReady = true')
          setIsReady(true)
          startDetection()
        }
      } catch (error) {
        console.error('❌ Ошибка инициализации TensorFlow HandPose:', error)
        console.error('Детали ошибки:', error.stack)
      }
    }

    const waitForVideo = () => {
      return new Promise((resolve) => {
        const video = videoRef.current
        if (!video) {
          console.warn('Видео элемент не найден')
          resolve()
          return
        }

        if (video.readyState >= video.HAVE_FUTURE_DATA) {
          console.log('Видео готово для определения')
          resolve()
        } else {
          const handleReady = () => {
            console.log('Видео загружено')
            resolve()
          }
          
          video.addEventListener('loadeddata', handleReady, { once: true })
          video.addEventListener('canplay', handleReady, { once: true })
          
          setTimeout(() => {
            if (mounted) {
              console.log('Таймаут ожидания видео, продолжаем')
              resolve()
            }
          }, 2000)
        }
      })
    }

    const startDetection = () => {
      console.log('🎬 Запуск детекции рук...')
      
      const detectHands = async () => {
        if (!mounted || !videoRef.current || !detectorRef.current) {
          console.warn('⚠️ Проверка не прошла:', {
            mounted,
            hasVideo: !!videoRef.current,
            hasDetector: !!detectorRef.current
          })
          return
        }
        
        const video = videoRef.current
        const now = performance.now()
        
        // Ограничиваем частоту обработки до ~10 FPS (100ms между кадрами)
        if (now - lastDetectionTimeRef.current >= 100) {
          if (video.readyState >= video.HAVE_FUTURE_DATA) {
            try {
              // Проверяем видео перед передачей
              console.log('📹 Передаем видео в детектор:', {
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                readyState: video.readyState,
                currentTime: video.currentTime
              })
              
              // Определяем руки
              const hands = await detectorRef.current.estimateHands(video)
              
              // Логируем только если нашли руки (чтобы не засорять консоль)
              if (hands && hands.length > 0) {
                console.log('👋 Найдено рук:', hands.length)
                console.log('🔍 ПОЛНЫЙ ОБЪЕКТ РУКИ:', JSON.stringify(hands[0], null, 2))
                console.log('🔍 Ключи объекта руки:', Object.keys(hands[0]))
                const fingerCount = countFingers(hands)
                onDetectionRef.current(fingerCount)
              } else {
                // Редкий лог когда руки не найдены
                if (now - lastDetectionTimeRef.current > 2000) {
                  console.log('❌ Руки не обнаружены')
                }
                onDetectionRef.current(0)
              }
              
              lastDetectionTimeRef.current = now
            } catch (error) {
              console.error('❌ Ошибка определения рук:', error)
            }
          }
        }
        
        // Запрашиваем следующий кадр
        if (mounted) {
          animationFrameRef.current = requestAnimationFrame(detectHands)
        }
      }
      
      detectHands()
    }

    initDetector()

    return () => {
      mounted = false
      setIsReady(false)
      
      // Останавливаем анимацию
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      
      // Очищаем детектор
      if (detectorRef.current) {
        detectorRef.current.dispose()
        detectorRef.current = null
      }
    }
  }, [videoRef])

  return isReady
}

// Подсчет поднятых пальцев на основе keypoints TensorFlow.js
function countFingers(hands) {
  let totalFingers = 0

  for (const hand of hands) {
    const keypoints = hand.keypoints
    
    console.log('🔍 Проверка руки, keypoints:', keypoints?.length)
    
    if (!keypoints || keypoints.length < 21) {
      console.warn('⚠️ Недостаточно keypoints:', keypoints?.length)
      continue
    }

    let fingers = 0
    
    // Логируем ПОЛНУЮ структуру первого keypoint для диагностики
    console.log('🔍 ПОЛНАЯ структура keypoint[0]:', JSON.stringify(keypoints[0], null, 2))
    console.log('🔍 Тип keypoints[0]:', typeof keypoints[0])
    console.log('🔍 Ключи keypoints[0]:', Object.keys(keypoints[0]))
    console.log('🔍 keypoints[0].x =', keypoints[0].x)
    console.log('🔍 keypoints[0].y =', keypoints[0].y)
    
    // Определяем левая или правая рука
    const thumbCMC = keypoints[1]
    const pinkyMCP = keypoints[17]
    
    const isRightHand = thumbCMC.x < pinkyMCP.x
    console.log('👉 Определена', isRightHand ? 'правая' : 'левая', 'рука')

    // БОЛЬШОЙ ПАЛЕЦ (индексы: 1-4)
    const thumbTip = keypoints[4]
    const thumbIP = keypoints[3]
    const thumbMCP = keypoints[2]
    
    console.log('👍 Большой палец:', {
      tip: thumbTip,
      ip: thumbIP,
      mcp: thumbMCP
    })
    
    // Упрощенная проверка большого пальца - просто по расстоянию
    const thumbDistance = Math.abs(thumbTip.x - thumbMCP.x)
    console.log('📏 Расстояние большого пальца:', thumbDistance)
    
    if (thumbDistance > 0.05) {  // Снизили порог
      fingers++
      console.log('✅ Большой палец засчитан')
    } else {
      console.log('❌ Большой палец НЕ засчитан')
    }

    // ОСТАЛЬНЫЕ 4 ПАЛЬЦА - проверяем вертикальное положение
    const fingerIndices = [
      { tip: 8, pip: 6, name: 'Указательный' },
      { tip: 12, pip: 10, name: 'Средний' },
      { tip: 16, pip: 14, name: 'Безымянный' },
      { tip: 20, pip: 18, name: 'Мизинец' }
    ]

    for (const finger of fingerIndices) {
      const tip = keypoints[finger.tip]
      const pip = keypoints[finger.pip]
      
      console.log(`${finger.name}:`, {
        tipY: tip.y,
        pipY: pip.y,
        разница: pip.y - tip.y
      })
      
      // Палец поднят если кончик выше среднего сустава
      if (tip.y < pip.y) {
        fingers++
        console.log(`✅ ${finger.name} засчитан`)
      } else {
        console.log(`❌ ${finger.name} НЕ засчитан (tip.y=${tip.y} >= pip.y=${pip.y})`)
      }
    }

    console.log('✋ Итого пальцев на этой руке:', fingers)
    totalFingers += fingers
  }

  console.log('📊 ВСЕГО ПАЛЬЦЕВ:', totalFingers)
  return totalFingers
}

