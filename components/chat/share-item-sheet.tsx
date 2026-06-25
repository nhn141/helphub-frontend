import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '@/components/auth/auth-provider';
import { authPalette } from '@/components/auth/auth-ui';
import {
  buildSharedItemMessage,
  getConversationSubtitle,
  getConversationTitle,
  getInitials,
  getMyConversations,
  getSharedItemLabel,
  sendConversationMessage,
  type ConversationSummary,
  type SharedItemType,
} from '@/components/chat/chat-api';
import { UserAvatar } from '@/components/user/user-avatar';
import { Fonts } from '@/constants/theme';

type ShareItemSheetProps = {
  itemId?: string | null;
  itemTitle: string;
  itemType: SharedItemType;
  onClose: () => void;
  visible: boolean;
};

export function ShareItemSheet({
  itemId,
  itemTitle,
  itemType,
  onClose,
  visible,
}: ShareItemSheetProps) {
  const { session, user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sendingConversationId, setSendingConversationId] = useState<string | null>(null);

  const itemLabel = useMemo(() => getSharedItemLabel(itemType), [itemType]);

  const loadConversations = useCallback(async () => {
    if (!visible) {
      return;
    }

    if (!session?.accessToken) {
      setError('Please sign in before sharing to chat.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await getMyConversations(session.accessToken);
      setConversations(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load conversations.');
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, visible]);

  useEffect(() => {
    if (visible) {
      void loadConversations();
    } else {
      setSendingConversationId(null);
      setError('');
    }
  }, [loadConversations, visible]);

  async function handleShare(conversationId: string) {
    if (!session?.accessToken || !itemId || sendingConversationId) {
      return;
    }

    setSendingConversationId(conversationId);
    setError('');

    try {
      await sendConversationMessage(
        session.accessToken,
        conversationId,
        buildSharedItemMessage(itemType, itemId, itemTitle)
      );
      onClose();
      Alert.alert('Shared', `This ${itemLabel} was shared to chat.`);
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : 'Could not share this item.');
    } finally {
      setSendingConversationId(null);
    }
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View style={styles.headerCopy}>
              <Text style={styles.sheetTitle}>Share to chat</Text>
              <Text numberOfLines={1} style={styles.sheetSubtitle}>
                {itemTitle || itemLabel}
              </Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={20} color={authPalette.text} />
            </Pressable>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={15} color="#AE3F3A" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={authPalette.primaryDark} />
              <Text style={styles.helperText}>Loading conversations...</Text>
            </View>
          ) : null}

          {!isLoading && conversations.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="message-circle" size={30} color="#AEBAB0" />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.helperText}>Create a chat first, then share this item.</Text>
            </View>
          ) : null}

          <ScrollView contentContainerStyle={styles.conversationList} showsVerticalScrollIndicator={false}>
            {conversations.map((conversation) => {
              const title = getConversationTitle(conversation, user?.id);
              const subtitle = getConversationSubtitle(conversation, user?.id);
              const avatarMember =
                conversation.members.find((member) => member.userId !== user?.id) ??
                conversation.members[0];
              const isSending = sendingConversationId === conversation.id;

              return (
                <Pressable
                  accessibilityRole="button"
                  disabled={Boolean(sendingConversationId)}
                  key={conversation.id}
                  onPress={() => void handleShare(conversation.id)}
                  style={[styles.conversationRow, Boolean(sendingConversationId) && styles.disabledRow]}>
                  <UserAvatar
                    fallback={getInitials(title)}
                    name={avatarMember?.fullName ?? title}
                    size={38}
                    style={styles.avatar}
                    textSize={12}
                    uri={avatarMember?.avatarUrl}
                  />
                  <View style={styles.conversationCopy}>
                    <Text numberOfLines={1} style={styles.conversationTitle}>
                      {title}
                    </Text>
                    <Text numberOfLines={1} style={styles.conversationSubtitle}>
                      {subtitle}
                    </Text>
                  </View>
                  {isSending ? (
                    <ActivityIndicator color={authPalette.primaryDark} />
                  ) : (
                    <Feather name="send" size={17} color={authPalette.primaryDark} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#E4F7EB',
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#F0F5F1',
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  conversationCopy: {
    flex: 1,
    minWidth: 0,
  },
  conversationList: {
    gap: 10,
    paddingBottom: 6,
  },
  conversationRow: {
    alignItems: 'center',
    backgroundColor: '#F8FBF9',
    borderColor: '#E2EAE4',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    minHeight: 66,
    padding: 11,
  },
  conversationSubtitle: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 12,
    marginTop: 3,
  },
  conversationTitle: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 15,
  },
  disabledRow: {
    opacity: 0.55,
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  emptyTitle: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 16,
  },
  errorBox: {
    alignItems: 'center',
    backgroundColor: '#FDE7E6',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    padding: 10,
  },
  errorText: {
    color: '#AE3F3A',
    flex: 1,
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 18,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  helperText: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 19,
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 18,
  },
  overlay: {
    backgroundColor: 'rgba(14, 27, 19, 0.42)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '78%',
    padding: 18,
    paddingBottom: 24,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  sheetSubtitle: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 13,
    marginTop: 3,
  },
  sheetTitle: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 19,
  },
});
