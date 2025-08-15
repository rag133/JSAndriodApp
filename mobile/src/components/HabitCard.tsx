import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Habit, HabitLog, HabitType, HabitLogStatus } from '../types/abhyasa';
import { calculateHabitStatus } from '../utils/habitUtils';

interface HabitCardProps {
  habit: Habit;
  log: HabitLog | null;
  onLog: (logData: Omit<HabitLog, 'id'>) => void;
  onSelect: (habitId: string) => void;
  isSelected: boolean;
  date: Date;
}

const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  log,
  onLog,
  onSelect,
  isSelected,
  date,
}) => {
  const [count, setCount] = useState(log?.value || 0);
  const [durationH, setDurationH] = useState(log?.value ? Math.floor(log.value / 60) : 0);
  const [durationM, setDurationM] = useState(log?.value ? log.value % 60 : 0);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(
    new Set(log?.completedChecklistItems || [])
  );

  const calculatedStatus = calculateHabitStatus(habit, log);
  const focusAreaName = habit.focusAreaId ? 'Focus Area' : 'General';
  const reminderTime = habit.reminders?.[0] || '';

  const handleLog = () => {
    onLog({
      habitId: habit.id,
      date: date,
      status: HabitLogStatus.COMPLETED,
      userId: '',
    });
  };

  const handleCountLog = () => {
    onLog({
      habitId: habit.id,
      date: date,
      status: count > 0 ? HabitLogStatus.PARTIAL : HabitLogStatus.NONE,
      value: count,
      userId: '',
    });
  };

  const handleDurationLog = () => {
    const totalMinutes = durationH * 60 + durationM;
    onLog({
      habitId: habit.id,
      date: date,
      status: totalMinutes > 0 ? HabitLogStatus.PARTIAL : HabitLogStatus.NONE,
      value: totalMinutes,
      userId: '',
    });
  };

  const handleChecklistToggle = (itemId: string) => {
    const newCheckedItems = new Set(checkedItems);
    if (newCheckedItems.has(itemId)) {
      newCheckedItems.delete(itemId);
    } else {
      newCheckedItems.add(itemId);
    }
    setCheckedItems(newCheckedItems);

    onLog({
      habitId: habit.id,
      date: date,
      status: newCheckedItems.size === (habit.checklist?.length || 0) ? HabitLogStatus.COMPLETED : HabitLogStatus.PARTIAL,
      completedChecklistItems: Array.from(newCheckedItems),
      userId: '',
    });
  };

  const renderLoggingControl = () => {
    switch (habit.type) {
      case HabitType.BINARY:
        return (
          <TouchableOpacity
            style={[styles.binaryButton, calculatedStatus.isComplete && styles.completedButton]}
            onPress={handleLog}
          >
            <Text style={[styles.binaryButtonText, calculatedStatus.isComplete && styles.completedButtonText]}>
              {calculatedStatus.isComplete ? '✓' : 'Done'}
            </Text>
          </TouchableOpacity>
        );

      case HabitType.COUNT:
      case HabitType.DURATION:
      case HabitType.CHECKLIST:
        // For non-binary habits, show a simple button that will open the modal
        return (
          <TouchableOpacity
            style={[styles.modalTriggerButton, calculatedStatus.isComplete && styles.completedButton]}
            onPress={() => onSelect(habit.id)}
          >
            <Text style={[styles.modalTriggerButtonText, calculatedStatus.isComplete && styles.completedButtonText]}>
              {calculatedStatus.isComplete ? '✓' : 'Log'}
            </Text>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={() => onSelect(habit.id)}
    >
      <View style={styles.leftSection}>
        <View style={[styles.iconContainer, { backgroundColor: `${habit.color}20` }]}>
          <Text style={[styles.iconText, { color: habit.color }]}>🎯</Text>
        </View>
      </View>

      <View style={styles.middleSection}>
        <Text style={styles.title}>{habit.title}</Text>
        <View style={styles.metaInfo}>
          <Text style={styles.habitType}>Habit</Text>
          {reminderTime && (
            <Text style={styles.reminderTime}>🕐 {reminderTime}</Text>
          )}
        </View>
      </View>

      <View style={styles.rightSection}>
        {/* Status Indicator */}
        <View style={styles.statusIndicator}>
          {calculatedStatus.isComplete ? (
            <View style={styles.completedStatus}>
              <Text style={styles.completedIcon}>✓</Text>
            </View>
          ) : (
            <View style={styles.pendingStatus}>
              <Text style={styles.timerIcon}>⏰</Text>
            </View>
          )}
        </View>

        {/* Logging Control */}
        {renderLoggingControl()}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedContainer: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  leftSection: {
    marginRight: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  middleSection: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reminderIcon: {
    fontSize: 12,
  },
  reminderTime: {
    fontSize: 12,
    color: '#666',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  binaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    minWidth: 60,
    alignItems: 'center',
  },
  completedButton: {
    backgroundColor: '#4CAF50',
  },
  binaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  completedButtonText: {
    color: 'white',
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  countValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    minWidth: 20,
    textAlign: 'center',
  },
  countTarget: {
    fontSize: 14,
    color: '#666',
  },
  durationContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  durationInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationInput: {
    width: 40,
    height: 32,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  durationUnit: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  durationTarget: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  checklistContainer: {
    alignItems: 'flex-end',
  },
  checklistButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    minWidth: 50,
    alignItems: 'center',
  },
  completedChecklistButton: {
    backgroundColor: '#4CAF50',
  },
  checklistButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  completedChecklistButtonText: {
    color: 'white',
  },
  logButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    minWidth: 50,
    alignItems: 'center',
  },
  logButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  modalTriggerButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  modalTriggerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statusIndicator: {
    marginBottom: 8,
  },
  completedStatus: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  completedIcon: {
    fontSize: 16,
    color: 'white',
  },
  pendingStatus: {
    backgroundColor: '#FFC107',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  timerIcon: {
    fontSize: 16,
    color: 'white',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  habitType: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

export default HabitCard;
