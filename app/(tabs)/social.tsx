import { useLocalSearchParams } from 'expo-router';

import ChatTabScreen from '@/app/(tabs)/chat';
import PostsTabScreen from '@/app/(tabs)/posts';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function SocialTabScreen() {
  const params = useLocalSearchParams();
  const view = getStringParam(params.view);

  if (view === 'chat') {
    return <ChatTabScreen />;
  }

  return <PostsTabScreen />;
}
