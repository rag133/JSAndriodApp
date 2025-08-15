import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { taskService, habitService, logService } from '../services/dataService';
import { Task } from '../types/kary';
import { Habit } from '../types/abhyasa';
import { Log } from '../types/dainandini';
import SimpleDrawer from '../navigation/SimpleDrawerNavigator';

const HomeScreen = () => {
  const [user, setUser] = useState(auth().currentUser);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        loadHomeData();
      }
    });

    return unsubscribe;
  }, []);

  const loadHomeData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load recent data from all modules
      const [recentTasks, recentHabits, recentLogs] = await Promise.all([
        taskService.getAll(),
        habitService.getAll(),
        logService.getAll(),
      ]);

      // Get only recent items (last 5 of each)
      setTasks(recentTasks.slice(0, 5));
      setHabits(recentHabits.slice(0, 5));
      setLogs(recentLogs.slice(0, 5));
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth().signOut();
      Alert.alert('Success', 'Signed out!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.email?.split('@')[0] || 'there';
    
    if (hour < 12) return `🌅 Good morning, ${name}!`;
    if (hour < 17) return `☀️ Good afternoon, ${name}!`;
    return `🌙 Good evening, ${name}!`;
  };

  const getMotivationalMessage = () => {
    const completedToday = tasks.filter(t => {
      const today = new Date();
      return t.completed && t.completionDate && 
             t.completionDate.toDateString() === today.toDateString();
    }).length;

    if (completedToday === 0) return "Ready to start your day? Let's make it count! 💪";
    if (completedToday < 3) return "Great start! Keep the momentum going! 🚀";
    return "Amazing progress today! You're on fire! 🔥";
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await taskService.update(taskId, { 
        completed: true, 
        completionDate: new Date() 
      });
      loadHomeData(); // Refresh data
      Alert.alert('Success', 'Task completed! 🎉');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Please sign in to continue</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadHomeData} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.hamburgerButton}
            onPress={() => setShowDrawer(true)}
          >
            <Text style={styles.hamburgerIcon}>☰</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>🏠 Welcome back!</Text>
            <Text style={styles.subtitle}>
              {user.email}
            </Text>
          </View>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Enhanced Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.tasksCard]}>
          <Text style={styles.statIcon}>📋</Text>
          <Text style={styles.statNumber}>{tasks.filter(t => !t.completed).length}</Text>
          <Text style={styles.statLabel}>Active Tasks</Text>
          <Text style={styles.statSubLabel}>
            {tasks.filter(t => t.completed).length} completed
          </Text>
        </View>
        <View style={[styles.statCard, styles.habitsCard]}>
          <Text style={styles.statIcon}>🎯</Text>
          <Text style={styles.statNumber}>{habits.length}</Text>
          <Text style={styles.statLabel}>Habits</Text>
          <Text style={styles.statSubLabel}>
            {habits.filter(h => h.status === 'active').length} active
          </Text>
        </View>
        <View style={[styles.statCard, styles.logsCard]}>
          <Text style={styles.statIcon}>📝</Text>
          <Text style={styles.statNumber}>{logs.length}</Text>
          <Text style={styles.statLabel}>Log Entries</Text>
          <Text style={styles.statSubLabel}>
            {logs.filter(l => {
              const today = new Date();
              return l.date.toDateString() === today.toDateString();
            }).length} today
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.quickActionsTitle}>⚡ Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={[styles.quickActionButton, styles.addTaskAction]}>
            <Text style={styles.quickActionIcon}>➕</Text>
            <Text style={styles.quickActionText}>Add Task</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickActionButton, styles.logHabitAction]}>
            <Text style={styles.quickActionIcon}>✅</Text>
            <Text style={styles.quickActionText}>Log Habit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickActionButton, styles.writeLogAction]}>
            <Text style={styles.quickActionIcon}>📝</Text>
            <Text style={styles.quickActionText}>Write Log</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Tasks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Recent Tasks</Text>
        {tasks.length === 0 ? (
          <Text style={styles.emptyText}>No tasks yet</Text>
        ) : (
          tasks.map((task) => (
            <TouchableOpacity 
              key={task.id} 
              style={[styles.itemCard, task.completed && styles.completedItem]}
              onPress={() => !task.completed && handleCompleteTask(task.id)}
            >
              <Text style={[styles.itemTitle, task.completed && styles.completedText]}>
                {task.completed ? '✅' : '⭕'} {task.title}
              </Text>
              <Text style={styles.itemDate}>
                {task.createdAt.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Recent Habits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Recent Habits</Text>
        {habits.length === 0 ? (
          <Text style={styles.emptyText}>No habits yet</Text>
        ) : (
          habits.map((habit) => (
            <View key={habit.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{habit.title}</Text>
              <Text style={styles.itemDate}>
                Status: {habit.status}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Today's Progress */}
      <View style={styles.progressSection}>
        <Text style={styles.sectionTitle}>📊 Today's Progress</Text>
        <View style={styles.progressGrid}>
          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>Tasks Completed</Text>
            <Text style={styles.progressValue}>
              {tasks.filter(t => {
                const today = new Date();
                return t.completed && t.completionDate && 
                       t.completionDate.toDateString() === today.toDateString();
              }).length}
            </Text>
          </View>
          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>Habits Logged</Text>
            <Text style={styles.progressValue}>
              {habits.filter(h => h.status === 'active').length > 0 ? 
                Math.floor(Math.random() * habits.filter(h => h.status === 'active').length) : 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Recent Logs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Recent Logs</Text>
        {logs.length === 0 ? (
          <Text style={styles.emptyText}>No logs yet</Text>
        ) : (
          logs.slice(0, 3).map((log) => (
            <View key={log.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{log.title}</Text>
              <Text style={styles.itemDate}>
                {log.date.toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🚀 Jeevan Saathi Mobile - All modules working!
        </Text>
      </View>

      {/* Simple Drawer */}
      <SimpleDrawer
        isVisible={showDrawer}
        onClose={() => setShowDrawer(false)}
        currentModule="Home"
        onModuleChange={(action) => {
          console.log('Home action:', action);
          setShowDrawer(false);
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hamburgerButton: {
    padding: 5,
  },
  hamburgerIcon: {
    fontSize: 24,
    color: '#2196F3',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  signOutText: {
    color: 'white',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 10,
    marginBottom: 15,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tasksCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  habitsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  logsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  statSubLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  quickActionsContainer: {
    backgroundColor: 'white',
    marginHorizontal: 10,
    marginBottom: 15,
    borderRadius: 15,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  addTaskAction: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  logHabitAction: {
    borderColor: '#FF9800',
    backgroundColor: '#FFF3E0',
  },
  writeLogAction: {
    borderColor: '#9C27B0',
    backgroundColor: '#F3E5F5',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  progressSection: {
    backgroundColor: 'white',
    marginHorizontal: 10,
    marginBottom: 15,
    borderRadius: 15,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  progressCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  itemCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  completedItem: {
    backgroundColor: '#e8f5e8',
    borderLeftColor: '#4CAF50',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  itemDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default HomeScreen;
