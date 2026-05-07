import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/components/auth/auth-provider';
import { authPalette } from '@/components/auth/auth-ui';
import {
  attachMediaToPost,
  createMediaRecord,
  createPost,
  type PostVisibility,
} from '@/components/post/post-api';
import {
  PostButton,
  PostCard,
  PostChoiceGroup,
  PostError,
  PostLoading,
  PostScreen,
  PostSection,
} from '@/components/post/post-ui';
import {
  getMySupportRequests,
  type SupportRequestSummary,
} from '@/components/support-request/request-api';
import { Fonts } from '@/constants/theme';

export default function PostCreateScreen() {
  const router = useRouter();
  const { session } = useAuth();

  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('PUBLIC');
  const [supportRequestId, setSupportRequestId] = useState<string>('');
  const [supportRequests, setSupportRequests] = useState<SupportRequestSummary[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [attachMockMedia, setAttachMockMedia] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRequests() {
      if (!session?.accessToken) return;
      try {
        const data = await getMySupportRequests(session.accessToken);
        setSupportRequests(data);
        if (data.length > 0) {
          setSupportRequestId(data[0].id);
        }
      } catch {
        // Support requests are optional, silently ignore
      } finally {
        setLoadingRequests(false);
      }
    }
    loadRequests();
  }, [session?.accessToken]);

  const handleCreate = useCallback(async () => {
    if (!session?.accessToken || content.trim().length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const newPost = await createPost(session.accessToken, {
        content: content.trim(),
        visibility,
        supportRequestId: supportRequestId || null,
      });

      if (attachMockMedia) {
        const mediaRecord = await createMediaRecord(session.accessToken, {
          fileName: 'mock-image.jpg',
          fileUrl: 'https://picsum.photos/seed/' + newPost.id + '/800/600',
          fileType: 'IMAGE',
          mimeType: 'image/jpeg',
          fileSize: 102400,
          altText: 'Mock random image',
          isPublic: visibility === 'PUBLIC',
        });
        
        await attachMediaToPost(session.accessToken, newPost.id, {
          mediaId: mediaRecord.id,
          displayOrder: 1,
        });
      }

      router.push(`/post-detail?id=${newPost.id}`);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create post.');
      Alert.alert('Error', err?.message ?? 'Failed to create post.');
    } finally {
      setSubmitting(false);
    }
  }, [session?.accessToken, content, visibility, supportRequestId, attachMockMedia, router]);

  const toggleVisibility = () => {
    setVisibility((prev) => (prev === 'PUBLIC' ? 'VOLUNTEERS_ONLY' : 'PUBLIC'));
  };

  return (
    <PostScreen title="Create Post" onBackPress={() => router.push('/(tabs)/posts')}>
      <PostCard>
        <View style={styles.composerHeader}>
          <Text style={styles.composerTitle}>Create Post</Text>
          <Pressable
            accessibilityRole="button"
            onPress={toggleVisibility}
            style={styles.privacyButton}>
            <Feather
              name={visibility === 'PUBLIC' ? 'globe' : 'users'}
              size={14}
              color={authPalette.muted}
            />
            <Text style={styles.privacyText}>
              {visibility === 'PUBLIC' ? 'Public' : 'Volunteers'}
            </Text>
            <Feather name="chevron-down" size={14} color={authPalette.muted} />
          </Pressable>
        </View>

        <TextInput
          multiline
          placeholder="What's on your mind?"
          placeholderTextColor="#93A095"
          value={content}
          onChangeText={setContent}
          style={styles.composerInput}
        />

        {attachMockMedia ? (
          <View style={styles.mediaPreview}>
            <Feather name="image" size={32} color={authPalette.muted} />
            <Text style={styles.mediaPreviewText}>Mock Image Attached</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setAttachMockMedia(false)}
              style={styles.mediaRemoveBtn}>
              <Feather name="x" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setAttachMockMedia(!attachMockMedia)}
            style={styles.actionIconBtn}>
            <Feather
              name="image"
              size={24}
              color={attachMockMedia ? authPalette.primaryDark : authPalette.muted}
            />
          </Pressable>
        </View>
      </PostCard>

      {loadingRequests ? (
        <PostLoading message="Loading support requests…" />
      ) : supportRequests.length > 0 ? (
        <PostSection title="Related Request (optional)">
          <PostChoiceGroup
            label="Request"
            onChange={setSupportRequestId}
            options={supportRequests.map((item) => ({
              label: item.title,
              value: item.id,
            }))}
            value={supportRequestId}
          />
        </PostSection>
      ) : null}

      {error ? <PostError message={error} /> : null}

      <View style={styles.buttonStack}>
        <PostButton
          label={submitting ? 'Posting…' : 'Post'}
          onPress={handleCreate}
          disabled={content.trim().length === 0 || submitting}
        />
        <PostButton
          label="Cancel"
          onPress={() => router.push('/(tabs)/posts')}
          variant="outline"
        />
      </View>
    </PostScreen>
  );
}

const styles = StyleSheet.create({
  composerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  composerTitle: {
    fontSize: 16,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontWeight: 'bold',
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF2ED',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  privacyText: {
    fontSize: 13,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  composerInput: {
    minHeight: 120,
    fontSize: 16,
    lineHeight: 24,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    textAlignVertical: 'top',
  },
  mediaPreview: {
    height: 160,
    borderRadius: 14,
    backgroundColor: '#F0F5F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  mediaPreviewText: {
    marginTop: 10,
    fontSize: 13,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  mediaRemoveBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E6EBE6',
    marginVertical: 14,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconBtn: {
    padding: 4,
  },
  buttonStack: {
    gap: 12,
    marginTop: 10,
  },
});
