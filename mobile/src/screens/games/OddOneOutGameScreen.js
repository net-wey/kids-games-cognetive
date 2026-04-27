import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import api from '../../config/api';
import { getMaxContainerWidth, isWebLargeScreen, getDesktopScale } from '../../utils/responsive';

const { width } = Dimensions.get('window');

// Наборы заданий
const LEVELS = [
  // По цвету
  { items: ['🔴', '🔴', '🔴', '🔵'], odd: 3, category: 'цвету' },
  // По форме
  { items: ['⬜', '⬜', '⬜', '🔵'], odd: 3, category: 'форме' },
  // Фрукты vs овощ
  { items: ['🍎', '🍊', '🍌', '🥕'], odd: 3, category: 'категории' },
  // Животные
  { items: ['🐶', '🐱', '🐭', '🚗'], odd: 3, category: 'категории' },
  // Транспорт
  { items: ['🚗', '🚕', '🚙', '🍎'], odd: 3, category: 'категории' },
  // Летают vs не летают
  { items: ['🦅', '🦋', '🦆', '🐟'], odd: 3, category: 'признаку' },
  // Числа
  { items: ['1️⃣', '2️⃣', '3️⃣', '🔤'], odd: 3, category: 'типу' },
  // Еда
  { items: ['🍕', '🍔', '🌭', '⚽'], odd: 3, category: 'категории' },
  // Эмоции
  { items: ['😊', '😃', '😄', '😢'], odd: 3, category: 'эмоции' },
  // Природа
  { items: ['🌳', '🌲', '🌴', '🏠'], odd: 3, category: 'категории' },
];

const OddOneOutGameScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const [selectedItems, setSelectedItems] = useState([]);
  const [shuffledLevel, setShuffledLevel] = useState(null);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [wrongAnswerModal, setWrongAnswerModal] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [hintModalVisible, setHintModalVisible] = useState(false);

  const totalLevels = Math.min(LEVELS.length, user?.age <= 3 ? 5 : user?.age <= 5 ? 7 : 10);

  // Перемешиваем элементы при смене уровня
  useEffect(() => {
    if (currentLevel < LEVELS.length) {
      const level = LEVELS[currentLevel];
      const oddItem = level.items[level.odd];
      
      // Создаем копию массива и перемешиваем
      const shuffled = [...level.items].sort(() => Math.random() - 0.5);
      const newOddIndex = shuffled.indexOf(oddItem);
      
      setShuffledLevel({
        ...level,
        items: shuffled,
        odd: newOddIndex
      });
      setHintUsed(false); // Сбрасываем подсказку для нового уровня
    }
  }, [currentLevel]);

  if (!shuffledLevel) return null;

  const level = shuffledLevel;

  const containerStyle = isWebLargeScreen() 
    ? [styles.container, { maxWidth: getMaxContainerWidth(), alignSelf: 'center', width: '100%' }]
    : styles.container;
  
  // Для десктопной версии используем ограниченную ширину и масштаб
  const containerWidth = isWebLargeScreen() ? getMaxContainerWidth() : width;
  const desktopScale = getDesktopScale();
  const baseItemSize = (containerWidth - 80) / 2;
  const itemSize = isWebLargeScreen() ? baseItemSize * desktopScale : baseItemSize;

  const handleItemPress = (index) => {
    if (selectedItems.includes(index)) return;

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (index === level.odd) {
      // Правильно! Всегда 10 баллов за правильный ответ
      const newScore = score + 10;
      setScore(newScore);
      setSelectedItems([...selectedItems, index]);

      setTimeout(() => {
        if (currentLevel + 1 < totalLevels) {
          setCurrentLevel(currentLevel + 1);
          setSelectedItems([]);
        } else {
          // Передаем актуальный счет и попытки в функцию завершения
          handleGameComplete(newScore, newAttempts);
        }
      }, 500);
    } else {
      // Неправильно
      setWrongAnswerModal(true);
    }
  };

  const handleGameComplete = async (finalScore = score, finalAttempts = attempts) => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    // Правильный расчет точности
    const correctAnswers = finalScore / 10; // каждый правильный ответ = 10 очков
    const accuracy = finalAttempts > 0 ? Math.floor((correctAnswers / finalAttempts) * 100) : 0;

    try {
      await api.post('/games/result', {
        gameType: 'odd-one-out',
        level: 1,
        score: finalScore,
        maxScore: totalLevels * 10,
        timeSpent: timeSpent,
        attempts: finalAttempts,
        completed: true,
        details: {
          levelsCompleted: totalLevels,
          correctAnswers: correctAnswers,
          totalAttempts: finalAttempts,
          accuracy: accuracy
        }
      });

      // Определяем результат
      const scorePercentage = (finalScore / (totalLevels * 10)) * 100;
      const isExcellent = scorePercentage >= 80;
      const isGood = scorePercentage >= 60;

      setGameResult({
        score: finalScore,
        maxScore: totalLevels * 10,
        timeSpent,
        accuracy,
        isExcellent,
        isGood
      });
      setResultModalVisible(true);
    } catch (error) {
      console.error('Ошибка сохранения результата:', error);
    }
  };

  const resetGame = () => {
    setCurrentLevel(0);
    setScore(0);
    setAttempts(0);
    setSelectedItems([]);
    setResultModalVisible(false);
  };

  const handleExit = () => {
    setResultModalVisible(false);
    navigation.goBack();
  };

  const handleHintPress = () => {
    if (hintUsed) {
      // Подсказка уже использована для этого уровня
      return;
    }
    setHintModalVisible(true);
  };

  const useHint = () => {
    setHintUsed(true);
    setHintModalVisible(false);
    // Показываем визуальную подсказку - добавим анимацию мигания правильного элемента
  };

  return (
    <View style={containerStyle}>
      <View style={styles.header}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentLevel + 1) / totalLevels) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.levelText}>
          Уровень {currentLevel + 1} из {totalLevels}
        </Text>
      </View>

      <View style={styles.scoreContainer}>
        <View style={styles.scoreBox}>
          <Ionicons name="star" size={24} color="#F59E0B" />
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>

      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          Найди лишний предмет по {level.category}
        </Text>
      </View>

      <View style={styles.itemsGrid}>
          {level.items.map((item, index) => {
            const textSize = isWebLargeScreen() ? 60 * desktopScale : 60;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.item,
                  { width: itemSize, height: itemSize },
                  selectedItems.includes(index) && styles.itemSelected,
                  hintUsed && index === level.odd && styles.itemHinted
                ]}
                onPress={() => handleItemPress(index)}
                disabled={selectedItems.includes(index)}
              >
                <Text style={[styles.itemText, { fontSize: textSize }]}>{item}</Text>
                {hintUsed && index === level.odd && (
                  <View style={styles.hintIndicator}>
                    <Ionicons name="star" size={20} color="#F59E0B" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
      </View>

      <TouchableOpacity 
        style={[styles.hintButton, hintUsed && styles.hintButtonDisabled]}
        onPress={handleHintPress}
        disabled={hintUsed}
      >
        <Ionicons 
          name={hintUsed ? "checkmark-circle" : "help-circle-outline"} 
          size={24} 
          color={hintUsed ? "#9CA3AF" : "#6366F1"} 
        />
        <Text style={[styles.hintButtonText, hintUsed && styles.hintButtonTextDisabled]}>
          {hintUsed ? "Подсказка использована" : "Подсказка"}
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={hintModalVisible}
        onRequestClose={() => setHintModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Ionicons name="bulb-outline" size={60} color="#F59E0B" />
            <Text style={styles.modalTitle}>Использовать подсказку?</Text>
            <Text style={styles.modalSubtitle}>
              Мы покажем тебе правильный ответ с помощью звездочки ⭐
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelHintButton]}
                onPress={() => setHintModalVisible(false)}
              >
                <Text style={styles.cancelHintButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.useHintButton]}
                onPress={useHint}
              >
                <Ionicons name="checkmark" size={24} color="#fff" />
                <Text style={styles.modalButtonText}>Использовать</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={wrongAnswerModal}
        onRequestClose={() => setWrongAnswerModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Ionicons name="close-circle" size={60} color="#F59E0B" />
            <Text style={styles.modalTitle}>Попробуй еще раз!</Text>
            <Text style={styles.modalSubtitle}>Подумай, какой предмет отличается от остальных</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.tryAgainButton]}
              onPress={() => setWrongAnswerModal(false)}
            >
              <Text style={styles.modalButtonText}>Хорошо</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
                  <Ionicons name="time" size={24} color="#10B981" />
                  <Text style={styles.resultLabel}>Время:</Text>
                  <Text style={styles.resultValue}>{gameResult.timeSpent}с</Text>
                </View>
                <View style={styles.resultRow}>
                  <Ionicons name="checkmark-circle" size={24} color="#6366F1" />
                  <Text style={styles.resultLabel}>Точность:</Text>
                  <Text style={styles.resultValue}>{gameResult.accuracy}%</Text>
                </View>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.playAgainButton]}
                onPress={resetGame}
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
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginLeft: 8,
  },
  instructionContainer: {
    backgroundColor: '#EEF2FF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4338CA',
    textAlign: 'center',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  item: {
    backgroundColor: '#fff',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 3,
    borderColor: '#fff',
  },
  itemSelected: {
    borderColor: '#10B981',
    backgroundColor: '#D1FAE5',
  },
  itemHinted: {
    borderColor: '#F59E0B',
    borderWidth: 4,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  itemText: {
    fontSize: 60,
  },
  hintIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#FFF',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  hintButtonDisabled: {
    borderColor: '#9CA3AF',
    backgroundColor: '#F3F4F6',
  },
  hintButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  hintButtonTextDisabled: {
    color: '#9CA3AF',
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
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
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
  tryAgainButton: {
    backgroundColor: '#6366F1',
  },
  cancelHintButton: {
    backgroundColor: '#E5E7EB',
  },
  cancelHintButtonText: {
    color: '#6B7280',
    fontWeight: 'bold',
    fontSize: 16,
  },
  useHintButton: {
    backgroundColor: '#F59E0B',
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

export default OddOneOutGameScreen;

