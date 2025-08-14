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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { taskService, listService, tagService } from '../services/dataService';
import { Task, List, Tag } from '../types/kary';
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
  
  // Quick add panel state
  const [showQuickAddPanel, setShowQuickAddPanel] = useState(false);
  const [quickAddTask, setQuickAddTask] = useState({
    title: '',
    dueDate: undefined as Date | undefined,
    priority: 3 as 1 | 2 | 3 | 4,
    tags: [] as string[],
    listId: ''
  });
  const [showQuickAddDatePicker, setShowQuickAddDatePicker] = useState(false);
  const [showQuickAddPriorityMenu, setShowQuickAddPriorityMenu] = useState(false);
      const [showQuickAddTagsMenu, setShowQuickAddTagsMenu] = useState(false);
    const [showQuickAddListsMenu, setShowQuickAddListsMenu] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    
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
      
      // Set default list for quick add
      if (listsData.length > 0) {
        setQuickAddTask(prev => ({
          ...prev,
          listId: selectedListId || listsData[0].id
        }));
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
        priority: 3, // Use number priority format to match web app
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      setNewTaskTitle('');
      setShowAddTask(false);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  // Quick add task function
  const handleQuickAddTask = async () => {
    if (!quickAddTask.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    if (!quickAddTask.listId) {
      Alert.alert('Error', 'Please select a list first');
      return;
    }

    try {
      await taskService.add({
        title: quickAddTask.title.trim(),
        listId: quickAddTask.listId,
        completed: false,
        priority: quickAddTask.priority,
        tags: quickAddTask.tags,
        dueDate: quickAddTask.dueDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Reset quick add form
      setQuickAddTask({
        title: '',
        dueDate: undefined,
        priority: 3,
        tags: [],
        listId: quickAddTask.listId // Keep the same list
      });
      
      setShowQuickAddPanel(false);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  // Quick add panel handlers
      const handleQuickAddDateChange = (date: Date) => {
      setQuickAddTask(prev => ({ ...prev, dueDate: date }));
      // Don't close modal automatically - let user choose when to close
    };

    const handleMonthChange = (direction: 'prev' | 'next') => {
      const newMonth = new Date(currentMonth);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      setCurrentMonth(newMonth);
    };

    const handleTimeChange = (hour: number, minute: number) => {
      if (quickAddTask.dueDate) {
        const newDate = new Date(quickAddTask.dueDate);
        newDate.setHours(hour, minute, 0, 0);
        setQuickAddTask(prev => ({ ...prev, dueDate: newDate }));
      }
      setShowTimePicker(false);
    };

  const handleQuickAddPriorityChange = (priority: 1 | 2 | 3 | 4) => {
    setQuickAddTask(prev => ({ ...prev, priority }));
    setShowQuickAddPriorityMenu(false);
  };

  const handleQuickAddTagToggle = (tagId: string) => {
    setQuickAddTask(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  const handleQuickAddListChange = (listId: string) => {
    setQuickAddTask(prev => ({ ...prev, listId }));
    setShowQuickAddListsMenu(false);
  };

  const handleCompleteTask = async (taskId: string, completed: boolean) => {
    try {
      const updatedTasks = tasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              completed: !completed,
              completionDate: !completed ? new Date() : null,
            }
          : task
      );
      setTasks(updatedTasks);

      // Prepare update data - only include defined values
      const updateData: Partial<Task> = { 
        completed: !completed,
      };
      
      if (!completed) {
        updateData.completionDate = new Date();
      } else {
        updateData.completionDate = null;
      }

      await taskService.update(taskId, updateData);
    } catch (error: any) {
      console.error('Error updating task completion:', error);
      loadData();
      Alert.alert('Error', `Failed to update task: ${error.message}`);
    }
  };

  const handleCompleteSubtask = async (parentTaskId: string, subtaskId: string, completed: boolean) => {
    try {
      // Find the subtask (child task) and update it directly
      const subtask = tasks.find(t => t.id === subtaskId);
      if (!subtask || subtask.parentId !== parentTaskId) return;

      // Update the subtask directly
      await taskService.update(subtaskId, { 
        completed: !completed,
        updatedAt: new Date()
      });

      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === subtaskId 
            ? { ...t, completed: !completed }
            : t
        )
      );
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
      // Update the main task
      await taskService.update(updatedTask.id, updatedTask);
      
      // Refresh all data to show any new/updated subtasks
      await loadData();
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



  // Smart filtering - Only show main tasks (not subtasks)
  const getFilteredTasks = () => {
    // Filter out subtasks (tasks with parentId) - only show main tasks
    let filtered = tasks.filter(task => !task.parentId);
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

    // Helper function to get all subtasks for a task (web app structure)
  const getTaskSubtasks = (task: Task): Task[] => {
    // Get child tasks with parentId (web app structure)
    return tasks.filter(t => t.parentId === task.id);
  };

  // Helper function to check if a task has subtasks (web app structure)
  const hasTaskSubtasks = (task: Task): boolean => {
    return getTaskSubtasks(task).length > 0;
  };

  const renderTaskItem = (task: Task, isSubtask = false, parentTaskId?: string) => {
    const isExpanded = expandedTasks.has(task.id);
    const hasSubtasks = hasTaskSubtasks(task);
    const taskSubtasks = getTaskSubtasks(task);
    
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
            {taskSubtasks.map((subtask) => (
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
               onPress={() => setShowQuickAddPanel(true)}
               disabled={!selectedListId}
               activeOpacity={0.8}
             >
               <Text style={styles.fabIcon}>+</Text>
             </TouchableOpacity>

             {/* Quick Add Modal */}
             <Modal 
               visible={showQuickAddPanel} 
               transparent 
               animationType="slide"
               onRequestClose={() => setShowQuickAddPanel(false)}
             >
               <TouchableOpacity 
                 style={styles.quickAddModalOverlay}
                 activeOpacity={1}
                 onPress={() => setShowQuickAddPanel(false)}
               >
                 <View style={styles.quickAddModalContent} onStartShouldSetResponder={() => true}>
                   {/* Header */}
                   <View style={styles.quickAddModalHeader}>
                     <Text style={styles.quickAddModalTitle}>Create a task</Text>
                     <TouchableOpacity 
                       style={styles.quickAddModalCloseButton}
                       onPress={() => setShowQuickAddPanel(false)}
                     >
                       <Text style={styles.quickAddModalCloseIcon}>✕</Text>
                     </TouchableOpacity>
                   </View>
                   
                   {/* Task Title Input */}
                   <View style={styles.quickAddModalInputRow}>
                     <TextInput
                       style={styles.quickAddModalInput}
                       placeholder="What would you like to do?"
                       placeholderTextColor={CompactColors.textMuted}
                       value={quickAddTask.title}
                       onChangeText={(text) => setQuickAddTask(prev => ({ ...prev, title: text }))}
                       autoFocus
                       multiline={false}
                     />
                   </View>
                   
                   {/* Action Icons Row */}
                   <View style={styles.quickAddModalIconsRow}>
                     <TouchableOpacity 
                       style={styles.quickAddModalIconButton}
                       onPress={() => setShowQuickAddDatePicker(true)}
                     >
                       <Text style={styles.quickAddModalIcon}>📅</Text>
                     </TouchableOpacity>
                     
                     <TouchableOpacity 
                       style={styles.quickAddModalIconButton}
                       onPress={() => setShowQuickAddPriorityMenu(true)}
                     >
                       <Text style={styles.quickAddModalIcon}>🚩</Text>
                     </TouchableOpacity>
                     
                     <TouchableOpacity 
                       style={styles.quickAddModalIconButton}
                       onPress={() => setShowQuickAddTagsMenu(true)}
                     >
                       <Text style={styles.quickAddModalIcon}>🏷️</Text>
                     </TouchableOpacity>
                     
                     <TouchableOpacity 
                       style={styles.quickAddModalIconButton}
                       onPress={() => setShowQuickAddListsMenu(true)}
                     >
                       <Text style={styles.quickAddModalIcon}>📋</Text>
                     </TouchableOpacity>
                     
                     <TouchableOpacity 
                       style={styles.quickAddModalIconButton}
                       onPress={() => {/* More options */}}
                     >
                       <Text style={styles.quickAddModalIcon}>⋯</Text>
                     </TouchableOpacity>
                   </View>
                   
                   {/* Add Button */}
                   <TouchableOpacity
                     style={styles.quickAddModalButton}
                     onPress={handleQuickAddTask}
                     disabled={!quickAddTask.title.trim()}
                   >
                     <Text style={styles.quickAddModalButtonText}>Add</Text>
                   </TouchableOpacity>
                 </View>
               </TouchableOpacity>
             </Modal>

                      {/* Quick Add Menus */}
                      {/* Simple Calendar Modal */}
                      <Modal
                        visible={showQuickAddDatePicker}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setShowQuickAddDatePicker(false)}
                      >
                        <TouchableOpacity 
                          style={styles.modalOverlay}
                          activeOpacity={1}
                          onPress={() => setShowQuickAddDatePicker(false)}
                        >
                          <View style={styles.dateTimePickerContent} onStartShouldSetResponder={() => true}>
                            {/* Header */}
                            <View style={styles.dateTimePickerHeader}>
                              <Text style={styles.dateTimePickerTitle}>Select Date</Text>
                              <TouchableOpacity 
                                style={styles.timePickerCloseButton}
                                onPress={() => setShowQuickAddDatePicker(false)}
                              >
                                <Text style={styles.timePickerCloseIcon}>✕</Text>
                              </TouchableOpacity>
                            </View>
                            
                            {/* Quick Date Selection */}
                            <View style={styles.quickDateSelectionRow}>
                              <TouchableOpacity 
                                style={styles.quickDateSelectionItem}
                                onPress={() => {
                                  const today = new Date();
                                  handleQuickAddDateChange(today);
                                  setShowQuickAddDatePicker(false);
                                }}
                              >
                                <View style={styles.quickDateIcon}>
                                  <Text style={styles.quickDateIconText}>📅</Text>
                                </View>
                                <Text style={styles.quickDateSelectionText}>Today</Text>
                              </TouchableOpacity>
                              
                              <TouchableOpacity 
                                style={styles.quickDateSelectionItem}
                                onPress={() => {
                                  const tomorrow = new Date();
                                  tomorrow.setDate(tomorrow.getDate() + 1);
                                  handleQuickAddDateChange(tomorrow);
                                  setShowQuickAddDatePicker(false);
                                }}
                              >
                                <View style={styles.quickDateIcon}>
                                  <Text style={styles.quickDateIconText}>📅</Text>
                                </View>
                                <Text style={styles.quickDateSelectionText}>Tomorrow</Text>
                              </TouchableOpacity>
                              
                              <TouchableOpacity 
                                style={styles.quickDateSelectionItem}
                                onPress={() => {
                                  const nextWeek = new Date();
                                  nextWeek.setDate(nextWeek.getDate() + 7);
                                  handleQuickAddDateChange(nextWeek);
                                  setShowQuickAddDatePicker(false);
                                }}
                              >
                                <View style={styles.quickDateIcon}>
                                  <Text style={styles.quickDateIconText}>📅</Text>
                                </View>
                                <Text style={styles.quickDateSelectionText}>Next Week</Text>
                              </TouchableOpacity>
                            </View>
                            
                            {/* Calendar */}
                            <View style={styles.calendarContainer}>
                              <View style={styles.calendarHeader}>
                                <TouchableOpacity 
                                  style={styles.calendarNavButton}
                                  onPress={() => handleMonthChange('prev')}
                                >
                                  <Text style={styles.calendarNavIcon}>‹</Text>
                                </TouchableOpacity>
                                
                                <Text style={styles.calendarMonthText}>
                                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </Text>
                                
                                <TouchableOpacity 
                                  style={styles.calendarNavButton}
                                  onPress={() => handleMonthChange('next')}
                                >
                                  <Text style={styles.calendarNavIcon}>›</Text>
                                </TouchableOpacity>
                              </View>
                              
                              {/* Days of Week */}
                              <View style={styles.calendarDaysHeader}>
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                  <Text key={day} style={styles.calendarDayHeader}>{day}</Text>
                                ))}
                              </View>
                              
                              {/* Calendar Grid */}
                              <View style={styles.calendarGrid}>
                                {(() => {
                                  const today = new Date();
                                  const displayMonth = currentMonth.getMonth();
                                  const displayYear = currentMonth.getFullYear();
                                  const firstDay = new Date(displayYear, displayMonth, 1);
                                  const lastDay = new Date(displayYear, displayMonth + 1, 0);
                                  const startDate = new Date(firstDay);
                                  startDate.setDate(startDate.getDate() - firstDay.getDay());
                                  
                                  const calendarDays = [];
                                  for (let i = 0; i < 42; i++) {
                                    const date = new Date(startDate);
                                    date.setDate(startDate.getDate() + i);
                                    const isCurrentMonth = date.getMonth() === displayMonth;
                                    const isToday = date.toDateString() === today.toDateString();
                                    const isSelected = quickAddTask.dueDate && date.toDateString() === quickAddTask.dueDate.toDateString();
                                    
                                    calendarDays.push(
                                      <TouchableOpacity
                                        key={i}
                                        style={[
                                          styles.calendarDay,
                                          isCurrentMonth && styles.calendarDayCurrentMonth,
                                          isToday && styles.calendarDayToday,
                                          isSelected && styles.calendarDaySelected
                                        ]}
                                        onPress={() => {
                                          if (isCurrentMonth) {
                                            handleQuickAddDateChange(date);
                                            setShowQuickAddDatePicker(false);
                                          }
                                        }}
                                        disabled={!isCurrentMonth}
                                      >
                                        <Text style={[
                                          styles.calendarDayText,
                                          isCurrentMonth && styles.calendarDayTextCurrentMonth,
                                          isToday && styles.calendarDayTextToday,
                                          isSelected && styles.calendarDayTextSelected
                                        ]}>
                                          {date.getDate()}
                                        </Text>
                                      </TouchableOpacity>
                                    );
                                  }
                                  return calendarDays;
                                })()}
                              </View>
                            </View>
                            
                            {/* Footer Buttons */}
                            <View style={styles.dateTimePickerFooter}>
                              <TouchableOpacity 
                                style={styles.dateTimePickerFooterButton}
                                onPress={() => {
                                  setQuickAddTask(prev => ({ ...prev, dueDate: undefined }));
                                  setShowQuickAddDatePicker(false);
                                }}
                              >
                                <Text style={styles.dateTimePickerFooterButtonText}>CLEAR</Text>
                              </TouchableOpacity>
                              
                              <TouchableOpacity 
                                style={styles.dateTimePickerFooterButton}
                                onPress={() => setShowQuickAddDatePicker(false)}
                              >
                                <Text style={styles.dateTimePickerFooterButtonText}>CANCEL</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </Modal>

             {/* Time Picker Modal */}
             {showTimePicker && (
               <Modal
                 visible={showTimePicker}
                 transparent={true}
                 animationType="fade"
                 onRequestClose={() => setShowTimePicker(false)}
               >
                 <TouchableOpacity 
                   style={styles.modalOverlay}
                   activeOpacity={1}
                   onPress={() => setShowTimePicker(false)}
                 >
                   <View style={styles.timePickerContent} onStartShouldSetResponder={() => true}>
                     {/* Header */}
                     <View style={styles.timePickerHeader}>
                       <Text style={styles.timePickerTitle}>Select Time</Text>
                       <TouchableOpacity 
                         style={styles.timePickerCloseButton}
                         onPress={() => setShowTimePicker(false)}
                       >
                         <Text style={styles.timePickerCloseIcon}>✕</Text>
                       </TouchableOpacity>
                     </View>
                     
                     {/* Quick Time Options */}
                     <View style={styles.quickTimeOptions}>
                       <TouchableOpacity 
                         style={styles.quickTimeOption}
                         onPress={() => handleTimeChange(9, 0)}
                       >
                         <Text style={styles.quickTimeOptionText}>9:00 AM</Text>
                       </TouchableOpacity>
                       <TouchableOpacity 
                         style={styles.quickTimeOption}
                         onPress={() => handleTimeChange(12, 0)}
                       >
                         <Text style={styles.quickTimeOptionText}>12:00 PM</Text>
                       </TouchableOpacity>
                       <TouchableOpacity 
                         style={styles.quickTimeOption}
                         onPress={() => handleTimeChange(15, 0)}
                       >
                         <Text style={styles.quickTimeOptionText}>3:00 PM</Text>
                       </TouchableOpacity>
                       <TouchableOpacity 
                         style={styles.quickTimeOption}
                         onPress={() => handleTimeChange(18, 0)}
                       >
                         <Text style={styles.quickTimeOptionText}>6:00 PM</Text>
                       </TouchableOpacity>
                     </View>
                     
                     {/* Custom Time Input */}
                     <View style={styles.customTimeSection}>
                       <Text style={styles.customTimeLabel}>Custom Time</Text>
                       <View style={styles.timeInputRow}>
                         <View style={styles.timeInputContainer}>
                           <Text style={styles.timeInputLabel}>Hour</Text>
                           <TextInput
                             style={styles.timeInput}
                             placeholder="12"
                             keyboardType="numeric"
                             maxLength={2}
                             defaultValue="12"
                           />
                         </View>
                         <Text style={styles.timeInputSeparator}>:</Text>
                         <View style={styles.timeInputContainer}>
                           <Text style={styles.timeInputLabel}>Minute</Text>
                           <TextInput
                             style={styles.timeInput}
                             placeholder="00"
                             keyboardType="numeric"
                             maxLength={2}
                             defaultValue="00"
                           />
                         </View>
                         <View style={styles.ampmContainer}>
                           <TouchableOpacity 
                             style={[
                               styles.ampmButton,
                               (quickAddTask.dueDate && quickAddTask.dueDate.getHours() < 12) && 
                               styles.ampmButtonActive
                             ]}
                             onPress={() => {
                               if (quickAddTask.dueDate) {
                                 const currentHour = quickAddTask.dueDate.getHours();
                                 const currentMinute = quickAddTask.dueDate.getMinutes();
                                 const newHour = currentHour >= 12 ? currentHour - 12 : currentHour;
                                 if (newHour === 0) newHour = 12;
                                 handleTimeChange(newHour, currentMinute);
                               }
                             }}
                           >
                             <Text style={[
                               styles.ampmButtonText,
                               (quickAddTask.dueDate && quickAddTask.dueDate.getHours() < 12) && 
                               styles.ampmButtonTextActive
                             ]}>AM</Text>
                           </TouchableOpacity>
                           <TouchableOpacity 
                             style={[
                               styles.ampmButton,
                               (quickAddTask.dueDate && quickAddTask.dueDate.getHours() >= 12) && 
                               styles.ampmButtonTextActive
                             ]}
                             onPress={() => {
                               if (quickAddTask.dueDate) {
                                 const currentHour = quickAddTask.dueDate.getHours();
                                 const currentMinute = quickAddTask.dueDate.getMinutes();
                                 const newHour = currentHour < 12 ? currentHour + 12 : currentHour;
                                 if (newHour === 24) newHour = 12;
                                 handleTimeChange(newHour, currentMinute);
                               }
                             }}
                           >
                             <Text style={[
                               styles.ampmButtonText,
                               (quickAddTask.dueDate && quickAddTask.dueDate.getHours() >= 12) && 
                               styles.ampmButtonTextActive
                             ]}>PM</Text>
                           </TouchableOpacity>
                         </View>
                       </View>
                     </View>
                     
                     {/* Footer */}
                     <View style={styles.timePickerFooter}>
                       <TouchableOpacity 
                         style={styles.timePickerFooterButton}
                         onPress={() => setShowTimePicker(false)}
                       >
                         <Text style={styles.timePickerFooterButtonText}>Cancel</Text>
                       </TouchableOpacity>
                       <TouchableOpacity 
                         style={styles.timePickerFooterButton}
                         onPress={() => setShowTimePicker(false)}
                       >
                         <Text style={styles.timePickerFooterButtonText}>OK</Text>
                       </TouchableOpacity>
                     </View>
                   </View>
                 </TouchableOpacity>
               </Modal>
             )}
 
             {showQuickAddPriorityMenu && (
             <Modal 
               visible={true} 
               transparent 
               animationType="fade"
               onRequestClose={() => setShowQuickAddPriorityMenu(false)}
             >
               <TouchableOpacity 
                 style={styles.materialMenuOverlay}
                 activeOpacity={1}
                 onPress={() => setShowQuickAddPriorityMenu(false)}
               >
                 <View style={styles.materialMenuContent} onStartShouldSetResponder={() => true}>
                   <Text style={styles.materialMenuTitle}>Priority</Text>
                   {[
                     { value: 1, label: 'Urgent', color: '#FF3B30' },
                     { value: 2, label: 'High', color: '#FF3B30' },
                     { value: 3, label: 'Medium', color: '#FFCC00' },
                     { value: 4, label: 'Low', color: '#007AFF' },
                   ].map((option) => (
                     <TouchableOpacity
                       key={option.value}
                       style={styles.materialMenuItem}
                       onPress={() => handleQuickAddPriorityChange(option.value)}
                     >
                       <View style={[styles.materialPriorityDot, { backgroundColor: option.color }]} />
                       <Text style={styles.materialMenuItemText}>{option.label}</Text>
                     </TouchableOpacity>
                   ))}
                 </View>
               </TouchableOpacity>
             </Modal>
           )}

           {showQuickAddTagsMenu && (
             <Modal 
               visible={true} 
               transparent 
               animationType="fade"
               onRequestClose={() => setShowQuickAddTagsMenu(false)}
             >
               <TouchableOpacity 
                 style={styles.materialMenuOverlay}
                 activeOpacity={1}
                 onPress={() => setShowQuickAddTagsMenu(false)}
               >
                 <View style={styles.materialMenuContent} onStartShouldSetResponder={() => true}>
                   <Text style={styles.materialMenuTitle}>Tags</Text>
                   {tags.map((tag) => (
                     <TouchableOpacity
                       key={tag.id}
                       style={styles.materialMenuItem}
                       onPress={() => handleQuickAddTagToggle(tag.id)}
                     >
                       <View style={[
                         styles.materialCheckbox,
                         quickAddTask.tags.includes(tag.id) && styles.materialCheckboxSelected
                       ]}>
                         {quickAddTask.tags.includes(tag.id) && <Text style={styles.materialCheckmark}>✓</Text>}
                       </View>
                       <Text style={styles.materialMenuItemText}>{tag.name}</Text>
                     </TouchableOpacity>
                   ))}
                 </View>
               </TouchableOpacity>
             </Modal>
           )}

           {showQuickAddListsMenu && (
             <Modal 
               visible={true} 
               transparent 
               animationType="fade"
               onRequestClose={() => setShowQuickAddListsMenu(false)}
             >
               <TouchableOpacity 
                 style={styles.materialMenuOverlay}
                 activeOpacity={1}
                 onPress={() => setShowQuickAddListsMenu(false)}
               >
                 <View style={styles.materialMenuContent} onStartShouldSetResponder={() => true}>
                   <Text style={styles.materialMenuTitle}>Lists</Text>
                   {lists.map((list) => (
                     <TouchableOpacity
                       key={list.id}
                       style={styles.materialMenuItem}
                       onPress={() => handleQuickAddListChange(list.id)}
                     >
                       <View style={[
                         styles.materialCheckbox,
                         quickAddTask.listId === list.id && styles.materialCheckboxSelected
                       ]}>
                         {quickAddTask.listId === list.id && <Text style={styles.materialCheckmark}>✓</Text>}
                       </View>
                       <Text style={styles.materialMenuItemText}>{list.name}</Text>
                     </TouchableOpacity>
                   ))}
                 </View>
               </TouchableOpacity>
             </Modal>
           )}

           {/* Add Task Modal (Legacy - can be removed) */}
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
             tasks={tasks}
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
  
  // Quick Add Modal Styles
  quickAddModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAddModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  quickAddModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickAddModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: CompactColors.text,
  },
  quickAddModalCloseButton: {
    padding: 8,
    marginLeft: 8,
  },
  quickAddModalCloseIcon: {
    fontSize: 24,
    color: CompactColors.textMuted,
    fontWeight: '600',
  },
  quickAddModalInputRow: {
    marginBottom: 20,
  },
  quickAddModalInput: {
    fontSize: 16,
    color: CompactColors.text,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: CompactColors.border,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  quickAddModalIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  quickAddModalIconButton: {
    padding: 12,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddModalIcon: {
    fontSize: 24,
    color: CompactColors.textMuted,
  },
  quickAddModalButton: {
    backgroundColor: CompactColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  quickAddModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Material Design 3 Menu Styles
  materialMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  materialMenuContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  materialMenuTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: CompactColors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  materialMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  materialMenuItemText: {
    fontSize: 16,
    color: CompactColors.text,
    marginLeft: 16,
    flex: 1,
  },
  materialPriorityDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  materialCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: CompactColors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  materialCheckboxSelected: {
    backgroundColor: CompactColors.primary,
    borderColor: CompactColors.primary,
  },
  materialCheckmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Date-Time Picker Styles
  dateTimePickerContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '95%',
    maxWidth: 400,
    maxHeight: '90%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  dateTimePickerHeader: {
    borderBottomWidth: 1,
    borderBottomColor: CompactColors.border,
    paddingBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  dateTimePickerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: CompactColors.text,
    textAlign: 'center',
  },

  quickDateSelectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: CompactColors.border,
  },
  quickDateSelectionItem: {
    alignItems: 'center',
    minWidth: 70,
  },
  quickDateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CompactColors.surface,
    borderWidth: 1,
    borderColor: CompactColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickDateIconText: {
    fontSize: 14,
    color: CompactColors.text,
    fontWeight: '600',
  },
  quickDateSelectionText: {
    fontSize: 12,
    color: CompactColors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  calendarContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarNavIcon: {
    fontSize: 20,
    color: CompactColors.textSecondary,
    fontWeight: '600',
  },
  calendarMonthText: {
    fontSize: 18,
    color: CompactColors.text,
    fontWeight: '600',
  },
  calendarDaysHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  calendarDayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: CompactColors.textSecondary,
    fontWeight: '500',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  calendarDayCurrentMonth: {
    // Default styling for current month days
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: CompactColors.primary,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  calendarDaySelected: {
    backgroundColor: CompactColors.primary,
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 14,
    color: CompactColors.textMuted,
    fontWeight: '500',
  },
  calendarDayTextCurrentMonth: {
    color: CompactColors.text,
  },
  calendarDayTextToday: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  calendarDaySubtext: {
    fontSize: 10,
    color: CompactColors.textMuted,
    marginTop: 2,
  },
  additionalOptionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: CompactColors.border,
  },
  additionalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  additionalOptionIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  additionalOptionIconText: {
    fontSize: 16,
    color: CompactColors.text,
  },
  additionalOptionText: {
    flex: 1,
    fontSize: 16,
    color: CompactColors.text,
    fontWeight: '500',
  },
  additionalOptionValue: {
    fontSize: 14,
    color: CompactColors.textSecondary,
    fontWeight: '500',
  },
  dateTimePickerFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: CompactColors.border,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dateTimePickerFooterButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  dateTimePickerFooterButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Time Picker Styles
  timePickerContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: CompactColors.border,
  },
  timePickerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: CompactColors.text,
  },
  timePickerCloseButton: {
    padding: 8,
  },
  timePickerCloseIcon: {
    fontSize: 20,
    color: CompactColors.textSecondary,
    fontWeight: '600',
  },
  quickTimeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: CompactColors.border,
  },
  quickTimeOption: {
    backgroundColor: CompactColors.surface,
    borderWidth: 1,
    borderColor: CompactColors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  quickTimeOptionText: {
    fontSize: 14,
    color: CompactColors.text,
    fontWeight: '500',
  },
  customTimeSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: CompactColors.border,
  },
  customTimeLabel: {
    fontSize: 16,
    color: CompactColors.text,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInputContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  timeInputLabel: {
    fontSize: 12,
    color: CompactColors.textSecondary,
    marginBottom: 8,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: CompactColors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 60,
    textAlign: 'center',
    fontSize: 16,
  },
  timeInputSeparator: {
    fontSize: 20,
    color: CompactColors.text,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  ampmContainer: {
    flexDirection: 'row',
    marginLeft: 16,
  },
  ampmButton: {
    backgroundColor: CompactColors.surface,
    borderWidth: 1,
    borderColor: CompactColors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
  },
  ampmButtonActive: {
    backgroundColor: CompactColors.primary,
    borderColor: CompactColors.primary,
  },
  ampmButtonText: {
    fontSize: 14,
    color: CompactColors.text,
    fontWeight: '500',
  },
  ampmButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timePickerFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: CompactColors.border,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  timePickerFooterButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  timePickerFooterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: CompactColors.text,
  },
  
  // Quick Add Menu Styles
  quickAddMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  quickAddMenu: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 16,
    maxHeight: '60%',
  },
  quickAddMenuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: CompactColors.text,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  quickAddMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quickAddMenuItemText: {
    fontSize: 16,
    color: CompactColors.text,
    marginLeft: 12,
  },
  quickAddPriorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  quickAddCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: CompactColors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddCheckboxSelected: {
    backgroundColor: CompactColors.primary,
    borderColor: CompactColors.primary,
  },
  quickAddCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default KaryScreenCompact;




