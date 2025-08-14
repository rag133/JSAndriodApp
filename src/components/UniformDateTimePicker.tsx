import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { DatePickerModal, TimePickerModal } from 'react-native-paper-dates';
import { Provider as PaperProvider, DefaultTheme, Button, Chip } from 'react-native-paper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface UniformDateTimePickerProps {
  visible: boolean;
  initialDate?: Date;
  onConfirm: (date: Date, reminder?: string) => void;
  onCancel: () => void;
}

interface QuickDateOption {
  label: string;
  value: Date;
  icon: string;
}

const UniformDateTimePicker: React.FC<UniformDateTimePickerProps> = ({
  visible,
  initialDate,
  onConfirm,
  onCancel,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
  const [viewDate, setViewDate] = useState<Date>(initialDate || new Date());
  const [selectedTime, setSelectedTime] = useState<{ hour: number; minute: number }>({
    hour: initialDate ? initialDate.getHours() : 12,
    minute: initialDate ? initialDate.getMinutes() : 0,
  });
  const [activeTab, setActiveTab] = useState<'quick' | 'calendar' | 'time'>('quick');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<string>('');

  useEffect(() => {
    if (initialDate) {
      const newDate = new Date(initialDate);
      setSelectedDate(newDate);
      setViewDate(newDate);
      setSelectedTime({
        hour: newDate.getHours(),
        minute: newDate.getMinutes(),
      });
    }
  }, [initialDate]);

  // Quick date options
  const quickDateOptions: QuickDateOption[] = [
    {
      label: 'Today',
      value: new Date(),
      icon: '📅',
    },
    {
      label: 'Tomorrow',
      value: new Date(Date.now() + 24 * 60 * 60 * 1000),
      icon: '⏰',
    },
    {
      label: 'Next Week',
      value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      icon: '📆',
    },
    {
      label: 'Next Month',
      value: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      icon: '🗓️',
    },
  ];

  // Reminder options
  const reminderOptions = [
    '5 minutes before',
    '15 minutes before',
    '30 minutes before',
    '1 hour before',
    '1 day before',
    'No reminder',
  ];

  const getCurrentMonth = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[viewDate.getMonth()];
  };

  const getCurrentYear = () => {
    return viewDate.getFullYear();
  };

  const getDaysInMonth = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(viewDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setViewDate(newDate);
  };

  const selectDate = (day: number) => {
    const newDate = new Date(viewDate);
    newDate.setDate(day);
    setSelectedDate(newDate);
    setViewDate(newDate);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      viewDate.getMonth() === today.getMonth() &&
      viewDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      viewDate.getMonth() === selectedDate.getMonth() &&
      viewDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handleQuickDateSelect = (option: QuickDateOption) => {
    setSelectedDate(option.value);
    setViewDate(option.value);
    setActiveTab('calendar');
  };

  const handleTimeConfirm = ({ hours, minutes }: { hours: number; minutes: number }) => {
    setSelectedTime({ hour: hours, minute: minutes });
    setShowTimePicker(false);
  };

  const handleConfirm = () => {
    const finalDate = new Date(selectedDate);
    finalDate.setHours(selectedTime.hour, selectedTime.minute, 0, 0);
    onConfirm(finalDate, selectedReminder);
  };

  const formatTime = () => {
    const displayHour = selectedTime.hour % 12 || 12;
    const displayMinute = selectedTime.minute.toString().padStart(2, '0');
    const ampm = selectedTime.hour >= 12 ? 'PM' : 'AM';
    return `${displayHour}:${displayMinute} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <PaperProvider theme={DefaultTheme}>
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Date & Time</Text>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
              <Text style={styles.confirmText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'quick' && styles.activeTab]}
              onPress={() => setActiveTab('quick')}
            >
              <Text style={[styles.tabText, activeTab === 'quick' && styles.activeTabText]}>
                Quick
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
              onPress={() => setActiveTab('calendar')}
            >
              <Text style={[styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>
                Calendar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'time' && styles.activeTab]}
              onPress={() => setActiveTab('time')}
            >
              <Text style={[styles.tabText, activeTab === 'time' && styles.activeTabText]}>
                Time
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Quick Selection Tab */}
            {activeTab === 'quick' && (
              <View style={styles.quickContainer}>
                <Text style={styles.sectionTitle}>Quick Selection</Text>
                <View style={styles.quickOptionsGrid}>
                  {quickDateOptions.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.quickOption}
                      onPress={() => handleQuickDateSelect(option)}
                    >
                      <Text style={styles.quickOptionIcon}>{option.icon}</Text>
                      <Text style={styles.quickOptionLabel}>{option.label}</Text>
                      <Text style={styles.quickOptionDate}>{formatDate(option.value)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <View style={styles.calendarContainer}>
                <Text style={styles.sectionTitle}>Select Date</Text>
                
                {/* Month Navigation */}
                <View style={styles.monthNavigation}>
                  <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
                    <Text style={styles.navButtonText}>‹</Text>
                  </TouchableOpacity>
                  <Text style={styles.monthYearText}>
                    {getCurrentMonth()} {getCurrentYear()}
                  </Text>
                  <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
                    <Text style={styles.navButtonText}>›</Text>
                  </TouchableOpacity>
                </View>

                {/* Day Headers */}
                <View style={styles.dayHeaders}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <Text key={index} style={styles.dayHeader}>
                      {day}
                    </Text>
                  ))}
                </View>

                {/* Calendar Grid */}
                <View style={styles.calendarGrid}>
                  {getDaysInMonth().map((day, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayCell,
                        day && isToday(day) && styles.todayCell,
                        day && isSelected(day) && styles.selectedCell,
                      ]}
                      onPress={() => day && selectDate(day)}
                      disabled={!day}
                    >
                      {day && (
                        <Text
                          style={[
                            styles.dayText,
                            isToday(day) && styles.todayText,
                            isSelected(day) && styles.selectedDayText,
                          ]}
                        >
                          {day}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Time Tab */}
            {activeTab === 'time' && (
              <View style={styles.timeContainer}>
                <Text style={styles.sectionTitle}>Select Time</Text>
                
                {/* Current Time Display */}
                <View style={styles.currentTimeContainer}>
                  <Text style={styles.currentTimeLabel}>Selected Time:</Text>
                  <Text style={styles.currentTimeValue}>{formatTime()}</Text>
                </View>

                {/* Time Picker Button */}
                <Button
                  mode="contained"
                  onPress={() => setShowTimePicker(true)}
                  style={styles.timePickerButton}
                  contentStyle={styles.timePickerButtonContent}
                >
                  <Text style={styles.timePickerButtonText}>Change Time</Text>
                </Button>

                {/* Reminder Options */}
                <Text style={styles.sectionTitle}>Reminder</Text>
                <View style={styles.reminderContainer}>
                  {reminderOptions.map((reminder, index) => (
                    <Chip
                      key={index}
                      selected={selectedReminder === reminder}
                      onPress={() => setSelectedReminder(reminder)}
                      style={styles.reminderChip}
                      textStyle={styles.reminderChipText}
                    >
                      {reminder}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Selected Date & Time Summary */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryLabel}>Selected:</Text>
            <Text style={styles.summaryValue}>
              {formatDate(selectedDate)} at {formatTime()}
            </Text>
            {selectedReminder && selectedReminder !== 'No reminder' && (
              <Text style={styles.summaryReminder}>
                Reminder: {selectedReminder}
              </Text>
            )}
          </View>

          {/* Time Picker Modal */}
          <TimePickerModal
            visible={showTimePicker}
            onDismiss={() => setShowTimePicker(false)}
            onConfirm={handleTimeConfirm}
            hours={selectedTime.hour}
            minutes={selectedTime.minute}
            use24HourClock={false}
          />
        </SafeAreaView>
      </PaperProvider>
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
  confirmButton: {
    padding: 8,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  quickContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  quickOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickOption: {
    width: (screenWidth - 64) / 2 - 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickOptionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  quickOptionDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  calendarContainer: {
    marginBottom: 24,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 20,
    color: '#374151',
    fontWeight: '600',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: (screenWidth - 64) / 7,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  todayCell: {
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
  },
  selectedCell: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  dayText: {
    fontSize: 16,
    color: '#374151',
  },
  todayText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timeContainer: {
    marginBottom: 24,
  },
  currentTimeContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  currentTimeLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  currentTimeValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  timePickerButton: {
    marginBottom: 24,
    backgroundColor: '#007AFF',
  },
  timePickerButtonContent: {
    paddingVertical: 8,
  },
  timePickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reminderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reminderChip: {
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
  },
  reminderChipText: {
    color: '#374151',
  },
  summaryContainer: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  summaryReminder: {
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
  },
});

export default UniformDateTimePicker;
