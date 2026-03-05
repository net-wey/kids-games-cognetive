import React from 'react'
import ARCamera from './ARCamera'
import ShowNumberGame from './games/ShowNumberGame'
import ShowColorGame from './games/ShowColorGame'
import FindPigGame from './games/FindPigGame'
import CountFruitsGame from './games/CountFruitsGame'
import './GameContainer.css'

const GameContainer = ({ gameId, onComplete, onBack }) => {
  const renderGame = () => {
    const gameProps = {
      onComplete: (score) => onComplete(gameId, score),
      onBack
    }

    switch (gameId) {
      case 'showNumber':
        return <ShowNumberGame {...gameProps} />
      case 'showColor':
        return <ShowColorGame {...gameProps} />
      case 'findPig':
        return <FindPigGame {...gameProps} />
      case 'countFruits':
        return <CountFruitsGame {...gameProps} />
      default:
        return null
    }
  }

  // Для игры "Найди свинку" и "Посчитай фрукты" не показываем переключатель камеры
  const showCameraSwitch = gameId !== 'findPig' && gameId !== 'countFruits'

  return (
    <div className="game-container">
      <ARCamera showCameraSwitch={showCameraSwitch} gameId={gameId}>
        {renderGame()}
      </ARCamera>
    </div>
  )
}

export default GameContainer

