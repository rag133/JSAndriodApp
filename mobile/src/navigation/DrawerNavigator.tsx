import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import KaryScreen from '../screens/KaryScreen';
import AbhyasaScreen from '../screens/AbhyasaScreen';
import DainandiniScreen from '../screens/DainandiniScreen';

const Drawer = createDrawerNavigator();

// Custom Drawer Content Component
const CustomDrawerContent = ({ navigation, state }: any) => {
  const currentRoute = state.routeNames[state.index];

  const renderKaryItems = () => (
    <View style={styles.moduleSection}>
      <Text style={styles.moduleTitle}>📋 Kary - Task Management</Text>
      
      <TouchableOpacity style={styles.drawerItem}>
        <Text style={styles.drawerItemIcon}>📥</Text>
        <Text style={styles.drawerItemText}>Inbox</Text>
        <Text style={styles.itemCount}>24</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.drawerItem}>
        <Text style={styles.drawerItemIcon}>📅</Text>
        <Text style={styles.drawerItemText}>Today</Text>
        <Text style={styles.itemCount}>10</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.drawerItem}>
        <Text style={styles.drawerItemIcon}>🔥</Text>
        <Text style={styles.drawerItemText}>This Week</Text>
        <Text style={styles.itemCount}>45</Text>
      </TouchableOpacity>
      
      <View style={styles.subSection}>
        <Text style={styles.subSectionTitle}>Lists</Text>
        <TouchableOpacity style={styles.drawerSubItem}>
          <Text style={styles.drawerItemText}>Personal</Text>
          <Text style={styles.itemCount}>12</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerSubItem}>
          <Text style={styles.drawerItemText}>Work</Text>
          <Text style={styles.itemCount}>8</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerSubItem}>
          <Text style={styles.drawerItemText}>Projects</Text>
          <Text style={styles.itemCount}>15</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.subSection}>
        <Text style={styles.subSectionTitle}>Tags</Text>
        <TouchableOpacity style={styles.drawerSubItem}>
          <Text style={styles.tagItem}>#urgent</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerSubItem}>
          <Text style={styles.tagItem}>#learning</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerSubItem}>
          <Text style={styles.tagItem}>#health</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAbhyasaItems = () => (
    <View style={styles.moduleSection}>
      <Text style={styles.moduleTitle}>🎯 Abhyasa - Habits & Goals</Text>
      
      <TouchableOpacity style={styles.drawerItem}>
        <Text style={styles.drawerItemIcon}>📊</Text>
        <Text style={styles.drawerItemText}>Dashboard</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.drawerItem}>
        <Text style={styles.drawerItemIcon}>🔥</Text>
        <Text style={styles.drawerItemText}>Active Habits</Text>
        <Text style={styles.itemCount}>8</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.drawerItem}>
        <Text style={styles.drawerItemIcon}>🏆</Text>
        <Text style={styles.drawerItemText}>Goals</Text>
        <Text style={styles.itemCount}>5</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.drawerItem}>
        <Text style={styles.drawerItemIcon}>🎯</Text>
        <Text style={styles.drawerItemText}>Milestones</Text>
        <Text style={styles.itemCount}>12</Text>
      </TouchableOpacity>
      
      <View style={styles.subSection}>
        <Text style={styles.subSectionTitle}>Categories</Text>
        <TouchableOpacity style={styles.drawerSubItem}>
          <Text style={styles.drawerItemText}>Health & Fitness</Text>
          <Text style={styles.itemCount}>4</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerSubItem}>
          <Text style={styles.drawerItemText}>Learning</Text>
          <Text style={styles.itemCount}>3</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerSubItem}>
          <Text style={styles.drawerItemText}>Productivity</Text>
          <Text style={styles.itemCount}>2</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDainandiniItems = () => (
    <View style={styles.moduleSection}>
      <Text style={styles.moduleTitle}>📝 Dainandini - Daily Logs</Text>
      
      <TouchableOpacity style={styles.drawerItem}>
        <Text style={styles.drawerItemIcon}>📅</Text>
        <Text style={styles.drawerItemText}>Today</Text>
        <Text style={styles.itemCount}>3</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.drawerItem}>
        <Text style={styles.drawerItemIcon}>📊</Text>
        <Text style={styles.drawerItemText}>Calendar View</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.drawerItem}>
        <Text style={styles.drawerItemIcon}>🔍</Text>
        <Text style={styles.drawerItemText}>Search Logs</Text>
      </TouchableOpacity>
      
      <View style={styles.subSection}>
        <Text style={styles.subSectionTitle}>Focus Areas</Text>
        <TouchableOpacity style={styles.drawerSubItem}>
          <Text style={styles.drawerItemText}>General</Text>
          <Text style={styles.itemCount}>15</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerSubItem}>
          <Text style={styles.drawerItemText}>Work Progress</Text>
          <Text style={styles.itemCount}>8</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerSubItem}>
          <Text style={styles.drawerItemText}>Personal Growth</Text>
          <Text style={styles.itemCount}>12</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerSubItem}>
          <Text style={styles.drawerItemText}>Health & Mood</Text>
          <Text style={styles.itemCount}>6</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHomeItems = () => (
    <View style={styles.moduleSection}>
      <Text style={styles.moduleTitle}>🏠 Home - Dashboard</Text>
      
      <TouchableOpacity style={styles.drawerItem}>
        <Text style={styles.drawerItemIcon}>📊</Text>
        <Text style={styles.drawerItemText}>Overview</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.drawerItem}>
        <Text style={styles.drawerItemIcon}>📅</Text>
        <Text style={styles.drawerItemText}>Today's Summary</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.drawerItem}>
        <Text style={styles.drawerItemIcon}>📈</Text>
        <Text style={styles.drawerItemText}>Weekly Progress</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.drawerItem}>
        <Text style={styles.drawerItemIcon}>⚡</Text>
        <Text style={styles.drawerItemText}>Quick Actions</Text>
      </TouchableOpacity>
    </View>
  );

  const getModuleContent = () => {
    switch (currentRoute) {
      case 'Kary':
        return renderKaryItems();
      case 'Abhyasa':
        return renderAbhyasaItems();
      case 'Dainandini':
        return renderDainandiniItems();
      default:
        return renderHomeItems();
    }
  };

  return (
    <ScrollView style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>🌟</Text>
          <Text style={styles.logoText}>Jeevan Saathi</Text>
        </View>
        <Text style={styles.logoSubtext}>Life Management Companion</Text>
      </View>
      
      {getModuleContent()}
      
      <View style={styles.drawerFooter}>
        <TouchableOpacity style={styles.drawerItem}>
          <Text style={styles.drawerItemIcon}>⚙️</Text>
          <Text style={styles.drawerItemText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerItem}>
          <Text style={styles.drawerItemIcon}>📊</Text>
          <Text style={styles.drawerItemText}>Analytics</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerPosition: 'left',
        drawerType: 'slide',
        drawerStyle: {
          backgroundColor: '#f8f9fa',
          width: 280,
        },
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Drawer.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: '🏠 Home',
          headerLeft: () => null, // We'll add custom hamburger button
        }}
      />
      <Drawer.Screen 
        name="Kary" 
        component={KaryScreen}
        options={{
          title: '📋 Tasks',
        }}
      />
      <Drawer.Screen 
        name="Abhyasa" 
        component={AbhyasaScreen}
        options={{
          title: '🎯 Habits',
        }}
      />
      <Drawer.Screen 
        name="Dainandini" 
        component={DainandiniScreen}
        options={{
          title: '📝 Logs',
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  drawerHeader: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
    marginBottom: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  logoSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  moduleSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  drawerItemIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  drawerItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  itemCount: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    textAlign: 'center',
  },
  subSection: {
    marginTop: 16,
    marginLeft: 16,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  drawerSubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  tagItem: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  drawerFooter: {
    marginTop: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
});

export default DrawerNavigator;
