import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import TaskDetailsModal from './TaskDetailsModal';
import { Task, List } from '../types/kary';

const TestDateTimePicker: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [testTask, setTestTask] = useState<Task>({
    id: 'test-1',
    listId: 'list-1',
    title: 'Test Task with Date-Time Picker',
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    description: 'This is a test task to demonstrate the new uniform date-time picker integration.',
    priority: 2,
    tags: [],
  });

  const [testLists] = useState<List[]>([
    {
      id: 'list-1',
      name: 'Test List',
      icon: '📝',
      color: '#007AFF',
    },
  ]);

  const handleSave = (updatedTask: Task) => {
    console.log('Task saved:', updatedTask);
    setTestTask(updatedTask);
    setShowModal(false);
  };

  const handleDelete = (taskId: string) => {
    console.log('Task deleted:', taskId);
    setShowModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Date-Time Picker Test</Text>
        <Text style={styles.subtitle}>
          Test the new uniform date-time picker integration
        </Text>

        {/* Current Task Info */}
        <View style={styles.taskInfo}>
          <Text style={styles.taskInfoTitle}>Current Task:</Text>
          <Text style={styles.taskTitle}>{testTask.title}</Text>
          {testTask.dueDate && (
            <Text style={styles.taskDueDate}>
              📅 Due: {testTask.dueDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </Text>
          )}
          {testTask.reminder && (
            <Text style={styles.taskReminder}>⏰ Reminder enabled</Text>
          )}
        </View>

        {/* Test Button */}
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => setShowModal(true)}
        >
          <Text style={styles.testButtonText}>Open Task Details Modal</Text>
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>How to Test:</Text>
          <Text style={styles.instructionText}>
            1. Tap the button above to open the modal
          </Text>
          <Text style={styles.instructionText}>
            2. Scroll down to the "Due Date" section
          </Text>
          <Text style={styles.instructionText}>
            3. Tap the 📅 icon to open the date-time picker
          </Text>
          <Text style={styles.instructionText}>
            4. Test the 3 tabs: Quick, Calendar, and Time
          </Text>
          <Text style={styles.instructionText}>
            5. Select a date, time, and reminder option
          </Text>
          <Text style={styles.instructionText}>
            6. Save the task and see the updated due date
          </Text>
        </View>
      </View>

      {/* Task Details Modal */}
      <TaskDetailsModal
        visible={showModal}
        task={testTask}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        lists={testLists}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  taskInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  taskInfoTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  taskTitle: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    marginBottom: 8,
  },
  taskDueDate: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 4,
  },
  taskReminder: {
    fontSize: 14,
    color: '#FF9800',
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  instructions: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
});

export default TestDateTimePicker;
