import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Fonts } from '@/constants/theme';

export const authPalette = {
  background: '#F8FBF7',
  text: '#2B352F',
  muted: '#667168',
  primary: '#0E7A52',
  primaryDark: '#0B6D49',
  mint: '#92F0C8',
  coral: '#F9735B',
  amber: '#F6B44B',
  field: '#DDE6DE',
  chip: '#EFF3EE',
  outline: '#86EABB',
  divider: '#D7DED8',
};

export type PasswordStrengthLevel = 'EMPTY' | 'WEAK' | 'FAIR' | 'GOOD' | 'STRONG';

export type PasswordStrengthResult = {
  score: number;
  maxScore: number;
  percent: number;
  activeSegments: number;
  label: PasswordStrengthLevel;
  color: string;
  checks: {
    minLength: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  };
};

type AuthPageProps = {
  children: ReactNode;
};

type AuthBrandHeaderProps = {
  showClose?: boolean;
  onClosePress?: () => void;
};

type AuthBackHeaderProps = {
  title: string;
  onBackPress?: () => void;
};

type AuthIntroProps = {
  title: string;
  subtitle?: string;
  centered?: boolean;
  compact?: boolean;
};

type AuthInputProps = ComponentProps<typeof TextInput> & {
  label?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

type AuthButtonProps = {
  label: string;
  variant?: 'primary' | 'outline';
  onPress?: () => void;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  disabled?: boolean;
};

type RoleOption = {
  label: string;
  value: string;
};

type RoleSelectorProps = {
  options: RoleOption[];
  value: string;
  onChange: (value: string) => void;
};

const PASSWORD_MAX_SCORE = 5;

export function getPasswordStrength(password: string): PasswordStrengthResult {
  const checks = {
    minLength: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const percent = Math.round((score / PASSWORD_MAX_SCORE) * 100);
  const activeSegments = password.length === 0 ? 0 : Math.max(1, Math.ceil(percent / 25));

  if (password.length === 0) {
    return {
      score: 0,
      maxScore: PASSWORD_MAX_SCORE,
      percent: 0,
      activeSegments,
      label: 'EMPTY',
      color: authPalette.divider,
      checks,
    };
  }

  if (score <= 1) {
    return {
      score,
      maxScore: PASSWORD_MAX_SCORE,
      percent,
      activeSegments,
      label: 'WEAK',
      color: '#D92D20',
      checks,
    };
  }

  if (score <= 2) {
    return {
      score,
      maxScore: PASSWORD_MAX_SCORE,
      percent,
      activeSegments,
      label: 'FAIR',
      color: authPalette.amber,
      checks,
    };
  }

  if (score <= 4) {
    return {
      score,
      maxScore: PASSWORD_MAX_SCORE,
      percent,
      activeSegments,
      label: 'GOOD',
      color: authPalette.primaryDark,
      checks,
    };
  }

  return {
    score,
    maxScore: PASSWORD_MAX_SCORE,
    percent,
    activeSegments,
    label: 'STRONG',
    color: '#047857',
    checks,
  };
}

export function AuthPage({ children }: AuthPageProps) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

export function AuthBrandHeader({ showClose = true, onClosePress }: AuthBrandHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <MaterialCommunityIcons name="hand-heart" size={20} color={authPalette.primaryDark} />
        <Text style={styles.brandText}>Help Hub</Text>
      </View>
      {showClose ? (
        <Pressable accessibilityRole="button" onPress={onClosePress} style={styles.closeButton}>
          <Feather name="x" size={24} color={authPalette.primaryDark} />
        </Pressable>
      ) : (
        <View style={styles.headerSpacer} />
      )}
    </View>
  );
}

export function AuthBackHeader({ title, onBackPress }: AuthBackHeaderProps) {
  return (
    <View style={styles.backHeader}>
      <Pressable accessibilityRole="button" onPress={onBackPress} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color={authPalette.primaryDark} />
      </Pressable>
      <View style={styles.backHeaderTitleStage}>
        <View style={styles.backHeaderTitleGlow} />
        <Text style={styles.backHeaderTitle}>{title}</Text>
        <View style={styles.backHeaderTitleAccent} />
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );
}

export function AuthIntro({ title, subtitle, centered = false, compact = false }: AuthIntroProps) {
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(reveal, {
      toValue: 1,
      duration: 620,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reveal]);

  return (
    <Animated.View
      style={[
        styles.intro,
        compact && styles.introCompact,
        {
          opacity: reveal,
          transform: [
            {
              translateY: reveal.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
          ],
        },
      ]}>
      <View style={[styles.titleStage, centered && styles.titleStageCentered]}>
        <View style={styles.titleGlowMint} />
        <View style={styles.titleGlowCoral} />
        <Text style={[styles.title, centered && styles.centerText, compact && styles.compactTitle]}>
          {title}
        </Text>
        <View style={[styles.titleAccent, centered && styles.titleAccentCentered]}>
          <View style={styles.titleAccentDot} />
          <View style={styles.titleAccentLine} />
        </View>
      </View>
      {subtitle ? (
        <Text
          style={[
            styles.subtitle,
            centered && styles.centerText,
            compact && styles.compactSubtitle,
          ]}>
          {subtitle}
        </Text>
      ) : null}
    </Animated.View>
  );
}

export function AuthInput({ label, leftIcon, rightIcon, style, ...props }: AuthInputProps) {
  return (
    <View style={styles.fieldGroup}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputShell}>
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          {...props}
          autoCorrect={false}
          placeholderTextColor="#909A90"
          style={[styles.input, style]}
        />
        {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
      </View>
    </View>
  );
}

export function AuthPasswordInput({ label, style, ...props }: AuthInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <AuthInput
      {...props}
      label={label}
      secureTextEntry={!visible}
      style={style}
      rightIcon={
        <Pressable accessibilityRole="button" onPress={() => setVisible((current) => !current)}>
          <Feather name="eye" size={22} color={authPalette.muted} />
        </Pressable>
      }
    />
  );
}

export function RememberRow({ onForgotPress }: { onForgotPress?: () => void }) {
  return (
    <View style={styles.rememberRow}>
      <View style={styles.rememberLeft}>
        <View style={styles.checkbox} />
        <Text style={styles.rememberText}>Remember me</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={onForgotPress}>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </Pressable>
    </View>
  );
}

export function AuthButton({ label, variant = 'primary', onPress, leftIcon, rightIcon, disabled }: AuthButtonProps) {
  const isOutline = variant === 'outline';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        isOutline ? styles.outlineButton : styles.primaryButton,
        disabled && styles.buttonDisabled,
      ]}>
      <View style={styles.buttonInner}>
        {leftIcon ? <View style={styles.buttonIcon}>{leftIcon}</View> : null}
        <Text style={[styles.buttonText, isOutline && styles.outlineButtonText]}>{label}</Text>
        {rightIcon ? <View style={styles.buttonIcon}>{rightIcon}</View> : null}
      </View>
    </Pressable>
  );
}

