import React, { createContext, useContext } from 'react'

// Создаем контекст для videoRef
const VideoContext = createContext(null)

// Хук для использования videoRef в дочерних компонентах
export const useVideoRef = () => {
  const context = useContext(VideoContext)
  if (!context) {
    console.warn('useVideoRef должен использоваться внутри VideoProvider')
  }
  return context
}

// Provider для передачи videoRef через контекст
export const VideoProvider = ({ children, videoRef }) => {
  return (
    <VideoContext.Provider value={videoRef}>
      {children}
    </VideoContext.Provider>
  )
}

export default VideoContext

