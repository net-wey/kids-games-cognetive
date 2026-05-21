import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '../../components/AppIcon';
import { AuthContext } from '../../context/AuthContext';
import api from '../../config/api';
import { getMaxContainerWidth, isWebLargeScreen, getDesktopScale } from '../../utils/responsive';

const { width } = Dimensions.get('window');

// Цвета блоков
const COLORS = ['🟥', '🟦', '🟩', '🟨', '🟪', '🟧'];

const BuildingGameScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [pattern, setPattern] = useState([]);
  const [userBlocks, setUserBlocks] = useState([]);
  const [showPattern, setShowPattern] = useState(true);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [startTime] = useState(Date.now());
  const [attempts, setAttempts] = useState(0);
  const [showTimer, setShowTimer] = useState(3);
  const [wrongAnswerModal, setWrongAnswerModal] = useState(false);
  const [incompleteModal, setIncompleteModal] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [gameResult, setGameResult] = useState(null);

  // Сложность зависит от возраста
  const patternSize = user?.age <= 3 ? 3 : user?.age <= 5 ? 4 : 6;
  const totalRounds = user?.age <= 3 ? 4 : user?.age <= 5 ? 6 : 8;

  useEffect(() => {
    generateNewPattern();
  }, [round]);

  useEffect(() => {
    if (showPattern && showTimer > 0) {
      const timer = setTimeout(() => {
        setShowTimer(showTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showPattern && showTimer === 0) {
      setShowPattern(false);
      setShowTimer(3);
    }
  }, [showTimer, showPattern]);

  const generateNewPattern = () => {
    const newPattern = [];
    for (let i = 0; i < patternSize; i++) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      newPattern.push(color);
    }
    setPattern(newPattern);
    setUserBlocks([]);
    setShowPattern(true);
    setShowTimer(patternSize + 1); // Время показа зависит от сложности
  };

  const handleBlockAdd = (color) => {
    if (userBlocks.length < patternSize) {
      setUserBlocks([...userBlocks, color]);
    }
  };

  const handleBlockRemove = () => {
    if (userBlocks.length > 0) {
      setUserBlocks(userBlocks.slice(0, -1));
    }
  };

  const handleCheck = () => {
    if (userBlocks.length !== patternSize) {
      setIncompleteModal(true);
      return;
    }

    setAttempts(attempts + 1);

    const isCorrect = pattern.every((block, index) => block === userBlocks[index]);

    if (isCorrect) {
      // Правильно! Всегда 10 баллов за правильный ответ
      const newScore = score + 10;
      const newAttempts = attempts + 1;
      setScore(newScore);
      
      setTimeout(() => {
        if (round + 1 < totalRounds) {
          setRound(round + 1);
        } else {
          handleGameComplete(newScore, newAttempts);
        }
      }, 500);
    } else {
      // Неправильно - просто увеличиваем попытки
      setWrongAnswerModal(true);
    }
  };

  const handleShowPattern = () => {
    setWrongAnswerModal(false);
    setShowPattern(true);
    setShowTimer(patternSize + 1);
    setUserBlocks([]);
  };

  const handleRetry = () => {
    setWrongAnswerModal(false);
  };

  const handleGameComplete = async (finalScore = score, finalAttempts = attempts) => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    // Правильный расчет точности
    const correctAnswers = finalScore / 10; // каждый правильный ответ = 10 очков
    const accuracy = finalAttempts > 0 ? Math.floor((correctAnswers / finalAttempts) * 100) : 0;

    try {
      await api.post('/games/result', {
        gameType: 'building',
        level: 1,
        score: finalScore,
        maxScore: totalRounds * 10,
        timeSpent: timeSpent,
        attempts: finalAttempts,
        completed: true,
        details: {
          patternSize: patternSize,
          correctAnswers: correctAnswers,
          totalAttempts: finalAttempts,
          accuracy: accuracy
        }
      });

      // Определяем результат
      const scorePercentage = (finalScore / (totalRounds * 10)) * 100;
      const isExcellent = scorePercentage >= 80;
      const isGood = scorePercentage >= 60;

      setGameResult({
        score: finalScore,
        maxScore: totalRounds * 10,
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
    setRound(0);
    setScore(0);
    setAttempts(0);
    setResultModalVisible(false);
  };

  const handleExit = () => {
    setResultModalVisible(false);
    navigation.goBack();
  };

  const containerStyle = isWebLargeScreen() 
    ? [styles.container, { maxWidth: getMaxContainerWidth(), alignSelf: 'center', width: '100%' }]
    : styles.container;
  
  // Для десктопной версии используем ограниченную ширину и масштаб
  const containerWidth = isWebLargeScreen() ? getMaxContainerWidth() : width;
  const desktopScale = getDesktopScale();
  // Рассчитываем размер блока так, чтобы в ряд помещалось 4 блока
  // Учитываем padding контейнера (20 с каждой стороны = 40) и margin блоков (5 с каждой стороны = 10 на блок)
  const blocksPerRow = 4;
  const blockMargin = 5; // margin каждого блока
  const containerPadding = 40; // padding контейнера слева и справа
  const totalMargins = blockMargin * 2 * blocksPerRow; // margin слева и справа для каждого блока
  const baseBlockSize = (containerWidth - containerPadding - totalMargins) / blocksPerRow;
  const blockSize = isWebLargeScreen() ? baseBlockSize * desktopScale : baseBlockSize;

  return (
    <View style={containerStyle}>
      <View style={styles.header}>
        <View style={styles.progressInfo}>
          <Text style={styles.roundText}>Уровень {round + 1} из {totalRounds}</Text>
          <View style={styles.scoreBox}>
            <Ionicons name="star" size={20} color="#F59E0B" />
            <Text style={styles.scoreText}>{score}</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((round + 1) / totalRounds) * 100}%` }
            ]} 
          />
        </View>
      </View>

      {showPattern ? (
        <View style={styles.patternSection}>
          <Text style={styles.patternTitle}>
            Запомни образец! ({showTimer}с)
          </Text>
          <View style={styles.blocksRow}>
            {pattern.map((block, index) => {
              const textSize = isWebLargeScreen() ? 40 * desktopScale : 40;
              return (
                <View key={index} style={[styles.block, { width: blockSize, height: blockSize }]}>
                  <Text style={[styles.blockText, { fontSize: textSize }]}>{block}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : (
        <>
          <View style={styles.buildSection}>
            <Text style={styles.buildTitle}>Собери по памяти:</Text>
            <View style={styles.blocksRow}>
              {userBlocks.map((block, index) => {
                const textSize = isWebLargeScreen() ? 40 * desktopScale : 40;
                return (
                  <View key={index} style={[styles.block, { width: blockSize, height: blockSize }]}>
                    <Text style={[styles.blockText, { fontSize: textSize }]}>{block}</Text>
                  </View>
                );
              })}
              {Array(patternSize - userBlocks.length).fill(0).map((_, index) => (
                <View key={`empty-${index}`} style={[styles.block, styles.emptyBlock, { width: blockSize, height: blockSize }]}>
                  <Ionicons name="add" size={30} color="#ccc" />
                </View>
              ))}
            </View>
          </View>

          <View style={styles.colorsSection}>
            <Text style={styles.colorsTitle}>Выбери цвет блока:</Text>
            <View style={styles.colorsGrid}>
              {COLORS.map((color, index) => {
                const buttonSize = isWebLargeScreen() ? 60 * desktopScale : 60;
                const textSize = isWebLargeScreen() ? 35 * desktopScale : 35;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.colorButton, { width: buttonSize, height: buttonSize }]}
                    onPress={() => handleBlockAdd(color)}
                    disabled={userBlocks.length >= patternSize}
                  >
                    <Text style={[styles.colorText, { fontSize: textSize }]}>{color}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.removeButton]}
              onPress={handleBlockRemove}
              disabled={userBlocks.length === 0}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Убрать</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.checkButton]}
              onPress={handleCheck}
              disabled={userBlocks.length !== patternSize}
            >
              <Ionicons name="checkmark" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Проверить</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.showPatternButton}
            onPress={() => {
              setShowPattern(true);
              setUserBlocks([]);
            }}
          >
            <Ionicons name="eye-outline" size={20} color="#6366F1" />
            <Text style={styles.showPatternText}>Посмотреть образец</Text>
          </TouchableOpacity>
        </>
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={incompleteModal}
        onRequestClose={() => setIncompleteModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Ionicons name="alert-circle" size={60} color="#F59E0B" />
            <Text style={styles.modalTitle}>Подожди</Text>
            <Text style={styles.modalSubtitle}>Нужно добавить все блоки</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.tryAgainButton]}
              onPress={() => setIncompleteModal(false)}
            >
              <Text style={styles.modalButtonText}>Хорошо</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={wrongAnswerModal}
        onRequestClose={handleRetry}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Ionicons name="close-circle" size={60} color="#F59E0B" />
            <Text style={styles.modalTitle}>Попробуй еще раз!</Text>
            <Text style={styles.modalSubtitle}>Проверь порядок блоков</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.showPatternButton2]}
                onPress={handleShowPattern}
              >
                <Ionicons name="eye-outline" size={24} color="#fff" />
                <Text style={styles.modalButtonText}>Посмотреть</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.continueButton]}
                onPress={handleRetry}
              >
                <Text style={styles.modalButtonText}>Продолжить</Text>
              </TouchableOpacity>
            </View>
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
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  roundText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginLeft: 5,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
  },
  patternSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 30,
  },
  buildSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  buildTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  blocksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  block: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyBlock: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  blockText: {
    fontSize: 40,
  },
  colorsSection: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  colorsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  colorButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
  },
  colorText: {
    fontSize: 35,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  removeButton: {
    backgroundColor: '#EF4444',
  },
  checkButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  showPatternButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  showPatternText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
  showPatternButton2: {
    backgroundColor: '#6366F1',
  },
  continueButton: {
    backgroundColor: '#10B981',
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

export default BuildingGameScreen;

