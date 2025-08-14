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
} from 'react-native';
import { Task, Tag, List } from '../types/kary';
import { taskService, tagService, listService } from '../services/dataService';
import { AutoSaveManager } from '../utils/debounceUtils';

const { height: screenHeight } = Dimensions.get('window');

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

const TaskDetailsModalWithAutoSave: React.FC<TaskDetailsModalProps> = ({
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
      500 // Immediate for priority
    );
    
    manager.registerField('tags', 
      (task: Task) => performAutoSave(task, 'tags'), 
      1000 // 1 second for tags
    );

    manager.registerField('completion', 
      (task: Task) => performAutoSave(task, 'completion'), 
      0 // Immediate for completion status
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

  // Manual save function (for save button or critical changes)
  const handleManualSave = async () => {
    if (!editedTask) return;

    try {
      setSaveState(prev => ({ ...prev, isSaving: true, error: null }));
      
      // Cancel any pending auto-saves
      autoSaveManager.current.cancelAllSaves();
      
      // Perform immediate save
      await performAutoSave(editedTask, 'manual');
      
      // Close modal after manual save
      onClose();
    } catch (error: any) {
      setSaveState(prev => ({
        ...prev,
        isSaving: false,
        error: `Save failed: ${error.message}`,
      }));
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
    
    // Warn if there are unsaved changes
    if (saveState.hasUnsavedChanges && saveState.isSaving) {
      Alert.alert(
        'Unsaved Changes',
        'Your changes are being saved. Wait a moment or save manually.',
        [
          { text: 'Wait', style: 'cancel' },
          { text: 'Save Now', onPress: handleManualSave },
          { 
            text: 'Discard', 
            style: 'destructive', 
            onPress: () => {
              autoSaveManager.current.cancelAllSaves();
              onClose();
            }
          },
        ]
      );
      return;
    }
    
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

  // Render save status indicator
  const renderSaveStatus = () => {
    if (saveState.error) {
      return (
        <View style={styles.saveStatus}>
          <Text style={styles.errorText}>❌ {saveState.error}</Text>
          <TouchableOpacity onPress={handleManualSave} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (saveState.isSaving) {
      return (
        <View style={styles.saveStatus}>
          <ActivityIndicator size="small" color="#2196F3" />
          <Text style={styles.savingText}>💾 Saving...</Text>
        </View>
      );
    }

    if (saveState.lastSaved && !saveState.hasUnsavedChanges) {
      return (
        <View style={styles.saveStatus}>
          <Text style={styles.savedText}>✅ Saved</Text>
        </View>
      );
    }

    if (saveState.hasUnsavedChanges) {
      return (
        <View style={styles.saveStatus}>
          <Text style={styles.unsavedText}>📝 Auto-saving...</Text>
        </View>
      );
    }

    return null;
  };

  if (!visible || !task || !editedTask) return null;

  const modalHeight = isExpanded ? screenHeight * 0.9 : screenHeight * 0.5;
  const selectedList = lists.find(l => l.id === task.listId);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
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

          {/* Header with Save Status */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.statusButton}
                onPress={() => updateTaskField({
                  completed: !editedTask.completed,
                  completionDate: !editedTask.completed ? new Date() : undefined,
                }, 'completion')}
              >
                <Text style={styles.statusIcon}>
                  {editedTask.completed ? '✅' : '⭕'}
                </Text>
              </TouchableOpacity>
              <View style={styles.taskMeta}>
                <Text style={styles.listName}>{selectedList?.name}</Text>
                {task.dueDate && (
                  <Text style={styles.dueDate}>
                    📅 {formatDate(task.dueDate)}
                  </Text>
                )}
                {renderSaveStatus()}
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleManualSave}
                disabled={saveState.isSaving}
              >
                <Text style={styles.actionIcon}>💾</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
                <Text style={styles.actionIcon}>🗑️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleClose}>
                <Text style={styles.actionIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Task Title with Auto-Save */}
            <TextInput
              style={[
                styles.titleInput,
                editedTask.completed && styles.completedTitle
              ]}
              value={editedTask.title}
              onChangeText={(text) => updateTaskField({ title: text }, 'title')}
              placeholder="Task title..."
              multiline
            />

            {/* Priority with Immediate Save */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Priority</Text>
              <View style={styles.priorityContainer}>
                {[1, 2, 3, 4].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityButton,
                      editedTask.priority === priority && styles.selectedPriority
                    ]}
                    onPress={() => updateTaskField({ priority: priority as 1 | 2 | 3 | 4 }, 'priority')}
                  >
                    <Text style={styles.priorityIcon}>{getPriorityIcon(priority)}</Text>
                    <Text style={styles.priorityText}>{getPriorityText(priority)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Description with Auto-Save */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Description</Text>
              <TextInput
                style={styles.descriptionInput}
                value={editedTask.description || ''}
                onChangeText={(text) => updateTaskField({ description: text }, 'description')}
                placeholder="Add description..."
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Tags with Auto-Save */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Tags</Text>
              <View style={styles.tagsContainer}>
                {availableTags.map((tag) => {
                  const isSelected = editedTask.tags?.includes(tag.name);
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[
                        styles.tagChip,
                        isSelected && styles.selectedTag
                      ]}
                      onPress={() => {
                        const currentTags = editedTask.tags || [];
                        const newTags = isSelected
                          ? currentTags.filter(t => t !== tag.name)
                          : [...currentTags, tag.name];
                        updateTaskField({ tags: newTags }, 'tags');
                      }}
                    >
                      <Text style={[
                        styles.tagText,
                        isSelected && styles.selectedTagText
                      ]}>
                        #{tag.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Subtasks */}
            {isExpanded && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Subtasks ({subtasks.length})</Text>
                
                {/* Add Subtask */}
                <View style={styles.addSubtaskContainer}>
                  <TextInput
                    style={styles.subtaskInput}
                    value={newSubtaskTitle}
                    onChangeText={setNewSubtaskTitle}
                    placeholder="Add a subtask..."
                    onSubmitEditing={addSubtask}
                  />
                  <TouchableOpacity style={styles.addSubtaskButton} onPress={addSubtask}>
                    <Text style={styles.addSubtaskIcon}>➕</Text>
                  </TouchableOpacity>
                </View>

                {/* Subtasks List */}
                {subtasks.map((subtask) => (
                  <View key={subtask.id} style={styles.subtaskItem}>
                    <TouchableOpacity
                      style={styles.subtaskCheckbox}
                      onPress={() => toggleSubtask(subtask.id, subtask.completed)}
                    >
                      <Text style={styles.subtaskStatusIcon}>
                        {subtask.completed ? '✅' : '⭕'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={[
                      styles.subtaskTitle,
                      subtask.completed && styles.completedSubtask
                    ]}>
                      {subtask.title}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Task Info */}
            {isExpanded && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Task Info</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Created:</Text>
                  <Text style={styles.infoValue}>{formatDate(task.createdAt)}</Text>
                </View>
                {task.completionDate && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Completed:</Text>
                    <Text style={styles.infoValue}>{formatDate(task.completionDate)}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>List:</Text>
                  <Text style={styles.infoValue}>{selectedList?.name}</Text>
                </View>
                {saveState.lastSaved && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Last Saved:</Text>
                    <Text style={styles.infoValue}>{formatDate(saveState.lastSaved)}</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
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
  // Save status styles
  saveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  savingText: {
    fontSize: 10,
    color: '#2196F3',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  savedText: {
    fontSize: 10,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
  unsavedText: {
    fontSize: 10,
    color: '#FF9800',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 10,
    color: '#F44336',
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
});

export default TaskDetailsModalWithAutoSave;

