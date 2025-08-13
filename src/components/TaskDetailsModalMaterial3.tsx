import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Dimensions,
  Alert,
  ScrollView,
  Keyboard,
  StatusBar,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  Provider as PaperProvider,
  MD3LightTheme,
  Surface,
  Card,
  Text,
  TextInput,
  Button,
  IconButton,
  Chip,
  Menu,
  Divider,
  Switch,
  SegmentedButtons,
  Badge,
  ActivityIndicator,
  Portal,
} from 'react-native-paper';
import { Task, Tag, List } from '../types/kary';
import { taskService, tagService, listService } from '../services/dataService';
import { AutoSaveManager } from '../utils/debounceUtils';
import MaterialDesign3DateTimePicker from './MaterialDesign3DateTimePicker';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// Material Design 3 Theme Configuration
const material3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: 'rgb(103, 80, 164)',
    onPrimary: 'rgb(255, 255, 255)',
    primaryContainer: 'rgb(234, 221, 255)',
    onPrimaryContainer: 'rgb(33, 0, 93)',
    secondary: 'rgb(98, 91, 113)',
    onSecondary: 'rgb(255, 255, 255)',
    secondaryContainer: 'rgb(232, 222, 248)',
    onSecondaryContainer: 'rgb(29, 25, 43)',
    tertiary: 'rgb(125, 82, 96)',
    onTertiary: 'rgb(255, 255, 255)',
    tertiaryContainer: 'rgb(255, 217, 227)',
    onTertiaryContainer: 'rgb(50, 16, 29)',
    error: 'rgb(186, 26, 26)',
    onError: 'rgb(255, 255, 255)',
    errorContainer: 'rgb(255, 218, 214)',
    onErrorContainer: 'rgb(65, 0, 2)',
    background: 'rgb(255, 251, 255)',
    onBackground: 'rgb(28, 27, 31)',
    surface: 'rgb(255, 251, 255)',
    onSurface: 'rgb(28, 27, 31)',
    surfaceVariant: 'rgb(231, 224, 236)',
    onSurfaceVariant: 'rgb(73, 69, 79)',
    outline: 'rgb(122, 117, 127)',
    outlineVariant: 'rgb(203, 196, 208)',
    scrim: 'rgb(0, 0, 0)',
    inverseSurface: 'rgb(49, 48, 51)',
    inverseOnSurface: 'rgb(244, 239, 244)',
    inversePrimary: 'rgb(206, 189, 255)',
    elevation: {
      level0: 'transparent',
      level1: 'rgb(247, 243, 249)',
      level2: 'rgb(243, 237, 246)',
      level3: 'rgb(238, 231, 244)',
      level4: 'rgb(236, 229, 242)',
      level5: 'rgb(233, 225, 240)',
    },
  },
};

interface SaveState {
  isSaving: boolean;
  lastSaved?: Date;
  error?: string;
}

interface TaskDetailsModalMaterial3Props {
  visible: boolean;
  task: Task | null;
  lists: List[];
  tags: Tag[];
  onSave: (task: Task) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
  onClose: () => void;
}

