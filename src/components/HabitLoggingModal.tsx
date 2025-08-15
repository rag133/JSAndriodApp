import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Habit, HabitLog, HabitType, HabitLogStatus } from '../types/abhyasa';

interface HabitLoggingModalProps {
  visible: boolean;
  habit: Habit | null;
  date: Date;
  existingLog: HabitLog | null;
  onClose: () => void;
  onLog: (logData: Omit<HabitLog, 'id'>) => void;
}

const HabitLoggingModal: React.FC<HabitLoggingModalProps> = ({
  visible,
  habit,
  date,
  existingLog,
  onClose,
  onLog,
}) => {
  const [count, setCount] = useState(0);
  const [durationH, setDurationH] = useState(0);
  const [durationM, setDurationM] = useState(0);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (existingLog) {
      setCount(existingLog.value || 0);
      if (habit?.type === HabitType.DURATION) {
        const totalMinutes = existingLog.value || 0;
        setDurationH(Math.floor(totalMinutes / 60));
        setDurationM(totalMinutes % 60);
      }
      if (existingLog.completedChecklistItems) {
        setCheckedItems(new Set(existingLog.completedChecklistItems));
      }
      setNotes(existingLog.notes || '');
    } else {
      // Reset to defaults for new logs
      setCount(0);
      setDurationH(0);
      setDurationM(0);
      setCheckedItems(new Set());
      setNotes('');
    }
  }, [existingLog, habit]);

  const handleLog = () => {
    if (!habit) return;

    let logData: Omit<HabitLog, 'id'> = {
      habitId: habit.id,
      date: date,
      userId: '',
    };
    
    // Only add notes if they exist and are not empty
    if (notes.trim()) {
      logData.notes = notes.trim();
    }

    switch (habit.type) {
      case HabitType.COUNT:
        logData.value = count || 0; // Ensure value is always a number
        break;

      case HabitType.DURATION:
        const totalMinutes = durationH * 60 + durationM;
        logData.value = totalMinutes || 0; // Ensure value is always a number
        break;

      case HabitType.CHECKLIST:
        const totalItems = habit.checklist?.length || 0;
        if (totalItems === 0) {
          Alert.alert('Error', 'This habit has no checklist items');
          return;
        }
        
        // Only add completedChecklistItems if there are checked items
        if (checkedItems.size > 0) {
          logData.completedChecklistItems = Array.from(checkedItems);
        }
        break;

      default:
        // No status needed - will be calculated on-the-fly
        break;
    }

    onLog(logData);
    onClose();
  };

  const handleChecklistToggle = (itemId: string) => {
    const newCheckedItems = new Set(checkedItems);
    if (newCheckedItems.has(itemId)) {
      newCheckedItems.delete(itemId);
    } else {
      newCheckedItems.add(itemId);
    }
    setCheckedItems(newCheckedItems);
  };

  const renderCountInput = () => (
    <View style={styles.inputSection}>
      <Text style={styles.inputLabel}>Count</Text>
      <View style={styles.countContainer}>
        <TouchableOpacity
          style={styles.countButton}
          onPress={() => setCount(Math.max(0, count - 1))}
        >
          <Text style={styles.countButtonText}>-</Text>
        </TouchableOpacity>
        
        <View style={styles.countDisplay}>
          <Text style={styles.countValue}>{count}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.countButton}
          onPress={() => setCount(count + 1)}
        >
          <Text style={styles.countButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      
      {habit?.dailyTarget && (
        <View style={styles.targetDisplay}>
          <Text style={styles.targetText}>Today</Text>
          <Text style={styles.targetValue}>{count} / {habit.dailyTarget}</Text>
        </View>
      )}
    </View>
  );

  const renderDurationInput = () => (
    <View style={styles.inputSection}>
      <Text style={styles.inputLabel}>Duration</Text>
      <View style={styles.durationContainer}>
        <View style={styles.timeInputGroup}>
          <Text style={styles.timeLabel}>Hours</Text>
          <TextInput
            style={styles.timeInput}
            value={durationH.toString()}
            onChangeText={(text) => setDurationH(parseInt(text) || 0)}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>
        
        <Text style={styles.timeSeparator}>:</Text>
        
        <View style={styles.timeInputGroup}>
          <Text style={styles.timeLabel}>Minutes</Text>
          <TextInput
            style={styles.timeInput}
            value={durationM.toString()}
            onChangeText={(text) => setDurationM(parseInt(text) || 0)}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>
      </View>
      
      {habit?.dailyTarget && (
        <View style={styles.targetDisplay}>
          <Text style={styles.targetText}>Today</Text>
          <Text style={styles.targetValue}>
            {String(durationH).padStart(2, '0')}:{String(durationM).padStart(2, '0')} / {String(Math.floor(habit.dailyTarget / 60)).padStart(2, '0')}:{String(habit.dailyTarget % 60).padStart(2, '0')}
          </Text>
        </View>
      )}
    </View>
  );

  const renderChecklistInput = () => (
    <View style={styles.inputSection}>
      <Text style={styles.inputLabel}>Checklist</Text>
      <ScrollView style={styles.checklistContainer}>
        {habit?.checklist?.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.checklistItem}
            onPress={() => handleChecklistToggle(item.id)}
          >
            <Text style={styles.checklistItemText}>{item.text}</Text>
            <View style={[
              styles.checkbox,
              checkedItems.has(item.id) && styles.checkboxChecked
            ]}>
              {checkedItems.has(item.id) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {habit?.checklist && (
        <View style={styles.targetDisplay}>
          <Text style={styles.targetText}>Today</Text>
          <Text style={styles.targetValue}>{checkedItems.size} / {habit.checklist.length}</Text>
        </View>
      )}
    </View>
  );

  const renderInputSection = () => {
    if (!habit) return null;

    switch (habit.type) {
      case HabitType.COUNT:
        return renderCountInput();
      case HabitType.DURATION:
        return renderDurationInput();
      case HabitType.CHECKLIST:
        return renderChecklistInput();
      default:
        return null;
    }
  };

  if (!habit) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{habit.title}</Text>
            <Text style={styles.modalDate}>
              {date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
            </Text>
            <View style={[styles.habitIcon, { backgroundColor: habit.color }]}>
              <Text style={styles.habitIconText}>{habit.icon}</Text>
            </View>
          </View>

          {/* Input Section */}
          {renderInputSection()}

          {/* Notes Section */}
          <View style={styles.notesSection}>
            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes about this habit..."
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>CANCEL</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.logButton]}
              onPress={handleLog}
            >
              <Text style={styles.logButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  modalDate: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 10,
  },
  habitIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitIconText: {
    fontSize: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  countButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countButtonText: {
    fontSize: 24,
    color: '#333',
  },
  countDisplay: {
    width: 80,
    height: 50,
    backgroundColor: '#6200EE',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  countValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  timeInputGroup: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  timeInput: {
    width: 60,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  timeSeparator: {
    fontSize: 24,
    color: '#333',
    marginHorizontal: 15,
  },
  checklistContainer: {
    maxHeight: 200,
    marginBottom: 15,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checklistItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  targetDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 10,
  },
  targetText: {
    fontSize: 14,
    color: '#666',
  },
  targetValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  notesSection: {
    marginBottom: 20,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  logButton: {
    backgroundColor: '#6200EE',
  },
  logButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default HabitLoggingModal;
