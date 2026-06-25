import { Feather } from '@expo/vector-icons';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { useAuth } from '@/components/auth/auth-provider';
import {
  AuthBrandHeader,
  AuthButton,
  AuthInput,
  AuthIntro,
  AuthPage,
  AuthPasswordInput,
  RememberRow,
  AuthTextLink,
  authPalette,
} from '@/components/auth/auth-ui';
import { useToast } from '@/components/ui/toast';
import { Fonts } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showToast } = useToast();
  const initialEmail = Array.isArray(params.email) ? params.email[0] : params.email;
  const notice = Array.isArray(params.notice) ? params.notice[0] : params.notice;
  const { isAuthenticated, isLoading, login } = useAuth();
  const [email, setEmail] = useState(initialEmail ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, router]);

  async function handleLogin() {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      const message = 'Please enter your email and password.';
      setError(message);
      showToast({ message, type: 'error' });
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await login({
        email: normalizedEmail,
        password,
      });
      showToast({ message: 'Logged in successfully.', type: 'success' });
      router.replace('/(tabs)');
    } catch (loginError) {
      const message = getAuthErrorMessage(loginError);
      setError(message);
      showToast({ message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthPage>
        <AuthBrandHeader />
        <AuthIntro
          title="Login"
          subtitle="Welcome back to Help Hub. Pick up where your kindness left off."
        />

        <AuthInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Email"
          textContentType="emailAddress"
          value={email}
          leftIcon={<Feather name="mail" size={20} color={authPalette.muted} />}
        />

        <AuthPasswordInput
          autoCapitalize="none"
          onChangeText={setPassword}
          placeholder="Password"
          textContentType="password"
          value={password}
          leftIcon={<Feather name="lock" size={20} color={authPalette.muted} />}
        />

        <RememberRow onForgotPress={() => router.push('/forgot-password')} />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}
        {error.toLowerCase().includes('not verified') ? (
          <AuthTextLink
            label="Verify Email"
            onPress={() =>
              router.push({
                pathname: '/verify-code',
                params: { email: email.trim().toLowerCase(), purpose: 'email-verification' },
              })
            }
          />
        ) : null}

        <AuthButton
          disabled={isLoading || isSubmitting}
          label={isSubmitting ? 'Logging in...' : 'Log In'}
          onPress={handleLogin}
          leftIcon={<Feather name="log-in" size={20} color="#FFFFFF" />}
        />
        <AuthButton
          label="Continue as Guest"
          onPress={() => router.push('/(tabs)')}
          variant="outline"
          leftIcon={<Feather name="user" size={20} color={authPalette.primaryDark} />}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account?</Text>
          <Link href="/create-account" style={styles.footerLink}>
            Create Account
          </Link>
        </View>
      </AuthPage>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: authPalette.background,
  },
  errorText: {
    marginBottom: 18,
    color: '#B42318',
    fontSize: 13,
    fontFamily: Fonts.rounded,
  },
  footer: {
    marginTop: 66,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  noticeText: {
    marginBottom: 18,
    color: authPalette.primaryDark,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.rounded,
  },
  footerText: {
    color: authPalette.muted,
    fontSize: 14,
    fontFamily: Fonts.rounded,
  },
  footerLink: {
    color: authPalette.primaryDark,
    fontSize: 14,
    fontFamily: Fonts.rounded,
  },
});
