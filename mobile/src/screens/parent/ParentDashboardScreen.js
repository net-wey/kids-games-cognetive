import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';

const ParentDashboardScreen = ({ navigation }) => {
  const { user, updateUser } = useContext(AuthContext);

  // Обновляем данные при фокусировке на экран
  useFocusEffect(
    React.useCallback(() => {
      updateUser();
    }, [])
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Добро пожаловать!</Text>
        <Text style={styles.username}>{user?.username}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={40} color="#10B981" />
          <Text style={styles.statNumber}>{user?.children?.length || 0}</Text>
          <Text style={styles.statLabel}>Моих детей</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Быстрые действия</Text>
        
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('Children')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#10B981' }]}>
            <Ionicons name="people" size={30} color="#fff" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Мои дети</Text>
            <Text style={styles.actionDescription}>
              Управление аккаунтами детей
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('Statistics')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#6366F1' }]}>
            <Ionicons name="stats-chart" size={30} color="#fff" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Статистика</Text>
            <Text style={styles.actionDescription}>
              Просмотр прогресса детей
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Информация</Text>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#6366F1" />
          <Text style={styles.infoText}>
            Следите за прогрессом ваших детей в развивающих играх и получайте персональные рекомендации для их развития.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#10B981',
    padding: 20,
    paddingBottom: 30,
  },
  greeting: {
    fontSize: 16,
    color: '#D1FAE5',
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  statsContainer: {
    padding: 15,
    marginTop: -20,
  },
  statCard: {
    backgroundColor: '#fff',
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
    color: '#333',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
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
  actionCard: {
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
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
    marginLeft: 15,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#4338CA',
    lineHeight: 20,
  },
});

export default ParentDashboardScreen;