const TaskDetailsModalMaterial3: React.FC<TaskDetailsModalMaterial3Props> = ({
  visible,
  task,
  lists,
  tags,
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
      priority: 'P3',
      tags: [],
      listId: lists[0]?.id || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );

  const [saveState, setSaveState] = useState<SaveState>({ isSaving: false });
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [showListMenu, setShowListMenu] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showTagsMenu, setShowTagsMenu] = useState(false);
  const [priorityValue, setPriorityValue] = useState(editedTask.priority || 'P3');

  // Auto-save manager
  const autoSaveManager = useRef(new AutoSaveManager()).current;

  // Priority options for segmented buttons
  const priorityOptions = [
    { value: 'P1', label: 'Urgent', icon: 'flag', color: '#FF3B30' },
    { value: 'P2', label: 'High', icon: 'flag', color: '#FF9500' },
    { value: 'P3', label: 'Medium', icon: 'flag', color: '#007AFF' },
    { value: 'P4', label: 'Low', icon: 'flag', color: '#8E8E93' },
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

    return () => {
      autoSaveManager.cancelAllSaves();
    };
  }, [task, onSave]);

  // Update edited task when task prop changes
  useEffect(() => {
    if (task) {
      setEditedTask(task);
      setPriorityValue(task.priority || 'P3');
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

  // Handle priority change
  const handlePriorityChange = (value: string) => {
    setPriorityValue(value);
    updateField('priority', value);
  };

  // Handle tag toggle
  const handleTagToggle = (tagId: string) => {
    const currentTags = editedTask.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];
    updateField('tags', newTags);
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
    onClose();
  };

  // Get selected list
  const selectedList = lists.find(list => list.id === editedTask.listId) || lists[0];

  // Get priority option
  const selectedPriority = priorityOptions.find(option => option.value === priorityValue) || priorityOptions[2];

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (!visible) return null;

  return (
    <PaperProvider theme={material3Theme}>
      <Portal>
        <Modal
          visible={visible}
          transparent={true}
          animationType="slide"
          onRequestClose={handleClose}
          statusBarTranslucent={true}
        >
          <StatusBar backgroundColor="rgba(0, 0, 0, 0.5)" barStyle="light-content" />
          
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.overlay}>
              <Surface style={styles.modalContainer} elevation={5}>
                
                {/* Header with Material 3 App Bar */}
                <Surface style={styles.appBar} elevation={2}>
                  <View style={styles.appBarContent}>
                    <IconButton
                      icon="close"
                      size={24}
                      onPress={handleClose}
                      iconColor={material3Theme.colors.onSurface}
                    />
                    
                    <Text variant="titleLarge" style={styles.appBarTitle}>
                      {task?.id ? 'Edit Task' : 'New Task'}
                    </Text>
                    
                    <View style={styles.appBarActions}>
                      {saveState.isSaving && (
                        <ActivityIndicator size={20} color={material3Theme.colors.primary} />
                      )}
                      
                      <Menu
                        visible={showActionsMenu}
                        onDismiss={() => setShowActionsMenu(false)}
                        anchor={
                          <IconButton
                            icon="dots-vertical"
                            size={24}
                            onPress={() => setShowActionsMenu(true)}
                            iconColor={material3Theme.colors.onSurface}
                          />
                        }
                      >
                        {task?.id && onDelete && (
                          <Menu.Item
                            onPress={() => {
                              setShowActionsMenu(false);
                              handleDelete();
                            }}
                            title="Delete Task"
                            leadingIcon="delete"
                          />
                        )}
                        <Menu.Item
                          onPress={() => {
                            setShowActionsMenu(false);
                            // Add duplicate functionality if needed
                          }}
                          title="Duplicate Task"
                          leadingIcon="content-copy"
                        />
                      </Menu>
                    </View>
                  </View>
                  
                  {/* Save Status */}
                  {(saveState.lastSaved || saveState.error) && (
                    <View style={styles.saveStatus}>
                      {saveState.error ? (
                        <Text variant="bodySmall" style={styles.saveError}>
                          Error: {saveState.error}
                        </Text>
                      ) : (
                        <Text variant="bodySmall" style={styles.saveSuccess}>
                          Saved {saveState.lastSaved ? formatDate(saveState.lastSaved) : ''}
                        </Text>
                      )}
                    </View>
                  )}
                </Surface>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                  
                  {/* Task Completion Toggle */}
                  <Card style={styles.card} mode="contained">
                    <Card.Content style={styles.cardContent}>
                      <View style={styles.completionRow}>
                        <Switch
                          value={editedTask.completed}
                          onValueChange={(value) => updateField('completed', value)}
                          thumbColor={editedTask.completed ? material3Theme.colors.primary : material3Theme.colors.outline}
                          trackColor={{
                            false: material3Theme.colors.surfaceVariant,
                            true: material3Theme.colors.primaryContainer,
                          }}
                        />
                        <Text 
                          variant="bodyLarge" 
                          style={[
                            styles.completionText,
                            editedTask.completed && styles.completionTextCompleted
                          ]}
                        >
                          {editedTask.completed ? 'Task Completed' : 'Mark as Complete'}
                        </Text>
                      </View>
                    </Card.Content>
                  </Card>

                  {/* Task Title */}
                  <Card style={styles.card} mode="contained">
                    <Card.Content style={styles.cardContent}>
                      <TextInput
                        label="Task Title"
                        value={editedTask.title}
                        onChangeText={(text) => updateField('title', text)}
                        mode="outlined"
                        multiline={false}
                        style={styles.titleInput}
                        contentStyle={styles.titleInputContent}
                        outlineStyle={styles.inputOutline}
                        placeholder="What needs to be done?"
                      />
                    </Card.Content>
                  </Card>

                  {/* List Selection */}
                  <Card style={styles.card} mode="contained">
                    <Card.Content style={styles.cardContent}>
                      <Text variant="titleMedium" style={styles.sectionTitle}>List</Text>
                      <Menu
                        visible={showListMenu}
                        onDismiss={() => setShowListMenu(false)}
                        anchor={
                          <Button
                            mode="outlined"
                            onPress={() => setShowListMenu(true)}
                            contentStyle={styles.listButtonContent}
                            style={styles.listButton}
                            icon="format-list-bulleted"
                          >
                            {selectedList?.name || 'Select List'}
                          </Button>
                        }
                      >
                        {lists.map((list) => (
                          <Menu.Item
                            key={list.id}
                            onPress={() => {
                              updateField('listId', list.id);
                              setShowListMenu(false);
                            }}
                            title={list.name}
                            leadingIcon={list.id === editedTask.listId ? "check" : undefined}
                          />
                        ))}
                      </Menu>
                    </Card.Content>
                  </Card>

                  {/* Priority Selection */}
                  <Card style={styles.card} mode="contained">
                    <Card.Content style={styles.cardContent}>
                      <Text variant="titleMedium" style={styles.sectionTitle}>Priority</Text>
                      <SegmentedButtons
                        value={priorityValue}
                        onValueChange={handlePriorityChange}
                        buttons={priorityOptions.map(option => ({
                          value: option.value,
                          label: option.label,
                          icon: option.icon,
                          style: {
                            backgroundColor: priorityValue === option.value 
                              ? `${option.color}20` 
                              : 'transparent'
                          }
                        }))}
                        style={styles.priorityButtons}
                      />
                    </Card.Content>
                  </Card>

                  {/* Due Date */}
                  <Card style={styles.card} mode="contained">
                    <Card.Content style={styles.cardContent}>
                      <View style={styles.dueDateHeader}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>Due Date</Text>
                        {editedTask.dueDate && (
                          <IconButton
                            icon="close"
                            size={20}
                            onPress={handleRemoveDueDate}
                            iconColor={material3Theme.colors.error}
                          />
                        )}
                      </View>
                      
                      <Button
                        mode="outlined"
                        onPress={() => setShowDateTimePicker(true)}
                        contentStyle={styles.dueDateButtonContent}
                        style={styles.dueDateButton}
                        icon="calendar"
                      >
                        {editedTask.dueDate ? formatDate(editedTask.dueDate) : 'Set Due Date'}
                      </Button>
                    </Card.Content>
                  </Card>

                  {/* Tags */}
                  <Card style={styles.card} mode="contained">
                    <Card.Content style={styles.cardContent}>
                      <Text variant="titleMedium" style={styles.sectionTitle}>Tags</Text>
                      <View style={styles.tagsContainer}>
                        {tags.map((tag) => (
                          <Chip
                            key={tag.id}
                            mode={editedTask.tags?.includes(tag.id) ? 'flat' : 'outlined'}
                            selected={editedTask.tags?.includes(tag.id)}
                            onPress={() => handleTagToggle(tag.id)}
                            style={[
                              styles.tagChip,
                              editedTask.tags?.includes(tag.id) && styles.tagChipSelected
                            ]}
                            textStyle={styles.tagChipText}
                          >
                            {tag.name}
                          </Chip>
                        ))}
                      </View>
                    </Card.Content>
                  </Card>

                  {/* Description */}
                  <Card style={styles.card} mode="contained">
                    <Card.Content style={styles.cardContent}>
                      <TextInput
                        label="Description"
                        value={editedTask.description || ''}
                        onChangeText={(text) => updateField('description', text)}
                        mode="outlined"
                        multiline={true}
                        numberOfLines={4}
                        style={styles.descriptionInput}
                        outlineStyle={styles.inputOutline}
                        placeholder="Add details about this task..."
                      />
                    </Card.Content>
                  </Card>

                  {/* Bottom Spacing */}
                  <View style={styles.bottomSpacing} />
                </ScrollView>

                {/* Material Design 3 Date Time Picker */}
                <MaterialDesign3DateTimePicker
                  visible={showDateTimePicker}
                  initialDate={editedTask.dueDate}
                  onConfirm={handleDueDateChange}
                  onCancel={() => setShowDateTimePicker(false)}
                />
              </Surface>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </Portal>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: material3Theme.colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: screenHeight * 0.9,
    minHeight: screenHeight * 0.6,
    overflow: 'hidden',
  },
  
  // App Bar
  appBar: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: material3Theme.colors.surface,
  },
  appBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    minHeight: 56,
  },
  appBarTitle: {
    flex: 1,
    marginLeft: 8,
    color: material3Theme.colors.onSurface,
    fontWeight: '500',
  },
  appBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveStatus: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  saveSuccess: {
    color: material3Theme.colors.primary,
    textAlign: 'center',
  },
  saveError: {
    color: material3Theme.colors.error,
    textAlign: 'center',
  },
  
  // Content
  content: {
    flex: 1,
    padding: 16,
  },
  
  // Cards
  card: {
    marginBottom: 16,
    backgroundColor: material3Theme.colors.surface,
  },
  cardContent: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    color: material3Theme.colors.onSurface,
    fontWeight: '500',
  },
  
  // Completion Toggle
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completionText: {
    marginLeft: 12,
    color: material3Theme.colors.onSurface,
  },
  completionTextCompleted: {
    textDecorationLine: 'line-through',
    color: material3Theme.colors.onSurfaceVariant,
  },
  
  // Title Input
  titleInput: {
    backgroundColor: 'transparent',
  },
  titleInputContent: {
    fontSize: 18,
    fontWeight: '500',
  },
  inputOutline: {
    borderColor: material3Theme.colors.outline,
    borderRadius: 12,
  },
  
  // List Selection
  listButton: {
    borderColor: material3Theme.colors.outline,
    borderRadius: 12,
  },
  listButtonContent: {
    paddingVertical: 8,
  },
  
  // Priority
  priorityButtons: {
    borderRadius: 12,
  },
  
  // Due Date
  dueDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dueDateButton: {
    borderColor: material3Theme.colors.outline,
    borderRadius: 12,
  },
  dueDateButtonContent: {
    paddingVertical: 8,
  },
  
  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  tagChipSelected: {
    backgroundColor: material3Theme.colors.primaryContainer,
  },
  tagChipText: {
    fontSize: 14,
  },
  
  // Description
  descriptionInput: {
    backgroundColor: 'transparent',
    minHeight: 100,
  },
  
  // Bottom Spacing
  bottomSpacing: {
    height: 20,
  },
});

export default TaskDetailsModalMaterial3;
