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
  StatusBar,
  Dimensions,
} from 'react-native';
import { taskService, listService, tagService } from '../services/dataService';
import { Task, List, Tag } from '../types/kary';
import SimpleDrawer from '../navigation/SimpleDrawerNavigator';
import { useFilter } from '../contexts/FilterContext';
import TaskDetailsModalEmailUI from './TaskDetailsModalEmailUI';

const { width: screenWidth } = Dimensions.get('window');

// Material Design 3 Color System
const MD3Colors = {
  // Primary Colors
  primary: '#6750A4',
  onPrimary: '#FFFFFF',
  primaryContainer: '#EADDFF',
  onPrimaryContainer: '#21005D',
  
  // Secondary Colors
  secondary: '#625B71',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#E8DEF8',
  onSecondaryContainer: '#1D192B',
  
  // Tertiary Colors
  tertiary: '#7D5260',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFD8E4',
  onTertiaryContainer: '#31111D',
  
  // Error Colors
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',
  
  // Surface Colors
  surface: '#FFFBFE',
  onSurface: '#1C1B1F',
  surfaceVariant: '#E7E0EC',
  onSurfaceVariant: '#49454F',
  surfaceContainer: '#F3EDF7',
  surfaceContainerHigh: '#ECE6F0',
  surfaceContainerHighest: '#E6E0E9',
  
  // Background Colors
  background: '#FFFBFE',
  onBackground: '#1C1B1F',
  
  // Outline Colors
  outline: '#79747E',
  outlineVariant: '#CAC4D0',
  
  // Other Colors
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#313033',
  inverseOnSurface: '#F4EFF4',
  inversePrimary: '#D0BCFF',
};

// Material Design 3 Typography
const MD3Typography = {
  displayLarge: {
    fontSize: 57,
    lineHeight: 64,
    letterSpacing: -0.25,
    fontWeight: '400' as const,
  },
  displayMedium: {
    fontSize: 45,
    lineHeight: 52,
    letterSpacing: 0,
    fontWeight: '400' as const,
  },
  displaySmall: {
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: 0,
    fontWeight: '400' as const,
  },
  headlineLarge: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: 0,
    fontWeight: '400' as const,
  },
  headlineMedium: {
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: 0,
    fontWeight: '400' as const,
  },
  headlineSmall: {
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0,
    fontWeight: '400' as const,
  },
  titleLarge: {
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
    fontWeight: '500' as const,
  },
  titleMedium: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.15,
    fontWeight: '500' as const,
  },
  titleSmall: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
    fontWeight: '500' as const,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.5,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.25,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
    fontWeight: '400' as const,
  },
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
    fontWeight: '500' as const,
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    fontWeight: '500' as const,
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.5,
    fontWeight: '500' as const,
  },
};

