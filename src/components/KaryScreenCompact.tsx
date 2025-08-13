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
import { Task, List, Tag, Subtask } from '../types/kary';
import SimpleDrawer from '../navigation/SimpleDrawerNavigator';
import { useFilter } from '../contexts/FilterContext';
import TaskDetailsModalEmailUI from './TaskDetailsModalEmailUI';

const { width: screenWidth } = Dimensions.get('window');

// Compact Color Scheme (Email-style)
const CompactColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#202124',
  textSecondary: '#5F6368',
  textMuted: '#9AA0A6',
  border: '#E8EAED',
  borderLight: '#F1F3F4',
  primary: '#1A73E8',
  checkbox: '#5F6368',
  checkboxChecked: '#1A73E8',
  red: '#EA4335',
  orange: '#FF6D01',
  yellow: '#FDD663',
  green: '#34A853',
  blue: '#4285F4',
  purple: '#9C27B0',
  grey: '#9AA0A6',
};

const KaryScreenCompact = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  
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
        listId: selectedListId,
        completed: false,
        priority: 3,
        tags: [],
        createdAt: new Date(),
      });
      
      setNewTaskTitle('');
      setShowAddTask(false);
      loadData();
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

  const handleCompleteSubtask = async (taskId: string, subtaskId: string, completed: boolean) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task || !task.subtasks) return;

      const updatedSubtasks = task.subtasks.map(subtask =>
        subtask.id === subtaskId 
          ? { ...subtask, completed: !completed }
          : subtask
      );

      const updatedTask = { ...task, subtasks: updatedSubtasks };
      
      setTasks(prevTasks => 
        prevTasks.map(t => t.id === taskId ? updatedTask : t)
      );

      await taskService.update(taskId, { subtasks: updatedSubtasks });
    } catch (error: any) {
      console.error('Error updating subtask:', error);
      loadData();
      Alert.alert('Error', `Failed to update subtask: ${error.message}`);
    }
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
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
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  // Smart filtering
  const getFilteredTasks = () => {
    let filtered = tasks;
    const { activeFilter } = filterState.kary;

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

  const isOverdue = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const getPriorityColor = (priority: number | undefined) => {
    switch (priority) {
      case 1: return CompactColors.red;    // Urgent
      case 2: return CompactColors.orange; // High  
      case 3: return CompactColors.yellow; // Medium
      case 4: return CompactColors.green;  // Low
      default: return CompactColors.grey;
    }
  };

  const selectedList = lists.find(list => list.id === filterState.kary.selectedListId);
  const completedCount = filteredTasks.filter(task => task.completed).length;
  const totalCount = filteredTasks.length;

  const renderTaskItem = (task: Task, isSubtask = false, parentTaskId?: string) => {
    const isExpanded = expandedTasks.has(task.id);
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    
    return (
      <View key={task.id}>
        {/* Main Task Row */}
        <View style={[
          styles.taskRow,
          isSubtask && styles.subtaskRow,
          task.completed && styles.completedTaskRow
        ]}>
          {/* Checkbox */}
          <TouchableOpacity 
            style={[
              styles.checkbox,
              task.completed && styles.checkboxCompleted
            ]}
            onPress={() => {
              if (isSubtask && parentTaskId) {
                handleCompleteSubtask(parentTaskId, task.id, task.completed);
              } else {
                handleCompleteTask(task.id, task.completed);
              }
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {task.completed && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
          
          {/* Task Content */}
          <TouchableOpacity 
            style={styles.taskContent}
            onPress={() => !isSubtask && openTaskDetails(task)}
            activeOpacity={0.7}
          >
            <View style={styles.taskTextContainer}>
              <Text style={[
                styles.taskTitle,
                task.completed && styles.completedTaskTitle,
                isSubtask && styles.subtaskTitle
              ]}>
                {task.title}
              </Text>
              
              {/* Task Meta - only for main tasks */}
              {!isSubtask && (
                <View style={styles.taskMeta}>
                  {task.dueDate && (
                    <Text style={[
                      styles.dueDate,
                      isOverdue(task.dueDate) && styles.overdueMeta
                    ]}>
                      {formatDueDate(task.dueDate)}
                    </Text>
                  )}
                  
                  {task.priority && task.priority > 0 && (
                    <View style={[
                      styles.priorityFlag,
                      { backgroundColor: getPriorityColor(task.priority) }
                    ]} />
                  )}
                  
                  {task.tags && task.tags.length > 0 && (
                    <Text style={styles.tagCount}>
                      {task.tags.length} tag{task.tags.length > 1 ? 's' : ''}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>
          
          {/* Expand/Collapse Button for tasks with subtasks */}
          {!isSubtask && hasSubtasks && (
            <TouchableOpacity 
              style={styles.expandButton}
              onPress={() => toggleTaskExpansion(task.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.expandIcon}>
                {isExpanded ? '⌄' : '⌃'}
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Three-dot menu for main tasks */}
          {!isSubtask && (
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={() => openTaskDetails(task)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.moreIcon}>⋮</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Subtasks */}
        {!isSubtask && hasSubtasks && isExpanded && (
          <View style={styles.subtasksContainer}>
            {task.subtasks!.map((subtask) => (
              renderTaskItem(subtask, true, task.id)
            ))}
          </View>
        )}
        
        {/* Divider */}
        {!isSubtask && <View style={styles.taskDivider} />}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={CompactColors.surface} barStyle="dark-content" />
      
      {/* Compact Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setShowDrawer(true)}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            {getFilterTitle('kary', lists)}
          </Text>
          
          <TouchableOpacity style={styles.moreButton}>
            <Text style={styles.moreIcon}>⋮</Text>
          </TouchableOpacity>
        </View>
        
        {totalCount > 0 && (
          <Text style={styles.headerSubtitle}>
            {completedCount}/{totalCount} completed
          </Text>
        )}
      </View>

      {/* Compact Tasks List */}
      <ScrollView 
        style={styles.tasksList}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={loadData}
            colors={[CompactColors.primary]}
            progressBackgroundColor={CompactColors.surface}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>
              {selectedList ? `Add your first task to ${selectedList.name}` : 'Create a list and add tasks'}
            </Text>
          </View>
        ) : (
          <View style={styles.tasksContainer}>
            {/* Active Tasks */}
            {filteredTasks.filter(task => !task.completed).map((task) => 
              renderTaskItem(task)
            )}
            
            {/* Completed Tasks */}
            {filteredTasks.filter(task => task.completed).map((task) => 
              renderTaskItem(task)
            )}
          </View>
        )}
      </ScrollView>

      {/* Compact FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddTask(true)}
        disabled={!selectedListId}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Add Task Modal */}
      <Modal visible={showAddTask} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Task</Text>
              
              <TextInput
                style={styles.textInput}
                placeholder="Enter task title..."
                placeholderTextColor={CompactColors.textMuted}
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
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
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.addButton]}
                  onPress={handleAddTask}
                >
                  <Text style={styles.addButtonText}>Add Task</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Drawer */}
      <SimpleDrawer
        isVisible={showDrawer}
        onClose={() => setShowDrawer(false)}
        currentModule="Kary"
        onModuleChange={() => setShowDrawer(false)}
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
    backgroundColor: CompactColors.background,
  },
  
  // Compact Header
  header: {
    backgroundColor: CompactColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: CompactColors.border,
    paddingTop: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuButton: {
    padding: 8,
    marginRight: 8,
  },
  menuIcon: {
    fontSize: 20,
    color: CompactColors.text,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: CompactColors.text,
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 13,
    color: CompactColors.textSecondary,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  moreButton: {
    padding: 8,
  },
  moreIcon: {
    fontSize: 16,
    color: CompactColors.textSecondary,
    fontWeight: '600',
  },
  
  // Tasks List
  tasksList: {
    flex: 1,
  },
  tasksContainer: {
    paddingBottom: 80,
  },
  
  // Compact Task Rows
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
    backgroundColor: CompactColors.surface,
  },
  subtaskRow: {
    paddingLeft: 48, // Indent subtasks
    paddingVertical: 6,
    minHeight: 40,
  },
  completedTaskRow: {
    opacity: 0.6,
  },
  
  // Compact Checkbox
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: CompactColors.checkbox,
    borderRadius: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: CompactColors.checkboxChecked,
    borderColor: CompactColors.checkboxChecked,
  },
  checkmark: {
    color: CompactColors.background,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 10,
  },
  
  // Task Content
  taskContent: {
    flex: 1,
    paddingRight: 8,
  },
  taskTextContainer: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    color: CompactColors.text,
    lineHeight: 20,
    fontWeight: '400',
  },
  subtaskTitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: CompactColors.textMuted,
  },
  
  // Task Meta
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 8,
  },
  dueDate: {
    fontSize: 12,
    color: CompactColors.textSecondary,
  },
  overdueMeta: {
    color: CompactColors.red,
  },
  priorityFlag: {
    width: 12,
    height: 8,
    borderRadius: 1,
  },
  tagCount: {
    fontSize: 11,
    color: CompactColors.textMuted,
  },
  
  // Expand/Collapse
  expandButton: {
    padding: 8,
    marginRight: 4,
  },
  expandIcon: {
    fontSize: 12,
    color: CompactColors.textSecondary,
  },
  
  // Subtasks
  subtasksContainer: {
    backgroundColor: CompactColors.surface,
  },
  
  // Divider
  taskDivider: {
    height: 1,
    backgroundColor: CompactColors.borderLight,
    marginLeft: 46, // Align with task content
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 48,
    opacity: 0.3,
  },
  emptyText: {
    fontSize: 16,
    color: CompactColors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: CompactColors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Compact FAB
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: CompactColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  fabIcon: {
    fontSize: 24,
    color: CompactColors.background,
    fontWeight: '300',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: CompactColors.surface,
    borderRadius: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: CompactColors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: CompactColors.border,
    borderRadius: 4,
    padding: 12,
    fontSize: 14,
    color: CompactColors.text,
    backgroundColor: CompactColors.surface,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    minWidth: 70,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    color: CompactColors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: CompactColors.primary,
  },
  addButtonText: {
    color: CompactColors.background,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default KaryScreenCompact;
