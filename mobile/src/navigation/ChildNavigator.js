import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import ChildDashboardScreen from '../screens/child/ChildDashboardScreen';
import ChildFriendsScreen from '../screens/child/ChildFriendsScreen';
import ChildLeaderboardScreen from '../screens/child/ChildLeaderboardScreen';
import ChildProfileScreen from '../screens/child/ChildProfileScreen';

// Игры
import MemoryGameScreen from '../screens/games/MemoryGameScreen';
import OddOneOutGameScreen from '../screens/games/OddOneOutGameScreen';
import SortingGameScreen from '../screens/games/SortingGameScreen';
import CountingGameScreen from '../screens/games/CountingGameScreen';
import ShadowMatchingGameScreen from '../screens/games/ShadowMatchingGameScreen';
import BuildingGameScreen from '../screens/games/BuildingGameScreen';
import PredictingGameScreen from '../screens/games/PredictingGameScreen';
import ARAdventureGameScreen from '../screens/games/ARAdventureGameScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Games') {
            iconName = focused ? 'game-controller' : 'game-controller-outline';
          } else if (route.name === 'Friends') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Leaderboard') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#F59E0B',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#F59E0B',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Games" 
        component={ChildDashboardScreen}
        options={{ title: 'Игры' }}
      />
      <Tab.Screen 
        name="Friends" 
        component={ChildFriendsScreen}
        options={{ title: 'Друзья' }}
      />
      <Tab.Screen 
        name="Leaderboard" 
        component={ChildLeaderboardScreen}
        options={{ title: 'Лидеры' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ChildProfileScreen}
        options={{ title: 'Профиль' }}
      />
    </Tab.Navigator>
  );
};

const ChildNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Main" 
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="MemoryGame" 
        component={MemoryGameScreen}
        options={{ 
          title: 'Мемори',
          headerStyle: { backgroundColor: '#F59E0B' },
          headerTintColor: '#fff'
        }}
      />
      <Stack.Screen 
        name="OddOneOutGame" 
        component={OddOneOutGameScreen}
        options={{ 
          title: 'Найди лишнее',
          headerStyle: { backgroundColor: '#F59E0B' },
          headerTintColor: '#fff'
        }}
      />
      <Stack.Screen 
        name="SortingGame" 
        component={SortingGameScreen}
        options={{ 
          title: 'Сортировка',
          headerStyle: { backgroundColor: '#F59E0B' },
          headerTintColor: '#fff'
        }}
      />
      <Stack.Screen 
        name="CountingGame" 
        component={CountingGameScreen}
        options={{ 
          title: 'Счет',
          headerStyle: { backgroundColor: '#F59E0B' },
          headerTintColor: '#fff'
        }}
      />
      <Stack.Screen 
        name="ShadowMatchingGame" 
        component={ShadowMatchingGameScreen}
        options={{ 
          title: 'Тени и Силуэты',
          headerStyle: { backgroundColor: '#F59E0B' },
          headerTintColor: '#fff'
        }}
      />
      <Stack.Screen 
        name="BuildingGame" 
        component={BuildingGameScreen}
        options={{ 
          title: 'Построй по Образцу',
          headerStyle: { backgroundColor: '#F59E0B' },
          headerTintColor: '#fff'
        }}
      />
      <Stack.Screen 
        name="PredictingGame" 
        component={PredictingGameScreen}
        options={{ 
          title: 'Что будет дальше?',
          headerStyle: { backgroundColor: '#F59E0B' },
          headerTintColor: '#fff'
        }}
      />
      <Stack.Screen 
        name="ARAdventureGame" 
        component={ARAdventureGameScreen}
        options={{ 
          headerShown: false // AR игра имеет свой header
        }}
      />
    </Stack.Navigator>
  );
};

export default ChildNavigator;

