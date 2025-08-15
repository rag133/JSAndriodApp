import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { Task, Tag, List } from '../types/kary';
import { taskService, tagService, listService } from '../services/dataService';
import DateTimePickerIcon from './DateTimePickerIcon';
import { TimePickerModal } from 'react-native-paper-dates';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';

const { height: screenHeight } = Dimensions.get('window');

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

interface TaskDetailsModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
  lists: List[];
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  visible,
  task,
  onClose,
  onSave,
  onDelete,
  lists,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editedTask, setEditedTask] = useState<Task | null>(task);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  
  // Date picker state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
      loadSubtasks();
      loadTags();
      
      // Set current month to task's due date month if it exists
      if (task.dueDate) {
        setCurrentMonth(new Date(task.dueDate));
      }
    }
  }, [task]);

  const loadSubtasks = async () => {
    if (!task) return;
    try {
      // Load subtasks (tasks with parentId = current task id)
      const allTasks = await taskService.getAll();
      const taskSubtasks = allTasks.filter(t => t.parentId === task.id);
      setSubtasks(taskSubtasks);
    } catch (error) {
      console.error('Error loading subtasks:', error);
    }
  };

  const loadTags = async () => {
    try {
      const tags = await tagService.getAll();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleSave = () => {
    if (editedTask) {
      onSave(editedTask);
      onClose();
    }
  };

  const handleDelete = () => {
    if (!task) return;
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(task.id);
            onClose();
          },
        },
      ]
    );
  };

  const addSubtask = async () => {
    if (!newSubtaskTitle.trim() || !task) return;
    
    try {
      const subtaskData = {
        title: newSubtaskTitle.trim(),
        listId: task.listId,
        completed: false,
        parentId: task.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await taskService.add(subtaskData);
      setNewSubtaskTitle('');
      loadSubtasks();
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };

  const toggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      await taskService.update(subtaskId, { 
        completed: !completed,
        completionDate: !completed ? new Date() : undefined,
      });
      loadSubtasks();
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPriorityIcon = (priority: number | undefined) => {
    switch (priority) {
      case 1: return '🚨'; // Urgent
      case 2: return '🔴'; // High
      case 3: return '🟡'; // Medium
      case 4: return '🟢'; // Low
      default: return '';
    }
  };

  const getPriorityText = (priority: number | undefined) => {
    switch (priority) {
      case 1: return 'Urgent';
      case 2: return 'High';
      case 3: return 'Medium';
      case 4: return 'Low';
      default: return 'None';
    }
  };

  const handleDateTimeConfirm = (date: Date, reminderOption?: string) => {
    if (editedTask) {
      setEditedTask({
        ...editedTask,
        dueDate: date,
        reminder: reminderOption === 'No reminder' ? false : true,
      });
    }
    setShowDateTimePicker(false);
  };

  const formatDueDate = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Calendar helper functions
  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  if (!visible || !task || !editedTask) return null;

  const modalHeight = isExpanded ? screenHeight * 0.9 : screenHeight * 0.5;
  const selectedList = lists.find(l => l.id === task.listId);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { height: modalHeight }]}>
          {/* Handle */}
          <TouchableOpacity
            style={styles.handle}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            <View style={styles.handleBar} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.statusButton}
                onPress={() => setEditedTask({
                  ...editedTask,
                  completed: !editedTask.completed,
                  completionDate: !editedTask.completed ? new Date() : undefined,
                })}
              >
                <Text style={styles.statusIcon}>
                  {editedTask.completed ? '✅' : '⬜'}
                </Text>
              </TouchableOpacity>
              <View style={styles.taskMeta}>
                <Text style={styles.listName}>{selectedList?.name}</Text>
                {editedTask.dueDate && (
                  <Text style={styles.dueDate}>
                    📅 {formatDueDate(editedTask.dueDate)}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Task Title */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Task Title</Text>
              <TextInput
                style={styles.titleInput}
                value={editedTask.title}
                onChangeText={(text) => setEditedTask({ ...editedTask, title: text })}
                placeholder="Enter task title"
                placeholderTextColor="#999"
              />
            </View>

            {/* Due Date Section */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Due Date</Text>
              
              {/* Date Time Picker Icon */}
              <View style={styles.dateTimeSection}>
                <DateTimePickerIcon
                  onPress={() => setShowDateTimePicker(true)}
                  size={32}
                  color="#007AFF"
                />
                <View style={styles.dateTimeInfo}>
                  <Text style={styles.dateTimeLabel}>Set due date & time</Text>
                  <Text style={styles.dateTimeValue}>
                    {editedTask.dueDate ? formatDueDate(editedTask.dueDate) : 'No due date set'}
                  </Text>
                </View>
              </View>

              {/* Selected Date Display */}
              {editedTask.dueDate && (
                <View style={styles.selectedDateTimeContainer}>
                  <Text style={styles.selectedDateTimeLabel}>Selected:</Text>
                  <Text style={styles.selectedDateTimeValue}>
                    {editedTask.dueDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.selectedDateTimeTime}>
                    at {editedTask.dueDate.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </Text>
                  {editedTask.reminder && (
                    <Text style={styles.reminderText}>
                      ⏰ Reminder enabled
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Task Description */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.descriptionInput}
                value={editedTask.description || ''}
                onChangeText={(text) => setEditedTask({ ...editedTask, description: text })}
                placeholder="Enter task description"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Priority Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.priorityContainer}>
                {[1, 2, 3, 4].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityButton,
                      editedTask.priority === priority && styles.selectedPriority,
                    ]}
                    onPress={() => setEditedTask({ ...editedTask, priority: priority as 1 | 2 | 3 | 4 })}
                  >
                    <Text style={[
                      styles.priorityIcon,
                      editedTask.priority === priority && styles.selectedPriorityIcon,
                    ]}>
                      {getPriorityIcon(priority)}
                    </Text>
                    <Text style={[
                      styles.priorityText,
                      editedTask.priority === priority && styles.selectedPriorityText,
                    ]}>
                      {getPriorityText(priority)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tags Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tags</Text>
              <View style={styles.tagsContainer}>
                {availableTags.map((tag) => (
                  <TouchableOpacity
                    key={tag.id}
                    style={[
                      styles.tagChip,
                      editedTask.tags?.includes(tag.id) && styles.selectedTag,
                    ]}
                    onPress={() => {
                      const currentTags = editedTask.tags || [];
                      const newTags = editedTask.tags?.includes(tag.id)
                        ? currentTags.filter(t => t !== tag.id)
                        : [...currentTags, tag.id];
                      setEditedTask({ ...editedTask, tags: newTags });
                    }}
                  >
                    <Text style={[
                      styles.tagText,
                      editedTask.tags?.includes(tag.id) && styles.selectedTagText,
                    ]}>
                      {tag.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Subtasks Section */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Subtasks</Text>
              <View style={styles.addSubtaskContainer}>
                <TextInput
                  style={styles.subtaskInput}
                  value={newSubtaskTitle}
                  onChangeText={setNewSubtaskTitle}
                  placeholder="Add a subtask"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={addSubtask} style={styles.addSubtaskButton}>
                  <Text style={styles.addSubtaskIcon}>+</Text>
                </TouchableOpacity>
              </View>
              
              {subtasks.map((subtask) => (
                <View key={subtask.id} style={styles.subtaskItem}>
                  <TouchableOpacity
                    style={styles.subtaskCheckbox}
                    onPress={() => toggleSubtask(subtask.id, subtask.completed)}
                  >
                    <Text style={styles.subtaskStatusIcon}>
                      {subtask.completed ? '✅' : '⬜'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={[
                    styles.subtaskTitle,
                    subtask.completed && styles.completedSubtask,
                  ]}>
                    {subtask.title}
                  </Text>
                </View>
              ))}
            </View>

            {/* Task Info */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Task Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Created:</Text>
                <Text style={styles.infoValue}>{formatDate(task.createdAt)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last Updated:</Text>
                <Text style={styles.infoValue}>{formatDate(task.updatedAt)}</Text>
              </View>
              {task.completionDate && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Completed:</Text>
                  <Text style={styles.infoValue}>{formatDate(task.completionDate)}</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Custom Date Time Picker Modal */}
          <Modal
            visible={showDateTimePicker}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowDateTimePicker(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowDateTimePicker(false)}
            >
              <View style={styles.dateTimePickerContent} onStartShouldSetResponder={() => true}>
                {/* Header */}
                <View style={styles.dateTimePickerHeader}>
                  <Text style={styles.dateTimePickerTitle}>Select Date</Text>
                </View>
                
                {/* Quick Date Selection */}
                <View style={styles.quickDateSelectionRow}>
                  <TouchableOpacity 
                    style={styles.quickDateSelectionItem}
                    onPress={() => {
                      const today = new Date();
                      setEditedTask(prev => prev ? { ...prev, dueDate: today } : null);
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
                      setEditedTask(prev => prev ? { ...prev, dueDate: tomorrow } : null);
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
                      setEditedTask(prev => prev ? { ...prev, dueDate: nextWeek } : null);
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
                        const isSelected = editedTask?.dueDate && date.toDateString() === editedTask.dueDate.toDateString();
                        
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
                                setEditedTask(prev => prev ? { ...prev, dueDate: date } : null);
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
                
                {/* Time Row - Material Design 3 Style */}
                <View style={styles.timeRow}>
                  <View style={styles.timeRowLeft}>
                    <Text style={styles.timeRowIcon}>⏰</Text>
                    <Text style={styles.timeRowLabel}>Time</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.timeRowValue}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={styles.timeRowValueText}>
                      {editedTask?.dueDate && editedTask.dueDate.getHours() !== 0 
                        ? editedTask.dueDate.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit', 
                            hour12: true 
                          })
                        : 'None {'>'}'
                      }
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Reminder Row - Material Design 3 Style */}
                <View style={styles.timeRow}>
                  <View style={styles.timeRowLeft}>
                    <Text style={styles.timeRowIcon}>🔔</Text>
                    <Text style={styles.timeRowLabel}>Reminder</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.timeRowValue}
                    onPress={() => {
                      // TODO: Implement reminder picker
                    }}
                  >
                    <Text style={styles.timeRowValueText}>None {'>'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Footer Buttons */}
                <View style={styles.dateTimePickerFooter}>
                  <TouchableOpacity
                    style={styles.dateTimePickerFooterButton}
                    onPress={() => {
                      setEditedTask(prev => prev ? { ...prev, dueDate: undefined } : null);
                    }}
                  >
                    <Text style={styles.dateTimePickerFooterButtonText}>CLEAR</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dateTimePickerFooterButton}
                    onPress={() => setShowDateTimePicker(false)}
                  >
                    <Text style={[styles.dateTimePickerFooterButtonText, { color: CompactColors.textSecondary }]}>CANCEL</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.dateTimePickerFooterButton, styles.okButton]}
                    onPress={() => setShowDateTimePicker(false)}
                  >
                    <Text style={[styles.dateTimePickerFooterButtonText, styles.okButtonText]}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Time Picker Modal - Material Design 3 */}
          <PaperProvider theme={DefaultTheme}>
            <TimePickerModal
              visible={showTimePicker}
              onDismiss={() => setShowTimePicker(false)}
              onConfirm={({ hours, minutes }) => {
                if (editedTask?.dueDate) {
                  const newDate = new Date(editedTask.dueDate);
                  newDate.setHours(hours, minutes, 0, 0);
                  setEditedTask(prev => prev ? { ...prev, dueDate: newDate } : null);
                }
                setShowTimePicker(false);
              }}
              hours={editedTask?.dueDate ? editedTask.dueDate.getHours() : 12}
              minutes={editedTask?.dueDate ? editedTask.dueDate.getMinutes() : 0}
              use24HourClock={false}
            />
          </PaperProvider>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  handle: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusButton: {
    marginRight: 12,
  },
  statusIcon: {
    fontSize: 24,
  },
  taskMeta: {
    flex: 1,
  },
  listName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dueDate: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  actionIcon: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 16,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  selectedPriority: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  priorityIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    fontSize: 14,
    color: '#333',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  selectedTag: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  tagText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  selectedTagText: {
    color: '#2196F3',
  },
  addSubtaskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subtaskInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 8,
  },
  addSubtaskButton: {
    padding: 8,
  },
  addSubtaskIcon: {
    fontSize: 16,
    color: '#2196F3',
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subtaskCheckbox: {
    marginRight: 12,
  },
  subtaskStatusIcon: {
    fontSize: 18,
  },
  subtaskTitle: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  completedSubtask: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dateTimeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateTimeInfo: {
    marginLeft: 10,
  },
  dateTimeLabel: {
    fontSize: 14,
    color: '#333',
  },
  dateTimeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 4,
  },
  selectedDateTimeContainer: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedDateTimeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  selectedDateTimeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  selectedDateTimeTime: {
    fontSize: 14,
    color: '#666',
  },
  reminderText: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FF5252',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    fontSize: 24,
    color: '#666',
  },
  selectedPriorityIcon: {
    color: '#2196F3',
  },
  selectedPriorityText: {
    color: '#2196F3',
  },

  // Date-Time Picker Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateTimePickerContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '80%',
    maxWidth: 340,
    maxHeight: '90%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    overflow: 'hidden',
    margin: 20,
  },
  dateTimePickerHeader: {
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    marginBottom: 8,
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
    color: CompactColors.primary,
    fontWeight: '600',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CompactColors.surface,
    justifyContent: 'space-between',
  },
  timeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  timeRowIcon: {
    fontSize: 20,
    color: CompactColors.text,
    marginRight: 8,
  },
  timeRowLabel: {
    fontSize: 14,
    color: CompactColors.textSecondary,
    fontWeight: '600',
  },
  timeRowValue: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  timeRowValueText: {
    fontSize: 14,
    color: CompactColors.text,
    fontWeight: '500',
    textAlign: 'right',
  },
  dateTimePickerFooter: {
    flexDirection: 'row',
    paddingTop: 16,
    paddingHorizontal: 12,
    paddingBottom: 20,
    gap: 4,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimePickerFooterButton: {
    flex: 0,
    minWidth: 60,
    maxWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: CompactColors.border,
    backgroundColor: 'transparent',
  },
  dateTimePickerFooterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: CompactColors.textSecondary,
  },
  okButton: {
    backgroundColor: CompactColors.primary,
    borderColor: CompactColors.primary,
  },
  okButtonText: {
    color: CompactColors.background,
    fontWeight: '600',
  },
});

export default TaskDetailsModal;
