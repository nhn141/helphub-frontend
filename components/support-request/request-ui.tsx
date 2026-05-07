import { Feather } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authPalette } from '@/components/auth/auth-ui';
import { Fonts } from '@/constants/theme';

type RequestScreenProps = {
  title: string;
  onBackPress?: () => void;
  rightSlot?: ReactNode;
  children: ReactNode;
};

type RequestSectionProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
};

type RequestFieldProps = ComponentProps<typeof TextInput> & {
  label: string;
  rightIcon?: ReactNode;
};

type RequestButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'danger';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  disabled?: boolean;
};

type RequestChoice = {
  label: string;
  value: string;
  detail?: string;
};

type RequestChoiceGroupProps = {
  label: string;
  options: RequestChoice[];
  value: string;
  onChange: (value: string) => void;
};

type RequestCardProps = {
  children: ReactNode;
};

type RequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED';

export function RequestScreen({ title, onBackPress, rightSlot, children }: RequestScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={onBackPress} style={styles.backButton}>
            <Feather name="arrow-left" size={22} color={authPalette.primaryDark} />
          </Pressable>
          <View style={styles.headerTitleStage}>
            <View style={styles.headerTitleGlowMint} />
            <View style={styles.headerTitleGlowAmber} />
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={styles.headerTitleAccent} />
          </View>
          <View style={styles.rightSlot}>{rightSlot ?? <View style={styles.headerSpacer} />}</View>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function RequestSection({ title, action, children }: RequestSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action ? <View>{action}</View> : null}
      </View>
      {children}
    </View>
  );
}

export function RequestCard({ children }: RequestCardProps) {
  return <View style={styles.card}>{children}</View>;
}

export function RequestField({ label, rightIcon, multiline, style, ...props }: RequestFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldShell, multiline && styles.fieldShellMultiline]}>
        <TextInput
          {...props}
          multiline={multiline}
          placeholderTextColor="#93A095"
          style={[styles.fieldInput, multiline && styles.fieldInputMultiline, style]}
        />
        {rightIcon ? <View style={styles.fieldRightIcon}>{rightIcon}</View> : null}
      </View>
    </View>
  );
}

export function RequestChoiceGroup({
  label,
  options,
  value,
  onChange,
}: RequestChoiceGroupProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.choiceStack}>
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              onPress={() => onChange(option.value)}
              style={[styles.choiceCard, selected && styles.choiceCardActive]}>
              <View style={styles.choiceText}>
                <Text style={[styles.choiceLabel, selected && styles.choiceLabelActive]}>
                  {option.label}
                </Text>
                {option.detail ? (
                  <Text style={[styles.choiceDetail, selected && styles.choiceDetailActive]}>
                    {option.detail}
                  </Text>
                ) : null}
              </View>
              <View style={[styles.choiceIndicator, selected && styles.choiceIndicatorActive]}>
                {selected ? <View style={styles.choiceIndicatorDot} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function RequestButton({
  label,
  onPress,
  variant = 'primary',
  leftIcon,
  rightIcon,
  disabled,
}: RequestButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'outline' && styles.buttonOutline,
        variant === 'danger' && styles.buttonDanger,
        disabled && styles.buttonDisabled,
      ]}>
      <View style={styles.buttonInner}>
        {leftIcon ? <View style={styles.buttonIcon}>{leftIcon}</View> : null}
        <Text
          style={[
            styles.buttonText,
            variant === 'outline' && styles.buttonTextOutline,
            variant === 'danger' && styles.buttonTextDanger,
          ]}>
          {label}
        </Text>
        {rightIcon ? <View style={styles.buttonIcon}>{rightIcon}</View> : null}
      </View>
    </Pressable>
  );
}

export function RequestStatusBadge({ status }: { status: string }) {
  const tone = statusStyles[status as RequestStatus] ?? statusStyles.PENDING;

  return (
    <View style={[styles.statusBadge, tone.surface]}>
      <Text style={[styles.statusLabel, tone.text]}>{status}</Text>
    </View>
  );
}

export function RequestMetaRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metaRow}>
      <View style={styles.metaIcon}>
        <Feather name={icon} size={15} color={authPalette.primaryDark} />
      </View>
      <View style={styles.metaText}>
        <Text style={styles.metaLabel}>{label}</Text>
        <Text style={styles.metaValue}>{value}</Text>
      </View>
    </View>
  );
}

