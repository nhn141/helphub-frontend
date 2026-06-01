import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';

import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import { useDemoRole } from '@/components/demo-role/demo-role-provider';
import { Badge, DashboardScreen } from '@/components/dashboard/tab-ui';
import { SectionTabs } from '@/components/dashboard/section-tabs';
import { canViewVolunteerPosts, getRoleTone } from '@/constants/role-access';
import { Fonts } from '@/constants/theme';
import { OpenableImage } from '@/components/media/image-viewer';
import { UserAvatar } from '@/components/user/user-avatar';
import {
  getAllPosts,
  getMyPosts,
  getCommentsByPost,
  getMediaByPost,
  getReactionCount,
  formatPostDateTime,
  type PostMedia,
  type PostSummary,
} from '@/components/post/post-api';
import { PostLoading, PostError } from '@/components/post/post-ui';

type PostFilter = 'ALL' | 'MY_POSTS' | 'PUBLIC' | 'VOLUNTEERS_ONLY';

function PostFeedCard({ item, role, session }: { item: PostSummary; role: string; session: any }) {
  const router = useRouter();
  const [reactionCount, setReactionCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [media, setMedia] = useState<PostMedia[]>([]);

  useEffect(() => {
    if (!session?.accessToken) return;
    let isMounted = true;

    Promise.all([
      getReactionCount(session.accessToken, item.id).catch(() => ({ totalCount: 0 })),
      getCommentsByPost(session.accessToken, item.id).catch(() => []),
      getMediaByPost(session.accessToken, item.id).catch(() => []),
    ]).then(([reactions, comments, postMedia]) => {
      if (isMounted) {
        setReactionCount(reactions.totalCount || 0);
        setCommentCount(comments.length || 0);
        setMedia(postMedia);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [session?.accessToken, item.id]);

  const imageMedia = media.filter((mediaItem) => mediaItem.fileType === 'IMAGE');
  const firstImage = imageMedia[0] ?? null;
  const openSupportRequest = (event: GestureResponderEvent) => {
    if (!item.supportRequestId) return;

    event.stopPropagation();
    router.push({
      pathname: '/support-request-detail',
      params: { id: item.supportRequestId },
    });
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/post-detail?id=${item.id}`)}
      style={styles.postCard}>
      
      <View style={styles.postHeader}>
        <UserAvatar
          name={item.authorName}
          size={44}
          style={styles.postAvatar}
          textSize={18}
          uri={item.authorAvatarUrl}
        />
        <View style={styles.postMeta}>
          <Text style={styles.postAuthorName}>{item.authorName}</Text>
          <View style={styles.postTimeRow}>
            <Text style={styles.postTime}>{formatPostDateTime(item.createdAt)}</Text>
            <Text style={styles.postTimeDot}>•</Text>
            <Feather
              name={item.visibility === 'PUBLIC' ? 'globe' : 'users'}
              size={12}
              color={authPalette.muted}
            />
          </View>
        </View>
        <Feather name="more-horizontal" size={20} color={authPalette.muted} />
      </View>

      <Text style={styles.postContent} numberOfLines={4}>
        {item.content}
      </Text>

      {firstImage ? (
        <View style={styles.feedMediaWrap}>
          <OpenableImage
            accessibilityLabel={firstImage.altText ?? 'Post image'}
            altText={firstImage.altText ?? 'Post image'}
            contentFit="cover"
            style={styles.feedMediaImage}
            uri={firstImage.fileUrl}
          />
          {imageMedia.length > 1 ? (
            <View style={styles.feedMediaCount}>
              <Feather name="image" size={12} color="#FFFFFF" />
              <Text style={styles.feedMediaCountText}>{imageMedia.length}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {item.supportRequestTitle ? (
        <Pressable
          accessibilityRole={item.supportRequestId ? 'button' : undefined}
          disabled={!item.supportRequestId}
          onPress={openSupportRequest}
          style={styles.supportTag}>
          <Feather name="link" size={14} color={authPalette.primaryDark} />
          <Text style={styles.supportTagText} numberOfLines={1}>
            {item.supportRequestTitle}
          </Text>
          {item.supportRequestId ? (
            <Feather name="arrow-right" size={14} color={authPalette.primaryDark} />
          ) : null}
        </Pressable>
      ) : null}

      {/* Stats Row */}
      {(reactionCount > 0 || commentCount > 0) ? (
        <View style={styles.postStatsRow}>
          {reactionCount > 0 ? (
            <View style={styles.statItem}>
              <View style={styles.reactionIconBg}>
                <Text style={styles.reactionIconText}>👍</Text>
              </View>
              <Text style={styles.statText}>{reactionCount}</Text>
            </View>
          ) : <View />}
          {commentCount > 0 ? (
            <Text style={styles.statText}>{commentCount} comments</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.postDivider} />

      <View style={styles.postActions}>
        <View style={styles.actionButton}>
          <Feather name="thumbs-up" size={18} color={authPalette.muted} />
          <Text style={styles.actionText}>React</Text>
        </View>
        <View style={styles.actionButton}>
          <Feather name="message-circle" size={18} color={authPalette.muted} />
          <Text style={styles.actionText}>Comment</Text>
        </View>
        <View style={styles.actionButton}>
          <Feather name="share-2" size={18} color={authPalette.muted} />
          <Text style={styles.actionText}>Share</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function PostsTabScreen() {
  const router = useRouter();
  const { role } = useDemoRole();
  const { session, user } = useAuth();

  const [allPosts, setAllPosts] = useState<PostSummary[]>([]);
  const [myPosts, setMyPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<PostFilter>('ALL');

  const fetchPosts = useCallback(async () => {
    if (!session?.accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const [allData, myData] = await Promise.all([
        getAllPosts(session.accessToken),
        getMyPosts(session.accessToken),
      ]);
      setAllPosts(allData);
      setMyPosts(myData);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load posts.');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const filteredPosts = (() => {
    let source = activeFilter === 'MY_POSTS' ? myPosts : allPosts;

    if (activeFilter === 'PUBLIC') {
      source = source.filter((p) => p.visibility === 'PUBLIC');
    } else if (activeFilter === 'VOLUNTEERS_ONLY') {
      source = source.filter((p) => p.visibility === 'VOLUNTEERS_ONLY');
    }

    if (!canViewVolunteerPosts(role) && activeFilter !== 'MY_POSTS') {
      source = source.filter((p) => p.visibility === 'PUBLIC');
    }

    return source;
  })();

  const FilterPill = ({ label, value, icon }: { label: string; value: PostFilter; icon: keyof typeof Feather.glyphMap }) => {
    const isActive = activeFilter === value;
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => setActiveFilter(value)}
        style={[styles.filterPill, isActive && styles.filterPillActive]}>
        <Feather name={icon} size={14} color={isActive ? '#FFFFFF' : authPalette.muted} style={styles.pillIcon} />
        <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <DashboardScreen
      title="Social"
      rightSlot={<Badge label={role} tone={getRoleTone(role)} />}>
      <SectionTabs
        items={[
          {
            active: true,
            icon: 'file-text',
            label: 'Posts',
            onPress: () => router.push({ pathname: '/(tabs)/social', params: { view: 'posts' } }),
          },
          {
            icon: 'message-circle',
            label: 'Chat',
            onPress: () => router.push({ pathname: '/(tabs)/social', params: { view: 'chat' } }),
          },
        ]}
      />

      {/* Create Post Composer Trigger */}
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/post-create')}
        style={styles.composerTrigger}>
        <UserAvatar
          fallback="U"
          name={user?.fullName}
          size={40}
          style={styles.composerAvatar}
          textSize={16}
          uri={user?.avatarUrl}
        />
        <View style={styles.composerInput}>
          <Text style={styles.composerInputText}>{"What's on your mind?"}</Text>
        </View>
        <Feather name="image" size={24} color={authPalette.primaryDark} />
      </Pressable>

      {/* Inline Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <FilterPill label="All" value="ALL" icon="layers" />
          <FilterPill label="My Posts" value="MY_POSTS" icon="user" />
          <FilterPill label="Public" value="PUBLIC" icon="globe" />
          {canViewVolunteerPosts(role) ? (
            <FilterPill label="Volunteers" value="VOLUNTEERS_ONLY" icon="users" />
          ) : null}
        </ScrollView>
      </View>

      {/* Feed List */}
      {loading ? <PostLoading message="Loading feed…" /> : null}
      {error ? <PostError message={error} onRetry={fetchPosts} /> : null}

      {!loading && !error ? (
        <View style={styles.feedStack}>
          {filteredPosts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={48} color="#C6D1C7" />
              <Text style={styles.emptyText}>No posts to show right now.</Text>
            </View>
          ) : null}

          {filteredPosts.map((item) => (
            <PostFeedCard key={item.id} item={item} role={role} session={session} />
          ))}
        </View>
      ) : null}
    </DashboardScreen>
  );
}

const styles = StyleSheet.create({
  composerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#0F4B34',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 8,
    gap: 12,
  },
  composerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F4EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerAvatarText: {
    fontSize: 16,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontWeight: 'bold',
  },
  composerInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F6FAF6',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  composerInputText: {
    fontSize: 15,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E6EBE6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillIcon: {
    marginTop: 1,
  },
  filterPillActive: {
    backgroundColor: authPalette.primaryDark,
  },
  filterPillText: {
    fontSize: 14,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  feedStack: {
    gap: 16,
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0F4B34',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F5F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  postAvatarText: {
    fontSize: 18,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontWeight: 'bold',
  },
  postMeta: {
    flex: 1,
  },
  postAuthorName: {
    fontSize: 16,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  postTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postTime: {
    fontSize: 12,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  postTimeDot: {
    fontSize: 12,
    color: authPalette.muted,
    marginHorizontal: 4,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    color: authPalette.text,
    fontFamily: Fonts.rounded,
  },
  feedMediaWrap: {
    aspectRatio: 4 / 3,
    backgroundColor: '#EEF2EF',
    borderRadius: 14,
    marginTop: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  feedMediaImage: {
    height: '100%',
    width: '100%',
  },
  feedMediaCount: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.54)',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    position: 'absolute',
    right: 10,
    top: 10,
  },
  feedMediaCountText: {
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
    fontSize: 12,
  },
  supportTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FAF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  supportTagText: {
    fontSize: 13,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    maxWidth: 250,
  },
  postStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reactionIconBg: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EDF2ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  reactionIconText: {
    fontSize: 10,
  },
  statText: {
    fontSize: 13,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  postDivider: {
    height: 1,
    backgroundColor: '#F0F5F1',
    marginTop: 12,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
  },
  actionText: {
    fontSize: 14,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
});
