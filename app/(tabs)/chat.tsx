import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import {
  connectChatRealtime,
  createPrivateConversationByEmail,
  formatChatDateTime,
  getConversationById,
  getConversationMessages,
  getConversationSubtitle,
  getConversationTitle,
  getInitials,
  getMyConversations,
  markMessageAsRead,
  sendConversationMessage,
  type ChatMessage,
  type ConversationSummary,
  type RealtimeStatus,
} from '@/components/chat/chat-api';
import { Fonts } from '@/constants/theme';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function upsertMessage(messages: ChatMessage[], nextMessage: ChatMessage) {
  const exists = messages.some((message) => message.id === nextMessage.id);

  if (exists) {
    return messages.map((message) => (message.id === nextMessage.id ? nextMessage : message));
  }

  return [...messages, nextMessage].sort(
    (left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt)
  );
}

function moveConversationToTop(
  conversations: ConversationSummary[],
  conversationId: string,
  updater: (conversation: ConversationSummary) => ConversationSummary
) {
  const target = conversations.find((conversation) => conversation.id === conversationId);

  if (!target) {
    return conversations;
  }

  const updatedTarget = updater(target);
  return [updatedTarget, ...conversations.filter((conversation) => conversation.id !== conversationId)];
}

export default function ChatTabScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const requestedConversationId = getStringParam(params.conversationId);
  const { width } = useWindowDimensions();
  const { isAuthenticated, session, user } = useAuth();
  const isWide = width >= 760;

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>({});
  const [messageDraft, setMessageDraft] = useState('');
  const [newChatEmail, setNewChatEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('disconnected');

  const selectedConversationIdRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const conversationsRef = useRef<ConversationSummary[]>([]);
  const messageScrollRef = useRef<ScrollView>(null);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );
  const selectedMessages = selectedConversationId
    ? messagesByConversation[selectedConversationId] ?? []
    : [];

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    if (!requestedConversationId) {
      return;
    }

    setSelectedConversationId(requestedConversationId);
  }, [requestedConversationId]);

  useEffect(() => {
    if (!session?.accessToken || !requestedConversationId) {
      return;
    }

    if (conversations.some((conversation) => conversation.id === requestedConversationId)) {
      return;
    }

    let isActive = true;

    getConversationById(session.accessToken, requestedConversationId)
      .then((conversation) => {
        if (!isActive) {
          return;
        }

        setConversations((current) => {
          if (current.some((item) => item.id === conversation.id)) {
            return current;
          }

          return [conversation, ...current];
        });
      })
      .catch(() => {});

    return () => {
      isActive = false;
    };
  }, [conversations, requestedConversationId, session?.accessToken]);

  const markConversationRead = useCallback(
    async (conversationId: string, message: ChatMessage | undefined) => {
      if (!session?.accessToken || !message || message.senderId === userIdRef.current) {
        return;
      }

      try {
        await markMessageAsRead(session.accessToken, conversationId, message.id);
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
          )
        );
      } catch {
        // Keep chat usable if read receipts fail.
      }
    },
    [session?.accessToken]
  );

  const fetchChatData = useCallback(async () => {
    if (!session?.accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const conversationData = await getMyConversations(session.accessToken);

      setConversations(conversationData);
      setSelectedConversationId((currentId) => {
        if (currentId && conversationData.some((conversation) => conversation.id === currentId)) {
          return currentId;
        }

        return null;
      });
    } catch (loadError: any) {
      setError(loadError?.message ?? 'Could not load chat.');
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchChatData();
    }
  }, [fetchChatData, isAuthenticated]);

  useEffect(() => {
    if (!session?.accessToken || !selectedConversationId) {
      return;
    }

    let isActive = true;
    const accessToken = session.accessToken;
    const conversationId = selectedConversationId;

    async function loadMessages() {
      setIsMessagesLoading(true);
      setError(null);

      try {
        const messages = await getConversationMessages(accessToken, conversationId);

        if (!isActive) {
          return;
        }

        setMessagesByConversation((current) => ({
          ...current,
          [conversationId]: messages,
        }));

        const lastMessage = messages[messages.length - 1];

        if (lastMessage) {
          setConversations((current) =>
            current.map((conversation) =>
              conversation.id === conversationId
                ? {
                    ...conversation,
                    lastMessageId: lastMessage.id,
                    unreadCount: 0,
                  }
                : conversation
              )
          );
          markConversationRead(conversationId, lastMessage);
        }
      } catch (loadError: any) {
        if (isActive) {
          setError(loadError?.message ?? 'Could not load messages.');
        }
      } finally {
        if (isActive) {
          setIsMessagesLoading(false);
        }
      }
    }

    loadMessages();

    return () => {
      isActive = false;
    };
  }, [markConversationRead, selectedConversationId, session?.accessToken]);

  useEffect(() => {
    if (!session?.accessToken) {
      setRealtimeStatus('disconnected');
      return;
    }

    const connection = connectChatRealtime(session.accessToken, {
      onError(message) {
        setError((current) => current ?? message);
      },
      onMessage(payload) {
        const nextMessage = payload.message;
        const isOpenConversation = selectedConversationIdRef.current === nextMessage.conversationId;
        const isMine = nextMessage.senderId === userIdRef.current;

        setMessagesByConversation((current) => ({
          ...current,
          [nextMessage.conversationId]: upsertMessage(
            current[nextMessage.conversationId] ?? [],
            nextMessage
          ),
        }));

        setConversations((current) => {
          const hasConversation = current.some(
            (conversation) => conversation.id === nextMessage.conversationId
          );

          if (!hasConversation) {
            return current;
          }

          return moveConversationToTop(current, nextMessage.conversationId, (conversation) => ({
            ...conversation,
            lastMessageId: nextMessage.id,
            unreadCount: isOpenConversation || isMine ? 0 : (conversation.unreadCount ?? 0) + 1,
          }));
        });

        if (
          !conversationsRef.current.some(
            (conversation) => conversation.id === nextMessage.conversationId
          )
        ) {
          getConversationById(session.accessToken, nextMessage.conversationId)
            .then((conversation) => {
              setConversations((current) => {
                if (current.some((item) => item.id === conversation.id)) {
                  return current;
                }

                return [conversation, ...current];
              });
            })
            .catch(() => {});
        }

        if (isOpenConversation && !isMine) {
          markConversationRead(nextMessage.conversationId, nextMessage);
        }
      },
      onStatusChange(status) {
        setRealtimeStatus(status);
      },
    }, {
      messages: true,
      notifications: false,
    });

    return () => {
      connection.disconnect();
    };
  }, [markConversationRead, session?.accessToken]);

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    const timeout = setTimeout(() => {
      messageScrollRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timeout);
  }, [selectedConversationId, selectedMessages.length]);

  async function handleSendMessage() {
    const content = messageDraft.trim();

    if (!session?.accessToken || !selectedConversationId || !content || isSending) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const sentMessage = await sendConversationMessage(
        session.accessToken,
        selectedConversationId,
        content
      );

      setMessageDraft('');
      setMessagesByConversation((current) => ({
        ...current,
        [selectedConversationId]: upsertMessage(
          current[selectedConversationId] ?? [],
          sentMessage
        ),
      }));
      setConversations((current) =>
        moveConversationToTop(current, selectedConversationId, (conversation) => ({
          ...conversation,
          lastMessageId: sentMessage.id,
          unreadCount: 0,
        }))
      );
    } catch (sendError: any) {
      setError(sendError?.message ?? 'Could not send message.');
    } finally {
      setIsSending(false);
    }
  }

  async function handleCreatePrivateConversation() {
    const receiverEmail = newChatEmail.trim();

    if (!session?.accessToken || !receiverEmail || isCreatingChat) {
      return;
    }

    setIsCreatingChat(true);
    setError(null);

    try {
      const conversation = await createPrivateConversationByEmail(
        session.accessToken,
        receiverEmail
      );

      setConversations((current) => [
        conversation,
        ...current.filter((item) => item.id !== conversation.id),
      ]);
      setNewChatEmail('');
      setSelectedConversationId(conversation.id);
    } catch (createError: any) {
      setError(createError?.message ?? 'Could not start chat.');
    } finally {
      setIsCreatingChat(false);
    }
  }

  function handleConversationPress(conversationId: string) {
    setSelectedConversationId(conversationId);
  }

  const selectedTitle = selectedConversation
    ? getConversationTitle(selectedConversation, user?.id)
    : 'Conversation';

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.authRequired}>
          <View style={styles.authIcon}>
            <Feather name="lock" size={24} color={authPalette.primaryDark} />
          </View>
          <Text style={styles.authTitle}>Login required</Text>
          <Text style={styles.authText}>Chat is available after login.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/login')}
            style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Chat</Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  realtimeStatus === 'connected' && styles.statusDotConnected,
                  realtimeStatus === 'connecting' && styles.statusDotConnecting,
                ]}
              />
              <Text style={styles.statusText}>
                {realtimeStatus === 'connected'
                  ? 'Live'
                  : realtimeStatus === 'connecting'
                    ? 'Connecting'
                    : 'Offline'}
              </Text>
            </View>
          </View>
          <Pressable accessibilityRole="button" onPress={fetchChatData} style={styles.iconButton}>
            <Feather name="refresh-cw" size={19} color={authPalette.primaryDark} />
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={16} color="#AE3F3A" />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => setError(null)}>
              <Feather name="x" size={18} color="#AE3F3A" />
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.chatLayout, isWide && styles.chatLayoutWide]}>
          {isWide || !selectedConversation ? (
            <ConversationList
              conversations={conversations}
              currentUserId={user?.id}
              isCreatingChat={isCreatingChat}
              isLoading={isLoading}
              newChatEmail={newChatEmail}
              onCreateChat={handleCreatePrivateConversation}
              onConversationPress={handleConversationPress}
              onNewChatEmailChange={setNewChatEmail}
              selectedConversationId={selectedConversationId}
            />
          ) : null}

          {isWide || selectedConversation ? (
            <View style={[styles.threadPanel, isWide && styles.threadPanelWide]}>
                {selectedConversation ? (
                  <>
                    <View style={styles.threadHeader}>
                      {!isWide ? (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setSelectedConversationId(null)}
                          style={styles.threadBackButton}>
                          <Feather name="arrow-left" size={20} color={authPalette.primaryDark} />
                        </Pressable>
                      ) : null}
                      <View style={styles.threadAvatar}>
                        <Text style={styles.threadAvatarText}>{getInitials(selectedTitle)}</Text>
                      </View>
                      <View style={styles.threadTitleWrap}>
                        <Text style={styles.threadTitle} numberOfLines={1}>
                          {selectedTitle}
                        </Text>
                        <Text style={styles.threadSubtitle} numberOfLines={1}>
                          {getConversationSubtitle(selectedConversation, user?.id)}
                        </Text>
                      </View>
                    </View>

                    <ScrollView
                      ref={messageScrollRef}
                      contentContainerStyle={styles.messagesContent}
                      showsVerticalScrollIndicator={false}
                      style={styles.messagesScroll}>
                      {isMessagesLoading ? (
                        <Text style={styles.helperText}>Loading messages...</Text>
                      ) : null}

                      {!isMessagesLoading && selectedMessages.length === 0 ? (
                        <View style={styles.emptyState}>
                          <Feather name="message-square" size={34} color="#AEBAB0" />
                          <Text style={styles.emptyTitle}>No messages yet</Text>
                        </View>
                      ) : null}

                      {selectedMessages.map((message) => {
                        const isMine = message.senderId === user?.id;

                        return (
                          <View
                            key={message.id}
                            style={[
                              styles.messageRow,
                              isMine ? styles.messageRowMine : styles.messageRowOther,
                            ]}>
                            <View
                              style={[
                                styles.messageBubble,
                                isMine ? styles.messageBubbleMine : styles.messageBubbleOther,
                              ]}>
                              {!isMine ? (
                                <Text style={styles.messageSender}>{message.senderName}</Text>
                              ) : null}
                              <Text
                                style={[
                                  styles.messageText,
                                  isMine && styles.messageTextMine,
                                ]}>
                                {message.content ?? 'Attachment'}
                              </Text>
                              <Text
                                style={[
                                  styles.messageTime,
                                  isMine && styles.messageTimeMine,
                                ]}>
                                {formatChatDateTime(message.createdAt)}
                                {message.editedAt ? ' - edited' : ''}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </ScrollView>

                    <View style={styles.composer}>
                      <TextInput
                        multiline
                        onChangeText={setMessageDraft}
                        placeholder="Message"
                        placeholderTextColor="#91A094"
                        style={styles.composerInput}
                        value={messageDraft}
                      />
                      <Pressable
                        accessibilityRole="button"
                        disabled={!messageDraft.trim() || isSending}
                        onPress={handleSendMessage}
                        style={[
                          styles.sendButton,
                          (!messageDraft.trim() || isSending) && styles.sendButtonDisabled,
                        ]}>
                        <Feather name="send" size={18} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <View style={styles.threadEmpty}>
                    <Feather name="message-circle" size={38} color="#AEBAB0" />
                    <Text style={styles.emptyTitle}>Select a conversation</Text>
                  </View>
                )}
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ConversationList({
  conversations,
  currentUserId,
  isCreatingChat,
  isLoading,
  newChatEmail,
  onCreateChat,
  onConversationPress,
  onNewChatEmailChange,
  selectedConversationId,
}: {
  conversations: ConversationSummary[];
  currentUserId?: string | null;
  isCreatingChat: boolean;
  isLoading: boolean;
  newChatEmail: string;
  onCreateChat: () => void;
  onConversationPress: (conversationId: string) => void;
  onNewChatEmailChange: (value: string) => void;
  selectedConversationId: string | null;
}) {
  return (
    <View style={styles.listPanel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Conversations</Text>
        <Text style={styles.panelMeta}>{conversations.length}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <View style={styles.newChatCard}>
          <View style={styles.newChatField}>
            <Feather name="mail" size={16} color={authPalette.muted} />
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={onNewChatEmailChange}
              onSubmitEditing={onCreateChat}
              placeholder="Receiver email"
              placeholderTextColor="#91A094"
              returnKeyType="send"
              style={styles.newChatInput}
              value={newChatEmail}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={!newChatEmail.trim() || isCreatingChat}
            onPress={onCreateChat}
            style={[
              styles.newChatButton,
              (!newChatEmail.trim() || isCreatingChat) && styles.newChatButtonDisabled,
            ]}>
            <Feather name="plus" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        {isLoading ? <Text style={styles.helperText}>Loading chats...</Text> : null}

        {!isLoading && conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="inbox" size={34} color="#AEBAB0" />
            <Text style={styles.emptyTitle}>No conversations</Text>
            <Text style={styles.emptyBody}>Accepted volunteer matches will appear here.</Text>
          </View>
        ) : null}

        {conversations.map((conversation) => {
          const title = getConversationTitle(conversation, currentUserId);
          const isSelected = conversation.id === selectedConversationId;

          return (
            <Pressable
              accessibilityRole="button"
              key={conversation.id}
              onPress={() => onConversationPress(conversation.id)}
              style={[styles.conversationCard, isSelected && styles.conversationCardActive]}>
              <View style={styles.conversationAvatar}>
                <Text style={styles.conversationAvatarText}>{getInitials(title)}</Text>
              </View>
              <View style={styles.conversationText}>
                <View style={styles.conversationTopLine}>
                  <Text style={styles.conversationTitle} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text style={styles.conversationTime}>
                    {formatChatDateTime(conversation.createdAt)}
                  </Text>
                </View>
                <Text style={styles.conversationSubtitle} numberOfLines={1}>
                  {getConversationSubtitle(conversation, currentUserId)}
                </Text>
              </View>
              {conversation.unreadCount > 0 ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{conversation.unreadCount}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6FAF6',
  },
  keyboard: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 88,
    gap: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 5,
  },
  title: {
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontSize: 30,
    lineHeight: 36,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  statusDot: {
    backgroundColor: '#D0D7D2',
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  statusDotConnected: {
    backgroundColor: authPalette.primaryDark,
  },
  statusDotConnecting: {
    backgroundColor: authPalette.amber,
  },
  statusText: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 13,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#ECF5EF',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  segment: {
    backgroundColor: '#EAF0EB',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 6,
    padding: 4,
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 10,
  },
  segmentButtonActive: {
    backgroundColor: authPalette.primaryDark,
  },
  segmentText: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 14,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  segmentBadge: {
    alignItems: 'center',
    backgroundColor: authPalette.coral,
    borderRadius: 8,
    minWidth: 18,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  segmentBadgeText: {
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
    fontSize: 11,
  },
  errorBanner: {
    alignItems: 'center',
    backgroundColor: '#FDE7E6',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    color: '#AE3F3A',
    flex: 1,
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 18,
  },
  chatLayout: {
    flex: 1,
    gap: 12,
  },
  chatLayoutWide: {
    flexDirection: 'row',
  },
  listPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E3EAE4',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  panelHeader: {
    alignItems: 'center',
    borderBottomColor: '#EDF2EE',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  panelTitle: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 17,
  },
  panelSubtitle: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 12,
    marginTop: 3,
  },
  panelMeta: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 13,
  },
  listContent: {
    gap: 8,
    padding: 10,
  },
  newChatCard: {
    alignItems: 'center',
    backgroundColor: '#F7FBF8',
    borderColor: '#DCE6DF',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 9,
  },
  newChatField: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E3EAE4',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 11,
  },
  newChatInput: {
    color: authPalette.text,
    flex: 1,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    minHeight: 40,
    minWidth: 0,
  },
  newChatButton: {
    alignItems: 'center',
    backgroundColor: authPalette.primaryDark,
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  newChatButtonDisabled: {
    opacity: 0.45,
  },
  conversationCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#EDF2EE',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 74,
    padding: 10,
  },
  conversationCardActive: {
    backgroundColor: '#F0FAF5',
    borderColor: '#A8E9C4',
  },
  conversationAvatar: {
    alignItems: 'center',
    backgroundColor: '#E4F7EB',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  conversationAvatarText: {
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontSize: 14,
  },
  conversationText: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  conversationTopLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  conversationTitle: {
    color: authPalette.text,
    flex: 1,
    fontFamily: Fonts.rounded,
    fontSize: 15,
  },
  conversationTime: {
    color: '#849085',
    fontFamily: Fonts.rounded,
    fontSize: 11,
  },
  conversationSubtitle: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 12,
  },
  unreadBadge: {
    alignItems: 'center',
    backgroundColor: authPalette.coral,
    borderRadius: 9,
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
    fontSize: 11,
  },
  threadPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E3EAE4',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  threadPanelWide: {
    flex: 1.4,
  },
  threadHeader: {
    alignItems: 'center',
    borderBottomColor: '#EDF2EE',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 64,
    paddingHorizontal: 12,
  },
  threadBackButton: {
    alignItems: 'center',
    backgroundColor: '#ECF5EF',
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  threadAvatar: {
    alignItems: 'center',
    backgroundColor: '#E4F7EB',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  threadAvatarText: {
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontSize: 13,
  },
  threadTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  threadTitle: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 16,
  },
  threadSubtitle: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 12,
    marginTop: 3,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    gap: 10,
    padding: 14,
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    borderRadius: 8,
    maxWidth: '82%',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  messageBubbleMine: {
    backgroundColor: authPalette.primaryDark,
  },
  messageBubbleOther: {
    backgroundColor: '#EFF4F0',
  },
  messageSender: {
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontSize: 11,
    marginBottom: 4,
  },
  messageText: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMine: {
    color: '#FFFFFF',
  },
  messageTime: {
    color: '#7D8980',
    fontFamily: Fonts.rounded,
    fontSize: 10,
    marginTop: 5,
  },
  messageTimeMine: {
    color: '#D8F8E7',
  },
  composer: {
    alignItems: 'flex-end',
    borderTopColor: '#EDF2EE',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 10,
  },
  composerInput: {
    backgroundColor: '#F2F7F3',
    borderRadius: 8,
    color: authPalette.text,
    flex: 1,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    maxHeight: 104,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: authPalette.primaryDark,
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  notificationsPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E3EAE4',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  notificationList: {
    gap: 9,
    padding: 10,
  },
  notificationCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#EDF2EE',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    minHeight: 70,
    padding: 11,
  },
  notificationCardUnread: {
    backgroundColor: '#F0FAF5',
    borderColor: '#A8E9C4',
  },
  notificationIcon: {
    alignItems: 'center',
    backgroundColor: '#E4F7EB',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  notificationText: {
    flex: 1,
    minWidth: 0,
  },
  notificationContent: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    lineHeight: 20,
  },
  notificationTime: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 11,
    marginTop: 5,
  },
  notificationUnreadDot: {
    backgroundColor: authPalette.coral,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#ECF5EF',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 10,
  },
  secondaryButtonDisabled: {
    opacity: 0.45,
  },
  secondaryButtonText: {
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 44,
  },
  emptyTitle: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 16,
  },
  emptyBody: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  helperText: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 19,
    padding: 12,
  },
  threadEmpty: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
  },
  authRequired: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  authIcon: {
    alignItems: 'center',
    backgroundColor: '#E4F7EB',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  authTitle: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 20,
  },
  authText: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: authPalette.primaryDark,
    borderRadius: 8,
    marginTop: 8,
    minHeight: 44,
    minWidth: 110,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
    fontSize: 15,
  },
});
