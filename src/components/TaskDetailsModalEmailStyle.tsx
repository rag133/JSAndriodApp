import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Task, Tag, List } from '../types/kary';
import { taskService, tagService, listService } from '../services/dataService';
import { AutoSaveManager } from '../utils/debounceUtils';
import MaterialDesign3DateTimePicker from './MaterialDesign3DateTimePicker';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

interface SaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  error: string | null;
}

interface TaskDetailsModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
  lists: List[];
}

const TaskDetailsModalEmailStyle: React.FC<TaskDetailsModalProps> = ({
  visible,
  task,
  onClose,
  onSave,
  onDelete,
  lists,
}) => {
  const [editedTask, setEditedTask] = useState<Task | null>(task);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showListDropdown, setShowListDropdown] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [saveState, setSaveState] = useState<SaveState>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    error: null,
  });

  // Auto-save manager for handling debounced saves
  const autoSaveManager = useRef<AutoSaveManager>(new AutoSaveManager(2000));
  const lastSavedTask = useRef<Task | null>(null);

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
      setSelectedListId(task.listId);
      lastSavedTask.current = { ...task };
      loadSubtasks();
      loadTags();
      setSaveState(prev => ({ ...prev, hasUnsavedChanges: false, error: null }));
    }
  }, [task]);

  // Cleanup auto-save manager on unmount
  useEffect(() => {
    return () => {
      autoSaveManager.current.clear();
    };
  }, []);

  const loadSubtasks = async () => {
    if (!task) return;
    try {
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

  // Auto-save function with optimistic updates
  const performAutoSave = useCallback(async (updatedTask: Task, fieldName: string) => {
    if (!updatedTask || !lastSavedTask.current) return;

    // Check if there are actual changes
    const hasChanges = JSON.stringify(updatedTask) !== JSON.stringify(lastSavedTask.current);
    if (!hasChanges) return;

    try {
      setSaveState(prev => ({ ...prev, isSaving: true, error: null }));

      // Call the parent's onSave function (optimistic update)
      onSave(updatedTask);
      
      // Update last saved reference
      lastSavedTask.current = { ...updatedTask };
      
      setSaveState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        error: null,
      }));

      console.log(`✅ Auto-saved ${fieldName} for task: ${updatedTask.title}`);
    } catch (error: any) {
      console.error(`❌ Auto-save failed for ${fieldName}:`, error);
      setSaveState(prev => ({
        ...prev,
        isSaving: false,
        error: `Failed to save ${fieldName}: ${error.message}`,
      }));
    }
  }, [onSave]);

  // Register auto-save callbacks for different fields
  useEffect(() => {
    if (!editedTask) return;

    const manager = autoSaveManager.current;

    // Register different fields with appropriate delays
    manager.registerField('title', 
      (task: Task) => performAutoSave(task, 'title'), 
      2000 // 2 seconds for title
    );
    
    manager.registerField('description', 
      (task: Task) => performAutoSave(task, 'description'), 
      3000 // 3 seconds for description
    );
    
    manager.registerField('priority', 
      (task: Task) => performAutoSave(task, 'priority'), 
      500 // Quick for priority
    );
    
    manager.registerField('tags', 
      (task: Task) => performAutoSave(task, 'tags'), 
      1000 // 1 second for tags
    );

    manager.registerField('completion', 
      (task: Task) => performAutoSave(task, 'completion'), 
      0 // Immediate for completion status
    );

    manager.registerField('list', 
      (task: Task) => performAutoSave(task, 'list'), 
      1000 // 1 second for list changes
    );

    manager.registerField('dueDate', 
      (task: Task) => performAutoSave(task, 'dueDate'), 
      1000 // 1 second for due date changes
    );
  }, [editedTask, performAutoSave]);

  // Enhanced task update function with auto-save
  const updateTaskField = (updates: Partial<Task>, fieldName: string) => {
    if (!editedTask) return;

    const updatedTask = { ...editedTask, ...updates };
    setEditedTask(updatedTask);
    
    // Mark as having unsaved changes
    setSaveState(prev => ({ ...prev, hasUnsavedChanges: true }));

    // Trigger auto-save for this field
    autoSaveManager.current.triggerSave(fieldName, updatedTask);
  };

  // Handle list change
  const handleListChange = async (listId: string) => {
    if (!editedTask) return;
    
    setSelectedListId(listId);
    setShowListDropdown(false);
    updateTaskField({ listId }, 'list');
  };

  // Handle priority change
  const handlePriorityChange = (priority: 1 | 2 | 3 | 4 | undefined) => {
    updateTaskField({ priority }, 'priority');
    setShowPriorityMenu(false);
  };

  // Handle due date change
  const handleDueDateChange = (date: Date) => {
    updateTaskField({ dueDate: date }, 'dueDate');
    setShowDateTimePicker(false);
  };

  // Handle due date removal
  const handleRemoveDueDate = () => {
    updateTaskField({ dueDate: undefined }, 'dueDate');
  };

  const handleDelete = () => {
    if (!task) return;
    setShowActionMenu(false);
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            autoSaveManager.current.cancelAllSaves();
            onDelete(task.id);
            onClose();
          },
        },
      ]
    );
  };

  const handleClose = () => {
    // Cancel any pending saves before closing
    autoSaveManager.current.cancelAllSaves();
    setShowActionMenu(false);
    setShowPriorityMenu(false);
    setShowListDropdown(false);
    setShowDateTimePicker(false);
    onClose();
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

  // Utility functions
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Professional priority flags with proper icons
  const getPriorityFlag = (priority: number | undefined) => {
    switch (priority) {
      case 1: return { icon: '🚩', color: '#DC2626', text: 'High Priority' }; // Red flag
      case 2: return { icon: '🟠', color: '#EA580C', text: 'Medium Priority' }; // Orange circle  
      case 3: return { icon: '🟡', color: '#CA8A04', text: 'Medium Priority' }; // Yellow circle
      case 4: return { icon: '🔵', color: '#2563EB', text: 'Low Priority' }; // Blue circle
      default: return { icon: '🏳️', color: '#6B7280', text: 'No Priority' }; // Gray flag
    }
  };

  // Render professional checkbox
  const renderCheckbox = (isCompleted: boolean, onPress: () => void) => {
    return (
      <TouchableOpacity style={styles.checkboxContainer} onPress={onPress}>
        <View style={[
          styles.checkbox,
          isCompleted && styles.checkboxCompleted
        ]}>
          {isCompleted && (
            <Text style={styles.checkboxTick}>✓</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!visible || !task || !editedTask) return null;

  const selectedList = lists.find(l => l.id === selectedListId);
  const priorityFlag = getPriorityFlag(editedTask.priority);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent={false}
    >
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <View style={styles.container}>
        {/* Email-style Header */}
        <View style={styles.header}>
          {/* Top Row */}
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={handleClose}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>
                {selectedList?.name || 'Task'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date'}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.moreButton} 
              onPress={() => setShowActionMenu(!showActionMenu)}
            >
              <Text style={styles.moreIcon}>⋯</Text>
            </TouchableOpacity>
          </View>

          {/* List Selector Row */}
          <View style={styles.listSelectorRow}>
            <Text style={styles.listLabel}>List</Text>
            <TouchableOpacity 
              style={styles.listDropdown}
              onPress={() => setShowListDropdown(!showListDropdown)}
            >
              <Text style={styles.listDropdownText}>{selectedList?.name || 'Select List'}</Text>
              <Text style={styles.listDropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Area */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Main Task Section */}
          <View style={styles.taskSection}>
            {/* Date & Repeat Row */}
            <TouchableOpacity 
              style={styles.dateRepeatRow}
              onPress={() => setShowDateTimePicker(true)}
            >
              <View style={styles.dateRepeatItem}>
                <Text style={styles.dateRepeatIcon}>📅</Text>
                <Text style={styles.dateRepeatLabel}>Date & Repeat</Text>
                {editedTask.dueDate && (
                  <View style={styles.dueDateInfo}>
                    <Text style={styles.dueDateText}>
                      {formatDate(editedTask.dueDate)}
                    </Text>
                    <TouchableOpacity onPress={handleRemoveDueDate}>
                      <Text style={styles.removeDueDateIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Task Title Row */}
            <View style={styles.taskTitleRow}>
              {renderCheckbox(editedTask.completed, () => updateTaskField({
                completed: !editedTask.completed,
                completionDate: !editedTask.completed ? new Date() : undefined,
              }, 'completion'))}
              
              <View style={styles.taskTitleContent}>
                <TextInput
                  style={[
                    styles.taskTitle,
                    editedTask.completed && styles.completedTaskTitle
                  ]}
                  value={editedTask.title}
                  onChangeText={(text) => updateTaskField({ title: text }, 'title')}
                  placeholder="Task title..."
                  multiline
                />
              </View>
              
              {/* Priority Flag */}
              <TouchableOpacity
                style={styles.priorityFlagButton}
                onPress={() => setShowPriorityMenu(!showPriorityMenu)}
              >
                <Text style={styles.priorityFlagIcon}>{priorityFlag.icon}</Text>
              </TouchableOpacity>
            </View>

            {/* Task Description */}
            <View style={styles.taskDescriptionSection}>
              <TextInput
                style={styles.taskDescription}
                value={editedTask.description || ''}
                onChangeText={(text) => updateTaskField({ description: text }, 'description')}
                placeholder="Add description..."
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Tags Section */}
            {(editedTask.tags && editedTask.tags.length > 0) && (
              <View style={styles.tagsSection}>
                <View style={styles.tagsContainer}>
                  {editedTask.tags.map((tagName, index) => (
                    <View key={index} style={styles.tagChip}>
                      <Text style={styles.tagText}>#{tagName}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Add Tags Button */}
            <TouchableOpacity style={styles.addTagsButton}>
              <Text style={styles.addTagsIcon}>🏷️</Text>
              <Text style={styles.addTagsText}>Add Tags</Text>
            </TouchableOpacity>

            {/* Subtasks Section */}
            {subtasks.length > 0 && (
              <View style={styles.subtasksSection}>
                <Text style={styles.subtasksTitle}>Subtasks ({subtasks.length})</Text>
                {subtasks.map((subtask) => (
                  <View key={subtask.id} style={styles.subtaskItem}>
                    {renderCheckbox(subtask.completed, () => toggleSubtask(subtask.id, subtask.completed))}
                    <Text style={[
                      styles.subtaskTitle,
                      subtask.completed && styles.completedSubtaskTitle
                    ]}>
                      {subtask.title}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Add Subtask */}
            <View style={styles.addSubtaskSection}>
              <TextInput
                style={styles.addSubtaskInput}
                value={newSubtaskTitle}
                onChangeText={setNewSubtaskTitle}
                placeholder="Add a subtask..."
                onSubmitEditing={addSubtask}
              />
            </View>
          </View>
        </ScrollView>

        {/* List Dropdown Modal */}
        {showListDropdown && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={styles.modalBackdrop} 
              onPress={() => setShowListDropdown(false)} 
            />
            <View style={styles.listDropdownModal}>
              <View style={styles.listDropdownHeader}>
                <TouchableOpacity onPress={() => setShowListDropdown(false)}>
                  <Text style={styles.listDropdownClose}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.listDropdownTitle}>Move to</Text>
                <View style={styles.listDropdownPlaceholder} />
              </View>
              
              <ScrollView style={styles.listDropdownContent}>
                {lists.map((list) => (
                  <TouchableOpacity
                    key={list.id}
                    style={[
                      styles.listDropdownItem,
                      selectedListId === list.id && styles.selectedListDropdownItem
                    ]}
                    onPress={() => handleListChange(list.id)}
                  >
                    <Text style={styles.listDropdownItemIcon}>📁</Text>
                    <Text style={[
                      styles.listDropdownItemText,
                      selectedListId === list.id && styles.selectedListDropdownItemText
                    ]}>
                      {list.name}
                    </Text>
                    {selectedListId === list.id && (
                      <Text style={styles.listDropdownItemCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Action Menu Modal */}
        {showActionMenu && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={styles.modalBackdrop} 
              onPress={() => setShowActionMenu(false)} 
            />
            <View style={styles.actionMenu}>
              <TouchableOpacity style={styles.actionMenuItem} onPress={handleDelete}>
                <Text style={styles.actionMenuIcon}>🗑️</Text>
                <Text style={styles.actionMenuText}>Delete Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Priority Menu Modal */}
        {showPriorityMenu && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={styles.modalBackdrop} 
              onPress={() => setShowPriorityMenu(false)} 
            />
            <View style={styles.priorityMenuModal}>
              <Text style={styles.priorityMenuTitle}>Set Priority</Text>
              {[
                { value: 1, icon: '🚩', text: 'High Priority' },
                { value: 2, icon: '🟠', text: 'Medium Priority' },
                { value: 3, icon: '🟡', text: 'Medium Priority' },
                { value: 4, icon: '🔵', text: 'Low Priority' },
                { value: undefined, icon: '🏳️', text: 'No Priority' },
              ].map((priority) => (
                <TouchableOpacity
                  key={priority.value || 'none'}
                  style={[
                    styles.priorityMenuItem,
                    editedTask.priority === priority.value && styles.selectedPriorityMenuItem
                  ]}
                  onPress={() => handlePriorityChange(priority.value as any)}
                >
                  <Text style={styles.priorityMenuIcon}>{priority.icon}</Text>
                  <Text style={styles.priorityMenuText}>{priority.text}</Text>
                  {editedTask.priority === priority.value && (
                    <Text style={styles.priorityMenuCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Save Indicator */}
        {saveState.isSaving && (
          <View style={styles.saveIndicator}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.saveText}>Saving...</Text>
          </View>
        )}

        {/* Material Design 3 Date Time Picker */}
        <MaterialDesign3DateTimePicker
          visible={showDateTimePicker}
          initialDate={editedTask.dueDate}
          onConfirm={handleDueDateChange}
          onCancel={() => setShowDateTimePicker(false)}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Email-style Header
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingTop: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: '500',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 1,
  },
  moreButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreIcon: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  
  // List Selector Row
  listSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  listLabel: {
    fontSize: 15,
    color: '#8E8E93',
    marginRight: 12,
    minWidth: 40,
  },
  listDropdown: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  listDropdownText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '400',
  },
  listDropdownArrow: {
    fontSize: 12,
    color: '#8E8E93',
  },
  
  // Content Area
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Task Section
  taskSection: {
    padding: 16,
  },
  
  // Date & Repeat Row
  dateRepeatRow: {
    marginBottom: 20,
  },
  dateRepeatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  dateRepeatIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  dateRepeatLabel: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
  },
  dueDateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateText: {
    fontSize: 15,
    color: '#007AFF',
    marginRight: 8,
  },
  removeDueDateIcon: {
    fontSize: 14,
    color: '#FF3B30',
    paddingHorizontal: 4,
  },
  
  // Task Title Row
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkboxContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  checkboxTick: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskTitleContent: {
    flex: 1,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 22,
    paddingVertical: 0,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  priorityFlagButton: {
    padding: 4,
  },
  priorityFlagIcon: {
    fontSize: 20,
  },
  
  // Task Description
  taskDescriptionSection: {
    marginBottom: 20,
  },
  taskDescription: {
    fontSize: 15,
    color: '#8E8E93',
    lineHeight: 20,
    minHeight: 60,
    textAlignVertical: 'top',
    paddingVertical: 0,
  },
  
  // Tags Section
  tagsSection: {
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  
  // Add Tags Button
  addTagsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    marginBottom: 16,
  },
  addTagsIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  addTagsText: {
    fontSize: 15,
    color: '#007AFF',
  },
  
  // Subtasks Section
  subtasksSection: {
    marginBottom: 20,
  },
  subtasksTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  subtaskTitle: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
    marginLeft: 12,
  },
  completedSubtaskTitle: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  
  // Add Subtask
  addSubtaskSection: {
    marginTop: 16,
  },
  addSubtaskInput: {
    fontSize: 15,
    color: '#8E8E93',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  
  // Modal Overlays
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  // List Dropdown Modal
  listDropdownModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    marginHorizontal: 20,
    maxHeight: screenHeight * 0.6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  listDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  listDropdownClose: {
    fontSize: 18,
    color: '#8E8E93',
    fontWeight: '600',
  },
  listDropdownTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  listDropdownPlaceholder: {
    width: 18,
  },
  listDropdownContent: {
    maxHeight: screenHeight * 0.4,
  },
  listDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  selectedListDropdownItem: {
    backgroundColor: '#F2F2F7',
  },
  listDropdownItemIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  listDropdownItemText: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
  },
  selectedListDropdownItemText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  listDropdownItemCheck: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  
  // Action Menu
  actionMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    marginHorizontal: 40,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  actionMenuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  actionMenuText: {
    fontSize: 15,
    color: '#FF3B30',
    fontWeight: '400',
  },
  
  // Priority Menu
  priorityMenuModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    marginHorizontal: 40,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  priorityMenuTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  priorityMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  selectedPriorityMenuItem: {
    backgroundColor: '#F2F2F7',
  },
  priorityMenuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  priorityMenuText: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
  },
  priorityMenuCheck: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  
  // Save Indicator
  saveIndicator: {
    position: 'absolute',
    top: 100,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 6,
  },
});

export default TaskDetailsModalEmailStyle;
