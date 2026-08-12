import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  secureTextEntry,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const labelAnim = useRef(new Animated.Value(rest.value ? 1 : 0)).current;

  const animateLabel = useCallback(
    (toValue: number) => {
      Animated.timing(labelAnim, {
        toValue,
        duration: 180,
        useNativeDriver: false,
      }).start();
    },
    [labelAnim]
  );

  const handleFocus = useCallback(
    (e: any) => {
      setIsFocused(true);
      animateLabel(1);
      onFocus?.(e);
    },
    [animateLabel, onFocus]
  );

  const handleBlur = useCallback(
    (e: any) => {
      setIsFocused(false);
      if (!rest.value) animateLabel(0);
      onBlur?.(e);
    },
    [animateLabel, onBlur, rest.value]
  );

  const labelTop = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [16, -8] });
  const labelFontSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Typography.fontSizes.md, Typography.fontSizes.xs],
  });
  const labelColor = error
    ? Colors.error
    : isFocused
    ? Colors.primary
    : Colors.textMuted;

  const isPasswordField = secureTextEntry;
  const actualSecure = isPasswordField && !showPassword;

  const borderColor = error ? Colors.error : isFocused ? Colors.primary : Colors.surfaceBorder;

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.inputWrapper, { borderColor }]}>
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={isFocused ? Colors.primary : Colors.textMuted}
            style={styles.leftIcon}
          />
        )}
        <View style={styles.inputContainer}>
          {label && (
            <Animated.Text
              style={[
                styles.label,
                {
                  top: labelTop,
                  fontSize: labelFontSize,
                  color: labelColor,
                  left: icon ? 32 : 12,
                },
              ]}
            >
              {label}
            </Animated.Text>
          )}
          <TextInput
            {...rest}
            secureTextEntry={actualSecure}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={[
              styles.input,
              { paddingLeft: icon ? 8 : 12, paddingTop: label ? 16 : 12 },
              style,
            ]}
            placeholderTextColor={Colors.textMuted}
            selectionColor={Colors.primary}
            cursorColor={Colors.primary}
          />
        </View>
        {isPasswordField && (
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.rightIcon}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        )}
        {rightIcon && !isPasswordField && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon} size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    minHeight: 56,
  },
  leftIcon: {
    paddingLeft: 12,
  },
  inputContainer: {
    flex: 1,
    position: 'relative',
  },
  label: {
    position: 'absolute',
    backgroundColor: Colors.surface,
    paddingHorizontal: 4,
    zIndex: 1,
    fontWeight: Typography.fontWeights.medium,
  },
  input: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizes.md,
    paddingVertical: 12,
    paddingRight: 12,
  },
  rightIcon: {
    paddingRight: 12,
    paddingLeft: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.fontSizes.xs,
    marginTop: 4,
    marginLeft: 4,
  },
});
