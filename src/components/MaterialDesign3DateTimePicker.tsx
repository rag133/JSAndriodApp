import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { DatePickerModal, TimePickerModal } from 'react-native-paper-dates';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MaterialDesign3DateTimePickerProps {
  visible: boolean;
  initialDate?: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

// Material Design 3 theme configuration
const md3Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#007AFF', // iOS blue for consistency with email style
    primaryContainer: '#E3F2FD',
    secondary: '#6B7280',
    secondaryContainer: '#F3F4F6',
    tertiary: '#8E8E93',
    surface: '#FFFFFF',
    surfaceVariant: '#F2F2F7',
    background: '#FFFFFF',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#007AFF',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#374151',
    onSurface: '#000000',
    onSurfaceVariant: '#6B7280',
    onBackground: '#000000',
    outline: '#E5E7EB',
    outlineVariant: '#F3F4F6',
    elevation: {
      level0: 'transparent',
      level1: '#F9FAFB',
      level2: '#F3F4F6',
      level3: '#E5E7EB',
      level4: '#D1D5DB',
      level5: '#9CA3AF',
    },
  },
};

const MaterialDesign3DateTimePicker: React.FC<MaterialDesign3DateTimePickerProps> = ({
  visible,
  initialDate,
  onConfirm,
  onCancel,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [selectedTime, setSelectedTime] = useState<{ hours?: number; minutes?: number }>({
    hours: initialDate?.getHours(),
    minutes: initialDate?.getMinutes(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeStep, setActiveStep] = useState<'choose' | 'date' | 'time'>('choose');
  const [currentMonth, setCurrentMonth] = useState<Date>(initialDate || new Date());

  useEffect(() => {
    if (visible) {
      setActiveStep('date'); // Start with date tab by default
      if (initialDate) {
        setSelectedDate(new Date(initialDate));
        setSelectedTime({
          hours: initialDate.getHours(),
          minutes: initialDate.getMinutes(),
        });
        setCurrentMonth(new Date(initialDate));
      } else {
        const now = new Date();
        setSelectedDate(now);
        setSelectedTime({
          hours: now.getHours(),
          minutes: now.getMinutes(),
        });
        setCurrentMonth(now);
      }
    }
  }, [visible, initialDate]);

  const handleDateConfirm = (params: { date: Date }) => {
    setSelectedDate(params.date);
    setShowDatePicker(false);
    setActiveStep('date'); // Stay on date view
  };

  const handleTimeConfirm = (params: { hours: number; minutes: number }) => {
    setSelectedTime({ hours: params.hours, minutes: params.minutes });
    setShowTimePicker(false);
    setActiveStep('time'); // Stay on time view
  };

  const handleFinalConfirm = () => {
    if (selectedDate && selectedTime.hours !== undefined && selectedTime.minutes !== undefined) {
      const finalDate = new Date(selectedDate);
      finalDate.setHours(selectedTime.hours, selectedTime.minutes, 0, 0);
      onConfirm(finalDate);
    }
  };

  // Navigate month
  const navigateMonth = (direction: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  // Handle date selection in embedded calendar
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  // Generate calendar days - only current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const weeks = [];
    
    // Calculate how many empty cells we need at the start
    const startEmptyCells = firstDay.getDay();
    
    // Create the first week with empty cells and first days
    let currentWeek = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startEmptyCells; i++) {
      currentWeek.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(new Date(year, month, day));
    }
    
    // Fill the last week with empty cells if needed
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
    
    return weeks;
  };

  // Render embedded calendar
  const renderEmbeddedCalendar = () => {
    const weeks = generateCalendarDays();
    const today = new Date();
    
    console.log('Calendar weeks generated:', weeks.length); // Debug log
    
    return (
      <View style={styles.calendarContainer}>
        {/* Day headers */}
        <View style={styles.dayHeadersRow}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <View key={day} style={styles.dayHeaderCell}>
              <Text style={styles.dayHeaderText}>{day}</Text>
            </View>
          ))}
        </View>
        
        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.calendarWeek}>
              {week.map((day, dayIndex) => {
                if (!day) {
                  // Empty cell
                  return (
                    <View key={dayIndex} style={styles.calendarDay}>
                      <Text style={styles.calendarDayText}></Text>
                    </View>
                  );
                }
                
                const isSelected = selectedDate && 
                  day.getDate() === selectedDate.getDate() &&
                  day.getMonth() === selectedDate.getMonth() &&
                  day.getFullYear() === selectedDate.getFullYear();
                const isToday = 
                  day.getDate() === today.getDate() &&
                  day.getMonth() === today.getMonth() &&
                  day.getFullYear() === today.getFullYear();
                
                return (
                  <TouchableOpacity
                    key={dayIndex}
                    style={[
                      styles.calendarDay,
                      isSelected && styles.selectedDay,
                      isToday && !isSelected && styles.todayDay,
                    ]}
                    onPress={() => handleDateSelect(day)}
                  >
                    <Text style={[
                      styles.calendarDayText,
                      isSelected && styles.selectedDayText,
                      isToday && !isSelected && styles.todayDayText,
                    ]}>
                      {day.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (hours?: number, minutes?: number) => {
    if (hours === undefined || minutes === undefined) return '12:00 PM';
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  const renderDateTimeInterface = () => {
    return (
      <View style={styles.mainContainer}>
        {/* Header with X and ✓ */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleFinalConfirm} style={styles.headerButton}>
            <Text style={styles.confirmButtonText}>✓</Text>
          </TouchableOpacity>
        </View>



        {/* Content Area */}
        <View style={styles.contentContainer}>
          {/* Month/Year Header */}
          <View style={styles.monthHeader}>
            <TouchableOpacity 
              style={styles.monthNavButton}
              onPress={() => navigateMonth(-1)}
            >
              <Text style={styles.monthNavText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity 
              style={styles.monthNavButton}
              onPress={() => navigateMonth(1)}
            >
              <Text style={styles.monthNavText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Embedded Calendar */}
          <View style={styles.dateContainer}>
            {renderEmbeddedCalendar()}
          </View>

          {/* Bottom Section: Time, Reminder, Repeat */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={styles.bottomItem}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.bottomIcon}>🕐</Text>
              <Text style={styles.bottomLabel}>Time</Text>
              <Text style={styles.bottomValue}>
                {formatTime(selectedTime.hours, selectedTime.minutes)}
              </Text>
              <TouchableOpacity style={styles.removeButton}>
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bottomItem}>
              <Text style={styles.bottomIcon}>⏰</Text>
              <Text style={styles.bottomLabel}>Reminder</Text>
              <Text style={styles.bottomValue}>On time</Text>
              <TouchableOpacity style={styles.removeButton}>
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bottomItem}>
              <Text style={styles.bottomIcon}>🔄</Text>
              <Text style={styles.bottomLabel}>Repeat</Text>
              <Text style={styles.bottomValue}>None</Text>
              <Text style={styles.bottomArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <PaperProvider theme={md3Theme}>
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onCancel}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            {renderDateTimeInterface()}
          </View>
        </View>



        {/* Material Design 3 Time Picker */}
        <TimePickerModal
          visible={showTimePicker}
          onDismiss={() => {
            setShowTimePicker(false);
            setActiveStep('choose');
          }}
          onConfirm={handleTimeConfirm}
          hours={selectedTime.hours}
          minutes={selectedTime.minutes}
          use24HourClock={false} // Use 12-hour format for iOS consistency
          presentationStyle="pageSheet"
        />
      </Modal>
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.8,
    minHeight: screenHeight * 0.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  
  // Main Container
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 18,
    color: '#000000',
    fontWeight: '400',
  },
  confirmButtonText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },
  

  
  // Content Container
  contentContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  dateContainer: {
    flex: 1,
  },
  timeContainer: {
    flex: 1,
  },
  
  // Month Header
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  monthNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  
  // Bottom Section
  bottomSection: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 8,
  },
  bottomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bottomIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
  },
  bottomLabel: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    fontWeight: '400',
  },
  bottomValue: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginRight: 8,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  bottomArrow: {
    fontSize: 16,
    color: '#C7C7CC',
    marginLeft: 8,
  },
  
  // Embedded Calendar Styles
  calendarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dayHeadersRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  calendarGrid: {
    gap: 4,
    paddingTop: 8,
  },
  calendarWeek: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  calendarDay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  selectedDay: {
    backgroundColor: '#007AFF',
  },
  todayDay: {
    backgroundColor: '#F2F2F7',
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 20,
  },
  selectedDayText: {
    color: '#FFFFFF',
  },
  todayDayText: {
    color: '#007AFF',
    fontWeight: '700',
  },
  
  // Selection Display
  selectionDisplay: {
    paddingVertical: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  selectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  selectionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  selectionText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  
  // Action Buttons
  actionButtons: {
    paddingVertical: 20,
  },
  actionButton: {
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    paddingVertical: 16,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    fontWeight: '400',
  },
  actionButtonValue: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  
  // Quick Actions
  quickActions: {
    paddingVertical: 20,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  quickActionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginVertical: 4,
  },
  quickActionText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default MaterialDesign3DateTimePicker;
