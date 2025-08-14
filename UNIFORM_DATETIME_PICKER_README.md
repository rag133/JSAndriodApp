# 🗓️ Uniform Date-Time Picker for Mobile App

This document describes the new uniform date-time picker components created for the Jeevan Saathi mobile app, designed to provide a consistent and user-friendly experience for selecting dates and times across the application.

## 📱 Components Overview

### 1. **UniformDateTimePicker** - Main Component
The core date-time picker with three tabs: Quick Selection, Calendar, and Time.

### 2. **DateTimePickerIcon** - Trigger Component
A simple icon component that can be used in forms to trigger the date-time picker.

### 3. **AddTaskWithDateTimeExample** - Integration Example
A complete example showing how to integrate the date-time picker with an add task form.

## ✨ Features

### 🚀 Quick Selection Tab
- **4 Quick Options**: Today, Tomorrow, Next Week, Next Month
- **Visual Icons**: Emoji icons for each option
- **Smart Navigation**: Automatically switches to calendar tab after selection

### 📅 Calendar Tab
- **Month Navigation**: Previous/Next month buttons
- **Full Calendar Grid**: Complete month view with proper day alignment
- **Visual Indicators**: 
  - Today highlighted in blue
  - Selected date highlighted in primary color
  - Current month days in dark text, other month days in light text

### ⏰ Time Tab
- **Material Design 3 Time Picker**: Uses `react-native-paper-dates` for native feel
- **Current Time Display**: Shows selected time in large, readable format
- **Reminder Options**: 6 reminder choices from 5 minutes to 1 day before
- **Chip Selection**: Material Design 3 chips for reminder selection

## 🎨 Design Features

- **Material Design 3**: Follows [Material Design 3 guidelines](https://m3.material.io/components/time-pickers/overview)
- **iOS Style**: Uses iOS blue (#007AFF) for consistency
- **Responsive Layout**: Adapts to different screen sizes
- **Smooth Animations**: Slide-up modal with proper transitions
- **Accessibility**: Proper touch targets and readable text sizes

## 📦 Installation & Dependencies

The components require the following dependencies (already in your project):

```json
{
  "react-native-paper": "^5.x.x",
  "react-native-paper-dates": "^1.x.x"
}
```

## 🔧 Usage Examples

### Basic Usage

```tsx
import { UniformDateTimePicker } from './components';

const MyComponent = () => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleConfirm = (date: Date, reminder?: string) => {
    setSelectedDate(date);
    console.log('Selected date:', date);
    console.log('Reminder:', reminder);
    setShowPicker(false);
  };

  return (
    <UniformDateTimePicker
      visible={showPicker}
      initialDate={selectedDate}
      onConfirm={handleConfirm}
      onCancel={() => setShowPicker(false)}
    />
  );
};
```

### With Icon Trigger

```tsx
import { DateTimePickerIcon, UniformDateTimePicker } from './components';

const TaskForm = () => {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View>
      <DateTimePickerIcon
        onPress={() => setShowPicker(true)}
        size={32}
        color="#007AFF"
      />
      
      <UniformDateTimePicker
        visible={showPicker}
        onConfirm={(date, reminder) => {
          // Handle date selection
          setShowPicker(false);
        }}
        onCancel={() => setShowPicker(false)}
      />
    </View>
  );
};
```

### Complete Task Form Integration

```tsx
import { AddTaskWithDateTimeExample } from './components';

const TaskScreen = () => {
  const [showAddTask, setShowAddTask] = useState(false);

  const handleSaveTask = (task) => {
    console.log('New task:', task);
    // Save task to database
    setShowAddTask(false);
  };

  return (
    <AddTaskWithDateTimeExample
      visible={showAddTask}
      onClose={() => setShowAddTask(false)}
      onSave={handleSaveTask}
    />
  );
};
```

## 🎯 API Reference

### UniformDateTimePicker Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | ✅ | Controls modal visibility |
| `initialDate` | `Date` | ❌ | Pre-selected date and time |
| `onConfirm` | `(date: Date, reminder?: string) => void` | ✅ | Called when user confirms selection |
| `onCancel` | `() => void` | ✅ | Called when user cancels |

### DateTimePickerIcon Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onPress` | `() => void` | ✅ | - | Function called when icon is pressed |
| `size` | `number` | ❌ | `24` | Size of the icon in pixels |
| `color` | `string` | ❌ | `#007AFF` | Color of the icon |

## 🔄 State Management

The component manages several internal states:

- **selectedDate**: Currently selected date
- **viewDate**: Date being viewed in calendar (for month navigation)
- **selectedTime**: Selected time (hour, minute)
- **activeTab**: Current active tab (quick, calendar, time)
- **selectedReminder**: Selected reminder option

## 🎨 Customization

### Colors
The component uses a consistent color scheme that can be customized:

```tsx
// Primary colors
primary: '#007AFF'        // iOS blue
primaryContainer: '#E3F2FD' // Light blue background
surface: '#FFFFFF'        // White surface
background: '#FFFFFF'     // White background

// Text colors
onPrimary: '#FFFFFF'      // White text on primary
onSurface: '#000000'      // Black text on surface
onBackground: '#000000'   // Black text on background
```

### Styling
All styles are defined in the StyleSheet and can be easily modified for:
- Border radius
- Spacing
- Typography
- Shadows and elevations

## 🧪 Testing

The components are designed to be easily testable:

```tsx
// Test date selection
fireEvent.press(screen.getByText('Today'));
expect(screen.getByText('Calendar')).toBeInTheDocument();

// Test time selection
fireEvent.press(screen.getByText('Change Time'));
expect(screen.getByText('Select Time')).toBeInTheDocument();
```

## 🚀 Performance Considerations

- **Memoized Calculations**: Calendar grid and time options are memoized
- **Efficient Rendering**: Only re-renders when necessary
- **Smooth Animations**: Uses native modal animations
- **Memory Management**: Proper cleanup of event listeners

## 🔮 Future Enhancements

Potential improvements for future versions:

1. **Recurring Dates**: Support for weekly/monthly recurring tasks
2. **Custom Reminders**: User-defined reminder times
3. **Time Zones**: Support for different time zones
4. **Dark Mode**: Dark theme support
5. **Localization**: Multiple language support
6. **Accessibility**: VoiceOver and TalkBack improvements

## 📝 Notes

- The component follows Material Design 3 guidelines for time pickers
- Uses `react-native-paper-dates` for native time picker experience
- Designed to work seamlessly with existing Jeevan Saathi mobile app
- Maintains consistency with iOS design patterns
- Supports both portrait and landscape orientations

## 🤝 Contributing

When modifying these components:

1. Maintain the existing API structure
2. Follow the established styling patterns
3. Test on both iOS and Android
4. Update this documentation
5. Ensure accessibility compliance

---

**Created for Jeevan Saathi Mobile App**  
**Version**: 1.0.0  
**Last Updated**: August 14, 2025
