import { useEffect, useState } from 'react'

/**
 * Хук для определения типа устройства
 * @returns {Object} { isMobile, isDesktop, deviceInfo }
 */
export const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isDesktop: true,
    userAgent: '',
    screenWidth: 0,
    isTouchDevice: false
  })

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const screenWidth = window.innerWidth
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      // Проверяем мобильные устройства
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i
      const isMobileByUA = mobileRegex.test(userAgent)
      
      // Комбинированная проверка
      const isMobile = isMobileByUA || (isTouchDevice && screenWidth <= 1024)
      
      console.log('📱 Определение устройства:', {
        userAgent: userAgent.substring(0, 50) + '...',
        screenWidth,
        isTouchDevice,
        isMobileByUA,
        result: isMobile ? '📱 MOBILE' : '🖥️ DESKTOP'
      })
      
      setDeviceInfo({
        isMobile,
        isDesktop: !isMobile,
        userAgent,
        screenWidth,
        isTouchDevice
      })
    }

    detectDevice()
    
    // Переопределяем при изменении размера окна
    window.addEventListener('resize', detectDevice)
    
    return () => {
      window.removeEventListener('resize', detectDevice)
    }
  }, [])

  return deviceInfo
}

