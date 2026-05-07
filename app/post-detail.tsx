import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import {
  createComment,
  createReaction,
  deleteComment,
  deleteReaction,
  formatPostDateTime,
  getCommentsByPost,
  getMediaByPost,
  getMyReaction,
  getPostById,
  getReactionCount,
  updateReaction,
  type PostComment,
  type PostDetail,
  type PostMedia,
  type PostReactionCount,
  type PostReactionType,
} from '@/components/post/post-api';
import {
  PostButton,
  PostCard,
  PostCommentBubble,
  PostCommentInput,
  PostError,
  PostLoading,
  PostMediaGallery,
  PostReactionBar,
  PostScreen,
  PostStatusBadge,
} from '@/components/post/post-ui';
import { Fonts } from '@/constants/theme';

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, user } = useAuth();

  // Post data
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reactions
  const [reactionCount, setReactionCount] = useState<PostReactionCount | null>(null);
  const [myReaction, setMyReaction] = useState<PostReactionType | null>(null);

  // Comments
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // Media
  const [media, setMedia] = useState<PostMedia[]>([]);

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

  const fetchReactions = useCallback(async () => {
    if (!session?.accessToken || !id) return;
    try {
      const [countData, myData] = await Promise.all([
        getReactionCount(session.accessToken, id),
        getMyReaction(session.accessToken, id).catch(() => null),
      ]);
      setReactionCount(countData);
      setMyReaction(myData?.type ?? null);
    } catch {
      // Reactions are non-critical
    }
  }, [session?.accessToken, id]);

  const fetchComments = useCallback(async () => {
    if (!session?.accessToken || !id) return;
    try {
      const data = await getCommentsByPost(session.accessToken, id);
      setComments(data);
    } catch {
      // Comments are non-critical
    }
  }, [session?.accessToken, id]);

  const fetchMedia = useCallback(async () => {
    if (!session?.accessToken || !id) return;
    try {
      const data = await getMediaByPost(session.accessToken, id);
      setMedia(data);
    } catch {
      // Media is non-critical
    }
  }, [session?.accessToken, id]);

  useEffect(() => {
    fetchPost();
    fetchReactions();
    fetchComments();
    fetchMedia();
  }, [fetchPost, fetchReactions, fetchComments, fetchMedia]);

  const handleReactionPress = useCallback(
    async (type: PostReactionType) => {
      if (!session?.accessToken || !id) return;

      try {
        if (myReaction === type) {
          await deleteReaction(session.accessToken, id);
          setMyReaction(null);
        } else if (myReaction) {
          await updateReaction(session.accessToken, id, { type });
          setMyReaction(type);
        } else {
          await createReaction(session.accessToken, id, { type });
          setMyReaction(type);
        }
        fetchReactions();
      } catch (err: any) {
        Alert.alert('Reaction Error', err?.message ?? 'Could not update reaction.');
      }
    },
    [session?.accessToken, id, myReaction, fetchReactions],
  );

  const handleSubmitComment = useCallback(async () => {
    if (!session?.accessToken || !id || commentText.trim().length === 0) return;

    setCommentLoading(true);
    try {
      await createComment(session.accessToken, id, { content: commentText.trim() });
      setCommentText('');
      fetchComments();
    } catch (err: any) {
      Alert.alert('Comment Error', err?.message ?? 'Could not post comment.');
    } finally {
      setCommentLoading(false);
    }
  }, [session?.accessToken, id, commentText, fetchComments]);

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!session?.accessToken) return;

      Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(session.accessToken!, commentId);
              fetchComments();
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'Could not delete comment.');
            }
          },
        },
      ]);
    },
    [session?.accessToken, fetchComments],
  );

  const handleDeletePost = () => {
    router.push(`/post-delete?id=${post?.id}`);
  };

  const handleEditPost = () => {
    router.push(`/post-edit?id=${post?.id}`);
  };

  if (loading) {
    return (
      <PostScreen title="Post Detail" onBackPress={() => router.push('/(tabs)/posts')}>
        <PostLoading message="Loading post…" />
      </PostScreen>
    );
  }

  if (error || !post) {
    return (
      <PostScreen title="Post Detail" onBackPress={() => router.push('/(tabs)/posts')}>
        <PostError message={error ?? 'Post not found.'} onRetry={fetchPost} />
      </PostScreen>
    );
  }

  const isOwner = user?.id === post.authorId;
  const isPublic = post.visibility === 'PUBLIC';

  return (
    <PostScreen
      title="Post"
      onBackPress={() => router.push('/(tabs)/posts')}
      rightSlot={<PostStatusBadge status={post.status} />}>
      
      <PostCard>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.authorAvatar}>
            <Text style={styles.authorInitials}>
              {post.authorName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.authorName}>{post.authorName}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{formatPostDateTime(post.createdAt)}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Feather 
                name={isPublic ? 'globe' : 'users'} 
                size={12} 
                color={authPalette.muted} 
              />
              <Text style={styles.metaText}>{isPublic ? 'Public' : 'Volunteers'}</Text>
            </View>
          </View>
          
          {isOwner ? (
            <View style={styles.ownerActions}>
              <Pressable onPress={handleEditPost} style={styles.actionIcon}>
                <Feather name="edit-2" size={16} color={authPalette.muted} />
              </Pressable>
              <Pressable onPress={handleDeletePost} style={styles.actionIcon}>
                <Feather name="trash-2" size={16} color="#AE3F3A" />
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* Post Content */}
        {post.supportRequestTitle ? (
          <Text style={styles.supportTitle}>Related: {post.supportRequestTitle}</Text>
        ) : null}
        <Text style={styles.content}>{post.content}</Text>

        {/* Media */}
        {media.length > 0 ? (
          <View style={styles.mediaWrap}>
            <PostMediaGallery
              items={media.map((m) => ({
                mediaId: m.mediaId,
                fileUrl: m.fileUrl,
                fileType: m.fileType,
                altText: m.altText,
              }))}
            />
          </View>
        ) : null}

        {/* Reaction Stats & Bar */}
        <View style={styles.reactionWrap}>
          <PostReactionBar
            countByType={reactionCount?.countByType ?? {}}
            totalCount={reactionCount?.totalCount ?? 0}
            myReaction={myReaction}
            onReactionPress={handleReactionPress}
          />
        </View>

        <View style={styles.divider} />

        {/* Comments Section */}
        <View style={styles.commentsWrap}>
          <Text style={styles.commentHeader}>
            {comments.length > 0 ? `${comments.length} Comments` : 'Write a comment'}
          </Text>
          
          <PostCommentInput
            value={commentText}
            onChangeText={setCommentText}
            onSubmit={handleSubmitComment}
            loading={commentLoading}
          />
          
          <View style={styles.commentList}>
            {comments.map((comment) => (
              <PostCommentBubble
                key={comment.id}
                userName={comment.userName}
                content={comment.content}
                createdAt={formatPostDateTime(comment.createdAt)}
                isOwn={user?.id === comment.userId}
                isReply={comment.parentCommentId !== null}
                onDelete={
                  user?.id === comment.userId
                    ? () => handleDeleteComment(comment.id)
                    : undefined
                }
              />
            ))}
          </View>
        </View>
      </PostCard>
    </PostScreen>
  );
}

const styles = StyleSheet.create({
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F4EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  authorInitials: {
    fontSize: 18,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontWeight: 'bold',
  },
  headerText: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    marginLeft: 4,
  },
  metaDot: {
    fontSize: 12,
    color: authPalette.muted,
    marginHorizontal: 4,
  },
  ownerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    padding: 6,
    backgroundColor: '#F6FAF6',
    borderRadius: 8,
  },
  supportTitle: {
    fontSize: 14,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  mediaWrap: {
    marginTop: 16,
    marginHorizontal: -18, // Stretch to edges of PostCard if PostCard has padding
    marginBottom: 8,
  },
  reactionWrap: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E6EBE6',
    marginVertical: 16,
  },
  commentsWrap: {
    marginTop: 4,
  },
  commentHeader: {
    fontSize: 14,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    marginBottom: 12,
    fontWeight: 'bold',
  },
  commentList: {
    marginTop: 16,
    gap: 12,
  },
});
