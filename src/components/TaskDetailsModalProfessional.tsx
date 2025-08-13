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

const TaskDetailsModalProfessional: React.FC<TaskDetailsModalProps> = ({
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
  const [showListDropdown, setShowListDropdown] = useState(false);
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
    setShowListDropdown(false);
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
    setShowListDropdown(false);
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

  // Render save status indicator (minimal)
  const renderSaveStatus = () => {
    if (saveState.isSaving) {
      return (
        <ActivityIndicator size="small" color="#6B7280" style={styles.saveIndicator} />
      );
    }
    return null;
  };

  if (!visible || !task || !editedTask) return null;

  const modalHeight = isExpanded ? screenHeight * 0.9 : screenHeight * 0.65;
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

          {/* Professional Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              {renderSaveStatus()}
            </View>
            
            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={() => setShowActionMenu(!showActionMenu)}
            >
              <Text style={styles.menuIcon}>⋯</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* List Dropdown */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>List</Text>
              <TouchableOpacity 
                style={styles.dropdown}
                onPress={() => setShowListDropdown(!showListDropdown)}
              >
                <Text style={styles.dropdownText}>{selectedList?.name || 'Select List'}</Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Main Task Row */}
            <View style={styles.taskRow}>
              {/* Checkbox */}
              {renderCheckbox(editedTask.completed, () => updateTaskField({
                completed: !editedTask.completed,
                completionDate: !editedTask.completed ? new Date() : undefined,
              }, 'completion'))}
              
              {/* Task Content */}
              <View style={styles.taskContent}>
                {/* Title and Priority Flag Row */}
                <View style={styles.titleRow}>
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
                  <View style={styles.dueDateRow}>
                    <Text style={styles.dueDateText}>
                      📅 Due {formatDate(task.dueDate)}
                    </Text>
                  </View>
                )}

                {/* Description */}
                <TextInput
                  style={styles.descriptionInput}
                  value={editedTask.description || ''}
                  onChangeText={(text) => updateTaskField({ description: text }, 'description')}
                  placeholder="Add description..."
                  multiline
                  textAlignVertical="top"
                />
              </View>
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
                    {renderCheckbox(subtask.completed, () => toggleSubtask(subtask.id, subtask.completed))}
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

          {/* List Dropdown Modal */}
          {showListDropdown && (
            <View style={styles.dropdownOverlay}>
              <TouchableOpacity 
                style={styles.dropdownBackdrop} 
                onPress={() => setShowListDropdown(false)} 
              />
              <View style={styles.dropdownMenu}>
                <Text style={styles.dropdownTitle}>Move to</Text>
                <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                  {lists.map((list) => (
                    <TouchableOpacity
                      key={list.id}
                      style={[
                        styles.dropdownItem,
                        selectedListId === list.id && styles.selectedDropdownItem
                      ]}
                      onPress={() => handleListChange(list.id)}
                    >
                      <View style={styles.dropdownItemContent}>
                        <Text style={styles.dropdownItemIcon}>📁</Text>
                        <Text style={[
                          styles.dropdownItemText,
                          selectedListId === list.id && styles.selectedDropdownText
                        ]}>
                          {list.name}
                        </Text>
                        {selectedListId === list.id && (
                          <Text style={styles.dropdownCheckmark}>✓</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

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
                  { value: 1, icon: '🚩', text: 'High Priority', color: '#DC2626' },
                  { value: 2, icon: '🟠', text: 'Medium Priority', color: '#EA580C' },
                  { value: 3, icon: '🟡', text: 'Medium Priority', color: '#CA8A04' },
                  { value: 4, icon: '🔵', text: 'Low Priority', color: '#2563EB' },
                  { value: undefined, icon: '🏳️', text: 'No Priority', color: '#6B7280' },
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
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
  },
  handle: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  saveIndicator: {
    // Minimal save indicator
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Professional Sections
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  
  // List Dropdown
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dropdownText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Task Row
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  
  // Professional Checkbox
  checkboxContainer: {
    marginRight: 16,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkboxTick: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Task Content
  taskContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 22,
    paddingVertical: 0,
    marginRight: 12,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  
  // Priority Flag
  priorityFlag: {
    padding: 4,
  },
  priorityFlagIcon: {
    fontSize: 18,
  },
  
  // Due Date
  dueDateRow: {
    marginBottom: 8,
  },
  dueDateText: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '500',
  },
  
  // Description
  descriptionInput: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    minHeight: 40,
    textAlignVertical: 'top',
    paddingVertical: 0,
  },
  
  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  selectedTag: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  tagText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedTagText: {
    color: '#3B82F6',
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
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 8,
  },
  addSubtaskButton: {
    backgroundColor: '#3B82F6',
    width: 32,
    height: 32,
    borderRadius: 6,
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
    borderBottomColor: '#F3F4F6',
  },
  subtaskTitle: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
  },
  completedSubtask: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  
  // Dropdown Overlay
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dropdownMenu: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 40,
    maxHeight: 300,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    textAlign: 'center',
  },
  dropdownScroll: {
    maxHeight: 240,
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  selectedDropdownItem: {
    backgroundColor: '#EFF6FF',
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownItemIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  selectedDropdownText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  dropdownCheckmark: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: 'bold',
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
    borderBottomColor: '#F3F4F6',
  },
  menuItemIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
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
    color: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    textAlign: 'center',
  },
  priorityMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  selectedPriorityItem: {
    backgroundColor: '#EFF6FF',
  },
  priorityMenuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  priorityMenuText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  priorityCheckmark: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: 'bold',
  },
});

export default TaskDetailsModalProfessional;
