import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
// Removed MaterialIcons import to avoid font issues
import { habitService, goalService, habitLogService } from '../services/dataService';
import { Habit, Goal, HabitLog, HabitStatus, GoalStatus, HabitLogStatus } from '../types/abhyasa';
import SimpleDrawer from '../navigation/SimpleDrawerNavigator';
import { useFilter } from '../contexts/FilterContext';

const AbhyasaScreen = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'habits' | 'goals'>('habits');
  
  // Modal states
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  
  const { filterState, getFilterTitle } = useFilter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [habitsData, goalsData, logsData] = await Promise.all([
        habitService.getAll(),
        goalService.getAll(),
        habitLogService.getAll(),
      ]);
      
      setHabits(habitsData);
      setGoals(goalsData);
      setHabitLogs(logsData);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHabit = async () => {
    if (!newHabitTitle.trim()) {
      Alert.alert('Error', 'Please enter a habit title');
      return;
    }

    try {
      await habitService.add({
        title: newHabitTitle.trim(),
        status: HabitStatus.ACTIVE,
        startDate: new Date(),
        frequency: { type: 'daily' },
        userId: '',
      });
      
      setNewHabitTitle('');
      setShowAddHabit(false);
      loadData();
      Alert.alert('Success', 'Habit added!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    try {
      await goalService.add({
        title: newGoalTitle.trim(),
        status: GoalStatus.ACTIVE,
        startDate: new Date(),
        userId: '',
      });
      
      setNewGoalTitle('');
      setShowAddGoal(false);
      loadData();
      Alert.alert('Success', 'Goal added!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleLogHabit = async (habitId: string, status: HabitLogStatus) => {
    try {
      // Check if already logged today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingLog = habitLogs.find(log => 
        log.habitId === habitId && 
        log.date >= today
      );

      if (existingLog) {
        // Update existing log
        await habitLogService.update(existingLog.id, { status });
      } else {
        // Create new log
        await habitLogService.add({
          habitId,
          date: new Date(),
          status,
          userId: '',
        });
      }
      
      loadData();
      Alert.alert('Success', `Habit marked as ${status}!`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const getHabitLogStatus = (habitId: string): HabitLogStatus | null => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLog = habitLogs.find(log => 
      log.habitId === habitId && 
      log.date >= today
    );
    
    return todayLog?.status || null;
  };

  const getStatusColor = (status: HabitLogStatus | null) => {
    switch (status) {
      case HabitLogStatus.COMPLETED: return '#4CAF50';
      case HabitLogStatus.SKIPPED: return '#FF9800';
      case HabitLogStatus.FAILED: return '#F44336';
      default: return '#ccc';
    }
  };

  const getStatusIcon = (status: HabitLogStatus | null) => {
    switch (status) {
      case HabitLogStatus.COMPLETED: return '✅';
      case HabitLogStatus.SKIPPED: return '⏰';
      case HabitLogStatus.FAILED: return '❌';
      default: return '⭕';
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.hamburgerButton}
            onPress={() => setShowDrawer(true)}
          >
            <Text style={styles.hamburgerIcon}>☰</Text>
          </TouchableOpacity>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'habits' && styles.activeTab]}
              onPress={() => setActiveTab('habits')}
            >
              <Text style={[styles.tabText, activeTab === 'habits' && styles.activeTabText]}>
                🎯 Habits ({habits.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'goals' && styles.activeTab]}
              onPress={() => setActiveTab('goals')}
            >
              <Text style={[styles.tabText, activeTab === 'goals' && styles.activeTabText]}>
                🏆 Goals ({goals.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        {activeTab === 'habits' ? (
          // Habits Tab
          habits.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📈</Text>
              <Text style={styles.emptyText}>No habits yet</Text>
              <Text style={styles.emptySubtext}>Start building positive habits</Text>
            </View>
          ) : (
            habits.map((habit) => {
              const logStatus = getHabitLogStatus(habit.id);
              return (
                <View key={habit.id} style={styles.habitCard}>
                  <View style={styles.habitHeader}>
                    <Text style={styles.habitTitle}>{habit.title}</Text>
                    <Text style={styles.habitFrequency}>
                      {habit.frequency.type}
                    </Text>
                  </View>
                  
                  <View style={styles.habitActions}>
                    <TouchableOpacity
                      style={[
                        styles.logButton,
                        { backgroundColor: getStatusColor(HabitLogStatus.COMPLETED) }
                      ]}
                      onPress={() => handleLogHabit(habit.id, HabitLogStatus.COMPLETED)}
                    >
                      <Text style={styles.buttonIcon}>✓</Text>
                      <Text style={styles.logButtonText}>Done</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.logButton,
                        { backgroundColor: getStatusColor(HabitLogStatus.SKIPPED) }
                      ]}
                      onPress={() => handleLogHabit(habit.id, HabitLogStatus.SKIPPED)}
                    >
                      <Text style={styles.buttonIcon}>⏰</Text>
                      <Text style={styles.logButtonText}>Skip</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.statusIndicator}>
                      <Text style={[
                        styles.statusEmojiIcon,
                        { color: getStatusColor(logStatus) }
                      ]}>
                        {getStatusIcon(logStatus)}
                      </Text>
                      <Text style={styles.statusText}>
                        {logStatus || 'Pending'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )
        ) : (
          // Goals Tab
          goals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyText}>No goals yet</Text>
              <Text style={styles.emptySubtext}>Set your first goal</Text>
            </View>
          ) : (
            goals.map((goal) => (
              <View key={goal.id} style={styles.goalCard}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                {goal.description && (
                  <Text style={styles.goalDescription}>{goal.description}</Text>
                )}
                <View style={styles.goalMeta}>
                  <Text style={styles.goalStatus}>Status: {goal.status}</Text>
                  <Text style={styles.goalDate}>
                    Started: {goal.startDate.toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          )
        )}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => activeTab === 'habits' ? setShowAddHabit(true) : setShowAddGoal(true)}
      >
        <Text style={styles.addButtonIcon}>➕</Text>
      </TouchableOpacity>

      {/* Add Habit Modal */}
      <Modal visible={showAddHabit} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Habit</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter habit title..."
              value={newHabitTitle}
              onChangeText={setNewHabitTitle}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddHabit(false);
                  setNewHabitTitle('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButtonModal]}
                onPress={handleAddHabit}
              >
                <Text style={styles.addButtonText}>Add Habit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Goal Modal */}
      <Modal visible={showAddGoal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Goal</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter goal title..."
              value={newGoalTitle}
              onChangeText={setNewGoalTitle}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddGoal(false);
                  setNewGoalTitle('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButtonModal]}
                onPress={handleAddGoal}
              >
                <Text style={styles.addButtonText}>Add Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Simple Drawer */}
      <SimpleDrawer
        isVisible={showDrawer}
        onClose={() => setShowDrawer(false)}
        currentModule="Abhyasa"
        onModuleChange={(action) => {
          // Filter state is now managed by FilterContext
          setShowDrawer(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  hamburgerButton: {
    padding: 5,
    marginRight: 10,
  },
  hamburgerIcon: {
    fontSize: 24,
    color: '#2196F3',
  },
  tabContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
  },
  habitCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  habitHeader: {
    marginBottom: 15,
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  habitFrequency: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  habitActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  logButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  statusIndicator: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  goalCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  goalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  goalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalStatus: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  goalDate: {
    fontSize: 12,
    color: '#999',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2196F3',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonIcon: {
    color: 'white',
    fontSize: 24,
  },
  buttonIcon: {
    color: 'white',
    fontSize: 16,
    marginRight: 4,
  },
  statusEmojiIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  emptyIcon: {
    fontSize: 64,
    color: '#ccc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  addButtonModal: {
    backgroundColor: '#2196F3',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AbhyasaScreen;
