import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { authPalette } from '@/components/auth/auth-ui';
import { useAuth } from '@/components/auth/auth-provider';
import {
  getMyPosts,
  formatPostDateTime,
  type PostSummary,
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
import { Fonts } from '@/constants/theme';

type MyPostFilter = 'ALL' | 'ACTIVE' | 'UNDER_REVIEW' | 'PUBLIC';

const filters: { label: string; value: MyPostFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Public', value: 'PUBLIC' },
];

export default function PostMyScreen() {
  const router = useRouter();
  const { session } = useAuth();

  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<MyPostFilter>('ALL');

  const fetchMyPosts = useCallback(async () => {
    if (!session?.accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getMyPosts(session.accessToken);
      setPosts(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load your posts.');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    fetchMyPosts();
  }, [fetchMyPosts]);

  const filteredPosts = (() => {
    if (activeFilter === 'ACTIVE') return posts.filter((p) => p.status === 'ACTIVE');
    if (activeFilter === 'UNDER_REVIEW') return posts.filter((p) => p.status === 'UNDER_REVIEW');
    if (activeFilter === 'PUBLIC') return posts.filter((p) => p.visibility === 'PUBLIC');
    return posts;
  })();

  return (
    <PostScreen title="My Posts" onBackPress={() => router.push('/(tabs)/posts')}>
      <PostSection title="Filters">
        <View style={styles.filterRow}>
          {filters.map((item) => (
            <Pressable
              key={item.value}
              accessibilityRole="button"
              onPress={() => setActiveFilter(item.value)}
              style={[
                styles.filterChip,
                activeFilter === item.value && styles.filterChipActive,
              ]}>
              <Text
                style={[
                  styles.filterText,
                  activeFilter === item.value && styles.filterTextActive,
                ]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </PostSection>

      {loading ? <PostLoading message="Loading your posts…" /> : null}
      {error ? <PostError message={error} onRetry={fetchMyPosts} /> : null}

      {!loading && !error ? (
        <PostSection title={`Post List (${filteredPosts.length})`}>
          <View style={styles.stack}>
            {filteredPosts.length === 0 ? (
              <PostCard>
                <Text style={styles.emptyText}>No posts match this filter.</Text>
              </PostCard>
            ) : null}
            {filteredPosts.map((item) => (
              <PostCard key={item.id}>
                <View style={styles.cardTop}>
                  <PostStatusBadge status={item.status} />
                  <PostVisibilityBadge visibility={item.visibility} />
                </View>
                {item.supportRequestTitle ? (
                  <Text style={styles.requestTitle}>{item.supportRequestTitle}</Text>
                ) : null}
                <Text style={styles.content} numberOfLines={3}>{item.content}</Text>
                <Text style={styles.meta}>Updated: {formatPostDateTime(item.updatedAt)}</Text>
                <View style={styles.buttonRow}>
                  <View style={styles.buttonCell}>
                    <PostButton
                      label="View Detail"
                      onPress={() => router.push(`/post-detail?id=${item.id}`)}
                      variant="outline"
                    />
                  </View>
                  <View style={styles.buttonCell}>
                    <PostButton label="Edit" onPress={() => router.push(`/post-edit?id=${item.id}`)} />
                  </View>
                </View>
              </PostCard>
            ))}
          </View>
        </PostSection>
      ) : null}
    </PostScreen>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    borderRadius: 999,
    backgroundColor: '#ECF2EC',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipActive: {
    backgroundColor: authPalette.primaryDark,
  },
  filterText: {
    fontSize: 13,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  stack: {
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  requestTitle: {
    marginTop: 12,
    fontSize: 18,
    lineHeight: 25,
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
  meta: {
    marginTop: 12,
    fontSize: 13,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
  buttonRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 12,
  },
  buttonCell: {
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
