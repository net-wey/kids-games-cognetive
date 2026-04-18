import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

const AdminStatisticsScreen = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/admin/statistics');
      if (response.data.success) {
        setStatistics(response.data.statistics);
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStatistics();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {statistics && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Пользователи</Text>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={30} color="#6366F1" />
                <Text style={styles.statNumber}>{statistics.users.total}</Text>
                <Text style={styles.statLabel}>Всего</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="person" size={30} color="#10B981" />
                <Text style={styles.statNumber}>{statistics.users.parents}</Text>
                <Text style={styles.statLabel}>Родителей</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="happy" size={30} color="#F59E0B" />
                <Text style={styles.statNumber}>{statistics.users.children}</Text>
                <Text style={styles.statLabel}>Детей</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Активность</Text>
            <View style={styles.activityCard}>
              <View style={styles.activityRow}>
                <Text style={styles.activityLabel}>Всего игр сыграно:</Text>
                <Text style={styles.activityValue}>{statistics.games.total}</Text>
              </View>
              <View style={styles.activityRow}>
                <Text style={styles.activityLabel}>За последнюю неделю:</Text>
                <Text style={styles.activityValue}>{statistics.games.lastWeek}</Text>
              </View>
              <View style={styles.activityRow}>
                <Text style={styles.activityLabel}>Активных пользователей:</Text>
                <Text style={styles.activityValue}>{statistics.users.active}</Text>
              </View>
            </View>
          </View>

          {statistics.popularGames.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Популярность игр</Text>
              {statistics.popularGames.map((game, index) => {
                const total = statistics.games.total;
                const percentage = ((game.count / total) * 100).toFixed(1);
                
                return (
                  <View key={index} style={styles.gameBar}>
                    <Text style={styles.gameBarLabel}>{getGameName(game.gameType)}</Text>
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressBar, { width: `${percentage}%` }]} />
                    </View>
                    <Text style={styles.gameBarValue}>{game.count} ({percentage}%)</Text>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}
    </ScrollView>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    flex: 1,
    margin: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  activityCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  activityLabel: {
    fontSize: 16,
    color: '#666',
  },
  activityValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  gameBar: {
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
  gameBarLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  progressContainer: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366F1',
  },
  gameBarValue: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
});

export default AdminStatisticsScreen;

