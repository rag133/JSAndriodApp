import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface DateTimePickerIconProps {
  onPress: () => void;
  size?: number;
  color?: string;
}

const DateTimePickerIcon: React.FC<DateTimePickerIconProps> = ({
  onPress,
  size = 24,
  color = '#007AFF',
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, { width: size, height: size }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.icon, { fontSize: size * 0.8, color }]}>
        📅
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  icon: {
    textAlign: 'center',
  },
});

export default DateTimePickerIcon;
