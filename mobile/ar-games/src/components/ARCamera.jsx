import React, { useRef, useEffect, useState } from 'react'
import { VideoProvider } from '../contexts/VideoContext'
import './ARCamera.css'

const ARCamera = ({ children, showCameraSwitch = true, gameId = null }) => {
  const videoRef = useRef(null)
  const streamRef = useRef(null)  // Храним ссылку на stream
  const [cameraActive, setCameraActive] = useState(false)
  const [error, setError] = useState(null)
  const [permissionGranted, setPermissionGranted] = useState(false)
  // Для игры "Посчитай фрукты" всегда используем фронтальную камеру
  const [facingMode, setFacingMode] = useState(
    gameId === 'countFruits' ? 'user' : 'environment'
  ) // 'environment' = задняя, 'user' = фронтальная
  
  // Определяем мобильное устройство
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(
    navigator.userAgent.toLowerCase()
  ) || ('ontouchstart' in window && window.innerWidth <= 1024)

  useEffect(() => {
    let mounted = true
    
    const initCamera = async () => {
      // Проверяем, не запущена ли уже камера
      if (streamRef.current) {
        console.log('Камера уже запущена, пропускаем повторную инициализацию')
        return
      }
      
      // Проверка на HTTPS (обязательно для работы камеры)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        setError('Для работы камеры требуется HTTPS. Пожалуйста, откройте сайт через безопасное соединение.')
        return
      }
      
      // Проверка наличия API камеры
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Ваш браузер не поддерживает доступ к камере. Пожалуйста, используйте современный браузер (Chrome, Safari, Firefox).')
        return
      }
      
      try {
        // Запрашиваем доступ к камере
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode, // Используем выбранную камеру
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        })

        if (!mounted) {
          // Если компонент уже размонтирован, останавливаем поток
          stream.getTracks().forEach(track => track.stop())
          return
        }

        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          
          // Используем promise для избежания ошибок
          try {
            await videoRef.current.play()
            if (mounted) {
              setCameraActive(true)
              setPermissionGranted(true)
              setError(null)
            }
          } catch (playError) {
            // Игнорируем ошибку если она из-за прерывания
            if (playError.name !== 'AbortError') {
              console.error('Ошибка воспроизведения видео:', playError)
            }
          }
        }
      } catch (err) {
        if (mounted) {
          console.error('Ошибка доступа к камере:', err)
          setError('Не удалось получить доступ к камере. Пожалуйста, разрешите доступ в настройках.')
          setCameraActive(false)
        }
      }
    }
    
    initCamera()
    
    return () => {
      mounted = false
      // Останавливаем камеру при размонтировании
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      setCameraActive(false)
    }
  }, [facingMode])

  // Для игры "Посчитай фрукты" всегда используем фронтальную камеру
  useEffect(() => {
    if (gameId === 'countFruits' && facingMode !== 'user') {
      console.log('📷 Принудительно устанавливаю фронтальную камеру для игры "Посчитай фрукты"')
      setFacingMode('user')
    }
  }, [gameId, facingMode])

  const startCamera = async (newFacingMode = facingMode) => {
    // Эта функция теперь используется только для повторного запуска
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraActive(true)
        setPermissionGranted(true)
        setError(null)
      }
    } catch (err) {
      console.error('Ошибка доступа к камере:', err)
      setError('Не удалось получить доступ к камере. Пожалуйста, разрешите доступ в настройках.')
      setCameraActive(false)
    }
  }

  const switchCamera = async () => {
    // Для игры "Посчитай фрукты" запрещаем переключение камеры
    if (gameId === 'countFruits') {
      console.log('⚠️ Переключение камеры запрещено для игры "Посчитай фрукты"')
      return
    }
    console.log('🔄 Переключаю камеру...')
    stopCamera()
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(newFacingMode)
    // useEffect автоматически перезапустит камеру с новым facingMode
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  const handleRetry = () => {
    stopCamera()
    setError(null)
    setTimeout(() => startCamera(), 100)  // Небольшая задержка перед повторным запуском
  }

  return (
    <div className="ar-camera">
      {/* Видео с камеры */}
      <video
        ref={videoRef}
        className="camera-video"
        playsInline
        muted
        autoPlay
      />

      {/* Ошибка доступа к камере */}
      {error && (
        <div className="camera-error">
          <div className="error-content">
            <span className="error-icon">📷</span>
            <p className="error-message">{error}</p>
            <button className="retry-button" onClick={handleRetry}>
              Попробовать снова
            </button>
          </div>
        </div>
      )}

      {/* Загрузка */}
      {!cameraActive && !error && (
        <div className="camera-loading">
          <div className="loading-spinner">
            <span className="spinner-icon">📷</span>
            <p>Загрузка камеры...</p>
          </div>
        </div>
      )}

      {/* AR контент поверх видео */}
      {cameraActive && (
        <div className="ar-overlay">
          <VideoProvider videoRef={videoRef}>
            {children}
          </VideoProvider>
        </div>
      )}

      {/* Декоративная рамка */}
      {cameraActive && (
        <div className="ar-frame">
          <div className="corner corner-tl"></div>
          <div className="corner corner-tr"></div>
          <div className="corner corner-bl"></div>
          <div className="corner corner-br"></div>
        </div>
      )}

      {/* Кнопка переключения камеры (только для мобильных) */}
      {cameraActive && showCameraSwitch && isMobile && (
        <button 
          className="camera-switch-btn" 
          onClick={() => {
            console.log('🔄 Нажата кнопка переключения камеры')
            switchCamera()
          }}
        >
          <span className="camera-icon">🔄</span>
          <span className="camera-label">
            {facingMode === 'environment' ? 'Фронт.' : 'Задн.'}
          </span>
        </button>
      )}
    </div>
  )
}

export default ARCamera