const KaryScreenMaterial3 = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddList, setShowAddList] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<1 | 2 | 3 | 4>(3);
  const [newListName, setNewListName] = useState('');
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  
  const { filterState, getFilterTitle } = useFilter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksData, listsData, tagsData] = await Promise.all([
        taskService.getAll(),
        listService.getAll(),
        tagService.getAll(),
      ]);
      
      setTasks(tasksData);
      setLists(listsData);
      setTags(tagsData);
      
      if (!selectedListId && listsData.length > 0) {
        setSelectedListId(listsData[0].id);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    if (!selectedListId) {
      Alert.alert('Error', 'Please select a list first');
      return;
    }

    try {
      await taskService.add({
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        listId: selectedListId,
        completed: false,
        priority: newTaskPriority,
        dueDate: newTaskDueDate ? new Date(newTaskDueDate) : undefined,
        tags: [],
        createdAt: new Date(),
      });
      
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskDueDate('');
      setNewTaskPriority(3);
      setShowAddTask(false);
      loadData();
      Alert.alert('Success', 'Task added!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleCompleteTask = async (taskId: string, completed: boolean) => {
    try {
      const updatedTasks = tasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              completed: !completed,
              completionDate: !completed ? new Date() : undefined,
            }
          : task
      );
      setTasks(updatedTasks);

      await taskService.update(taskId, { 
        completed: !completed,
        completionDate: !completed ? new Date() : undefined,
      });
    } catch (error: any) {
      console.error('Error updating task completion:', error);
      loadData();
      Alert.alert('Error', `Failed to update task: ${error.message}`);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await taskService.delete(taskId);
              loadData();
              Alert.alert('Success', 'Task deleted!');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const openTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const closeTaskDetails = () => {
    setSelectedTask(null);
    setShowTaskDetails(false);
  };

  const handleTaskSave = async (updatedTask: Task) => {
    try {
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === updatedTask.id ? updatedTask : task
        )
      );

      await taskService.update(updatedTask.id, updatedTask);
    } catch (error: any) {
      console.error('Error saving task:', error);
      loadData();
      Alert.alert('Error', `Failed to save task: ${error.message}`);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await taskService.delete(taskId);
      loadData();
      Alert.alert('Success', 'Task deleted!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  // Smart filtering based on filter context state
  const getFilteredTasks = () => {
    let filtered = tasks;
    const { activeFilter, selectedListId, selectedTagId } = filterState.kary;

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    switch (activeFilter) {
      case 'filter:today':
        return filtered.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate.toDateString() === today.toDateString();
        });
      case 'filter:due':
        return filtered.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate <= today && !task.completed;
        });
      case 'filter:upcoming':
        return filtered.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate > today && dueDate <= nextWeek;
        });
      case activeFilter.startsWith('list:') && activeFilter:
        const listId = activeFilter.replace('list:', '');
        return filtered.filter(task => task.listId === listId);
      case activeFilter.startsWith('tag:') && activeFilter:
        const tagName = activeFilter.replace('tag:', '');
        return filtered.filter(task => 
          task.tags && task.tags.some(tag => tag.toLowerCase().includes(tagName.toLowerCase()))
        );
      default:
        return filtered;
    }
  };

  const filteredTasks = getFilteredTasks();

  // Helper functions
  const formatDueDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      const options: Intl.DateTimeFormatOptions = { 
        month: 'short', 
        day: 'numeric'
      };
      return date.toLocaleDateString('en-US', options);
    }
  };

  const isDueSoon = (date: Date) => {
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    return date <= threeDaysFromNow && date >= today;
  };

  const isOverdue = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const getPriorityColor = (priority: number | undefined) => {
    switch (priority) {
      case 1: return MD3Colors.error; // Urgent
      case 2: return '#FF6B35'; // High  
      case 3: return '#FFA726'; // Medium
      case 4: return '#66BB6A'; // Low
      default: return MD3Colors.onSurfaceVariant;
    }
  };

  const getPriorityIcon = (priority: number | undefined) => {
    switch (priority) {
      case 1: return '🚨';
      case 2: return '🔥';
      case 3: return '⚡';
      case 4: return '🌱';
      default: return '';
    }
  };

  const selectedList = lists.find(list => list.id === filterState.kary.selectedListId);
  const completedCount = filteredTasks.filter(task => task.completed).length;
  const totalCount = filteredTasks.length;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={MD3Colors.surface} barStyle="dark-content" />
      
      {/* Material 3 Top App Bar */}
      <View style={styles.topAppBar}>
        <View style={styles.appBarContent}>
          <TouchableOpacity 
            style={styles.navigationIcon}
            onPress={() => setShowDrawer(true)}
          >
            <Text style={styles.navIcon}>☰</Text>
          </TouchableOpacity>
          
          <View style={styles.appBarTextContainer}>
            <Text style={[styles.appBarTitle, MD3Typography.titleLarge]}>
              {getFilterTitle('kary', lists)}
            </Text>
            <Text style={[styles.appBarSubtitle, MD3Typography.bodyMedium]}>
              {completedCount}/{totalCount} completed
            </Text>
          </View>
        </View>
      </View>

      {/* Tasks List */}
      <ScrollView 
        style={styles.tasksList}
        contentContainerStyle={styles.tasksContainer}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={loadData}
            colors={[MD3Colors.primary]}
            progressBackgroundColor={MD3Colors.surface}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={[styles.emptyText, MD3Typography.bodyLarge]}>No tasks yet</Text>
            <Text style={[styles.emptySubtext, MD3Typography.bodyMedium]}>
              {selectedList ? `Add your first task to ${selectedList.name}` : 'Create a list and add tasks'}
            </Text>
          </View>
        ) : (
          <>
            {/* Active Tasks */}
            {filteredTasks.filter(task => !task.completed).map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <TouchableOpacity 
                  style={styles.taskCardContent}
                  onPress={() => openTaskDetails(task)}
                  activeOpacity={0.7}
                >
                  <View style={styles.taskRow}>
                    <TouchableOpacity 
                      style={styles.checkbox}
                      onPress={() => handleCompleteTask(task.id, true)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <View style={styles.checkboxBorder} />
                    </TouchableOpacity>
                    
                    <View style={styles.taskContent}>
                      <Text style={[styles.taskTitle, MD3Typography.bodyLarge]}>
                        {task.title}
                      </Text>
                      
                      {task.description && (
                        <Text style={[styles.taskDescription, MD3Typography.bodyMedium]}>
                          {task.description}
                        </Text>
                      )}
                      
                      <View style={styles.taskMeta}>
                        {task.dueDate && (
                          <View style={[
                            styles.dueDateChip,
                            isDueSoon(task.dueDate) && styles.dueSoonChip,
                            isOverdue(task.dueDate) && styles.overdueChip
                          ]}>
                            <Text style={styles.dueDateIcon}>📅</Text>
                            <Text style={[
                              styles.dueDateText,
                              MD3Typography.labelSmall,
                              isDueSoon(task.dueDate) && styles.dueSoonText,
                              isOverdue(task.dueDate) && styles.overdueText
                            ]}>
                              {formatDueDate(task.dueDate)}
                            </Text>
                          </View>
                        )}
                        
                        {task.priority && task.priority > 0 && (
                          <View style={[
                            styles.priorityChip,
                            { backgroundColor: getPriorityColor(task.priority) + '20' }
                          ]}>
                            <Text style={styles.priorityIcon}>
                              {getPriorityIcon(task.priority)}
                            </Text>
                            <Text style={[
                              styles.priorityText,
                              MD3Typography.labelSmall,
                              { color: getPriorityColor(task.priority) }
                            ]}>
                              P{task.priority}
                            </Text>
                          </View>
                        )}
                        
                        {task.tags && Array.isArray(task.tags) && task.tags.length > 0 && (
                          <View style={styles.tagsContainer}>
                            {task.tags.slice(0, 2).map((tag, index) => (
                              <View key={index} style={styles.tagChip}>
                                <Text style={[styles.tagText, MD3Typography.labelSmall]}>
                                  #{tag}
                                </Text>
                              </View>
                            ))}
                            {task.tags.length > 2 && (
                              <Text style={[styles.moreTagsText, MD3Typography.labelSmall]}>
                                +{task.tags.length - 2}
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.moreButton}
                      onPress={() => console.log('Task options:', task.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.moreIcon}>⋮</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
            
            {/* Completed Tasks Section */}
            {filteredTasks.filter(task => task.completed).length > 0 && (
              <View style={styles.completedSection}>
                <TouchableOpacity 
                  style={styles.completedHeader}
                  onPress={() => setShowCompleted(!showCompleted)}
                >
                  <Text style={[styles.completedHeaderText, MD3Typography.titleMedium]}>
                    Completed ({filteredTasks.filter(task => task.completed).length})
                  </Text>
                  <Text style={styles.chevron}>
                    {showCompleted ? '⌄' : '⌃'}
                  </Text>
                </TouchableOpacity>
                
                {showCompleted && filteredTasks.filter(task => task.completed).map((task) => (
                  <View key={task.id} style={[styles.taskCard, styles.completedTaskCard]}>
                    <TouchableOpacity 
                      style={styles.taskCardContent}
                      onPress={() => openTaskDetails(task)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.taskRow}>
                        <TouchableOpacity 
                          style={[styles.checkbox, styles.completedCheckbox]}
                          onPress={() => handleCompleteTask(task.id, false)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.checkmark}>✓</Text>
                        </TouchableOpacity>
                        
                        <View style={styles.taskContent}>
                          <Text style={[
                            styles.taskTitle, 
                            styles.completedTaskTitle,
                            MD3Typography.bodyLarge
                          ]}>
                            {task.title}
                          </Text>
                          {task.completionDate && (
                            <Text style={[styles.completionDate, MD3Typography.bodySmall]}>
                              Completed {formatDueDate(task.completionDate)}
                            </Text>
                          )}
                        </View>
                        
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => handleDeleteTask(task.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.deleteIcon}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Material 3 Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddTask(true)}
        disabled={!selectedListId}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Add Task Modal - Material 3 styled */}
      <Modal visible={showAddTask} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={[styles.modalTitle, MD3Typography.headlineSmall]}>
                Add New Task
              </Text>
              
              <TextInput
                style={[styles.textInput, MD3Typography.bodyLarge]}
                placeholder="Enter task title..."
                placeholderTextColor={MD3Colors.onSurfaceVariant}
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                multiline
                autoFocus
              />
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowAddTask(false);
                    setNewTaskTitle('');
                  }}
                >
                  <Text style={[styles.cancelButtonText, MD3Typography.labelLarge]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.addButton]}
                  onPress={handleAddTask}
                >
                  <Text style={[styles.addButtonText, MD3Typography.labelLarge]}>
                    Add Task
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Simple Drawer */}
      <SimpleDrawer
        isVisible={showDrawer}
        onClose={() => setShowDrawer(false)}
        currentModule="Kary"
        onModuleChange={(filter) => {
          setShowDrawer(false);
        }}
      />

      {/* Task Details Modal */}
      <TaskDetailsModalEmailUI
        visible={showTaskDetails}
        task={selectedTask}
        onClose={closeTaskDetails}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
        lists={lists}
        tags={tags}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MD3Colors.background,
  },
  
  // Material 3 Top App Bar
  topAppBar: {
    backgroundColor: MD3Colors.surface,
    elevation: 4,
    shadowColor: MD3Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderBottomWidth: 1,
    borderBottomColor: MD3Colors.outlineVariant,
  },
  appBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 20,
  },
  navigationIcon: {
    padding: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  navIcon: {
    fontSize: 24,
    color: MD3Colors.onSurface,
  },
  appBarTextContainer: {
    flex: 1,
  },
  appBarTitle: {
    color: MD3Colors.onSurface,
    fontWeight: '500',
    marginBottom: 2,
  },
  appBarSubtitle: {
    color: MD3Colors.onSurfaceVariant,
  },
  
  // Tasks List
  tasksList: {
    flex: 1,
  },
  tasksContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    opacity: 0.5,
  },
  emptyText: {
    color: MD3Colors.onSurfaceVariant,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: MD3Colors.onSurfaceVariant,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  
  // Material 3 Task Cards
  taskCard: {
    backgroundColor: MD3Colors.surfaceContainer,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: MD3Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: MD3Colors.outlineVariant,
  },
  taskCardContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  completedTaskCard: {
    opacity: 0.6,
    backgroundColor: MD3Colors.surfaceVariant,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  
  // Material 3 Checkbox
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxBorder: {
    width: 20,
    height: 20,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: MD3Colors.primary,
    backgroundColor: 'transparent',
  },
  completedCheckbox: {
    backgroundColor: MD3Colors.primary,
    borderRadius: 4,
  },
  checkmark: {
    color: MD3Colors.onPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Task Content
  taskContent: {
    flex: 1,
    marginRight: 8,
  },
  taskTitle: {
    color: MD3Colors.onSurface,
    fontWeight: '500',
    marginBottom: 4,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: MD3Colors.onSurfaceVariant,
  },
  taskDescription: {
    color: MD3Colors.onSurfaceVariant,
    marginBottom: 8,
  },
  completionDate: {
    color: MD3Colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginTop: 4,
  },
  
  // Task Meta Information
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  
  // Material 3 Chips
  dueDateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MD3Colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dueSoonChip: {
    backgroundColor: '#FFF3E0',
  },
  overdueChip: {
    backgroundColor: MD3Colors.errorContainer,
  },
  dueDateIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  dueDateText: {
    color: MD3Colors.onSecondaryContainer,
    fontWeight: '500',
  },
  dueSoonText: {
    color: '#E65100',
  },
  overdueText: {
    color: MD3Colors.onErrorContainer,
  },
  
  priorityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  priorityText: {
    fontWeight: '500',
  },
  
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tagChip: {
    backgroundColor: MD3Colors.tertiaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    color: MD3Colors.onTertiaryContainer,
    fontWeight: '500',
  },
  moreTagsText: {
    color: MD3Colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  
  // Action Buttons
  moreButton: {
    padding: 8,
    marginTop: -4,
  },
  moreIcon: {
    fontSize: 20,
    color: MD3Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
    marginTop: -4,
  },
  deleteIcon: {
    fontSize: 18,
  },
  
  // Completed Section
  completedSection: {
    marginTop: 24,
  },
  completedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  completedHeaderText: {
    color: MD3Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 16,
    color: MD3Colors.onSurfaceVariant,
  },
  
  // Material 3 Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: MD3Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: MD3Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  fabIcon: {
    fontSize: 24,
    color: MD3Colors.onPrimaryContainer,
    fontWeight: '400',
  },
  
  // Material 3 Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: MD3Colors.surfaceContainerHigh,
    borderRadius: 24,
    elevation: 8,
    shadowColor: MD3Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalContent: {
    padding: 24,
  },
  modalTitle: {
    color: MD3Colors.onSurface,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: MD3Colors.outline,
    borderRadius: 8,
    padding: 16,
    color: MD3Colors.onSurface,
    backgroundColor: MD3Colors.surface,
    marginBottom: 24,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    color: MD3Colors.primary,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: MD3Colors.primary,
  },
  addButtonText: {
    color: MD3Colors.onPrimary,
    fontWeight: '500',
  },
});

export default KaryScreenMaterial3;

