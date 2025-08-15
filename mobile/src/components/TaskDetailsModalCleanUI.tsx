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

const TaskDetailsModalCleanUI: React.FC<TaskDetailsModalProps> = ({
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
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
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
    updateTaskField({ listId }, 'list');
  };

  // Handle priority change
  const handlePriorityChange = (priority: 1 | 2 | 3 | 4 | undefined) => {
    updateTaskField({ priority }, 'priority');
    setShowPriorityMenu(false);
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

  const getPriorityFlag = (priority: number | undefined) => {
    switch (priority) {
      case 1: return { icon: '🚩', color: '#F44336', text: 'High Priority' }; // Red flag
      case 2: return { icon: '🧡', color: '#FF9800', text: 'Medium Priority' }; // Orange flag  
      case 3: return { icon: '💛', color: '#FFC107', text: 'Medium Priority' }; // Yellow flag
      case 4: return { icon: '🔵', color: '#2196F3', text: 'Low Priority' }; // Blue flag
      default: return { icon: '🏳️', color: '#9E9E9E', text: 'No Priority' }; // Gray flag
    }
  };

  // Render save status indicator (minimal)
  const renderSaveStatus = () => {
    if (saveState.isSaving) {
      return (
        <View style={styles.saveStatusMinimal}>
          <ActivityIndicator size="small" color="#2196F3" />
        </View>
      );
    }
    return null;
  };

  if (!visible || !task || !editedTask) return null;

  const modalHeight = isExpanded ? screenHeight * 0.9 : screenHeight * 0.6;
  const selectedList = lists.find(l => l.id === selectedListId);
  const priorityFlag = getPriorityFlag(editedTask.priority);

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

          {/* Clean Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              {/* Close Button */}
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeIcon}>×</Text>
              </TouchableOpacity>
              
              {/* Save Status */}
              {renderSaveStatus()}
              
              {/* 3-Dot Menu */}
              <TouchableOpacity 
                style={styles.menuButton} 
                onPress={() => setShowActionMenu(!showActionMenu)}
              >
                <Text style={styles.menuIcon}>⋯</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* List Name at Top (Editable) */}
            <View style={styles.listSection}>
              <Text style={styles.listLabel}>List</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.listSelector}>
                  {lists.map((list) => (
                    <TouchableOpacity
                      key={list.id}
                      style={[
                        styles.listChip,
                        selectedListId === list.id && styles.selectedListChip
                      ]}
                      onPress={() => handleListChange(list.id)}
                    >
                      <Text style={[
                        styles.listChipText,
                        selectedListId === list.id && styles.selectedListChipText
                      ]}>
                        {list.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Task Title with Completion Status */}
            <View style={styles.titleSection}>
              <TouchableOpacity
                style={styles.completionButton}
                onPress={() => updateTaskField({
                  completed: !editedTask.completed,
                  completionDate: !editedTask.completed ? new Date() : undefined,
                }, 'completion')}
              >
                <Text style={styles.completionIcon}>
                  {editedTask.completed ? '✅' : '⭕'}
                </Text>
              </TouchableOpacity>
              
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
              
              {/* Priority Flag */}
              <TouchableOpacity
                style={styles.priorityFlag}
                onPress={() => setShowPriorityMenu(!showPriorityMenu)}
              >
                <Text style={styles.priorityFlagIcon}>{priorityFlag.icon}</Text>
              </TouchableOpacity>
            </View>

            {/* Due Date */}
            {task.dueDate && (
              <View style={styles.dueDateSection}>
                <Text style={styles.dueDateText}>
                  📅 Due {formatDate(task.dueDate)}
                </Text>
              </View>
            )}

            {/* Description */}
            <View style={styles.section}>
              <TextInput
                style={styles.descriptionInput}
                value={editedTask.description || ''}
                onChangeText={(text) => updateTaskField({ description: text }, 'description')}
                placeholder="Add description..."
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Tags */}
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
                    <Text style={styles.addSubtaskIcon}>+</Text>
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
          </ScrollView>

          {/* Action Menu Modal */}
          {showActionMenu && (
            <View style={styles.menuOverlay}>
              <TouchableOpacity 
                style={styles.menuBackdrop} 
                onPress={() => setShowActionMenu(false)} 
              />
              <View style={styles.actionMenu}>
                <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                  <Text style={styles.menuItemIcon}>🗑️</Text>
                  <Text style={styles.menuItemText}>Delete Task</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => setShowActionMenu(false)}
                >
                  <Text style={styles.menuItemIcon}>✕</Text>
                  <Text style={styles.menuItemText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Priority Menu Modal */}
          {showPriorityMenu && (
            <View style={styles.menuOverlay}>
              <TouchableOpacity 
                style={styles.menuBackdrop} 
                onPress={() => setShowPriorityMenu(false)} 
              />
              <View style={styles.priorityMenu}>
                <Text style={styles.priorityMenuTitle}>Set Priority</Text>
                {[
                  { value: 1, icon: '🚩', text: 'High Priority', color: '#F44336' },
                  { value: 2, icon: '🧡', text: 'Medium High', color: '#FF9800' },
                  { value: 3, icon: '💛', text: 'Medium', color: '#FFC107' },
                  { value: 4, icon: '🔵', text: 'Low Priority', color: '#2196F3' },
                  { value: undefined, icon: '🏳️', text: 'No Priority', color: '#9E9E9E' },
                ].map((priority) => (
                  <TouchableOpacity
                    key={priority.value || 'none'}
                    style={[
                      styles.priorityMenuItem,
                      editedTask.priority === priority.value && styles.selectedPriorityItem
                    ]}
                    onPress={() => handlePriorityChange(priority.value as any)}
                  >
                    <Text style={styles.priorityMenuIcon}>{priority.icon}</Text>
                    <Text style={styles.priorityMenuText}>{priority.text}</Text>
                    {editedTask.priority === priority.value && (
                      <Text style={styles.priorityCheckmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  saveStatusMinimal: {
    flex: 1,
    alignItems: 'center',
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  // List Section
  listSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  listSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  listChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedListChip: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  listChipText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedListChipText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  // Title Section
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  completionButton: {
    marginRight: 12,
    marginTop: 2,
  },
  completionIcon: {
    fontSize: 24,
  },
  titleInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    minHeight: 50,
    textAlignVertical: 'top',
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  priorityFlag: {
    marginLeft: 8,
    marginTop: 2,
  },
  priorityFlagIcon: {
    fontSize: 20,
  },
  // Due Date
  dueDateSection: {
    paddingVertical: 8,
  },
  dueDateText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '500',
  },
  // Description
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
  },
  // Tags
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
  // Subtasks
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
    backgroundColor: '#2196F3',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSubtaskIcon: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
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
  // Menu Overlays
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  // Action Menu
  actionMenu: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 40,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  // Priority Menu
  priorityMenu: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 40,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  priorityMenuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    textAlign: 'center',
  },
  priorityMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedPriorityItem: {
    backgroundColor: '#f0f8ff',
  },
  priorityMenuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  priorityMenuText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  priorityCheckmark: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
  },
});

export default TaskDetailsModalCleanUI;

