import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  PanResponder
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import api from '../../config/api';
import { getMaxContainerWidth, isWebLargeScreen, getDesktopScale } from '../../utils/responsive';

const { width, height } = Dimensions.get('window');

// Задания для сортировки
const SORTING_TASKS = [
  {
    title: 'Сортируй по размеру',
    categories: ['Большие', 'Маленькие'],
    items: [
      { emoji: '🐘', category: 0, name: 'слон' },
      { emoji: '🐜', category: 1, name: 'муравей' },
      { emoji: '🐋', category: 0, name: 'кит' },
      { emoji: '🐝', category: 1, name: 'пчела' },
    ]
  },
  {
    title: 'Фрукты и овощи',
    categories: ['Фрукты', 'Овощи'],
    items: [
      { emoji: '🍎', category: 0, name: 'яблоко' },
      { emoji: '🥕', category: 1, name: 'морковь' },
      { emoji: '🍌', category: 0, name: 'банан' },
      { emoji: '🥦', category: 1, name: 'брокколи' },
    ]
  },
  {
    title: 'Где живут?',
    categories: ['В лесу', 'На ферме'],
    items: [
      { emoji: '🦊', category: 0, name: 'лиса' },
      { emoji: '🐄', category: 1, name: 'корова' },
      { emoji: '🐻', category: 0, name: 'медведь' },
      { emoji: '🐷', category: 1, name: 'свинья' },
    ]
  },
  {
    title: 'Транспорт',
    categories: ['Едет', 'Летает'],
    items: [
      { emoji: '🚗', category: 0, name: 'машина' },
      { emoji: '✈️', category: 1, name: 'самолет' },
      { emoji: '🚂', category: 0, name: 'поезд' },
      { emoji: '🚁', category: 1, name: 'вертолет' },
    ]
  },
  {
    title: 'Цвета',
    categories: ['Красные', 'Синие'],
    items: [
      { emoji: '🔴', category: 0, name: 'красный' },
      { emoji: '🔵', category: 1, name: 'синий' },
      { emoji: '🍎', category: 0, name: 'красное яблоко' },
      { emoji: '🦋', category: 1, name: 'синяя бабочка' },
    ]
  },
];

const SortingGameScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [currentTask, setCurrentTask] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());
  const [basket1Items, setBasket1Items] = useState([]);
  const [basket2Items, setBasket2Items] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [wrongAnswerModal, setWrongAnswerModal] = useState(false);
  const [levelCompleteModal, setLevelCompleteModal] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const basket1Ref = useRef(null);
  const basket2Ref = useRef(null);

  const totalTasks = Math.min(SORTING_TASKS.length, user?.age <= 3 ? 3 : user?.age <= 5 ? 4 : 5);

  useEffect(() => {
    resetTask();
  }, [currentTask]);

  const resetTask = () => {
    const shuffled = [...SORTING_TASKS[currentTask].items].sort(() => Math.random() - 0.5);
    setAvailableItems(shuffled);
    setBasket1Items([]);
    setBasket2Items([]);
  };

  const handleItemDrop = useCallback((item, basketIndex) => {
    // Используем setState с функцией для получения актуального состояния
    setAvailableItems(currentAvailable => {
      // Проверяем, что элемент еще существует (предотвращаем дублирование)
      const itemExists = currentAvailable.find(i => i.name === item.name);
      
      if (!itemExists) {
        console.log('⚠️ Элемент уже обработан, пропускаем');
        return currentAvailable; // Возвращаем без изменений
      }

    const isCorrect = item.category === basketIndex;

    if (isCorrect) {
        console.log(`✅ ПРАВИЛЬНО! "${item.name}" → корзина ${basketIndex + 1}`);
        
        // Увеличиваем баллы
        setScore(prev => prev + 10);
        setAttempts(prev => prev + 1);
      
        // Добавляем в корзину
      if (basketIndex === 0) {
          setBasket1Items(prev => [...prev, item]);
      } else {
          setBasket2Items(prev => [...prev, item]);
      }

        // Убираем предмет из доступных
        const newAvailableItems = currentAvailable.filter(i => i.name !== item.name);
        console.log(`📦 Осталось предметов: ${newAvailableItems.length}`);

      // Проверяем, все ли предметы разложены
      if (newAvailableItems.length === 0) {
        setTimeout(() => {
          if (currentTask + 1 < totalTasks) {
            setLevelCompleteModal(true);
          } else {
            handleGameComplete();
          }
        }, 500);
      }

        return newAvailableItems;
    } else {
        console.log(`❌ Неправильно! "${item.name}" не подходит для корзины ${basketIndex + 1}`);
        setAttempts(prev => prev + 1);
      setWrongAnswerModal(true);
        return currentAvailable; // Возвращаем без изменений
    }
    });
  }, [currentTask, totalTasks]);

  const handleNextLevel = () => {
    setLevelCompleteModal(false);
    setCurrentTask(currentTask + 1);
  };

  const handleGameComplete = async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const maxScore = totalTasks * 40; // 4 предмета * 10 очков за задание
    const correctAnswers = score / 10;
    const accuracy = attempts > 0 ? Math.floor((correctAnswers / attempts) * 100) : 100;

    try {
      await api.post('/games/result', {
        gameType: 'sorting',
        level: 1,
        score: score,
        maxScore: maxScore,
        timeSpent: timeSpent,
        attempts: attempts,
        completed: true,
        details: {
          tasksCompleted: totalTasks,
          correctAnswers: correctAnswers,
          totalAttempts: attempts,
          accuracy: accuracy
        }
      });

      // Определяем результат
      const scorePercentage = (score / maxScore) * 100;
      const isExcellent = scorePercentage >= 80;
      const isGood = scorePercentage >= 60;

      setGameResult({
        score,
        maxScore: maxScore,
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
    setCurrentTask(0);
    setScore(0);
    setAttempts(0);
    setResultModalVisible(false);
  };

  const handleExit = () => {
    setResultModalVisible(false);
    navigation.goBack();
  };

  const task = SORTING_TASKS[currentTask];

  const containerStyle = isWebLargeScreen() 
    ? [styles.container, { maxWidth: getMaxContainerWidth(), alignSelf: 'center', width: '100%' }]
    : styles.container;
  
  // Для десктопной версии используем масштабирование элементов
  const desktopScale = getDesktopScale();
  const ITEM_SIZE = isWebLargeScreen() ? 80 * desktopScale : 80;

  return (
    <View style={containerStyle}>
      <View style={styles.header}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <Text style={styles.progress}>Задание {currentTask + 1} из {totalTasks}</Text>
        <View style={styles.scoreBox}>
          <Ionicons name="star" size={20} color="#F59E0B" />
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>

      <View style={styles.basketsContainer}>
        <View style={styles.basket} ref={basket1Ref}>
          <Text style={styles.basketTitle}>{task.categories[0]}</Text>
          <View style={styles.basketContent}>
            {basket1Items.map((item, index) => (
              <Text key={index} style={styles.basketItem}>{item.emoji}</Text>
            ))}
          </View>
        </View>

        <View style={styles.basket} ref={basket2Ref}>
          <Text style={styles.basketTitle}>{task.categories[1]}</Text>
          <View style={styles.basketContent}>
            {basket2Items.map((item, index) => (
              <Text key={index} style={styles.basketItem}>{item.emoji}</Text>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.itemsContainer}>
        <Text style={styles.itemsTitle}>Перетащи предметы в корзины:</Text>
        <View style={styles.itemsGrid}>
          {availableItems.map((item) => (
            <DraggableItem
              key={`${currentTask}-${item.name}`}
              item={item}
              onDrop={(basketIndex) => {
                if (basketIndex !== null) {
                  handleItemDrop(item, basketIndex);
                }
              }}
              basket1Ref={basket1Ref}
              basket2Ref={basket2Ref}
            />
          ))}
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
            <Text style={styles.modalSubtitle}>Это не подходит сюда</Text>
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
        visible={levelCompleteModal}
        onRequestClose={handleNextLevel}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle" size={60} color="#10B981" />
            <Text style={styles.modalTitle}>Отлично! 🎉</Text>
            <Text style={styles.modalSubtitle}>Переходим к следующему заданию</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.nextLevelButton]}
              onPress={handleNextLevel}
            >
              <Text style={styles.modalButtonText}>Далее</Text>
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
                  <Ionicons name="checkmark-circle" size={24} color="#6366F1" />
                  <Text style={styles.resultLabel}>Точность:</Text>
                  <Text style={styles.resultValue}>{gameResult.accuracy}%</Text>
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

// Компонент для перетаскивания
const DraggableItem = ({ item, onDrop, basket1Ref, basket2Ref, itemSize = 80 }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [isDragging, setIsDragging] = useState(false);
  const itemRef = useRef(null);
  const isProcessing = useRef(false); // Флаг для предотвращения множественных вызовов

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: () => {
        setIsDragging(true);
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),

      onPanResponderRelease: (evt, gesture) => {
        // Предотвращаем множественные вызовы
        if (isProcessing.current) {
          console.log('⏳ Уже обрабатывается...');
          return;
        }

        setIsDragging(false);
        pan.flattenOffset();

        // Проверяем в какую корзину попал элемент
        if (basket1Ref.current && basket2Ref.current && itemRef.current) {
          // Получаем позицию элемента
          itemRef.current.measureInWindow((itemX, itemY, itemW, itemH) => {
            // Центр перетаскиваемого элемента
            const centerX = itemX + itemW / 2;
            const centerY = itemY + itemH / 2;

            basket1Ref.current.measureInWindow((x1, y1, w1, h1) => {
              basket2Ref.current.measureInWindow((x2, y2, w2, h2) => {
                let targetBasket = null;

                // Расширяем зону попадания на 60 пикселей - вся корзина и вокруг
                const padding = 60;

                // Проверяем попадание в первую корзину
                if (
                  centerX >= x1 - padding &&
                  centerX <= x1 + w1 + padding &&
                  centerY >= y1 - padding &&
                  centerY <= y1 + h1 + padding
                ) {
                  targetBasket = 0;
                  console.log('✅ Попал в корзину 1!');
                }
                // Проверяем попадание во вторую корзину
                else if (
                  centerX >= x2 - padding &&
                  centerX <= x2 + w2 + padding &&
                  centerY >= y2 - padding &&
                  centerY <= y2 + h2 + padding
                ) {
                  targetBasket = 1;
                  console.log('✅ Попал в корзину 2!');
                } else {
                  // Альтернативная проверка: какая корзина ближе к центру элемента
                  const dist1 = Math.sqrt(
                    Math.pow(centerX - (x1 + w1/2), 2) + 
                    Math.pow(centerY - (y1 + h1/2), 2)
                  );
                  const dist2 = Math.sqrt(
                    Math.pow(centerX - (x2 + w2/2), 2) + 
                    Math.pow(centerY - (y2 + h2/2), 2)
                  );
                  
                  // Если элемент достаточно близко к одной из корзин (в пределах 200 пикселей)
                  if (dist1 < 200 || dist2 < 200) {
                    targetBasket = dist1 < dist2 ? 0 : 1;
                    console.log(`🎯 Попал через расстояние в корзину ${targetBasket + 1}! Расстояния: ${dist1.toFixed(0)}, ${dist2.toFixed(0)}`);
                  } else {
                    console.log('❌ Слишком далеко от корзин');
                    console.log('Расстояния:', dist1.toFixed(0), dist2.toFixed(0));
                  }
                }

                if (targetBasket !== null) {
                  // Попал в корзину - сразу вызываем onDrop БЕЗ анимации
                  isProcessing.current = true;
                  console.log('🚀 Немедленная обработка дропа');
                  
                  // Сбрасываем позицию без анимации
                  pan.setValue({ x: 0, y: 0 });
                  
                  // Вызываем onDrop сразу
                  onDrop(targetBasket);
                  
                  // Сбрасываем флаг через короткое время
                  setTimeout(() => {
                    isProcessing.current = false;
                  }, 100);
                } else {
                  // Не попал - показываем анимацию возврата
                  console.log('↩️ Возврат на место');
                  Animated.spring(pan, {
                    toValue: { x: 0, y: 0 },
                    useNativeDriver: false,
                    friction: 5,
                  }).start();
                }
              });
            });
          });
        } else {
          console.log('⚠️ Не удалось получить ссылки на корзины');
          // Если не удалось определить корзины, просто возвращаем на место
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      ref={itemRef}
      style={[
        styles.itemWrapper,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
          zIndex: isDragging ? 1000 : 1,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.item, { width: itemSize, height: itemSize }, isDragging && styles.itemDragging]}>
        <Text style={styles.itemEmoji}>{item.emoji}</Text>
      </View>
      {!isDragging && (
        <View style={styles.dragHint}>
          <Ionicons name="move" size={16} color="#666" />
          <Text style={styles.dragHintText}>Перетащи</Text>
        </View>
      )}
    </Animated.View>
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
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  progress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
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
  basketsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  basket: {
    width: '48%',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 15,
    minHeight: 180,
    borderWidth: 4,
    borderColor: '#10B981',
    borderStyle: 'dashed',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  basketTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 10,
  },
  basketContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  basketItem: {
    fontSize: 35,
    margin: 5,
  },
  itemsContainer: {
    flex: 1,
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  itemWrapper: {
    margin: 10,
  },
  item: {
    backgroundColor: '#fff',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemEmoji: {
    fontSize: 45,
  },
  itemDragging: {
    backgroundColor: '#FEF3C7',
    borderWidth: 3,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  dragHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dragHintText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
    fontWeight: '600',
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
  nextLevelButton: {
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

export default SortingGameScreen;

