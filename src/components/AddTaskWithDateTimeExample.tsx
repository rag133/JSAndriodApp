import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import TaskDetailsDateTimePicker from './TaskDetailsDateTimePicker';
import DateTimePickerIcon from './DateTimePickerIcon';

interface AddTaskWithDateTimeExampleProps {
  visible: boolean;
  onClose: () => void;
  onSave: (task: { title: string; description: string; dueDate: Date | null; reminder: string }) => void;
}

const AddTaskWithDateTimeExample: React.FC<AddTaskWithDateTimeExampleProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [reminder, setReminder] = useState('');
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);

  const handleDateTimeConfirm = (date: Date, reminderOption?: string) => {
    setDueDate(date);
    if (reminderOption) {
      setReminder(reminderOption);
    }
    setShowDateTimePicker(false);
  };

  const handleSave = () => {
    if (taskTitle.trim()) {
      onSave({
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        dueDate,
        reminder,
      });
      // Reset form
      setTaskTitle('');
      setTaskDescription('');
      setDueDate(null);
      setReminder('');
      onClose();
    }
  };

  const formatDueDate = () => {
    if (!dueDate) return 'No due date set';
    
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
    
    return dueDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add New Task</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, !taskTitle.trim() && styles.saveButtonDisabled]}
            disabled={!taskTitle.trim()}
          >
            <Text style={[styles.saveText, !taskTitle.trim() && styles.saveTextDisabled]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Task Title */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Task Title *</Text>
            <TextInput
              style={styles.textInput}
              value={taskTitle}
              onChangeText={setTaskTitle}
              placeholder="Enter task title"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Task Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={taskDescription}
              onChangeText={setTaskDescription}
              placeholder="Enter task description"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
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
                <Text style={styles.dateTimeValue}>{formatDueDate()}</Text>
              </View>
            </View>

            {/* Selected Date Display */}
            {dueDate && (
              <View style={styles.selectedDateTimeContainer}>
                <Text style={styles.selectedDateTimeLabel}>Selected:</Text>
                <Text style={styles.selectedDateTimeValue}>
                  {dueDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={styles.selectedDateTimeTime}>
                  at {dueDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </Text>
                {reminder && reminder !== 'No reminder' && (
                  <Text style={styles.reminderText}>
                    ⏰ Reminder: {reminder}
                  </Text>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Task Details Date Time Picker Modal */}
        <TaskDetailsDateTimePicker
          visible={showDateTimePicker}
          initialDate={dueDate}
          onConfirm={handleDateTimeConfirm}
          onCancel={() => setShowDateTimePicker(false)}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  saveButton: {
    padding: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveTextDisabled: {
    color: '#9CA3AF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
  },
  dateTimeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateTimeInfo: {
    marginLeft: 16,
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  dateTimeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  selectedDateTimeContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  selectedDateTimeLabel: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  selectedDateTimeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  selectedDateTimeTime: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  reminderText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default AddTaskWithDateTimeExample;
