import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { useAuth } from '@/components/auth/auth-provider';
import {
  getPostById,
  updatePost,
  type PostDetail,
  type PostVisibility,
} from '@/components/post/post-api';
import {
  PostButton,
  PostChoiceGroup,
  PostError,
  PostField,
  PostLoading,
  PostScreen,
  PostSection,
  PostStatusBadge,
  PostVisibilityBadge,
} from '@/components/post/post-ui';
import {
  getMySupportRequests,
  type SupportRequestSummary,
} from '@/components/support-request/request-api';

const visibilityOptions = [
  { label: 'Public', value: 'PUBLIC', detail: 'Visible to everyone in the app' },
  {
    label: 'Volunteers Only',
    value: 'VOLUNTEERS_ONLY',
    detail: 'Visible only to volunteer users',
  },
];

export default function PostEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('PUBLIC');
  const [supportRequestId, setSupportRequestId] = useState('');
  const [supportRequests, setSupportRequests] = useState<SupportRequestSummary[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!session?.accessToken || !id) return;

    setLoading(true);
    setError(null);

    try {
      const [postData, requestsData] = await Promise.all([
        getPostById(session.accessToken, id),
        getMySupportRequests(session.accessToken).catch(() => [] as SupportRequestSummary[]),
      ]);
      setPost(postData);
      setContent(postData.content);
      setVisibility(postData.visibility);
      setSupportRequestId(postData.supportRequestId ?? '');
      setSupportRequests(requestsData);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load post.');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = useCallback(async () => {
    if (!session?.accessToken || !id || content.trim().length === 0) return;

    setSaving(true);
    try {
      await updatePost(session.accessToken, id, {
        content: content.trim(),
        visibility,
        supportRequestId: supportRequestId || null,
      });
      router.push(`/post-detail?id=${id}`);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to update post.');
    } finally {
      setSaving(false);
    }
  }, [session?.accessToken, id, content, visibility, supportRequestId, router]);

  if (loading) {
    return (
      <PostScreen title="Edit Post" onBackPress={() => router.back()}>
        <PostLoading message="Loading post…" />
      </PostScreen>
    );
  }

  if (error || !post) {
    return (
      <PostScreen title="Edit Post" onBackPress={() => router.back()}>
        <PostError message={error ?? 'Post not found.'} onRetry={fetchData} />
      </PostScreen>
    );
  }

  return (
    <PostScreen
      title="Edit Post"
      onBackPress={() => router.push(`/post-detail?id=${id}`)}
      rightSlot={<PostStatusBadge status={post.status} />}>
      <PostSection title="Current Visibility" action={<PostVisibilityBadge visibility={visibility} />}>
        <PostChoiceGroup
          label="Visibility"
          onChange={(val) => setVisibility(val as PostVisibility)}
          options={visibilityOptions}
          value={visibility}
        />
      </PostSection>

      <PostSection title="Post Content">
        <PostField
          label="Content"
          multiline
          numberOfLines={6}
          onChangeText={setContent}
          value={content}
        />
      </PostSection>

      {supportRequests.length > 0 ? (
        <PostSection title="Related Request">
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

      <View style={styles.buttonStack}>
        <PostButton
          label={saving ? 'Saving…' : 'Save Changes'}
          onPress={handleSave}
        />
        <PostButton
          label="Cancel"
          onPress={() => router.push(`/post-detail?id=${id}`)}
          variant="outline"
        />
      </View>
    </PostScreen>
  );
}

const styles = StyleSheet.create({
  buttonStack: {
    gap: 12,
  },
});
