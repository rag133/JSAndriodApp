import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Task, Tag, List } from '../types/kary';
import { taskService, tagService, listService } from '../services/dataService';
import { AutoSaveManager } from '../utils/debounceUtils';
import MaterialDesign3DateTimePicker from './MaterialDesign3DateTimePicker';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

interface SaveState {
  isSaving: boolean;
  lastSaved?: Date;
  error?: string;
}

interface TaskDetailsModalEmailUIProps {
  visible: boolean;
  task: Task | null;
  lists: List[];
  tags: Tag[];
  tasks: Task[]; // Add tasks prop to access all tasks for subtask lookup
  onSave: (task: Task) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
  onClose: () => void;
}

const TaskDetailsModalEmailUI: React.FC<TaskDetailsModalEmailUIProps> = ({
  visible,
  task,
  lists,
  tags,
  tasks,
  onSave,
  onDelete,
  onClose,
}) => {
  // State management
  const [editedTask, setEditedTask] = useState<Task>(
    task || {
      id: '',
      title: '',
      description: '',
      completed: false,
      priority: 3, // Use number format to match web app
      tags: [],
      listId: lists[0]?.id || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );

  const [saveState, setSaveState] = useState<SaveState>({ isSaving: false });
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [showListDropdown, setShowListDropdown] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Auto-save manager
  const autoSaveManager = useRef(new AutoSaveManager()).current;

  // Priority options with updated colors (number format to match web app)
  const priorityOptions = [
    { value: 1, label: 'Urgent', color: '#FF3B30', icon: '🚩' }, // Red for high/urgent
    { value: 2, label: 'High', color: '#FF3B30', icon: '🚩' },   // Red for high
    { value: 3, label: 'Medium', color: '#FFCC00', icon: '🚩' }, // Yellow for medium
    { value: 4, label: 'Low', color: '#007AFF', icon: '🚩' },    // Blue for low
    { value: undefined, label: 'No Priority', color: '#C7C7CC', icon: '🏳️' }, // Light grey for none
  ];

  // Initialize auto-save
  useEffect(() => {
    if (!task) return;

    const performAutoSave = async (updatedTask: Task, field: string) => {
      try {
        setSaveState(prev => ({ ...prev, isSaving: true, error: undefined }));
        await onSave(updatedTask);
        setSaveState(prev => ({
          ...prev,
          isSaving: false,
          lastSaved: new Date(),
        }));
      } catch (error: any) {
        console.error(`Auto-save failed for ${field}:`, error);
        setSaveState(prev => ({
          ...prev,
          isSaving: false,
          error: error.message,
        }));
      }
    };

    // Register fields for auto-save
    autoSaveManager.registerField('title', (task: Task) => performAutoSave(task, 'title'), 1000);
    autoSaveManager.registerField('description', (task: Task) => performAutoSave(task, 'description'), 1500);
    autoSaveManager.registerField('priority', (task: Task) => performAutoSave(task, 'priority'), 500);
    autoSaveManager.registerField('listId', (task: Task) => performAutoSave(task, 'listId'), 500);
    autoSaveManager.registerField('tags', (task: Task) => performAutoSave(task, 'tags'), 500);
    autoSaveManager.registerField('dueDate', (task: Task) => performAutoSave(task, 'dueDate'), 1000);
    autoSaveManager.registerField('completed', (task: Task) => performAutoSave(task, 'completed'), 0);
    autoSaveManager.registerField('subtasks', (task: Task) => performAutoSave(task, 'subtasks'), 1000);

    return () => {
      autoSaveManager.cancelAllSaves();
    };
  }, [task, onSave]);

  // Update edited task when task prop changes
  useEffect(() => {
    if (task) {
      setEditedTask(task);
    }
  }, [task]);

  // Handle field updates
  const updateField = (field: keyof Task, value: any) => {
    const updatedTask = { ...editedTask, [field]: value, updatedAt: new Date() };
    setEditedTask(updatedTask);
    
    if (task?.id) {
      autoSaveManager.triggerSave(field as string, updatedTask);
    }
  };

  // Handle task completion toggle
  const handleToggleCompletion = () => {
    updateField('completed', !editedTask.completed);
  };

  // Handle priority change
  const handlePriorityChange = (priority: string) => {
    updateField('priority', priority);
    setShowPriorityMenu(false);
  };

  // Handle list change
  const handleListChange = (listId: string) => {
    updateField('listId', listId);
    setShowListDropdown(false);
  };

  // Handle due date change
  const handleDueDateChange = (date: Date) => {
    updateField('dueDate', date);
    setShowDateTimePicker(false);
  };

  // Handle due date removal
  const handleRemoveDueDate = () => {
    updateField('dueDate', undefined);
  };

  // Handle tag toggle
  const handleTagToggle = (tagId: string) => {
    const currentTags = editedTask.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];
    updateField('tags', newTags);
  };

  // Handle subtask addition - Create new task with parentId
  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !editedTask.id) return;
    
    try {
      // Create new subtask as a separate task with parentId
      const newSubtaskId = await taskService.add({
        title: newSubtaskTitle.trim(),
        listId: editedTask.listId,
        completed: false,
        priority: 3, // Default priority
        tags: [],
        parentId: editedTask.id, // Link to parent task
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Clear input
      setNewSubtaskTitle('');
      
      // Refresh the parent component to show new subtask
      // The parent will re-fetch tasks and display the new subtask
      if (onSave) {
        await onSave(editedTask);
      }
    } catch (error: any) {
      console.error('Error adding subtask:', error);
      Alert.alert('Error', `Failed to add subtask: ${error.message}`);
    }
  };

  // Handle subtask toggle - Update the actual subtask task
  const handleSubtaskToggle = async (subtaskId: string) => {
    try {
      // Find the subtask in the tasks array
      const subtask = tasks.find(t => t.id === subtaskId);
      if (!subtask) return;
      
      // Update the subtask completion status
      await taskService.update(subtaskId, {
        completed: !subtask.completed,
        updatedAt: new Date()
      });
      
      // Refresh the parent component to show updated subtask
      if (onSave) {
        await onSave(editedTask);
      }
    } catch (error: any) {
      console.error('Error updating subtask:', error);
      Alert.alert('Error', `Failed to update subtask: ${error.message}`);
    }
  };

  // Handle subtask deletion - Delete the actual subtask task
  const handleSubtaskDelete = async (subtaskId: string) => {
    try {
      // Delete the subtask
      await taskService.delete(subtaskId);
      
      // Refresh the parent component to show updated subtask list
      if (onSave) {
        await onSave(editedTask);
      }
    } catch (error: any) {
      console.error('Error deleting subtask:', error);
      Alert.alert('Error', `Failed to delete subtask: ${error.message}`);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!task?.id || !onDelete) return;

    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete(task.id);
              onClose();
            } catch (error: any) {
              Alert.alert('Error', `Failed to delete task: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  // Handle close
  const handleClose = () => {
    autoSaveManager.cancelAllSaves();
    setShowListDropdown(false);
    setShowActionsMenu(false);
    setShowPriorityMenu(false);
    onClose();
  };

  // Get selected list
  const selectedList = lists.find(list => list.id === editedTask.listId) || lists[0];

  // Get selected priority
  const selectedPriority = priorityOptions.find(option => option.value === editedTask.priority) || priorityOptions[4]; // Default to no priority

  // Format date
  const formatDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (taskDate.getTime() === today.getTime()) {
      return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (taskDate.getTime() === today.getTime() + 24 * 60 * 60 * 1000) {
      return `Tomorrow ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <StatusBar backgroundColor="rgba(0, 0, 0, 0.5)" barStyle="light-content" />
      
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          
          {/* Layer 1: Down Arrow, List Name, 3-Dot Menu */}
          <View style={styles.layer1}>
            <TouchableOpacity onPress={handleClose} style={styles.downArrowButton}>
              <Text style={styles.downArrowIcon}>⌄</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setShowListDropdown(true)}
              style={styles.listNameButton}
            >
              <Text style={styles.listNameText}>{selectedList?.name || 'Inbox'}</Text>
              <Text style={styles.listDropdownIcon}>⌄</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setShowActionsMenu(true)}
              style={styles.menuButton}
            >
              <Text style={styles.menuIcon}>⋮</Text>
            </TouchableOpacity>
          </View>

          {/* Layer 2: Checkbox, Date-Time, Flag */}
          <View style={styles.layer2}>
            <TouchableOpacity onPress={handleToggleCompletion} style={styles.checkboxButton}>
              <View style={[styles.checkbox, editedTask.completed && styles.checkboxCompleted]}>
                {editedTask.completed && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setShowDateTimePicker(true)}
              style={styles.dateTimeButton}
            >
              <Text style={styles.dateTimeText}>
                {editedTask.dueDate ? formatDate(editedTask.dueDate) : 'Set due date'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setShowPriorityMenu(true)}
              style={styles.flagButton}
            >
              <Text style={[styles.flagIcon, { color: selectedPriority.color }]}>
                {selectedPriority.icon}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* Layer 3: Task Name */}
            <View style={styles.layer3}>
              <TextInput
                value={editedTask.title}
                onChangeText={(text) => updateField('title', text)}
                placeholder="Task name"
                style={styles.taskNameInput}
                multiline={false}
                placeholderTextColor="#8E8E93"
              />
            </View>

            {/* Layer 4: Description */}
            <View style={styles.layer4}>
              <TextInput
                value={editedTask.description || ''}
                onChangeText={(text) => updateField('description', text)}
                placeholder="Add description..."
                style={styles.descriptionInput}
                multiline={true}
                placeholderTextColor="#8E8E93"
              />
            </View>

            {/* Layer 5: Subtasks */}
            <View style={styles.layer5}>
              <Text style={styles.sectionTitle}>Subtasks</Text>
              
              {/* Get subtasks from parentId structure (web app) */}
              {(() => {
                // Find all tasks that have this task as parent
                const subtasks = tasks.filter(t => t.parentId === editedTask.id);
                return subtasks.map((subtask) => (
                  <View key={subtask.id} style={styles.subtaskRow}>
                    <TouchableOpacity 
                      onPress={() => handleSubtaskToggle(subtask.id)}
                      style={styles.subtaskCheckbox}
                    >
                      <View style={[styles.checkbox, styles.subtaskCheckboxSmall, subtask.completed && styles.checkboxCompleted]}>
                        {subtask.completed && <Text style={styles.checkboxCheckSmall}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                    
                    <Text style={[
                      styles.subtaskTitle,
                      subtask.completed && styles.subtaskTitleCompleted
                    ]}>
                      {subtask.title}
                    </Text>
                    
                    <TouchableOpacity 
                      onPress={() => handleSubtaskDelete(subtask.id)}
                      style={styles.subtaskDeleteButton}
                    >
                      <Text style={styles.subtaskDeleteIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ));
              })()}
              
              <View style={styles.addSubtaskRow}>
                <View style={[styles.checkbox, styles.subtaskCheckboxSmall, styles.addSubtaskCheckbox]}>
                  <Text style={styles.addSubtaskIcon}>+</Text>
                </View>
                <TextInput
                  value={newSubtaskTitle}
                  onChangeText={setNewSubtaskTitle}
                  placeholder="Add subtask"
                  style={styles.addSubtaskInput}
                  placeholderTextColor="#8E8E93"
                  onSubmitEditing={handleAddSubtask}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Layer 6: Tags */}
            <View style={styles.layer6}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {tags.map((tag) => (
                  <TouchableOpacity
                    key={tag.id}
                    onPress={() => handleTagToggle(tag.id)}
                    style={[
                      styles.tagChip,
                      editedTask.tags?.includes(tag.id) && styles.tagChipSelected
                    ]}
                  >
                    <Text style={[
                      styles.tagChipText,
                      editedTask.tags?.includes(tag.id) && styles.tagChipTextSelected
                    ]}>
                      {tag.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.bottomSpacing} />
          </ScrollView>

          {/* Save State Indicator */}
          {saveState.isSaving && (
            <View style={styles.saveIndicator}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.saveText}>Saving...</Text>
            </View>
          )}

          {/* List Dropdown */}
          {showListDropdown && (
            <TouchableOpacity 
              style={styles.dropdown}
              activeOpacity={1}
              onPress={() => setShowListDropdown(false)}
            >
              <TouchableOpacity 
                style={styles.dropdownContent}
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <Text style={styles.dropdownTitle}>Move to list</Text>
                {lists.map((list) => (
                  <TouchableOpacity
                    key={list.id}
                    onPress={() => handleListChange(list.id)}
                    style={styles.dropdownItem}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      list.id === editedTask.listId && styles.dropdownItemTextSelected
                    ]}>
                      {list.name}
                    </Text>
                    {list.id === editedTask.listId && (
                      <Text style={styles.dropdownItemCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </TouchableOpacity>
            </TouchableOpacity>
          )}

          {/* Actions Menu */}
          {showActionsMenu && (
            <TouchableOpacity 
              style={styles.dropdown}
              activeOpacity={1}
              onPress={() => setShowActionsMenu(false)}
            >
              <TouchableOpacity 
                style={styles.dropdownContent}
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                {task?.id && onDelete && (
                  <TouchableOpacity
                    onPress={() => {
                      setShowActionsMenu(false);
                      handleDelete();
                    }}
                    style={styles.dropdownItem}
                  >
                    <Text style={[styles.dropdownItemText, styles.deleteText]}>Delete</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          )}

          {/* Priority Menu */}
          {showPriorityMenu && (
            <TouchableOpacity 
              style={styles.dropdown}
              activeOpacity={1}
              onPress={() => setShowPriorityMenu(false)}
            >
              <TouchableOpacity 
                style={styles.dropdownContent}
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <Text style={styles.dropdownTitle}>Priority</Text>
                {priorityOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => handlePriorityChange(option.value)}
                    style={styles.dropdownItem}
                  >
                    <Text style={[styles.priorityIcon, { color: option.color }]}>{option.icon}</Text>
                    <Text style={[
                      styles.dropdownItemText,
                      option.value === editedTask.priority && styles.dropdownItemTextSelected
                    ]}>
                      {option.label}
                    </Text>
                    {option.value === editedTask.priority && (
                      <Text style={styles.dropdownItemCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </TouchableOpacity>
            </TouchableOpacity>
          )}

          {/* Material Design 3 Date Time Picker */}
          <MaterialDesign3DateTimePicker
            visible={showDateTimePicker}
            initialDate={editedTask.dueDate}
            onConfirm={handleDueDateChange}
            onCancel={() => setShowDateTimePicker(false)}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Layer 1: Down Arrow, List Name, 3-Dot Menu
  layer1: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    backgroundColor: '#FFFFFF',
  },
  downArrowButton: {
    padding: 8,
  },
  downArrowIcon: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '600',
  },
  listNameButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  listNameText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  listDropdownIcon: {
    fontSize: 16,
    color: '#8E8E93',
    marginLeft: 4,
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '600',
  },
  
  // Layer 2: Checkbox, Date-Time, Flag
  layer2: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  checkboxButton: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dateTimeButton: {
    flex: 1,
    paddingHorizontal: 8,
  },
  dateTimeText: {
    fontSize: 15,
    color: '#007AFF',
  },
  flagButton: {
    padding: 4,
  },
  flagIcon: {
    fontSize: 20,
  },
  
  // Scroll Content
  scrollContent: {
    flex: 1,
  },
  
  // Layer 3: Task Name
  layer3: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  taskNameInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    paddingVertical: 0,
    textAlignVertical: 'top',
  },
  
  // Layer 4: Description
  layer4: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  descriptionInput: {
    fontSize: 16,
    color: '#000000',
    minHeight: 60,
    textAlignVertical: 'top',
    paddingVertical: 0,
  },
  
  // Layer 5: Subtasks
  layer5: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subtaskCheckbox: {
    marginRight: 12,
  },
  subtaskCheckboxSmall: {
    width: 20,
    height: 20,
    borderRadius: 3,
  },
  checkboxCheckSmall: {
    fontSize: 12,
    fontWeight: '600',
  },
  subtaskTitle: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
  },
  subtaskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  subtaskDeleteButton: {
    padding: 4,
  },
  subtaskDeleteIcon: {
    fontSize: 14,
    color: '#FF3B30',
  },
  addSubtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addSubtaskCheckbox: {
    borderColor: '#8E8E93',
    marginRight: 12,
  },
  addSubtaskIcon: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  addSubtaskInput: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
    paddingVertical: 0,
  },
  
  // Layer 6: Tags
  layer6: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChip: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagChipSelected: {
    backgroundColor: '#007AFF',
  },
  tagChipText: {
    fontSize: 14,
    color: '#000000',
  },
  tagChipTextSelected: {
    color: '#FFFFFF',
  },
  
  // Save Indicator
  saveIndicator: {
    position: 'absolute',
    top: 80,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  saveText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 6,
  },
  
  // Dropdown Menus
  dropdown: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  dropdownContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 16,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  dropdownItemTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  dropdownItemCheck: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  deleteText: {
    color: '#FF3B30',
  },
  priorityIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  
  // Bottom Spacing
  bottomSpacing: {
    height: 40,
  },
});

export default TaskDetailsModalEmailUI;
