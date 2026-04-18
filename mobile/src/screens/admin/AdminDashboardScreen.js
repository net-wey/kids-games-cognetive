import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

const AdminDashboardScreen = () => {
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Панель управления</Text>
        <Text style={styles.headerSubtitle}>Обзор системы</Text>
      </View>

      {statistics && (
        <>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#6366F1' }]}>
              <Ionicons name="people" size={40} color="#fff" />
              <Text style={styles.statNumber}>{statistics.users.total}</Text>
              <Text style={styles.statLabel}>Всего пользователей</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#10B981' }]}>
              <Ionicons name="person" size={40} color="#fff" />
              <Text style={styles.statNumber}>{statistics.users.parents}</Text>
              <Text style={styles.statLabel}>Родителей</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#F59E0B' }]}>
              <Ionicons name="happy" size={40} color="#fff" />
              <Text style={styles.statNumber}>{statistics.users.children}</Text>
              <Text style={styles.statLabel}>Детей</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#8B5CF6' }]}>
              <Ionicons name="game-controller" size={40} color="#fff" />
              <Text style={styles.statNumber}>{statistics.games.total}</Text>
              <Text style={styles.statLabel}>Игр сыграно</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Активность за неделю</Text>
            <View style={styles.infoCard}>
              <Ionicons name="trending-up" size={30} color="#6366F1" />
              <View style={styles.infoContent}>
                <Text style={styles.infoNumber}>{statistics.games.lastWeek}</Text>
                <Text style={styles.infoLabel}>Игр за последние 7 дней</Text>
              </View>
            </View>
          </View>

          {statistics.popularGames.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Популярные игры</Text>
              {statistics.popularGames.map((game, index) => (
                <View key={index} style={styles.gameCard}>
                  <View style={styles.gameRank}>
                    <Text style={styles.gameRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.gameInfo}>
                    <Text style={styles.gameName}>{getGameName(game.gameType)}</Text>
                    <Text style={styles.gameCount}>{game.count} игр</Text>
                  </View>
                </View>
              ))}
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
  header: {
    backgroundColor: '#6366F1',
    padding: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E0E7FF',
    marginTop: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    marginTop: -20,
  },
  statCard: {
    width: '47%',
    margin: '1.5%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginTop: 5,
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContent: {
    marginLeft: 15,
  },
  infoNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  gameCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameRankText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameInfo: {
    marginLeft: 15,
    flex: 1,
  },
  gameName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  gameCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
});

export default AdminDashboardScreen;