export function RequestInlineLink({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.inlineLink}>
      <Text style={styles.inlineLinkText}>{label}</Text>
      <Feather name="arrow-right" size={16} color={authPalette.primaryDark} />
    </Pressable>
  );
}

const statusStyles = {
  PENDING: {
    surface: { backgroundColor: '#FFF1D8' },
    text: { color: '#9A6500' },
  },
  APPROVED: {
    surface: { backgroundColor: '#E4F7EB' },
    text: { color: authPalette.primaryDark },
  },
  IN_PROGRESS: {
    surface: { backgroundColor: '#D9F6E7' },
    text: { color: authPalette.primaryDark },
  },
  REJECTED: {
    surface: { backgroundColor: '#FDE7E6' },
    text: { color: '#AE3F3A' },
  },
  COMPLETED: {
    surface: { backgroundColor: '#E8F3FF' },
    text: { color: '#2A5EAA' },
  },
  CANCELLED: {
    surface: { backgroundColor: '#EEF2EF' },
    text: { color: '#5B675D' },
  },
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6FAF6',
  },
  screen: {
    flex: 1,
    backgroundColor: '#F6FAF6',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDF5EF',
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 21,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    textShadowColor: 'rgba(146, 240, 200, 0.65)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
  },
  headerTitleStage: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 10,
  },
  headerTitleGlowMint: {
    position: 'absolute',
    width: 56,
    height: 34,
    borderRadius: 999,
    backgroundColor: '#BDF6D7',
    opacity: 0.58,
    transform: [{ rotate: '-8deg' }],
  },
  headerTitleGlowAmber: {
    position: 'absolute',
    right: 20,
    bottom: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFE1A8',
    opacity: 0.72,
  },
  headerTitleAccent: {
    marginTop: 6,
    width: 58,
    height: 4,
    borderRadius: 999,
    backgroundColor: authPalette.coral,
  },
  rightSlot: {
    minWidth: 36,
    alignItems: 'flex-end',
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    textShadowColor: 'rgba(146, 240, 200, 0.42)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  card: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 18,
    shadowColor: '#0F4B34',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  fieldGroup: {
    gap: 10,
  },
  fieldLabel: {
    fontSize: 14,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  fieldShell: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: authPalette.field,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldShellMultiline: {
    paddingTop: 14,
    paddingBottom: 14,
    alignItems: 'flex-start',
  },
  fieldInput: {
    flex: 1,
    minHeight: 56,
    color: authPalette.text,
    fontSize: 15,
    fontFamily: Fonts.rounded,
  },
  fieldInputMultiline: {
    minHeight: 104,
    textAlignVertical: 'top',
  },
  fieldRightIcon: {
    marginLeft: 10,
    paddingTop: 16,
  },
  choiceStack: {
    gap: 10,
  },
  choiceCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2EAE3',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  choiceCardActive: {
    borderColor: '#97EFC8',
    backgroundColor: '#F2FCF6',
  },
  choiceText: {
    flex: 1,
    gap: 4,
  },
  choiceLabel: {
    fontSize: 15,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  choiceLabelActive: {
    color: authPalette.primaryDark,
  },
  choiceDetail: {
    fontSize: 13,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  choiceDetailActive: {
    color: authPalette.primaryDark,
  },
  choiceIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.2,
    borderColor: '#CDD7CF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceIndicatorActive: {
    borderColor: '#97EFC8',
  },
  choiceIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: authPalette.primaryDark,
  },
  button: {
    minHeight: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: authPalette.primaryDark,
  },
  buttonOutline: {
    borderWidth: 1.5,
    borderColor: '#BDE7CF',
    backgroundColor: '#FFFFFF',
  },
  buttonDanger: {
    backgroundColor: '#B94540',
  },
  buttonDisabled: {
    opacity: 0.62,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonIcon: {
    marginTop: 1,
  },
  buttonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
  },
  buttonTextOutline: {
    color: authPalette.primaryDark,
  },
  buttonTextDanger: {
    color: '#FFFFFF',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  statusLabel: {
    fontSize: 12,
    fontFamily: Fonts.rounded,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF7F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaText: {
    flex: 1,
    gap: 3,
  },
  metaLabel: {
    fontSize: 12,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  metaValue: {
    fontSize: 14,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  inlineLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineLinkText: {
    fontSize: 14,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
});
