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
} from 'react-native';
// Removed MaterialIcons import to avoid font issues
import { taskService, listService } from '../services/dataService';
import { Task, List } from '../types/kary';
import SimpleDrawer from '../navigation/SimpleDrawerNavigator';
import { useFilter } from '../contexts/FilterContext';
import TaskDetailsModal from '../components/TaskDetailsModal';

const KaryScreen = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<List[]>([]);
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
      const [tasksData, listsData] = await Promise.all([
        taskService.getAll(),
        listService.getAll(),
      ]);
      
      setTasks(tasksData);
      setLists(listsData);
      
      // Set default list if none selected
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
      
      // Reset form
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

  const handleAddList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    try {
      const listId = await listService.add({
        name: newListName.trim(),
        icon: 'list',
        color: '#2196F3',
      });
      
      setNewListName('');
      setShowAddList(false);
      setSelectedListId(listId);
      loadData();
      Alert.alert('Success', 'List added!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleCompleteTask = async (taskId: string, completed: boolean) => {
    try {
      await taskService.update(taskId, { 
        completed: !completed,
        completionDate: !completed ? new Date() : undefined,
      });
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
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
      await taskService.update(updatedTask.id, updatedTask);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
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

    // Apply smart filters
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

  // Helper functions for enhanced UI
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

  const getPriorityIcon = (priority: number | undefined) => {
    switch (priority) {
      case 1: return '🚨'; // Urgent (P1)
      case 2: return '🔴'; // High (P2)
      case 3: return '🟡'; // Medium (P3)
      case 4: return '🟢'; // Low (P4)
      default: return '';
    }
  };

  const getPriorityStyle = (priority: number | undefined) => {
    switch (priority) {
      case 1: return styles.urgentPriority; // Urgent
      case 2: return styles.highPriority;   // High
      case 3: return styles.mediumPriority; // Medium
      case 4: return styles.lowPriority;    // Low
      default: return styles.defaultPriority;
    }
  };

  const getPriorityText = (priority: number | undefined) => {
    switch (priority) {
      case 1: return 'Urgent';
      case 2: return 'High';
      case 3: return 'Medium';
      case 4: return 'Low';
      default: return '';
    }
  };

  const selectedList = lists.find(list => list.id === filterState.kary.selectedListId);
  const completedCount = filteredTasks.filter(task => task.completed).length;
  const totalCount = filteredTasks.length;

  return (
    <View style={styles.container}>
      {/* Header with Hamburger Menu and List Selector */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.hamburgerButton}
            onPress={() => setShowDrawer(true)}
          >
            <Text style={styles.hamburgerIcon}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {getFilterTitle('kary', lists)}
          </Text>
        </View>
        <Text style={styles.subtitle}>
          {completedCount}/{totalCount} completed
        </Text>
      </View>

      {/* Tasks List */}
      <ScrollView 
        style={styles.tasksList}
        contentContainerStyle={styles.tasksContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
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
          <>
            {/* Active Tasks */}
            {filteredTasks.filter(task => !task.completed).map((task) => (
              <View key={task.id} style={[styles.taskCard, styles.activeTaskCard]}>
                <View style={styles.taskRow}>
                  <TouchableOpacity 
                    style={[styles.checkbox, styles.activeCheckbox]}
                    onPress={() => handleCompleteTask(task.id, true)}
                  >
                    <View style={styles.checkboxInner} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.taskContent}
                    onPress={() => openTaskDetails(task)}
                  >
                    <Text style={styles.taskTitle}>
                      {task.title}
                    </Text>
                    {task.description && (
                      <Text style={styles.taskDescription}>{task.description}</Text>
                    )}
                    
                    <View style={styles.taskMeta}>
                      {task.dueDate && (
                        <View style={styles.dueDateContainer}>
                          <Text style={styles.dueDateIcon}>🗓️</Text>
                          <Text style={[
                            styles.taskDue,
                            isDueSoon(task.dueDate) && styles.dueSoon,
                            isOverdue(task.dueDate) && styles.overdue
                          ]}>
                            {formatDueDate(task.dueDate)}
                          </Text>
                        </View>
                      )}
                      
                      {task.priority && task.priority > 0 && (
                        <View style={styles.priorityContainer}>
                          <Text style={[
                            styles.priorityBadge,
                            getPriorityStyle(task.priority)
                          ]}>
                            {getPriorityIcon(task.priority)} {getPriorityText(task.priority)}
                          </Text>
                        </View>
                      )}
                      
                      {task.tags && Array.isArray(task.tags) && task.tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                          {task.tags.slice(0, 2).map((tag, index) => (
                            <Text key={index} style={styles.tag}>
                              #{tag}
                            </Text>
                          ))}
                          {task.tags.length > 2 && (
                            <Text style={styles.moreTagsText}>+{task.tags.length - 2}</Text>
                          )}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.moreButton}
                    onPress={() => console.log('Task options:', task.id)}
                  >
                    <Text style={styles.moreIcon}>⋯</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            
            {/* Completed Tasks Section */}
            {filteredTasks.filter(task => task.completed).length > 0 && (
              <View style={styles.completedSection}>
                <TouchableOpacity 
                  style={styles.completedHeader}
                  onPress={() => setShowCompleted(!showCompleted)}
                >
                  <Text style={styles.completedHeaderText}>
                    Completed {filteredTasks.filter(task => task.completed).length}
                  </Text>
                  <Text style={styles.chevron}>
                    {showCompleted ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>
                
                {showCompleted && filteredTasks.filter(task => task.completed).map((task) => (
                  <View key={task.id} style={[styles.taskCard, styles.completedTaskCard]}>
                    <View style={styles.taskRow}>
                      <TouchableOpacity 
                        style={[styles.checkbox, styles.completedCheckbox]}
                        onPress={() => handleCompleteTask(task.id, false)}
                      >
                        <Text style={styles.checkmark}>✓</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.taskContent}
                        onPress={() => openTaskDetails(task)}
                      >
                        <Text style={[styles.taskTitle, styles.completedTaskTitle]}>
                          {task.title}
                        </Text>
                        {task.completionDate && (
                          <Text style={styles.completionDate}>
                            Completed {formatDueDate(task.completionDate)}
                          </Text>
                        )}
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => handleDeleteTask(task.id)}
                      >
                        <Text style={styles.deleteIcon}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Add Task Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddTask(true)}
        disabled={!selectedListId}
      >
        <Text style={styles.addButtonText}>➕</Text>
      </TouchableOpacity>

      {/* Add Task Modal */}
      <Modal visible={showAddTask} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Task</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter task title..."
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              multiline
              autoFocus
            />
            <View style={styles.modalButtons}>
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
                style={[styles.modalButton, styles.addButtonModal]}
                onPress={handleAddTask}
              >
                <Text style={styles.addButtonText}>Add Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add List Modal */}
      <Modal visible={showAddList} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New List</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter list name..."
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddList(false);
                  setNewListName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButtonModal]}
                onPress={handleAddList}
              >
                <Text style={styles.addButtonText}>Add List</Text>
              </TouchableOpacity>
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
          // Filter state is now managed by FilterContext
          setShowDrawer(false);
        }}
      />

      {/* Task Details Modal */}
      <TaskDetailsModal
        visible={showTaskDetails}
        task={selectedTask}
        onClose={closeTaskDetails}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
        lists={lists}
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
    padding: 20,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  hamburgerButton: {
    marginRight: 15,
    padding: 5,
  },
  hamburgerIcon: {
    fontSize: 24,
    color: '#2196F3',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
    marginBottom: 15,
  },
  listSelector: {
    flexDirection: 'row',
  },
  listChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  selectedListChip: {
    backgroundColor: '#2196F3',
  },
  listChipText: {
    color: '#666',
    fontSize: 14,
  },
  selectedListChipText: {
    color: 'white',
  },
  addListChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: 16,
    color: '#2196F3',
  },
  addListText: {
    color: '#2196F3',
    fontSize: 14,
    marginLeft: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
  },
  tasksList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    color: '#ccc',
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
    textAlign: 'center',
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  taskContent: {
    flex: 1,
    marginRight: 8,
  },
  taskIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  taskText: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    lineHeight: 22,
    marginBottom: 4,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  taskDue: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 5,
  },
  deleteIcon: {
    fontSize: 20,
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
    maxHeight: 100,
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
  // New enhanced task card styles
  tasksContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  activeTaskCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  completedTaskCard: {
    opacity: 0.6,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  activeCheckbox: {
    borderColor: '#2196F3',
    backgroundColor: 'transparent',
  },
  completedCheckbox: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50',
  },
  checkboxInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dueDateIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  dueSoon: {
    color: '#FF9800',
  },
  overdue: {
    color: '#F44336',
  },
  priorityContainer: {
    marginLeft: 4,
  },
  priorityBadge: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textAlign: 'center',
  },
  urgentPriority: {
    backgroundColor: '#ffebee',
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  highPriority: {
    backgroundColor: '#ffebee',
    color: '#c62828',
  },
  mediumPriority: {
    backgroundColor: '#fff8e1',
    color: '#ef6c00',
  },
  lowPriority: {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
  },
  defaultPriority: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    fontSize: 11,
    color: '#2196F3',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  completionDate: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
    marginTop: 2,
  },
  moreIcon: {
    fontSize: 18,
    color: '#ccc',
    fontWeight: 'bold',
  },
  completedSection: {
    marginTop: 20,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  chevron: {
    fontSize: 12,
    color: '#666',
  },
});

export default KaryScreen;
