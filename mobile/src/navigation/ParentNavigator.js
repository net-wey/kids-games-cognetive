import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import ParentDashboardScreen from '../screens/parent/ParentDashboardScreen';
import ParentChildrenScreen from '../screens/parent/ParentChildrenScreen';
import ParentStatisticsScreen from '../screens/parent/ParentStatisticsScreen';
import ParentProfileScreen from '../screens/parent/ParentProfileScreen';

const Tab = createBottomTabNavigator();

const ParentNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Children') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Statistics') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#10B981',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={ParentDashboardScreen}
        options={{ title: 'Главная' }}
      />
      <Tab.Screen 
        name="Children" 
        component={ParentChildrenScreen}
        options={{ title: 'Мои дети' }}
      />
      <Tab.Screen 
        name="Statistics" 
        component={ParentStatisticsScreen}
        options={{ title: 'Статистика' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ParentProfileScreen}
        options={{ title: 'Профиль' }}
      />
    </Tab.Navigator>
  );
};

export default ParentNavigator;

