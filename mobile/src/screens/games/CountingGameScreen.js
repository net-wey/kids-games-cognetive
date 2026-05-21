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

// Разные предметы для счета
const COUNT_ITEMS = ['🍎', '🍌', '⚽', '🚗', '⭐', '🐶', '🌸', '🎈', '🍪', '🎁'];

const CountingGameScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const maxNumber = user?.age <= 3 ? 5 : user?.age <= 5 ? 10 : 15;
  
  const [currentNumber, setCurrentNumber] = useState(0);
  const [currentItem, setCurrentItem] = useState('');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [startTime] = useState(Date.now());
  const [attempts, setAttempts] = useState(0);
  const [wrongAnswerModal, setWrongAnswerModal] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [gameResult, setGameResult] = useState(null);

  const totalRounds = user?.age <= 3 ? 5 : user?.age <= 5 ? 8 : 10;

  useEffect(() => {
    generateNewRound();
  }, [round]);

  const generateNewRound = () => {
    const number = Math.floor(Math.random() * maxNumber) + 1;
    const item = COUNT_ITEMS[Math.floor(Math.random() * COUNT_ITEMS.length)];
    setCurrentNumber(number);
    setCurrentItem(item);
  };

  const handleNumberSelect = (selectedNumber) => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (selectedNumber === currentNumber) {
      // Правильно! Всегда 10 баллов за правильный ответ
      const newScore = score + 10;
      setScore(newScore);
      
      setTimeout(() => {
        if (round + 1 < totalRounds) {
          setRound(round + 1);
        } else {
          handleGameComplete(newScore, newAttempts);
        }
      }, 300);
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
        gameType: 'counting',
        level: 1,
        score: finalScore,
        maxScore: totalRounds * 10,
        timeSpent: timeSpent,
        attempts: finalAttempts,
        completed: true,
        details: {
          maxNumber: maxNumber,
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

  const renderItems = () => {
    const items = [];
    const itemFontSize = isWebLargeScreen() ? 40 * getDesktopScale() : 40;
    for (let i = 0; i < currentNumber; i++) {
      items.push(
        <Text key={i} style={[styles.countItem, { fontSize: itemFontSize }]}>{currentItem}</Text>
      );
    }
    return items;
  };

  const renderNumberButtons = () => {
    const buttons = [];
    const optionsCount = Math.min(4, maxNumber);
    const desktopScale = getDesktopScale();
    const buttonSize = isWebLargeScreen() ? 70 * desktopScale : 70;
    
    // Генерируем варианты ответа
    let options = [currentNumber];
    while (options.length < optionsCount) {
      const randomNum = Math.floor(Math.random() * maxNumber) + 1;
      if (!options.includes(randomNum)) {
        options.push(randomNum);
      }
    }
    
    // Перемешиваем
    options = options.sort(() => Math.random() - 0.5);

    return options.map((num) => (
      <TouchableOpacity
        key={num}
        style={[styles.numberButton, { width: buttonSize, height: buttonSize }]}
        onPress={() => handleNumberSelect(num)}
      >
        <Text style={styles.numberButtonText}>{num}</Text>
      </TouchableOpacity>
    ));
  };

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

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>Сколько предметов?</Text>
      </View>

      <View style={styles.itemsContainer}>
        {renderItems()}
      </View>

      <View style={styles.answersContainer}>
        <Text style={styles.answersTitle}>Выбери число:</Text>
        <View style={styles.numbersGrid}>
          {renderNumberButtons()}
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
            <Text style={styles.modalSubtitle}>Посчитай внимательнее</Text>
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
    backgroundColor: '#3B82F6',
  },
  questionContainer: {
    backgroundColor: '#DBEAFE',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E40AF',
    textAlign: 'center',
  },
  itemsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  countItem: {
    fontSize: 40,
    margin: 8,
  },
  answersContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
  },
  answersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  numbersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  numberButton: {
    width: 70,
    height: 70,
    backgroundColor: '#3B82F6',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  numberButtonText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
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

export default CountingGameScreen;

