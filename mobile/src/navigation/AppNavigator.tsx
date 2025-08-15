import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import KaryScreen from '../screens/KaryScreen';
import AbhyasaScreen from '../screens/AbhyasaScreen';
import DainandiniScreen from '../screens/DainandiniScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let icon = '';

          if (route.name === 'Home') {
            icon = '🏠';
          } else if (route.name === 'Kary') {
            icon = '📋';
          } else if (route.name === 'Abhyasa') {
            icon = '🎯';
          } else if (route.name === 'Dainandini') {
            icon = '📝';
          }

          return (
            <Text style={{ fontSize: focused ? 24 : 20, color }}>
              {icon}
            </Text>
          );
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false, // Each screen has its own header with hamburger
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Kary" 
        component={KaryScreen} 
        options={{ tabBarLabel: 'Tasks' }}
      />
      <Tab.Screen 
        name="Abhyasa" 
        component={AbhyasaScreen} 
        options={{ tabBarLabel: 'Habits' }}
      />
      <Tab.Screen 
        name="Dainandini" 
        component={DainandiniScreen} 
        options={{ tabBarLabel: 'Logs' }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