export function PasswordStrength({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  const label = strength.label === 'EMPTY' ? 'START' : strength.label;

  return (
    <View style={styles.strengthRow}>
      {[0, 1, 2, 3].map((index) => {
        const active = index < strength.activeSegments;

        return (
          <View
            key={index}
            style={[
              styles.strengthBar,
              active && {
                backgroundColor: strength.color,
              },
            ]}
          />
        );
      })}
      <Text style={[styles.strengthText, { color: strength.color }]}>
        {label} {strength.percent}%
      </Text>
    </View>
  );
}

export function RoleSelector({ options, value, onChange }: RoleSelectorProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>I want to join as:</Text>
      <View style={styles.roleWrap}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              onPress={() => onChange(option.value)}
              style={[styles.roleChip, selected && styles.roleChipActive]}>
              <Text style={[styles.roleText, selected && styles.roleTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function AuthCodeRow({ values }: { values: string[] }) {
  return (
    <View style={styles.codeRow}>
      {values.map((value, index) => (
        <View key={`${value}-${index}`} style={styles.codeCell}>
          <Text style={styles.codeText}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

export function AuthChecklist({
  items,
}: {
  items: { label: string; checked: boolean }[];
}) {
  return (
    <View style={styles.checklistCard}>
      {items.map((item) => (
        <View key={item.label} style={styles.checklistRow}>
          <View style={[styles.checkIcon, item.checked ? styles.checkIconActive : styles.checkIconIdle]}>
            {item.checked ? <Feather name="check" size={12} color={authPalette.primaryDark} /> : null}
          </View>
          <Text style={[styles.checkLabel, !item.checked && styles.checkLabelMuted]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function AuthTextLink({
  label,
  onPress,
  leftIcon,
}: {
  label: string;
  onPress?: () => void;
  leftIcon?: ReactNode;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.textLink}>
      {leftIcon ? <View style={styles.textLinkIcon}>{leftIcon}</View> : null}
      <Text style={styles.textLinkLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: authPalette.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontSize: 21,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
  closeButton: {
    padding: 4,
  },
  backButton: {
    padding: 4,
    width: 28,
    alignItems: 'flex-start',
  },
  headerSpacer: {
    width: 28,
  },
  backHeaderTitle: {
    fontSize: 18,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    textShadowColor: 'rgba(146, 240, 200, 0.6)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  backHeaderTitleStage: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    minHeight: 38,
    justifyContent: 'center',
  },
  backHeaderTitleGlow: {
    position: 'absolute',
    width: 64,
    height: 30,
    borderRadius: 999,
    backgroundColor: '#BDF6D7',
    opacity: 0.58,
    transform: [{ rotate: '-6deg' }],
  },
  backHeaderTitleAccent: {
    marginTop: 5,
    width: 52,
    height: 3,
    borderRadius: 999,
    backgroundColor: authPalette.coral,
  },
  intro: {
    marginTop: 56,
    marginBottom: 36,
  },
  introCompact: {
    marginTop: 118,
  },
  titleStage: {
    alignSelf: 'flex-start',
    position: 'relative',
    paddingTop: 8,
    paddingRight: 12,
    paddingBottom: 12,
  },
  titleStageCentered: {
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  titleGlowMint: {
    position: 'absolute',
    left: -12,
    top: 2,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#BDF6D7',
    opacity: 0.55,
  },
  titleGlowCoral: {
    position: 'absolute',
    right: -4,
    bottom: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFD4C7',
    opacity: 0.68,
  },
  title: {
    fontSize: 40,
    lineHeight: 48,
    color: authPalette.primaryDark,
    fontFamily: Fonts.sans,
    textShadowColor: 'rgba(146, 240, 200, 0.72)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 18,
  },
  compactTitle: {
    fontSize: 30,
    lineHeight: 38,
    fontFamily: Fonts.rounded,
  },
  titleAccent: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleAccentCentered: {
    justifyContent: 'center',
  },
  titleAccentDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: authPalette.coral,
  },
  titleAccentLine: {
    width: 86,
    height: 5,
    borderRadius: 999,
    backgroundColor: authPalette.mint,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  compactSubtitle: {
    lineHeight: 20,
  },
  centerText: {
    textAlign: 'center',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    marginBottom: 10,
    fontSize: 14,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  inputShell: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: authPalette.field,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 22,
    paddingRight: 16,
  },
  input: {
    flex: 1,
    minHeight: 56,
    color: authPalette.text,
    fontSize: 15,
    fontFamily: Fonts.rounded,
  },
  leftIcon: {
    marginRight: 12,
  },
  rightIcon: {
    marginLeft: 12,
  },
  rememberRow: {
    marginTop: 10,
    marginBottom: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rememberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.2,
    borderColor: '#B8C0B8',
  },
  rememberText: {
    fontSize: 14,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  forgotText: {
    fontSize: 14,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
  button: {
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.62,
  },
  primaryButton: {
    backgroundColor: authPalette.primaryDark,
  },
  outlineButton: {
    marginTop: 18,
    borderWidth: 2,
    borderColor: authPalette.outline,
    backgroundColor: authPalette.background,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
  },
  outlineButtonText: {
    color: authPalette.primaryDark,
  },
  strengthRow: {
    marginTop: -8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: authPalette.divider,
  },
  strengthText: {
    marginLeft: 6,
    fontSize: 12,
    fontFamily: Fonts.rounded,
  },
  codeRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  codeCell: {
    width: 49,
    height: 56,
    borderRadius: 8,
    backgroundColor: authPalette.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    fontSize: 22,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  roleWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  roleChip: {
    minWidth: 114,
    minHeight: 42,
    paddingHorizontal: 20,
    borderRadius: 21,
    backgroundColor: authPalette.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleChipActive: {
    backgroundColor: '#9CF2CC',
  },
  roleText: {
    fontSize: 14,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  roleTextActive: {
    color: authPalette.primaryDark,
  },
  checklistCard: {
    borderRadius: 22,
    backgroundColor: '#F2F7F3',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
  },
  checkIconActive: {
    borderColor: '#9CF2CC',
    backgroundColor: '#9CF2CC',
  },
  checkIconIdle: {
    borderColor: '#C8D0CA',
    backgroundColor: 'transparent',
  },
  checkLabel: {
    fontSize: 14,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  checkLabelMuted: {
    color: '#A2AAA4',
  },
  textLink: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  textLinkIcon: {
    marginTop: 1,
  },
  textLinkLabel: {
    fontSize: 16,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
  buttonIcon: {
    marginTop: 1,
  },
});
