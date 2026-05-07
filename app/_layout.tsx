import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/components/auth/auth-provider';
import { DemoRoleProvider } from '@/components/demo-role/demo-role-provider';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <DemoRoleProvider>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F7FAF5' } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="create-account" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="verify-code" />
            <Stack.Screen name="reset-password" />
            <Stack.Screen name="support-request-create" />
            <Stack.Screen name="support-request-my" />
            <Stack.Screen name="support-request-detail" />
            <Stack.Screen name="support-request-edit" />
            <Stack.Screen name="support-request-approve" />
            <Stack.Screen name="support-request-reject" />
            <Stack.Screen name="support-request-assign-location" />
            <Stack.Screen name="support-location-create" />
            <Stack.Screen name="support-location-detail" />
            <Stack.Screen name="support-location-edit" />
            <Stack.Screen name="support-location-status" />
            <Stack.Screen name="support-location-assign-request" />
            <Stack.Screen name="post-create" />
            <Stack.Screen name="post-my" />
            <Stack.Screen name="post-detail" />
            <Stack.Screen name="post-edit" />
            <Stack.Screen name="post-delete" />
            <Stack.Screen name="category-create" />
            <Stack.Screen name="category-detail" />
            <Stack.Screen name="category-edit" />
            <Stack.Screen name="category-status" />
            <Stack.Screen name="profile-detail" />
            <Stack.Screen name="profile-edit" />
            <Stack.Screen name="users-list" />
            <Stack.Screen name="user-detail" />
            <Stack.Screen name="user-role" />
            <Stack.Screen name="user-status" />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
        </DemoRoleProvider>
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
