import { resolveMaterialAppearance } from '@/src/theme/editions';
import { forwardRef, useState } from 'react';
import { TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';

// Preserve native refs and editing behavior while inheriting each Material World's input geometry.
export const NeverInput = forwardRef<TextInput, TextInputProps>(function NeverInput({ style, onFocus, onBlur, ...props }, ref) {
  const theme = useTheme();
  const { resolvedMode, reduceTransparency } = useThemePreference();
  const [focused, setFocused] = useState(false);
  const hasSurface = Boolean(StyleSheet.flatten(style)?.backgroundColor);
  const surface = resolveMaterialAppearance(theme, 'input', { reduceTransparency, focused }).style;
  return <TextInput ref={ref} selectionColor={theme.chrome} keyboardAppearance={resolvedMode}
    placeholderTextColor={theme.textTertiary} {...props}
    onFocus={(event) => { setFocused(true); onFocus?.(event); }}
    onBlur={(event) => { setFocused(false); onBlur?.(event); }}
    style={[
      styles.input,
      style,
      hasSurface && {
        backgroundColor: surface.backgroundColor,
        borderRadius: theme.materials.input.radius,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: surface.borderColor
      },
      { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: focused ? theme.chrome : 'transparent' }
    ]} />;
});
const styles = StyleSheet.create({ input: { minWidth: 0, minHeight: 44 } });
