import { forwardRef, useState } from 'react';
import { TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';

// Preserve native refs and editing behavior, with one focus/keyboard treatment.
export const NeverInput = forwardRef<TextInput, TextInputProps>(function NeverInput({ style, onFocus, onBlur, ...props }, ref) {
  const theme = useTheme();
  const { resolvedMode } = useThemePreference();
  const [focused, setFocused] = useState(false);
  return <TextInput ref={ref} selectionColor={theme.chrome} keyboardAppearance={resolvedMode}
    placeholderTextColor={theme.textTertiary} {...props}
    onFocus={(event) => { setFocused(true); onFocus?.(event); }}
    onBlur={(event) => { setFocused(false); onBlur?.(event); }}
    style={[styles.input, style, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: focused ? theme.chrome : 'transparent' }]} />;
});
const styles = StyleSheet.create({ input: { minWidth: 0, minHeight: 44 } });
