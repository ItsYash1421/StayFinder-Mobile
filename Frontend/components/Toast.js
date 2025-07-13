import React, { useEffect } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, getHeaderHeight } from '../constants/theme';

const ICONS = {
  success: 'check-circle',
  error: 'x-circle',
  info: 'info',
};

export default function Toast({
  visible,
  message,
  type = 'info',
  onHide,
  duration = 2000,
}) {
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => onHide && onHide());
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toast, { opacity }]}> 
      <Feather
        name={ICONS[type] || 'info'}
        size={22}
        color={type === 'success' ? COLORS.success : type === 'error' ? COLORS.error : COLORS.primary}
        style={{ marginRight: 10 }}
      />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: getHeaderHeight() + 20, // Position just under the header with some padding
    left: 24,
    right: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 9999,
  },
  toastText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
}); 