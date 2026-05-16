import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import api from '../../config/api';

const ParentStatisticsScreen = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [selectedChild, setSelectedChild] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);

  // Обновляем данные пользователя при фокусировке на экран
  useFocusEffect(
    React.useCallback(() => {
      updateUser();
    }, [])
  );

  useEffect(() => {
    if (user?.children && user.children.length > 0) {
      setSelectedChild(user.children[0]);
    }
  }, [user]);

  useEffect(() => {
    if (selectedChild) {
      fetchStatistics(selectedChild.id);
    }
  }, [selectedChild]);

  const fetchStatistics = async (childId) => {
    setLoading(true);
    try {
      const response = await api.get(`/games/statistics/${childId}`);
      if (response.data.success) {
        setStatistics(response.data.statistics);
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user?.children || user.children.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="stats-chart-outline" size={80} color="#ccc" />
        <Text style={styles.emptyText}>Нет детей для просмотра статистики</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.childSelector}
        contentContainerStyle={styles.childSelectorContent}
      >
        {user.children.map((child) => (
          <TouchableOpacity
            key={child.id}
            style={[
              styles.childButton,
              selectedChild?.id === child.id && styles.childButtonActive
            ]}
            onPress={() => setSelectedChild(child)}
          >
            <Ionicons 
              name="person" 
              size={20} 
              color={selectedChild?.id === child.id ? '#fff' : '#10B981'} 
            />
            <Text style={[
              styles.childButtonText,
              selectedChild?.id === child.id && styles.childButtonTextActive
            ]}>
              {child.childName}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : statistics ? (
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Общая статистика</Text>
            <View style={styles.statCard}>
              <Ionicons name="game-controller" size={40} color="#10B981" />
              <Text style={styles.statNumber}>{statistics.totalGames}</Text>
              <Text style={styles.statLabel}>Всего игр сыграно</Text>
            </View>
          </View>

          {Object.keys(statistics.gameStats).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Успехи по играм</Text>
              {Object.entries(statistics.gameStats).map(([gameType, stats]) => (
                <View key={gameType} style={styles.gameStatsCard}>
                  <Text style={styles.gameStatsTitle}>{getGameName(gameType)}</Text>
                  <View style={styles.gameStatsRow}>
                    <View style={styles.gameStatItem}>
                      <Text style={styles.gameStatValue}>{stats.gamesPlayed}</Text>
                      <Text style={styles.gameStatLabel}>Игр</Text>
                    </View>
                    <View style={styles.gameStatItem}>
                      <Text style={[styles.gameStatValue, { color: getScoreColor(parseFloat(stats.averageScore)) }]}>
                        {stats.averageScore}%
                      </Text>
                      <Text style={styles.gameStatLabel}>Средний балл</Text>
                    </View>
                    <View style={styles.gameStatItem}>
                      <Text style={styles.gameStatValue}>{stats.completedGames}</Text>
                      <Text style={styles.gameStatLabel}>Завершено</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {statistics.recommendations && statistics.recommendations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Рекомендации</Text>
              {statistics.recommendations.map((recommendation, index) => (
                <View key={index} style={styles.recommendationCard}>
                  <Ionicons name="bulb" size={24} color="#F59E0B" />
                  <Text style={styles.recommendationText}>{recommendation}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : null}
    </View>
  );
};

const getGameName = (type) => {
  const names = {
    'memory': 'Мемори',
    'odd-one-out': 'Найди лишнее',
    'sorting': 'Сортировка',
    'counting': 'Счет',
    'shadow-matching': 'Тени и Силуэты',
    'building': 'Построй по Образцу',
    'predicting': 'Что будет дальше?',
    'ar-adventure': 'AR Приключение'
  };
  return names[type] || type;
};

const getScoreColor = (score) => {
  if (score >= 80) return '#10B981';
  if (score >= 50) return '#F59E0B';
  return '#EF4444';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  childSelector: {
    flexGrow: 0,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  childSelectorContent: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  childButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: '#10B981',
    minHeight: 44,
  },
  childButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  childButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  childButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 20,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  gameStatsCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameStatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  gameStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  gameStatItem: {
    alignItems: 'center',
  },
  gameStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  gameStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  recommendationCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  recommendationText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
});

export default ParentStatisticsScreen;

