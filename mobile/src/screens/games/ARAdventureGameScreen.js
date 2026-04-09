import React, { useState, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import api from '../../config/api';
import { getARServerUrl } from '../../utils/network';

/**
 * AR Adventure Game Screen
 * 
 * Экран для отображения AR игр через WebView
 * 
 * Интегрированы 4 AR игры:
 * 1. Покажи число - распознавание жестов рук (1-10 пальцев)
 * 2. Покажи цвет - поиск цветов в реальном мире через камеру
 * 3. Найди свинку - игра на внимание и реакцию
 * 4. Посчитай фрукты - AR объекты над головой, подсчет
 * 
 * ЗАПУСК AR СЕРВЕРА:
 * 
 * cd mobile/ar-games
 * npm install
 * npm run dev
 * 
 * AR приложение будет доступно на https://localhost:3001
 * 
 * КОММУНИКАЦИЯ:
 * - AR приложение → React Native: window.ReactNativeWebView.postMessage()
 * - React Native → AR приложение: webViewRef.current.postMessage()
 */

const ARAdventureGameScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [isARReady, setIsARReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentGame, setCurrentGame] = useState(null);
  const webViewRef = useRef(null);

  // URL AR приложения (автоматически определяется в зависимости от платформы)
  const AR_APP_URL = getARServerUrl();

  // Обработка сообщений от AR веб-приложения
  const handleWebViewMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('📨 Сообщение от AR приложения:', message);
      
      switch (message.type) {
        case 'APP_READY':
          setIsARReady(true);
          setIsLoading(false);
          console.log('✅ AR приложение готово');
          break;
          
        case 'GAME_SELECTED':
          setCurrentGame(message.data.gameId);
          console.log('🎮 Игра выбрана:', message.data.gameId);
          break;
          
        case 'GAME_COMPLETED':
          handleGameComplete(message.data);
          break;
          
        case 'BACK_TO_HOME':
          setCurrentGame(null);
          break;
          
        default:
          console.log('📬 Неизвестное сообщение:', message);
      }
    } catch (error) {
      console.error('❌ Ошибка обработки сообщения от WebView:', error);
    }
  };

  // Завершение игры и отправка результатов
  const handleGameComplete = async (gameData) => {
    try {
      console.log('💾 Сохранение результатов игры:', gameData);
      
      // Сохраняем результаты в базу данных
      await api.post('/games/result', {
        gameType: `ar-${gameData.gameId}`, // ar-showNumber, ar-showColor, и т.д.
        level: 1,
        score: gameData.score || 0,
        maxScore: gameData.maxScore || 100,
        timeSpent: 0,
        attempts: 1,
        completed: true,
        details: {
          gameId: gameData.gameId,
          timestamp: gameData.timestamp,
          ...gameData
        }
      });

      console.log('✅ Результаты сохранены');
      
      // Показываем уведомление о завершении
      if (Platform.OS === 'web') {
        alert(`🎉 Игра завершена!\n\nОчки: ${gameData.score}/${gameData.maxScore}`);
      } else {
        Alert.alert(
          '🎉 Игра завершена!',
          `Очки: ${gameData.score}/${gameData.maxScore}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Ошибка сохранения результата игры:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить результат игры');
    }
  };

  // Выход из игры
  const handleExit = () => {
    if (Platform.OS === 'web') {
      // Для веба используем window.confirm
      const confirmed = window.confirm('Вы уверены, что хотите выйти из игры? Прогресс не будет сохранен.');
      if (confirmed) {
        navigation.goBack();
      }
    } else {
      // Для мобильных используем Alert.alert
      Alert.alert(
        'Выход из игры',
        'Вы уверены, что хотите выйти? Прогресс не будет сохранен.',
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Выйти',
            style: 'destructive',
            onPress: () => navigation.goBack()
          }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header с кнопкой выхода */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleExit}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AR Приключение</Text>
        <View style={styles.placeholder} />
      </View>

      {/* WebView с AR играми */}
      {Platform.OS === 'web' ? (
        // Для веб-версии используем iframe
        <View style={styles.webContainer}>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={styles.loadingText}>Загрузка AR игр...</Text>
              <Text style={styles.loadingHint}>
                Убедитесь, что AR сервер запущен на порту 3001
              </Text>
            </View>
          )}
          <iframe
            src={AR_APP_URL}
            style={{
              flex: 1,
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            allow="camera; microphone"
            onLoad={() => {
              console.log('✅ iframe загружен');
              setIsLoading(false);
              setIsARReady(true);
            }}
            onError={() => {
              console.error('❌ Ошибка загрузки iframe');
              setIsLoading(false);
              Alert.alert(
                'Ошибка подключения',
                'Не удалось загрузить AR игры. Убедитесь, что сервер запущен:\n\ncd mobile/ar-games\nnpm run dev'
              );
            }}
          />
        </View>
      ) : (
        // Для мобильных используем WebView
        <View style={styles.webContainer}>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={styles.loadingText}>Загрузка AR игр...</Text>
              <Text style={styles.loadingHint}>
                Убедитесь, что AR сервер запущен на порту 3001
              </Text>
            </View>
          )}
          <WebView
            ref={webViewRef}
            source={{ uri: AR_APP_URL }}
            style={styles.webView}
            onMessage={handleWebViewMessage}
            onLoad={() => {
              console.log('✅ WebView загружен');
              setIsLoading(false);
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('❌ Ошибка WebView:', nativeEvent);
              Alert.alert(
                'Ошибка подключения',
                'Не удалось загрузить AR игры. Убедитесь, что сервер запущен:\n\ncd mobile/ar-games\nnpm run dev'
              );
            }}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            // Настройки для AR
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            // Доступ к камере (требуется для AR)
            cameraAccessEnabled={true}
            microphoneAccessEnabled={false}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'web' ? 15 : 40,
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
  },
  loadingHint: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default ARAdventureGameScreen;

