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

// Объекты и их силуэты
const SHADOW_PAIRS = [
  { object: '🍎', shadow: '●', name: 'яблоко' },
  { object: '⭐', shadow: '★', name: 'звезда' },
  { object: '❤️', shadow: '♥', name: 'сердце' },
  { object: '🌙', shadow: '☽', name: 'луна' },
  { object: '☀️', shadow: '☼', name: 'солнце' },
  { object: '🏠', shadow: '⌂', name: 'дом' },
  { object: '🌲', shadow: '♣', name: 'дерево' },
  { object: '🌸', shadow: '✿', name: 'цветок' },
];

const ShadowMatchingGameScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [currentPair, setCurrentPair] = useState(null);
  const [shadowOptions, setShadowOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [startTime] = useState(Date.now());
  const [attempts, setAttempts] = useState(0);
  const [wrongAnswerModal, setWrongAnswerModal] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [gameResult, setGameResult] = useState(null);

  const totalRounds = Math.min(SHADOW_PAIRS.length, user?.age <= 3 ? 4 : user?.age <= 5 ? 6 : 8);

  useEffect(() => {
    generateNewRound();
  }, [round]);

  const generateNewRound = () => {
    const pair = SHADOW_PAIRS[round];
    setCurrentPair(pair);

    // Создаем варианты ответа
    const wrongOptions = SHADOW_PAIRS
      .filter(p => p !== pair)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    
    const options = [pair, ...wrongOptions].sort(() => Math.random() - 0.5);
    setShadowOptions(options);
  };

  const handleShadowSelect = (selectedPair) => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (selectedPair === currentPair) {
      // Правильно! Всегда 10 баллов за правильный ответ
      const newScore = score + 10;
      setScore(newScore);
      
      if (round + 1 < totalRounds) {
        setTimeout(() => {
          setRound(round + 1);
        }, 500);
      } else {
        handleGameComplete(newScore, newAttempts);
      }
    } else {
      // Неправильно - просто увеличиваем попытки
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
        gameType: 'shadow-matching',
        level: 1,
        score: finalScore,
        maxScore: totalRounds * 10,
        timeSpent: timeSpent,
        attempts: finalAttempts,
        completed: true,
        details: {
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

  if (!currentPair) return null;

  const containerStyle = isWebLargeScreen() 
    ? [styles.container, { maxWidth: getMaxContainerWidth(), alignSelf: 'center', width: '100%' }]
    : styles.container;

  return (
    <View style={containerStyle}>
      <View style={styles.header}>
        <View style={styles.progressInfo}>
          <Text style={styles.roundText}>Раунд {round + 1} из {totalRounds}</Text>
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

      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>Найди тень для этого предмета:</Text>
      </View>

      <View style={styles.objectContainer}>
        <Text style={[styles.objectEmoji, { fontSize: isWebLargeScreen() ? 100 * getDesktopScale() : 100 }]}>
          {currentPair.object}
        </Text>
      </View>

      <View style={styles.shadowsContainer}>
        <Text style={styles.shadowsTitle}>Выбери правильную тень:</Text>
        <View style={styles.shadowsGrid}>
          {shadowOptions.map((pair, index) => {
            const shadowSize = isWebLargeScreen() ? 100 * getDesktopScale() : 100;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.shadowOption, { width: shadowSize, height: shadowSize }]}
                onPress={() => handleShadowSelect(pair)}
              >
                <Text style={[styles.shadowText, { fontSize: isWebLargeScreen() ? 60 * getDesktopScale() : 60 }]}>
                  {pair.shadow}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

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
            <Text style={styles.modalSubtitle}>Это не та тень</Text>
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
    backgroundColor: '#6366F1',
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
  objectContainer: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  objectEmoji: {
    fontSize: 100,
  },
  shadowsContainer: {
    flex: 1,
  },
  shadowsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  shadowsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  shadowOption: {
    width: 100,
    height: 100,
    backgroundColor: '#1F2937',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  shadowText: {
    fontSize: 60,
    color: '#4B5563',
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

export default ShadowMatchingGameScreen;

