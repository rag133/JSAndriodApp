import React, { useState, useEffect, useCallback } from 'react';
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
import { Habit, Goal, HabitLog, HabitStatus, GoalStatus, HabitLogStatus, HabitType, HabitTargetComparison, HabitFrequencyType } from '../types/abhyasa';
import SimpleDrawer from '../navigation/SimpleDrawerNavigator';
import { useFilter } from '../contexts/FilterContext';
import HabitCard from '../components/HabitCard';
import HabitLoggingModal from '../components/HabitLoggingModal';
import { calculateHabitStatus, shouldShowHabitOnDate, isSameDay, isToday, getLogDate } from '../utils/habitUtils';

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
  
  // Calendar view states
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [showHabitLoggingModal, setShowHabitLoggingModal] = useState(false);
  const [habitToLog, setHabitToLog] = useState<Habit | null>(null);
  
  const { filterState, getFilterTitle } = useFilter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading Abhyasa data...');
      
      const [habitsData, goalsData, logsData] = await Promise.all([
        habitService.getAll(),
        goalService.getAll(),
        habitLogService.getAll(),
      ]);
      
      console.log('📊 Data loaded:', {
        habits: habitsData.length,
        goals: goalsData.length,
        logs: logsData.length
      });
      
      // Debug habit logs structure
      if (logsData.length > 0) {
        console.log('📝 Sample habit log:', logsData[0]);
        console.log('📝 Habit log date type:', typeof logsData[0]?.date);
        console.log('📝 Habit log date value:', logsData[0]?.date);
        console.log('📝 Habit log keys:', Object.keys(logsData[0]));
        
        // Check if date field exists and its properties
        const sampleLog = logsData[0];
        if (sampleLog) {
          console.log('📝 Sample log full structure:', JSON.stringify(sampleLog, null, 2));
          if (sampleLog.date) {
            console.log('📝 Date field properties:', {
              constructor: sampleLog.date.constructor.name,
              hasToDate: typeof (sampleLog.date as any).toDate === 'function',
              hasToISOString: typeof sampleLog.date.toISOString === 'function',
              value: sampleLog.date
            });
          } else {
            console.log('❌ Date field is missing or undefined');
          }
        }
      }
      
      // Clean up habit logs data - ensure all logs have valid dates
      const cleanedLogsData = logsData.filter(log => {
        if (!log || !log.date) {
          console.warn('Filtering out habit log without date:', log);
          return false;
        }
        return true;
      });
      
      console.log('🧹 Cleaned logs data:', {
        original: logsData.length,
        cleaned: cleanedLogsData.length
      });
      
      // Additional validation: ensure all required fields exist
      const validatedLogsData = cleanedLogsData.filter(log => {
        // Check if all required fields exist and are valid
        const hasValidId = log && typeof log.id === 'string' && log.id.length > 0;
        const hasValidHabitId = log && typeof log.habitId === 'string' && log.habitId.length > 0;
        const hasValidDate = log && log.date && log.date instanceof Date && !isNaN(log.date.getTime());
        // Status is calculated on-the-fly, not stored in database
        const hasValidStatus = true;
        const hasValidUserId = log && typeof log.userId === 'string' && log.userId.length > 0;
        
        if (!hasValidId || !hasValidHabitId || !hasValidDate || !hasValidStatus || !hasValidUserId) {
          console.warn('Filtering out invalid habit log:', {
            logId: log?.id,
            habitId: log?.habitId,
            hasDate: !!log?.date,
            dateType: typeof log?.date,
            dateValid: log?.date instanceof Date && !isNaN(log?.date.getTime()),
            userId: log?.userId,
            fullLog: log
          });
          return false;
        }
        
        return true;
      });
      
      console.log('✅ Validated logs data:', {
        original: logsData.length,
        cleaned: cleanedLogsData.length,
        validated: validatedLogsData.length
      });
      
      // Attempt to repair corrupted logs by adding missing dates
      if (validatedLogsData.length < cleanedLogsData.length) {
        console.log('🔧 Attempting to repair corrupted habit logs...');
        const corruptedLogs = cleanedLogsData.filter(log => !validatedLogsData.includes(log));
        
        let repairedCount = 0;
        let deletedCount = 0;
        
        for (const corruptedLog of corruptedLogs) {
          try {
            if (corruptedLog && corruptedLog.id && corruptedLog.habitId) {
              console.log('🔧 Repairing habit log:', corruptedLog.id);
              console.log('🔧 Corrupted log data:', JSON.stringify(corruptedLog, null, 2));
              
              // Add missing date field - ensure no undefined values for Firebase
              const repairData: Partial<HabitLog> = {};
              
              // Only add fields that have valid values (status is calculated on-the-fly)
              if (corruptedLog.date) repairData.date = corruptedLog.date;
              if (corruptedLog.value !== undefined && corruptedLog.value !== null) repairData.value = corruptedLog.value;
              if (corruptedLog.completedChecklistItems) repairData.completedChecklistItems = corruptedLog.completedChecklistItems;
              if (corruptedLog.notes) repairData.notes = corruptedLog.notes;
              if (corruptedLog.userId) repairData.userId = corruptedLog.userId;
              
              // Always ensure date exists
              repairData.date = new Date();
              
              console.log('🔧 Repair data to send:', JSON.stringify(repairData, null, 2));
              
              await habitLogService.update(corruptedLog.id, repairData);
              console.log('✅ Repaired habit log:', corruptedLog.id);
              repairedCount++;
            }
          } catch (error) {
            console.error('❌ Failed to repair habit log:', corruptedLog.id, error);
            console.error('❌ Corrupted log that failed:', JSON.stringify(corruptedLog, null, 2));
            
            // Try to delete the corrupted log instead
            try {
              console.log('🗑️ Attempting to delete corrupted habit log:', corruptedLog.id);
              await habitLogService.delete(corruptedLog.id);
              console.log('✅ Deleted corrupted habit log:', corruptedLog.id);
              deletedCount++;
            } catch (deleteError) {
              console.error('❌ Failed to delete corrupted habit log:', corruptedLog.id, deleteError);
            }
          }
        }
        
        console.log('🔧 Repair summary:', { repaired: repairedCount, deleted: deletedCount, total: corruptedLogs.length });
        
        // Reload data after repairs
        console.log('🔄 Reloading data after repairs...');
        const [repairedHabits, repairedGoals, repairedLogs] = await Promise.all([
          habitService.getAll(),
          goalService.getAll(),
          habitLogService.getAll(),
        ]);
        
        // Apply same validation to repaired data
        const finalValidatedLogs = repairedLogs.filter(log => {
          const hasValidId = log && typeof log.id === 'string' && log.id.length > 0;
          const hasValidHabitId = log && typeof log.habitId === 'string' && log.habitId.length > 0;
          const hasValidDate = log && log.date && log.date instanceof Date && !isNaN(log.date.getTime());
          // Status is calculated on-the-fly, not stored in database
          const hasValidStatus = true;
          const hasValidUserId = log && typeof log.userId === 'string' && log.userId.length > 0;
          
          return hasValidId && hasValidHabitId && hasValidDate && hasValidStatus && hasValidUserId;
        });
        
        console.log('🔧 Final validated logs after repair:', {
          original: logsData.length,
          final: finalValidatedLogs.length
        });
        
        setHabits(repairedHabits);
        setGoals(repairedGoals);
        setHabitLogs(finalValidatedLogs);
      } else {
        setHabits(habitsData);
        setGoals(goalsData);
        setHabitLogs(validatedLogsData);
      }
      
      if (habitsData.length === 0) {
        await createSampleHabits();
      }
      
      if (habitsData.length > 0) {
        console.log('🎯 Sample habit:', habitsData[0]);
      }
    } catch (error: any) {
      console.error('❌ Error loading data:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const createSampleHabits = async () => {
    try {
      console.log('🧪 Creating sample habits for testing...');
      
      // Create a sample binary habit
      await habitService.add({
        title: 'Morning Prayer',
        description: 'Daily morning prayer routine',
        status: HabitStatus.ACTIVE,
        startDate: new Date(),
        frequency: { type: HabitFrequencyType.DAILY },
        type: HabitType.BINARY,
        icon: '🙏',
        color: '#4CAF50',
        createdAt: new Date(),
        userId: '',
      });
      
      // Create a sample count habit
      await habitService.add({
        title: 'Water Glasses',
        description: 'Drink 8 glasses of water daily',
        status: HabitStatus.ACTIVE,
        startDate: new Date(),
        frequency: { type: HabitFrequencyType.DAILY },
        type: HabitType.COUNT,
        icon: '💧',
        color: '#2196F3',
        dailyTarget: 8,
        dailyTargetComparison: HabitTargetComparison.AT_LEAST,
        createdAt: new Date(),
        userId: '',
      });
      
      // Create a sample duration habit
      await habitService.add({
        title: 'Exercise',
        description: 'Daily exercise routine',
        status: HabitStatus.ACTIVE,
        startDate: new Date(),
        frequency: { type: HabitFrequencyType.DAILY },
        type: HabitType.DURATION,
        icon: '🏃',
        color: '#FF9800',
        dailyTarget: 30,
        dailyTargetComparison: HabitTargetComparison.AT_LEAST,
        createdAt: new Date(),
        userId: '',
      });
      
      console.log('✅ Sample habits created successfully!');
      loadData(); // Reload data
    } catch (error: any) {
      console.error('❌ Error creating sample habits:', error);
      Alert.alert('Error', error.message);
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
        frequency: { type: HabitFrequencyType.DAILY },
        type: HabitType.BINARY,
        icon: '🎯',
        color: '#2196F3',
        createdAt: new Date(),
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

  const handleLogHabit = async (logData: Omit<HabitLog, 'id'>) => {
    try {
      // Check if already logged today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingLog = habitLogs.find(log => {
        // Check if log and log.date exist before comparison
        if (!log || !log.date) {
          return false;
        }
        
        try {
          return log.habitId === logData.habitId && log.date >= today;
        } catch (error) {
          console.error(`Error processing habit log date for update:`, error, log);
          return false;
        }
      });

      if (existingLog) {
        // Update existing log - ensure no undefined values
        const updateData: Partial<HabitLog> = {};
        
        // Only include fields that have valid values (status is calculated on-the-fly)
        if (logData.value !== undefined) updateData.value = logData.value;
        if (logData.completedChecklistItems !== undefined) updateData.completedChecklistItems = logData.completedChecklistItems;
        if (logData.notes !== undefined) updateData.notes = logData.notes;
        
        // Ensure we have at least one field to update
        if (Object.keys(updateData).length > 0) {
          await habitLogService.update(existingLog.id, updateData);
        }
      } else {
        // Create new log - ensure all required fields are present (no status needed)
        const newLogData = {
          ...logData,
          userId: logData.userId || '',
        };
        
        await habitLogService.add(newLogData);
      }
      
      loadData();
      Alert.alert('Success', `Habit logged successfully!`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const getHabitLogStatus = (habitId: string): HabitLogStatus | null => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLog = habitLogs.find(log => {
      // Check if log and log.date exist before comparison
      if (!log || !log.date) {
        return false;
      }
      
      try {
        return log.habitId === habitId && log.date >= today;
      } catch (error) {
        console.error(`Error processing habit log date for status check:`, error, log);
        return false;
      }
    });
    
    // Calculate status on-the-fly instead of reading from database
    if (todayLog) {
      const habit = habits.find(h => h.id === habitId);
      if (habit) {
        const calculatedStatus = calculateHabitStatus(habit, todayLog);
        return calculatedStatus.status;
      }
    }
    
    return null;
  };

  const getStatusColor = (status: HabitLogStatus | null) => {
    switch (status) {
      case HabitLogStatus.COMPLETED: return '#4CAF50';
      case HabitLogStatus.SKIPPED: return '#FF9800';
      case HabitLogStatus.FAILED: return '#F44336';
      case HabitLogStatus.PARTIAL: return '#FF9800';
      default: return '#ccc';
    }
  };

  const getStatusIcon = (status: HabitLogStatus | null) => {
    switch (status) {
      case HabitLogStatus.COMPLETED: return '✅';
      case HabitLogStatus.SKIPPED: return '⏰';
      case HabitLogStatus.FAILED: return '❌';
      case HabitLogStatus.PARTIAL: return '🔄';
      default: return '⭕';
    }
  };

  // Calendar view functions
  const getWeekDays = () => {
    const weekDays = [];
    const today = new Date(selectedDate);
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };

  const getHabitsForDate = (date: Date) => {
    return habits.filter(habit => shouldShowHabitOnDate(habit, date, habitLogs));
  };

  const getHabitLogForDate = (habitId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return habitLogs.find(log => {
      // Check if log and log.date exist
      if (!log || !log.date) {
        console.warn(`Habit log missing date for habit ${habitId}:`, log);
        return false;
      }
      
      try {
        // Use utility function to get date consistently
        const logDate = getLogDate(log);
        const logDateStr = logDate.toISOString().split('T')[0];
        return log.habitId === habitId && logDateStr === dateStr;
      } catch (error) {
        console.error(`Error processing habit log date for habit ${habitId}:`, error, log);
        return false;
      }
    });
  };

  const handleHabitSelect = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (habit && habit.type !== HabitType.BINARY) {
      setHabitToLog(habit);
      setShowHabitLoggingModal(true);
    } else {
      setSelectedHabitId(habitId);
    }
  };

  const handleHabitLoggingClose = () => {
    setShowHabitLoggingModal(false);
    setHabitToLog(null);
  };

  // Render different views based on filter state
  const renderMainContent = () => {
    const currentFilter = filterState.abhyasa.activeFilter;
    
    switch (currentFilter) {
      case 'filter:goals':
        return renderGoalsView();
      case 'filter:milestones':
        return renderMilestonesView();
      case 'filter:habits':
        return renderAllHabitsView();
      case 'filter:calendar':
        return renderCalendarView();
      default:
        return renderDefaultView();
    }
  };

  const renderDefaultView = () => (
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
                    onPress={() => handleLogHabit({
                      habitId: habit.id,
                      date: new Date(),
                      status: HabitLogStatus.COMPLETED,
                      userId: '',
                    })}
                  >
                    <Text style={styles.buttonIcon}>✓</Text>
                    <Text style={styles.logButtonText}>Done</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.logButton,
                      { backgroundColor: getStatusColor(HabitLogStatus.SKIPPED) }
                    ]}
                    onPress={() => handleLogHabit({
                      habitId: habit.id,
                      date: new Date(),
                      status: HabitLogStatus.SKIPPED,
                      userId: '',
                    })}
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
  );

  const renderAllHabitsView = () => (
    <ScrollView 
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadData} />
      }
    >
      <View style={styles.viewHeader}>
        <Text style={styles.viewTitle}>🔄 All Habits</Text>
        <Text style={styles.viewSubtitle}>Manage and track all your habits</Text>
      </View>
      
      {habits.length === 0 ? (
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
                <Text style={styles.habitStatus}>
                  Status: {habit.status}
                </Text>
              </View>
              
              {habit.description && (
                <Text style={styles.habitDescription}>{habit.description}</Text>
              )}
              
              <View style={styles.habitActions}>
                <TouchableOpacity
                  style={[
                    styles.logButton,
                    { backgroundColor: getStatusColor(HabitLogStatus.COMPLETED) }
                  ]}
                  onPress={() => handleLogHabit({
                    habitId: habit.id,
                    date: new Date(),
                    status: HabitLogStatus.COMPLETED,
                    userId: '',
                  })}
                >
                  <Text style={styles.buttonIcon}>✓</Text>
                  <Text style={styles.logButtonText}>Done</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.logButton,
                    { backgroundColor: getStatusColor(HabitLogStatus.SKIPPED) }
                  ]}
                  onPress={() => handleLogHabit({
                    habitId: habit.id,
                    date: new Date(),
                    status: HabitLogStatus.SKIPPED,
                    userId: '',
                  })}
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
      )}
    </ScrollView>
  );

  const renderCalendarView = () => {
    const weekDays = getWeekDays();
    const habitsForSelectedDay = getHabitsForDate(selectedDate);
    
    console.log('📅 Calendar View Debug:', {
      totalHabits: habits.length,
      selectedDate: selectedDate.toISOString(),
      habitsForSelectedDay: habitsForSelectedDay.length,
      weekDays: weekDays.length
    });
    
    if (habits.length > 0) {
      console.log('🎯 First habit:', habits[0]);
      console.log('🔍 Should show on selected date:', shouldShowHabitOnDate(habits[0], selectedDate, habitLogs));
    }
    
    return (
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        {/* Calendar Header */}
        <View style={styles.calendarHeader}>
          {habits.length === 0 && (
            <TouchableOpacity
              style={styles.createSampleButton}
              onPress={createSampleHabits}
            >
              <Text style={styles.createSampleButtonText}>Create Sample Habits</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Week Navigation */}
        <View style={styles.weekNavigation}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() - 7);
              setSelectedDate(newDate);
            }}
          >
            <Text style={styles.navButtonText}>← Previous Week</Text>
          </TouchableOpacity>
          
          <Text style={styles.currentWeekText}>
            {weekDays[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </Text>
          
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() + 7);
              setSelectedDate(newDate);
            }}
          >
            <Text style={styles.navButtonText}>Next Week →</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {/* Day Headers */}
          <View style={styles.dayHeaders}>
            <View style={styles.habitNameHeader}>
              <Text style={styles.dayHeaderText}>Habits</Text>
            </View>
            {weekDays.map((day, index) => (
              <View key={index} style={styles.dayHeader}>
                <Text style={styles.dayDateText}>
                  {day.getDate()}
                </Text>
                <Text style={styles.dayHeaderText}>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
              </View>
            ))}
          </View>

          {/* Habit Rows */}
          {habits.map((habit) => {
            // Additional safety check for habit data
            if (!habit || !habit.id || !habit.title) {
              console.warn('Skipping invalid habit:', habit);
              return null;
            }
            
            return (
              <View key={habit.id} style={styles.habitRow}>
                <View style={styles.habitNameCell}>
                  <Text style={styles.habitName} numberOfLines={1}>
                    {habit.title}
                  </Text>
                </View>
                
                {weekDays.map((day, dayIndex) => {
                  try {
                    const log = getHabitLogForDate(habit.id, day);
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                      <TouchableOpacity
                        key={dayIndex}
                        style={[
                          styles.dayCell,
                          isToday && styles.todayCell,
                          log && styles.completedDayCell
                        ]}
                        onPress={() => {
                          setSelectedDate(day);
                          setSelectedHabitId(habit.id);
                        }}
                      >
                        {log ? (
                          <Text style={styles.completedIcon}>✓</Text>
                        ) : (
                          <Text style={styles.emptyDayIcon}>○</Text>
                        )}
                      </TouchableOpacity>
                    );
                  } catch (error) {
                    console.error('Error rendering day cell:', error, { habit, day, dayIndex });
                    return (
                      <View key={dayIndex} style={styles.dayCell}>
                        <Text style={styles.errorIcon}>⚠️</Text>
                      </View>
                    );
                  }
                })}
              </View>
            );
          })}
        </View>

        {/* Selected Day Details */}
        {habitsForSelectedDay.length > 0 && (
          <View style={styles.selectedDayDetails}>
            <Text style={styles.selectedDayTitle}>
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            
                         {habitsForSelectedDay.map(habit => {
               try {
                 const log = getHabitLogForDate(habit.id, selectedDate) || null;
                 return (
                   <HabitCard
                     key={habit.id}
                     habit={habit}
                     log={log}
                     date={selectedDate}
                     onLog={handleLogHabit}
                     onSelect={handleHabitSelect}
                     isSelected={selectedHabitId === habit.id}
                   />
                 );
               } catch (error) {
                 console.error('Error rendering habit card:', error, { habit, selectedDate });
                 return (
                   <View key={habit.id} style={styles.errorHabitCard}>
                     <Text style={styles.errorText}>⚠️ Error loading habit: {habit.title}</Text>
                   </View>
                 );
               }
             })}
          </View>
        )}
        {/* Habit Logging Modal */}
        <HabitLoggingModal
          visible={showHabitLoggingModal}
          habit={habitToLog}
          date={selectedDate}
          existingLog={habitToLog ? getHabitLogForDate(habitToLog.id, selectedDate) || null : null}
          onClose={handleHabitLoggingClose}
          onLog={handleLogHabit}
        />
      </ScrollView>
    );
  };

  const renderGoalsView = () => (
    <ScrollView 
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadData} />
      }
    >
      <View style={styles.viewHeader}>
        <Text style={styles.viewTitle}>🎯 All Goals</Text>
        <Text style={styles.viewSubtitle}>Track your long-term objectives</Text>
      </View>
      
      {goals.length === 0 ? (
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
      )}
    </ScrollView>
  );

  const renderMilestonesView = () => (
    <ScrollView 
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadData} />
      }
    >
      <View style={styles.viewHeader}>
        <Text style={styles.viewTitle}>🏁 All Milestones</Text>
        <Text style={styles.viewSubtitle}>Track your progress milestones</Text>
      </View>
      
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🏁</Text>
        <Text style={styles.emptyText}>No milestones yet</Text>
        <Text style={styles.emptySubtext}>Milestones will appear here</Text>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.hamburgerButton}
            onPress={() => setShowDrawer(true)}
          >
            <Text style={styles.hamburgerIcon}>☰</Text>
          </TouchableOpacity>
          
          {/* Show filter title when not in default view */}
          {filterState.abhyasa.activeFilter !== 'all' ? (
            <View style={styles.filterTitleContainer}>
              <Text style={styles.filterTitle}>
                {getFilterTitle('Abhyasa')}
              </Text>
            </View>
          ) : (
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
          )}
        </View>
      </View>

      {/* Main Content */}
      {renderMainContent()}

      {/* Add Button - only show in default view */}
      {filterState.abhyasa.activeFilter === 'all' && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => activeTab === 'habits' ? setShowAddHabit(true) : setShowAddGoal(true)}
        >
          <Text style={styles.addButtonIcon}>➕</Text>
        </TouchableOpacity>
      )}

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
  filterTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  viewHeader: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  viewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  viewSubtitle: {
    fontSize: 16,
    color: '#666',
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
  habitStatus: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
    marginTop: 4,
  },
  habitDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
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
  // Calendar View Styles
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  navButton: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  navButtonText: {
    fontSize: 18,
    color: '#333',
  },
  currentWeekText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dayContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeader: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    minWidth: 50,
  },
  selectedDayHeader: {
    backgroundColor: '#2196F3',
  },
  todayHeader: {
    backgroundColor: '#e3f2fd',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedDayText: {
    color: 'white',
  },
  todayText: {
    color: '#1976d2',
  },
  dayHabits: {
    width: '100%',
  },
  dayHabitItem: {
    backgroundColor: '#f5f5f5',
    padding: 8,
    marginBottom: 5,
    borderRadius: 6,
    alignItems: 'center',
  },
  completedHabitItem: {
    backgroundColor: '#e8f5e8',
  },
  dayHabitTitle: {
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  dayHabitStatus: {
    fontSize: 12,
  },
  selectedDaySection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },
  selectedDayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyDayState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyDayText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  createSampleButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 10,
  },
  createSampleButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // New styles for calendar grid
  calendarHeader: {
    marginBottom: 20,
    paddingBottom: 15,
    alignItems: 'center',
  },
  calendarGrid: {
    marginBottom: 20,
  },
  dayHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 10,
  },
  habitNameHeader: {
    width: 100,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
    marginTop: 2,
  },
  dayDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  habitRow: {
    flexDirection: 'row',
    marginBottom: 8,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  habitNameCell: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitName: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  dayCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 2,
    backgroundColor: '#f8f9fa',
  },
  todayCell: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  completedDayCell: {
    backgroundColor: '#e8f5e8',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  completedIcon: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyDayIcon: {
    color: '#ccc',
    fontSize: 16,
  },
  errorIcon: {
    color: '#FF9800',
    fontSize: 20,
  },
  selectedDayDetails: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },
  errorHabitCard: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF9800',
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default AbhyasaScreen;
