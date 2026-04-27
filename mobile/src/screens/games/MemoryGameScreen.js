import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import api from '../../config/api';
import { getMaxContainerWidth, isWebLargeScreen, getDesktopScale } from '../../utils/responsive';

const { width } = Dimensions.get('window');

// Символы для карточек (эмодзи для простоты)
const SYMBOLS = ['🍎', '🍌', '🍇', '🍊', '🍓', '🍒', '🥝', '🍑', '🍍', '🥥', '🍉', '🍈', '🌟', '🎈', '🎨', '⚽'];

const MemoryGameScreen = ({ navigation, route }) => {
  const { user } = useContext(AuthContext);
  const level = route.params?.level || 1;
  
  // Определяем размер сетки на основе возраста
  // 2-3 года: 3x2 (3 пары = 6 карточек)
  // 4-5 лет: 4x3 (6 пар = 12 карточек)
  // 6 лет: 4x4 (8 пар = 16 карточек)
  const getGridConfig = (age) => {
    if (age <= 3) {
      return { pairs: 3, columns: 3, rows: 2 }; // 3x2 = 6 карточек
    } else if (age <= 5) {
      return { pairs: 6, columns: 4, rows: 3 }; // 4x3 = 12 карточек
    } else {
      return { pairs: 8, columns: 4, rows: 4 }; // 4x4 = 16 карточек
    }
  };
  
  const gridConfig = getGridConfig(user?.age || 4);
  const pairsCount = gridConfig.pairs;
  // Для десктопной версии используем ограниченную ширину и масштаб
  const containerWidth = isWebLargeScreen() ? getMaxContainerWidth() : width;
  const desktopScale = getDesktopScale();
  const baseCardSize = (containerWidth - 40 - (gridConfig.columns + 1) * 10) / gridConfig.columns;
  const CARD_SIZE = isWebLargeScreen() ? baseCardSize * desktopScale : baseCardSize;
  
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [gameResult, setGameResult] = useState(null);

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (flippedIndices.length === 2) {
      checkForMatch();
    }
  }, [flippedIndices]);

  useEffect(() => {
    if (matchedPairs.length === pairsCount) {
      handleGameComplete();
    }
  }, [matchedPairs]);

  const initializeGame = () => {
    const selectedSymbols = SYMBOLS.slice(0, pairsCount);
    const cardPairs = [...selectedSymbols, ...selectedSymbols];
    const shuffled = cardPairs.sort(() => Math.random() - 0.5);
    
    setCards(shuffled.map((symbol, index) => ({
      id: index,
      symbol,
      isFlipped: false,
      isMatched: false
    })));
    
    setFlippedIndices([]);
    setMatchedPairs([]);
    setMoves(0);
    setStartTime(Date.now());
  };

  const handleCardPress = (index) => {
    if (isProcessing || flippedIndices.length >= 2) return;
    if (cards[index].isMatched || flippedIndices.includes(index)) return;

    setFlippedIndices([...flippedIndices, index]);
    setMoves(moves + 1);
  };

  const checkForMatch = () => {
    setIsProcessing(true);
    const [first, second] = flippedIndices;

    if (cards[first].symbol === cards[second].symbol) {
      // Совпадение!
      setTimeout(() => {
        setMatchedPairs([...matchedPairs, cards[first].symbol]);
        setFlippedIndices([]);
        setIsProcessing(false);
      }, 500);
    } else {
      // Не совпадают
      setTimeout(() => {
        setFlippedIndices([]);
        setIsProcessing(false);
      }, 1000);
    }
  };

  const handleGameComplete = async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    // Простая система: прошел игру = получил баллы
    const score = pairsCount * 10; // Каждая пара = 10 баллов
    const maxScore = pairsCount * 10;
    
    // Эффективность: минимальное количество ходов = количество пар * 2
    const minMoves = pairsCount * 2;
    const efficiency = Math.floor((minMoves / moves) * 100);

    try {
      await api.post('/games/result', {
        gameType: 'memory',
        level: 1,
        score: score,
        maxScore: maxScore,
        timeSpent: timeSpent,
        attempts: moves,
        completed: true,
        details: {
          pairs: pairsCount,
          moves: moves,
          efficiency: efficiency
        }
      });

      // Определяем результат по эффективности
      const isExcellent = efficiency >= 80;
      const isGood = efficiency >= 60;
      
      setGameResult({
        score,
        maxScore,
        timeSpent,
        moves,
        efficiency,
        isExcellent,
        isGood
      });
      setResultModalVisible(true);
    } catch (error) {
      console.error('Ошибка сохранения результата:', error);
    }
  };

  const handlePlayAgain = () => {
    setResultModalVisible(false);
    initializeGame();
  };

  const handleExit = () => {
    setResultModalVisible(false);
    navigation.goBack();
  };

  const renderCard = (card, index) => {
    const isFlipped = flippedIndices.includes(index) || matchedPairs.includes(card.symbol);

    return (
      <TouchableOpacity
        key={card.id}
        style={[
          styles.card,
          { width: CARD_SIZE, height: CARD_SIZE },
          isFlipped && styles.cardFlipped,
          matchedPairs.includes(card.symbol) && styles.cardMatched
        ]}
        onPress={() => handleCardPress(index)}
        disabled={isFlipped}
      >
        {isFlipped ? (
          <Text style={styles.cardSymbol}>{card.symbol}</Text>
        ) : (
          <Ionicons name="help" size={40} color="#fff" />
        )}
      </TouchableOpacity>
    );
  };

  const containerStyle = isWebLargeScreen() 
    ? [styles.container, { maxWidth: getMaxContainerWidth(), alignSelf: 'center', width: '100%' }]
    : styles.container;

  return (
    <View style={containerStyle}>
      <View style={styles.header}>
        <View style={styles.stat}>
          <Ionicons name="footsteps" size={20} color="#666" />
          <Text style={styles.statText}>Ходов: {moves}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.statText}>Пары: {matchedPairs.length}/{pairsCount}</Text>
        </View>
      </View>

      <View style={styles.gameBoard}>
        {cards.map((card, index) => renderCard(card, index))}
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={initializeGame}>
        <Ionicons name="refresh" size={24} color="#fff" />
        <Text style={styles.resetButtonText}>Начать заново</Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={resultModalVisible}
        onRequestClose={handleExit}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.resultHeader}>
              {gameResult?.isExcellent ? (
                <>
                  <Ionicons name="trophy" size={80} color="#FFD700" />
                  <Text style={styles.resultTitle}>🎉 Отлично!</Text>
                  <Text style={styles.resultSubtitle}>Ты молодец!</Text>
                </>
              ) : gameResult?.isGood ? (
                <>
                  <Ionicons name="happy" size={80} color="#10B981" />
                  <Text style={styles.resultTitle}>👍 Хорошо!</Text>
                  <Text style={styles.resultSubtitle}>Так держать!</Text>
                </>
              ) : (
                <>
                  <Ionicons name="heart" size={80} color="#F59E0B" />
                  <Text style={styles.resultTitle}>Неплохо!</Text>
                  <Text style={styles.resultSubtitle}>Попробуй еще раз!</Text>
                </>
              )}
            </View>

            {gameResult && (
              <View style={styles.resultsBox}>
                <View style={styles.resultRow}>
                  <Ionicons name="star" size={24} color="#FFD700" />
                  <Text style={styles.resultLabel}>Очки:</Text>
                  <Text style={styles.resultValue}>{gameResult.score}/{gameResult.maxScore}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Ionicons name="footsteps" size={24} color="#6366F1" />
                  <Text style={styles.resultLabel}>Ходов:</Text>
                  <Text style={styles.resultValue}>{gameResult.moves}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Ionicons name="checkmark-circle" size={24} color="#8B5CF6" />
                  <Text style={styles.resultLabel}>Эффективность:</Text>
                  <Text style={styles.resultValue}>{gameResult.efficiency}%</Text>
                </View>
                <View style={styles.resultRow}>
                  <Ionicons name="time" size={24} color="#10B981" />
                  <Text style={styles.resultLabel}>Время:</Text>
                  <Text style={styles.resultValue}>{gameResult.timeSpent}с</Text>
                </View>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.playAgainButton]}
                onPress={handlePlayAgain}
              >
                <Ionicons name="refresh" size={24} color="#fff" />
                <Text style={styles.modalButtonText}>Заново</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.exitButton]}
                onPress={handleExit}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
                <Text style={styles.modalButtonText}>Назад</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  gameBoard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: width - 30,
    alignSelf: 'center',
  },
  card: {
    margin: 5,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardFlipped: {
    backgroundColor: '#fff',
  },
  cardMatched: {
    backgroundColor: '#10B981',
  },
  cardSymbol: {
    fontSize: 40,
  },
  resetButton: {
    flexDirection: 'row',
    backgroundColor: '#F59E0B',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    textAlign: 'center',
  },
  resultSubtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  resultsBox: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  resultLabel: {
    fontSize: 18,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  resultValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  playAgainButton: {
    backgroundColor: '#10B981',
  },
  exitButton: {
    backgroundColor: '#6366F1',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default MemoryGameScreen;

