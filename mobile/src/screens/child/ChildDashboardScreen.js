import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '../../components/AppIcon';
import { AuthContext } from '../../context/AuthContext';

const games = [
  {
    id: 'memory',
    name: 'Мемори',
    description: 'Найди пары карточек',
    icon: 'grid',
    color: '#EF4444',
    screen: 'MemoryGame'
  },
  {
    id: 'odd-one-out',
    name: 'Найди лишнее',
    description: 'Выбери лишний предмет',
    icon: 'search',
    color: '#F59E0B',
    screen: 'OddOneOutGame'
  },
  {
    id: 'sorting',
    name: 'Сортировка',
    description: 'Разложи по категориям',
    icon: 'albums',
    color: '#10B981',
    screen: 'SortingGame'
  },
  {
    id: 'counting',
    name: 'Счет',
    description: 'Посчитай предметы',
    icon: 'calculator',
    color: '#3B82F6',
    screen: 'CountingGame'
  },
  {
    id: 'shadow-matching',
    name: 'Тени',
    description: 'Найди правильную тень',
    icon: 'contrast',
    color: '#6366F1',
    screen: 'ShadowMatchingGame'
  },
  {
    id: 'building',
    name: 'Конструктор',
    description: 'Построй по образцу',
    icon: 'cube',
    color: '#8B5CF6',
    screen: 'BuildingGame'
  },
  {
    id: 'predicting',
    name: 'Что дальше?',
    description: 'Угадай, что произойдет',
    icon: 'bulb',
    color: '#EC4899',
    screen: 'PredictingGame'
  },
  {
    id: 'ar-adventure',
    name: 'AR Приключение',
    description: 'Исследуй мир вокруг себя',
    icon: 'cube-outline',
    color: '#8B5CF6',
    screen: 'ARAdventureGame',
    badge: 'NEW'
  },
];

const ChildDashboardScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Привет, {user?.childName}! 👋</Text>
        <Text style={styles.subtitle}>Выбери игру для развития</Text>
      </View>

      <View style={styles.gamesGrid}>
        {games.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={styles.gameCard}
            onPress={() => navigation.navigate(game.screen)}
            activeOpacity={0.7}
          >
            <View style={[styles.gameIcon, { backgroundColor: game.color }]}>
              <Ionicons name={game.icon} size={40} color="#fff" />
            </View>
            <View style={styles.gameInfo}>
              <View style={styles.gameNameContainer}>
                <Text style={styles.gameName}>{game.name}</Text>
                {game.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{game.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.gameDescription}>{game.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        ))}
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
    backgroundColor: '#F59E0B',
    padding: 20,
    paddingBottom: 30,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#FEF3C7',
    marginTop: 5,
  },
  gamesGrid: {
    padding: 15,
  },
  gameCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameInfo: {
    flex: 1,
    marginLeft: 15,
  },
  gameNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  badge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  gameDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
});

export default ChildDashboardScreen;

