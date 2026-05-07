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

// Сценарии с вопросами о последствиях
const SCENARIOS = [
  {
    situation: 'Мяч лежит на вершине горки 🎱⛰️',
    question: 'Что произойдет?',
    options: [
      { text: 'Мяч покатится вниз', correct: true, emoji: '⬇️' },
      { text: 'Мяч улетит вверх', correct: false, emoji: '⬆️' },
      { text: 'Мяч останется на месте', correct: false, emoji: '⏸️' }
    ]
  },
  {
    situation: 'Льёт дождь ☔',
    question: 'Что нужно взять?',
    options: [
      { text: 'Зонтик', correct: true, emoji: '☂️' },
      { text: 'Солнцезащитные очки', correct: false, emoji: '🕶️' },
      { text: 'Купальник', correct: false, emoji: '🩱' }
    ]
  },
  {
    situation: 'Растение без воды 🌱',
    question: 'Что случится?',
    options: [
      { text: 'Завянет', correct: true, emoji: '🥀' },
      { text: 'Вырастет больше', correct: false, emoji: '🌳' },
      { text: 'Ничего не изменится', correct: false, emoji: '🌱' }
    ]
  },
  {
    situation: 'Лед на солнце 🧊☀️',
    question: 'Что произойдет?',
    options: [
      { text: 'Растает', correct: true, emoji: '💧' },
      { text: 'Станет больше', correct: false, emoji: '❄️' },
      { text: 'Загорится', correct: false, emoji: '🔥' }
    ]
  },
  {
    situation: 'Воздушный шарик 🎈',
    question: 'Что будет, если отпустить?',
    options: [
      { text: 'Улетит вверх', correct: true, emoji: '⬆️' },
      { text: 'Упадет вниз', correct: false, emoji: '⬇️' },
      { text: 'Останется на месте', correct: false, emoji: '⏸️' }
    ]
  },
  {
    situation: 'Ребенок хочет спать 😴',
    question: 'Что нужно сделать?',
    options: [
      { text: 'Лечь в кровать', correct: true, emoji: '🛏️' },
      { text: 'Поиграть в футбол', correct: false, emoji: '⚽' },
      { text: 'Съесть мороженое', correct: false, emoji: '🍦' }
    ]
  },
  {
    situation: 'Чайник на плите 🫖🔥',
    question: 'Что случится с водой?',
    options: [
      { text: 'Закипит', correct: true, emoji: '♨️' },
      { text: 'Замерзнет', correct: false, emoji: '🧊' },
      { text: 'Исчезнет', correct: false, emoji: '💨' }
    ]
  },
  {
    situation: 'Темно в комнате 🌙',
    question: 'Что нужно сделать?',
    options: [
      { text: 'Включить свет', correct: true, emoji: '💡' },
      { text: 'Открыть холодильник', correct: false, emoji: '🧊' },
      { text: 'Закрыть окно', correct: false, emoji: '🪟' }
    ]
  },
];

const PredictingGameScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [currentScenario, setCurrentScenario] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());
  const [attempts, setAttempts] = useState(0);
  const [wrongAnswerModal, setWrongAnswerModal] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [gameResult, setGameResult] = useState(null);

  const totalScenarios = Math.min(SCENARIOS.length, user?.age <= 3 ? 4 : user?.age <= 5 ? 6 : 8);

  const handleOptionSelect = (option) => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (option.correct) {
      // Правильно! Всегда 10 баллов за правильный ответ
      const newScore = score + 10;
      setScore(newScore);
      
      setTimeout(() => {
        if (currentScenario + 1 < totalScenarios) {
          setCurrentScenario(currentScenario + 1);
        } else {
          handleGameComplete(newScore, newAttempts);
        }
      }, 500);
    } else {
      // Неправильно - просто увеличиваем попытки
      setWrongAnswerModal(true);
    }
  };

  const handleGameComplete = async (finalScore = score, finalAttempts = attempts) => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    // Правильный расчет точности: правильные ответы / всего попыток
    const correctAnswers = finalScore / 10; // каждый правильный ответ = 10 очков
    const accuracy = finalAttempts > 0 ? Math.floor((correctAnswers / finalAttempts) * 100) : 100;

    try {
      await api.post('/games/result', {
        gameType: 'predicting',
        level: 1,
        score: finalScore,
        maxScore: totalScenarios * 10,
        timeSpent: timeSpent,
        attempts: finalAttempts,
        completed: true,
        details: {
          accuracy: accuracy,
          correctAnswers: correctAnswers,
          totalQuestions: totalScenarios
        }
      });

      // Определяем результат
      const scorePercentage = (finalScore / (totalScenarios * 10)) * 100;
      const isExcellent = scorePercentage >= 80;
      const isGood = scorePercentage >= 60;

      setGameResult({
        score: finalScore,
        maxScore: totalScenarios * 10,
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
    setCurrentScenario(0);
    setScore(0);
    setAttempts(0);
    setResultModalVisible(false);
  };

  const handleExit = () => {
    setResultModalVisible(false);
    navigation.goBack();
  };

  const scenario = SCENARIOS[currentScenario];

  const containerStyle = isWebLargeScreen() 
    ? [styles.container, { maxWidth: getMaxContainerWidth(), alignSelf: 'center', width: '100%' }]
    : styles.container;

  return (
    <View style={containerStyle}>
      <View style={styles.header}>
        <View style={styles.progressInfo}>
          <Text style={styles.roundText}>Ситуация {currentScenario + 1} из {totalScenarios}</Text>
          <View style={styles.scoreBox}>
            <Ionicons name="star" size={20} color="#F59E0B" />
            <Text style={styles.scoreText}>{score}</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentScenario + 1) / totalScenarios) * 100}%` }
            ]} 
          />
        </View>
      </View>

      <View style={styles.scenarioContainer}>
        <Text style={styles.situationText}>{scenario.situation}</Text>
        <Text style={styles.questionText}>{scenario.question}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {scenario.options.map((option, index) => {
          const desktopScale = getDesktopScale();
          const emojiSize = isWebLargeScreen() ? 35 * desktopScale : 35;
          const textSize = isWebLargeScreen() ? 18 * desktopScale : 18;
          return (
            <TouchableOpacity
              key={index}
              style={styles.optionButton}
              onPress={() => handleOptionSelect(option)}
            >
              <Text style={[styles.optionEmoji, { fontSize: emojiSize }]}>{option.emoji}</Text>
              <Text style={[styles.optionText, { fontSize: textSize }]}>{option.text}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.hintBox}>
        <Ionicons name="bulb-outline" size={24} color="#F59E0B" />
        <Text style={styles.hintText}>
          Подумай, что обычно происходит в такой ситуации
        </Text>
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
            <Text style={styles.modalTitle}>Подумай еще!</Text>
            <Text style={styles.modalSubtitle}>Попробуй выбрать другой ответ</Text>
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
    backgroundColor: '#EC4899',
  },
  scenarioContainer: {
    backgroundColor: '#FDF2F8',
    padding: 25,
    borderRadius: 15,
    marginBottom: 25,
    alignItems: 'center',
  },
  situationText: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 15,
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#BE185D',
    textAlign: 'center',
  },
  optionsContainer: {
    flex: 1,
  },
  optionButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionEmoji: {
    fontSize: 35,
    marginRight: 15,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  hintBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  hintText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
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

export default PredictingGameScreen;

