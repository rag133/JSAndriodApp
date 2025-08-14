import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DateTimePickerProps {
  visible: boolean;
  initialDate?: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  visible,
  initialDate,
  onConfirm,
  onCancel,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
  const [selectedTime, setSelectedTime] = useState<{ hour: number; minute: number; isAM: boolean }>({
    hour: initialDate ? initialDate.getHours() % 12 || 12 : 12,
    minute: initialDate ? initialDate.getMinutes() : 0,
    isAM: initialDate ? initialDate.getHours() < 12 : true,
  });
  const [activeTab, setActiveTab] = useState<'date' | 'time'>('date');
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(new Date(initialDate));
      setSelectedTime({
        hour: initialDate.getHours() % 12 || 12,
        minute: initialDate.getMinutes(),
        isAM: initialDate.getHours() < 12,
      });
    }
  }, [initialDate]);

  const getCurrentMonth = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[selectedDate.getMonth()];
  };

  const getCurrentYear = () => {
    return selectedDate.getFullYear();
  };

  const getDaysInMonth = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
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
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const selectDate = (day: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(day);
    setSelectedDate(newDate);
  };

  const formatTime = () => {
    const displayHour = selectedTime.hour;
    const displayMinute = selectedTime.minute.toString().padStart(2, '0');
    const ampm = selectedTime.isAM ? 'AM' : 'PM';
    return `${displayHour}:${displayMinute} ${ampm}`;
  };

  const handleTimeChange = (type: 'hour' | 'minute', value: number) => {
    setSelectedTime(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const toggleAMPM = () => {
    setSelectedTime(prev => ({
      ...prev,
      isAM: !prev.isAM
    }));
  };

  const handleConfirm = () => {
    const finalDate = new Date(selectedDate);
    let hour = selectedTime.hour;
    
    // Convert to 24-hour format
    if (!selectedTime.isAM && hour !== 12) {
      hour += 12;
    } else if (selectedTime.isAM && hour === 12) {
      hour = 0;
    }
    
    finalDate.setHours(hour, selectedTime.minute, 0, 0);
    onConfirm(finalDate);
  };

  const renderClockPicker = () => {
    const clockSize = 240;
    const centerX = clockSize / 2;
    const centerY = clockSize / 2;
    const radius = 80;

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    
    return (
      <View style={styles.clockContainer}>
        {/* Digital Time Display */}
        <View style={styles.digitalTimeContainer}>
          <Text style={styles.digitalTime}>
            {selectedTime.hour.toString().padStart(2, '0')} : {selectedTime.minute.toString().padStart(2, '0')}
          </Text>
          <View style={styles.ampmContainer}>
            <TouchableOpacity
              style={[styles.ampmButton, selectedTime.isAM && styles.ampmButtonActive]}
              onPress={() => setSelectedTime(prev => ({ ...prev, isAM: true }))}
            >
              <Text style={[styles.ampmText, selectedTime.isAM && styles.ampmTextActive]}>AM</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ampmButton, !selectedTime.isAM && styles.ampmButtonActive]}
              onPress={() => setSelectedTime(prev => ({ ...prev, isAM: false }))}
            >
              <Text style={[styles.ampmText, !selectedTime.isAM && styles.ampmTextActive]}>PM</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Clock Face */}
        <View style={[styles.clockFace, { width: clockSize, height: clockSize }]}>
          <View style={styles.clockCenter} />
          
          {/* Hour markers */}
          {hours.map((hour) => {
            const angle = ((hour - 3) * 30) * (Math.PI / 180); // -3 to start from 12 o'clock
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            return (
              <TouchableOpacity
                key={hour}
                style={[
                  styles.hourMarker,
                  {
                    left: x - 15,
                    top: y - 15,
                  },
                  selectedTime.hour === hour && styles.selectedHourMarker
                ]}
                onPress={() => handleTimeChange('hour', hour)}
              >
                <Text style={[
                  styles.hourText,
                  selectedTime.hour === hour && styles.selectedHourText
                ]}>
                  {hour}
                </Text>
              </TouchableOpacity>
            );
          })}
          
          {/* Hour hand */}
          {(() => {
            const hourAngle = ((selectedTime.hour - 3) * 30) * (Math.PI / 180);
            const hourHandLength = 50;
            const hourEndX = centerX + hourHandLength * Math.cos(hourAngle);
            const hourEndY = centerY + hourHandLength * Math.sin(hourAngle);
            
            return (
              <View
                style={[
                  styles.clockHand,
                  {
                    left: centerX - 1,
                    top: centerY - 1,
                    width: 2,
                    height: hourHandLength,
                    transform: [
                      { translateX: -1 },
                      { translateY: -hourHandLength / 2 },
                      { rotate: `${(selectedTime.hour - 3) * 30}deg` }
                    ]
                  }
                ]}
              />
            );
          })()}
        </View>
      </View>
    );
  };

  const renderDatePicker = () => {
    const days = getDaysInMonth();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    return (
      <View style={styles.calendarContainer}>
        {/* Month/Year Header */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => navigateMonth('prev')}>
            <Text style={styles.navButton}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthYear}>{getCurrentMonth()}</Text>
          <TouchableOpacity onPress={() => navigateMonth('next')}>
            <Text style={styles.navButton}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day names */}
        <View style={styles.dayNamesContainer}>
          {dayNames.map((dayName) => (
            <Text key={dayName} style={styles.dayName}>{dayName}</Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {days.map((day, index) => {
            if (day === null) {
              return <View key={index} style={styles.emptyDay} />;
            }
            
            const isSelected = day === selectedDate.getDate();
            const isToday = day === today.getDate() && 
                           selectedDate.getMonth() === today.getMonth() && 
                           selectedDate.getFullYear() === today.getFullYear();
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  isSelected && styles.selectedDay,
                  isToday && !isSelected && styles.todayDay
                ]}
                onPress={() => selectDate(day)}
              >
                <Text style={[
                  styles.dayText,
                  isSelected && styles.selectedDayText,
                  isToday && !isSelected && styles.todayDayText
                ]}>
                  {day}
                </Text>
                {/* Small number below each day */}
                <Text style={styles.dayNumber}>{10 + index}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Time Section */}
        <TouchableOpacity 
          style={styles.timeSection}
          onPress={() => setShowTimePicker(!showTimePicker)}
        >
          <View style={styles.timeSectionContent}>
            <Text style={styles.timeSectionIcon}>🕐</Text>
            <Text style={styles.timeSectionLabel}>Time</Text>
            <Text style={styles.timeSectionValue}>{formatTime()}</Text>
            <Text style={styles.timeSectionRemove}>✕</Text>
          </View>
        </TouchableOpacity>

        {/* Reminder and Repeat sections */}
        <View style={styles.extraOptions}>
          <View style={styles.extraOption}>
            <Text style={styles.extraOptionIcon}>🔔</Text>
            <Text style={styles.extraOptionLabel}>Reminder</Text>
            <Text style={styles.extraOptionValue}>On time</Text>
            <Text style={styles.extraOptionRemove}>✕</Text>
          </View>
          
          <View style={styles.extraOption}>
            <Text style={styles.extraOptionIcon}>🔄</Text>
            <Text style={styles.extraOptionLabel}>Repeat</Text>
            <Text style={styles.extraOptionValue}>None</Text>
            <Text style={styles.extraOptionChevron}>›</Text>
          </View>
        </View>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.cancelButton}>✕</Text>
            </TouchableOpacity>
            
            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'date' && styles.activeTab]}
                onPress={() => setActiveTab('date')}
              >
                <Text style={[styles.tabText, activeTab === 'date' && styles.activeTabText]}>
                  Date
                </Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={styles.confirmButton}>✓</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {showTimePicker ? renderClockPicker() : renderDatePicker()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    maxHeight: screenHeight * 0.8,
    minHeight: screenHeight * 0.6,
    width: screenWidth - 40,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  cancelButton: {
    fontSize: 18,
    color: '#8E8E93',
    fontWeight: '600',
  },
  confirmButton: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 2,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  
  // Content
  content: {
    flex: 1,
    padding: 20,
  },
  
  // Clock Picker
  clockContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  digitalTimeContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  digitalTime: {
    fontSize: 48,
    fontWeight: '300',
    color: '#007AFF',
    marginBottom: 10,
  },
  ampmContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    padding: 2,
  },
  ampmButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
  },
  ampmButtonActive: {
    backgroundColor: '#007AFF',
  },
  ampmText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  ampmTextActive: {
    color: '#FFFFFF',
  },
  clockFace: {
    position: 'relative',
    borderWidth: 2,
    borderColor: '#F2F2F7',
    borderRadius: 120,
    backgroundColor: '#FFFFFF',
  },
  clockCenter: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 8,
    height: 8,
    backgroundColor: '#007AFF',
    borderRadius: 4,
    marginLeft: -4,
    marginTop: -4,
  },
  hourMarker: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedHourMarker: {
    backgroundColor: '#007AFF',
  },
  hourText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  selectedHourText: {
    color: '#FFFFFF',
  },
  clockHand: {
    position: 'absolute',
    backgroundColor: '#007AFF',
    transformOrigin: 'bottom center',
  },
  
  // Calendar
  calendarContainer: {
    paddingVertical: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
    paddingHorizontal: 15,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  dayNamesContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  emptyDay: {
    width: `${100/7}%`,
    height: 44,
  },
  dayButton: {
    width: `${100/7}%`,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  selectedDay: {
    backgroundColor: '#007AFF',
  },
  todayDay: {
    backgroundColor: '#F2F2F7',
  },
  dayText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  selectedDayText: {
    color: '#FFFFFF',
  },
  todayDayText: {
    color: '#007AFF',
  },
  dayNumber: {
    fontSize: 10,
    color: '#C7C7CC',
    position: 'absolute',
    bottom: 2,
  },
  
  // Time Section
  timeSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    paddingVertical: 12,
  },
  timeSectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeSectionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  timeSectionLabel: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  timeSectionValue: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 8,
  },
  timeSectionRemove: {
    fontSize: 16,
    color: '#FF3B30',
  },
  
  // Extra Options
  extraOptions: {
    marginTop: 10,
  },
  extraOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  extraOptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  extraOptionLabel: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  extraOptionValue: {
    fontSize: 16,
    color: '#8E8E93',
    marginRight: 8,
  },
  extraOptionRemove: {
    fontSize: 16,
    color: '#FF3B30',
  },
  extraOptionChevron: {
    fontSize: 16,
    color: '#C7C7CC',
  },
});

export default DateTimePicker;

