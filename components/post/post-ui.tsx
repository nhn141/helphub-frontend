import { Feather } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authPalette } from '@/components/auth/auth-ui';
import { Fonts } from '@/constants/theme';
import { reactionEmojis, type PostReactionType } from '@/components/post/post-api';

type PostScreenProps = {
  title: string;
  onBackPress?: () => void;
  rightSlot?: ReactNode;
  children: ReactNode;
};

type PostSectionProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
};

type PostCardProps = {
  children: ReactNode;
};

type PostFieldProps = ComponentProps<typeof TextInput> & {
  label: string;
};

type PostChoice = {
  label: string;
  value: string;
  detail?: string;
};

type PostChoiceGroupProps = {
  label: string;
  options: PostChoice[];
  value: string;
  onChange: (value: string) => void;
};

type PostButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline' | 'danger';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  disabled?: boolean;
};

type PostStatus = 'ACTIVE' | 'UNDER_REVIEW' | 'HIDDEN' | 'REMOVED';
type PostVisibility = 'PUBLIC' | 'VOLUNTEERS_ONLY';

export function PostScreen({ title, onBackPress, rightSlot, children }: PostScreenProps) {
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

export function PostSection({ title, action, children }: PostSectionProps) {
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

export function PostCard({ children }: PostCardProps) {
  return <View style={styles.card}>{children}</View>;
}

export function PostField({ label, multiline, style, ...props }: PostFieldProps) {
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
      </View>
    </View>
  );
}

export function PostChoiceGroup({ label, options, value, onChange }: PostChoiceGroupProps) {
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

export function PostButton({
  label,
  onPress,
  variant = 'primary',
  leftIcon,
  rightIcon,
  disabled = false,
}: PostButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
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

export function PostStatusBadge({ status }: { status: string }) {
  const tone = postStatusStyles[status as PostStatus] ?? postStatusStyles.ACTIVE;

  return (
    <View style={[styles.badge, tone.surface]}>
      <Text style={[styles.badgeText, tone.text]}>{status}</Text>
    </View>
  );
}

export function PostVisibilityBadge({ visibility }: { visibility: string }) {
  const tone =
    postVisibilityStyles[visibility as PostVisibility] ?? postVisibilityStyles.PUBLIC;

  return (
    <View style={[styles.badge, tone.surface]}>
      <Text style={[styles.badgeText, tone.text]}>{visibility}</Text>
    </View>
  );
}

export function PostMetaRow({
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

export function PostInlineLink({
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

const postStatusStyles = {
  ACTIVE: {
    surface: { backgroundColor: '#E4F7EB' },
    text: { color: authPalette.primaryDark },
  },
  UNDER_REVIEW: {
    surface: { backgroundColor: '#FFF1D8' },
    text: { color: '#9A6500' },
  },
  HIDDEN: {
    surface: { backgroundColor: '#EEF2EF' },
    text: { color: '#5B675D' },
  },
  REMOVED: {
    surface: { backgroundColor: '#FDE7E6' },
    text: { color: '#AE3F3A' },
  },
};

const postVisibilityStyles = {
  PUBLIC: {
    surface: { backgroundColor: '#EEF2EF' },
    text: { color: '#5B675D' },
  },
  VOLUNTEERS_ONLY: {
    surface: { backgroundColor: '#D8F8E7' },
    text: { color: authPalette.primaryDark },
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
  },
  fieldShellMultiline: {
    paddingTop: 14,
    paddingBottom: 14,
  },
  fieldInput: {
    minHeight: 56,
    color: authPalette.text,
    fontSize: 15,
    fontFamily: Fonts.rounded,
  },
  fieldInputMultiline: {
    minHeight: 132,
    textAlignVertical: 'top',
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
    opacity: 0.5,
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
  badge: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  badgeText: {
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

// ─────────────────────────────────────────────────────────────
// Loading & Error states
// ─────────────────────────────────────────────────────────────

export function PostLoading({ message = 'Loading…' }: { message?: string }) {
  return (
    <View style={extraStyles.loadingContainer}>
      <ActivityIndicator size="large" color={authPalette.primaryDark} />
      <Text style={extraStyles.loadingText}>{message}</Text>
    </View>
  );
}

export function PostError({
  message = 'Something went wrong.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={extraStyles.errorContainer}>
      <View style={extraStyles.errorIcon}>
        <Feather name="alert-circle" size={24} color="#AE3F3A" />
      </View>
      <Text style={extraStyles.errorText}>{message}</Text>
      {onRetry ? (
        <PostButton label="Retry" onPress={onRetry} variant="outline" />
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Reaction Bar
// ─────────────────────────────────────────────────────────────

const REACTION_TYPES: PostReactionType[] = ['LIKE', 'LOVE', 'CARE', 'SAD', 'WOW'];

export function PostReactionBar({
  countByType,
  totalCount,
  myReaction,
  onReactionPress,
}: {
  countByType: Record<string, number>;
  totalCount: number;
  myReaction: PostReactionType | null;
  onReactionPress: (type: PostReactionType) => void;
}) {
  return (
    <View style={extraStyles.reactionBar}>
      <View style={extraStyles.reactionChips}>
        {REACTION_TYPES.map((type) => {
          const count = countByType[type] ?? 0;
          const active = myReaction === type;

          return (
            <Pressable
              key={type}
              accessibilityRole="button"
              onPress={() => onReactionPress(type)}
              style={[
                extraStyles.reactionChip,
                active && extraStyles.reactionChipActive,
              ]}>
              <Text style={extraStyles.reactionEmoji}>{reactionEmojis[type]}</Text>
              {count > 0 ? (
                <Text
                  style={[
                    extraStyles.reactionCount,
                    active && extraStyles.reactionCountActive,
                  ]}>
                  {count}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {totalCount > 0 ? (
        <Text style={extraStyles.reactionTotal}>{totalCount} reactions</Text>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Comment components
// ─────────────────────────────────────────────────────────────

export function PostCommentBubble({
  userName,
  content,
  createdAt,
  isOwn,
  onEdit,
  onDelete,
  onReply,
  isReply,
}: {
  userName: string;
  content: string;
  createdAt: string;
  isOwn: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onReply?: () => void;
  isReply?: boolean;
}) {
  return (
    <View style={[extraStyles.commentBubble, isReply && extraStyles.commentReply]}>
      <View style={extraStyles.commentHeader}>
        <View style={extraStyles.commentAvatar}>
          <Text style={extraStyles.commentAvatarText}>
            {userName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={extraStyles.commentMeta}>
          <Text style={extraStyles.commentUser}>{userName}</Text>
          <Text style={extraStyles.commentTime}>{createdAt}</Text>
        </View>
      </View>
      <Text style={extraStyles.commentContent}>{content}</Text>
      <View style={extraStyles.commentActions}>
        {onReply ? (
          <Pressable accessibilityRole="button" onPress={onReply} style={extraStyles.commentAction}>
            <Feather name="corner-down-right" size={13} color={authPalette.primaryDark} />
            <Text style={extraStyles.commentActionText}>Reply</Text>
          </Pressable>
        ) : null}
        {isOwn && onEdit ? (
          <Pressable accessibilityRole="button" onPress={onEdit} style={extraStyles.commentAction}>
            <Feather name="edit-2" size={13} color={authPalette.muted} />
            <Text style={[extraStyles.commentActionText, { color: authPalette.muted }]}>Edit</Text>
          </Pressable>
        ) : null}
        {isOwn && onDelete ? (
          <Pressable accessibilityRole="button" onPress={onDelete} style={extraStyles.commentAction}>
            <Feather name="trash-2" size={13} color="#AE3F3A" />
            <Text style={[extraStyles.commentActionText, { color: '#AE3F3A' }]}>Delete</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function PostCommentInput({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Write a comment…',
  submitLabel = 'Post',
  loading,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  submitLabel?: string;
  loading?: boolean;
}) {
  return (
    <View style={extraStyles.commentInputRow}>
      <View style={extraStyles.commentInputShell}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#93A095"
          style={extraStyles.commentInput}
          multiline
        />
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onSubmit}
        disabled={loading || value.trim().length === 0}
        style={[
          extraStyles.commentSendButton,
          (loading || value.trim().length === 0) && extraStyles.commentSendDisabled,
        ]}>
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Feather name="send" size={16} color="#FFFFFF" />
        )}
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Media Gallery
// ─────────────────────────────────────────────────────────────

export function PostMediaGallery({
  items,
}: {
  items: { mediaId: string; fileUrl: string; fileType: string; altText: string | null }[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <View style={extraStyles.mediaGallery}>
      {items.map((item) => (
        <View key={item.mediaId} style={extraStyles.mediaItem}>
          {item.fileType === 'IMAGE' ? (
            <Image
              source={{ uri: item.fileUrl }}
              style={extraStyles.mediaImage}
              resizeMode="cover"
              accessibilityLabel={item.altText ?? 'Post image'}
            />
          ) : (
            <View style={extraStyles.mediaPlaceholder}>
              <Feather
                name={
                  item.fileType === 'VIDEO'
                    ? 'video'
                    : item.fileType === 'AUDIO'
                      ? 'headphones'
                      : 'file'
                }
                size={24}
                color={authPalette.primaryDark}
              />
              <Text style={extraStyles.mediaFileName}>{item.altText ?? 'Attachment'}</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

export function PostMockMediaPicker({
  selected,
  onToggle,
}: {
  selected: boolean;
  onToggle: (val: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onToggle(!selected)}
      style={[extraStyles.mockPicker, selected && extraStyles.mockPickerActive]}>
      <View style={[extraStyles.mockPickerIcon, selected && extraStyles.mockPickerIconActive]}>
        <Feather name="image" size={20} color={selected ? '#FFFFFF' : authPalette.primaryDark} />
      </View>
      <View style={extraStyles.mockPickerText}>
        <Text style={extraStyles.mockPickerTitle}>Attach Mock Image</Text>
        <Text style={extraStyles.mockPickerSub}>
          {selected ? 'Fake image selected' : 'Tap to add a placeholder image'}
        </Text>
      </View>
      <View style={[extraStyles.mockPickerCheck, selected && extraStyles.mockPickerCheckActive]}>
        {selected ? <Feather name="check" size={14} color={authPalette.primaryDark} /> : null}
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────
// Extra styles
// ─────────────────────────────────────────────────────────────

const extraStyles = StyleSheet.create({
  /* Loading / Error */
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 14,
  },
  loadingText: {
    fontSize: 14,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 14,
  },
  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FDE7E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
    lineHeight: 22,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  /* Reactions */
  reactionBar: {
    gap: 10,
  },
  reactionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F0F5F1',
    borderWidth: 1.2,
    borderColor: '#E2EAE3',
  },
  reactionChipActive: {
    backgroundColor: '#E4F7EB',
    borderColor: '#97EFC8',
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 13,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  reactionCountActive: {
    color: authPalette.primaryDark,
  },
  reactionTotal: {
    fontSize: 12,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },

  /* Comments */
  commentBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#0F4B34',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  commentReply: {
    marginLeft: 28,
    backgroundColor: '#F7FBF8',
    borderLeftWidth: 2,
    borderLeftColor: '#BDE7CF',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#D8F8E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: 13,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
  commentMeta: {
    flex: 1,
    gap: 2,
  },
  commentUser: {
    fontSize: 13,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  commentTime: {
    fontSize: 11,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 21,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 12,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  commentInputShell: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2EF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  commentInput: {
    fontSize: 14,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    maxHeight: 80,
  },
  commentSendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: authPalette.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentSendDisabled: {
    opacity: 0.45,
  },

  /* Media Gallery */
  mediaGallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mediaItem: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  mediaImage: {
    width: 140,
    height: 140,
    borderRadius: 14,
    backgroundColor: '#EEF2EF',
  },
  mediaPlaceholder: {
    width: 140,
    height: 100,
    borderRadius: 14,
    backgroundColor: '#F0F5F1',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
  },
  mediaFileName: {
    fontSize: 11,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    textAlign: 'center',
  },

  /* Mock Picker */
  mockPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E6EBE6',
    backgroundColor: '#FAFCFA',
  },
  mockPickerActive: {
    borderColor: '#97EFC8',
    backgroundColor: '#F0FAF5',
  },
  mockPickerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F4EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockPickerIconActive: {
    backgroundColor: authPalette.primaryDark,
  },
  mockPickerText: {
    flex: 1,
    gap: 2,
  },
  mockPickerTitle: {
    fontSize: 15,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  mockPickerSub: {
    fontSize: 13,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  mockPickerCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C6D1C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockPickerCheckActive: {
    borderColor: '#97EFC8',
    backgroundColor: '#BDF6D7',
  },
});
