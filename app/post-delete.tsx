import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import {
  deletePost,
  getPostById,
  type PostDetail,
} from '@/components/post/post-api';
import {
  PostButton,
  PostCard,
  PostError,
  PostLoading,
  PostScreen,
  PostSection,
  PostStatusBadge,
  PostVisibilityBadge,
} from '@/components/post/post-ui';
import { UserAvatar } from '@/components/user/user-avatar';
import { Fonts } from '@/constants/theme';

export default function PostDeleteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!session?.accessToken || !id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getPostById(session.accessToken, id);
      setPost(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load post.');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleDelete = useCallback(async () => {
    if (!session?.accessToken || !id) return;

    Alert.alert(
      'Confirm Delete',
      'This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deletePost(session.accessToken!, id);
              router.push('/post-my');
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'Failed to delete post.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }, [session?.accessToken, id, router]);

  if (loading) {
    return (
      <PostScreen title="Delete Post" onBackPress={() => router.back()}>
        <PostLoading message="Loading post…" />
      </PostScreen>
    );
  }

  if (error || !post) {
    return (
      <PostScreen title="Delete Post" onBackPress={() => router.back()}>
        <PostError message={error ?? 'Post not found.'} onRetry={fetchPost} />
      </PostScreen>
    );
  }

  return (
    <PostScreen
      title="Delete Post"
      onBackPress={() => router.push(`/post-detail?id=${id}`)}
      rightSlot={<PostStatusBadge status={post.status} />}>
      <PostSection
        title="Post Summary"
        action={<PostVisibilityBadge visibility={post.visibility} />}>
        <PostCard>
          {post.supportRequestTitle ? (
            <Text style={styles.title}>{post.supportRequestTitle}</Text>
          ) : null}
          <Text style={styles.content} numberOfLines={3}>{post.content}</Text>
          <View style={styles.authorRow}>
            <UserAvatar
              name={post.authorName}
              size={36}
              style={styles.authorAvatar}
              textSize={14}
              uri={post.authorAvatarUrl}
            />
            <View style={styles.authorText}>
              <Text style={styles.authorLabel}>Author</Text>
              <Text style={styles.authorName} numberOfLines={1}>
                {post.authorName}
              </Text>
            </View>
          </View>
        </PostCard>
      </PostSection>

      <PostSection title="Delete Confirmation">
        <PostCard>
          <View style={styles.noticeRow}>
            <View style={styles.noticeIcon}>
              <Feather name="alert-triangle" size={18} color="#AE3F3A" />
            </View>
            <Text style={styles.noticeText}>
              Deleting this post will remove it from your updates list. This action cannot be undone.
            </Text>
          </View>
        </PostCard>
      </PostSection>

      <View style={styles.buttonStack}>
        <PostButton
          label={deleting ? 'Deleting…' : 'Delete Post'}
          onPress={handleDelete}
          variant="danger"
        />
        <PostButton
          label="Back to Detail"
          onPress={() => router.push(`/post-detail?id=${id}`)}
          variant="outline"
        />
      </View>
    </PostScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    lineHeight: 28,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  content: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  authorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  authorAvatar: {
    backgroundColor: '#E6F4EB',
  },
  authorText: {
    flex: 1,
    minWidth: 0,
  },
  authorLabel: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 12,
  },
  authorName: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    marginTop: 2,
  },
  noticeRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  noticeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDE7E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  buttonStack: {
    gap: 12,
  },
});
