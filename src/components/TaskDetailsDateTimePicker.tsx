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

const { width: screenWidth } = Dimensions.get('window');

interface TaskDetailsDateTimePickerProps {
  visible: boolean;
  initialDate?: Date;
  onConfirm: (date: Date, reminder?: string) => void;
  onCancel: () => void;
}

const TaskDetailsDateTimePicker: React.FC<TaskDetailsDateTimePickerProps> = ({
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
      setSelectedDate(initialDate);
      setViewDate(initialDate);
      setSelectedTime({
        hour: initialDate.getHours(),
        minute: initialDate.getMinutes(),
      });
    }
  }, [initialDate]);

  const handleDateConfirm = ({ date }: { date: Date | undefined }) => {
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.hour, selectedTime.minute, 0, 0);
      setSelectedDate(newDate);
      setViewDate(newDate);
    }
  };

  const handleTimeConfirm = ({ hours, minutes }: { hours: number; minutes: number }) => {
    setSelectedTime({ hour: hours, minute: minutes });
    const newDate = new Date(selectedDate);
    newDate.setHours(hours, minutes, 0, 0);
    setSelectedDate(newDate);
    setShowTimePicker(false);
  };

  const handleConfirm = () => {
    const finalDate = new Date(selectedDate);
    finalDate.setHours(selectedTime.hour, selectedTime.minute, 0, 0);
    onConfirm(finalDate, selectedReminder);
  };

  const quickDateOptions = [
    { label: 'Today', days: 0 },
    { label: 'Tomorrow', days: 1 },
    { label: 'Next Week', days: 7 },
    { label: 'Next Month', days: 30 },
  ];

  const getQuickDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = (year: number, month: number) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const calendarDays = generateCalendarDays(viewDate.getFullYear(), viewDate.getMonth());
  const today = new Date();
  const isToday = (date: Date) => date.toDateString() === today.toDateString();
  const isSelected = (date: Date) => date.toDateString() === selectedDate.toDateString();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <PaperProvider theme={DefaultTheme}>
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Select Date & Time</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
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
            <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
              {activeTab === 'quick' && (
                <View style={styles.quickContainer}>
                  <Text style={styles.sectionTitle}>Quick Selection</Text>
                  <View style={styles.quickOptions}>
                    {quickDateOptions.map((option) => (
                      <TouchableOpacity
                        key={option.label}
                        style={styles.quickOption}
                        onPress={() => {
                          const date = getQuickDate(option.days);
                          setSelectedDate(date);
                          setViewDate(date);
                        }}
                      >
                        <Text style={styles.quickOptionText}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {activeTab === 'calendar' && (
                <View style={styles.calendarContainer}>
                  <Text style={styles.sectionTitle}>Calendar</Text>
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity
                      onPress={() => {
                        const newDate = new Date(viewDate);
                        newDate.setMonth(newDate.getMonth() - 1);
                        setViewDate(newDate);
                      }}
                    >
                      <Text style={styles.calendarNav}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.calendarTitle}>
                      {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        const newDate = new Date(viewDate);
                        newDate.setMonth(newDate.getMonth() + 1);
                        setViewDate(newDate);
                      }}
                    >
                      <Text style={styles.calendarNav}>›</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.calendarGrid}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <Text key={day} style={styles.calendarDayHeader}>{day}</Text>
                    ))}
                    {calendarDays.map((date, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.calendarDay,
                          date && isToday(date) && styles.calendarDayToday,
                          date && isSelected(date) && styles.calendarDaySelected,
                        ]}
                        onPress={() => date && setSelectedDate(date)}
                        disabled={!date}
                      >
                        {date && (
                          <Text style={[
                            styles.calendarDayText,
                            isToday(date) && styles.calendarDayTextToday,
                            isSelected(date) && styles.calendarDayTextSelected,
                          ]}>
                            {date.getDate()}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {activeTab === 'time' && (
                <View style={styles.timeContainer}>
                  <Text style={styles.sectionTitle}>Time & Reminder</Text>
                  
                  {/* Time Row */}
                  <View style={styles.timeRow}>
                    <View style={styles.timeRowLeft}>
                      <Text style={styles.timeRowIcon}>⏰</Text>
                      <Text style={styles.timeRowLabel}>Time</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.timeRowValue}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Text style={styles.timeRowValueText}>
                        {selectedTime.hour > 0 
                          ? (() => {
                              const tempDate = new Date();
                              tempDate.setHours(selectedTime.hour, selectedTime.minute, 0, 0);
                              return tempDate.toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit', 
                                hour12: true 
                              });
                            })()
                          : 'None {'>'}'
                        }
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Reminder Row */}
                  <View style={styles.timeRow}>
                    <View style={styles.timeRowLeft}>
                      <Text style={styles.timeRowIcon}>🔔</Text>
                      <Text style={styles.timeRowLabel}>Reminder</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.timeRowValue}
                      onPress={() => {
                        // TODO: Implement reminder picker
                      }}
                    >
                      <Text style={styles.timeRowValueText}>None {'>'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Summary */}
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Selected:</Text>
              <Text style={styles.summaryDate}>
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <Text style={styles.summaryTime}>
                at {selectedDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.footerButton} onPress={onCancel}>
                <Text style={styles.footerButtonText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.footerButton, styles.okButton]} onPress={handleConfirm}>
                <Text style={[styles.footerButtonText, styles.okButtonText]}>OK</Text>
              </TouchableOpacity>
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
          </View>
        </SafeAreaView>
      </PaperProvider>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  quickContainer: {
    alignItems: 'center',
  },
  quickOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  quickOption: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickOptionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  calendarContainer: {
    alignItems: 'center',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  calendarNav: {
    fontSize: 24,
    color: '#007AFF',
    paddingHorizontal: 10,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  calendarGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDayHeader: {
    width: '14.28%',
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 20,
  },
  calendarDaySelected: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 16,
    color: '#333',
  },
  calendarDayTextToday: {
    color: '#007AFF',
    fontWeight: '600',
  },
  calendarDayTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  timeContainer: {
    width: '100%',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  timeRowIcon: {
    fontSize: 20,
    color: '#333',
    marginRight: 8,
  },
  timeRowLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  timeRowValue: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  timeRowValueText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
  },
  summary: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  summaryTime: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  footerButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  okButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  okButtonText: {
    color: 'white',
  },
});

export default TaskDetailsDateTimePicker;
