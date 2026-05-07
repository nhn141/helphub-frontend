import { Link, useRouter } from 'expo-router';
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
  authPalette,
} from '@/components/auth/auth-ui';
import { Fonts } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login } = useAuth();
  const [email, setEmail] = useState('');
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
      setError('Please enter your email and password.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await login({
        email: normalizedEmail,
        password,
      });
      router.replace('/(tabs)');
    } catch (loginError) {
      setError(getAuthErrorMessage(loginError));
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
        />

        <AuthPasswordInput
          autoCapitalize="none"
          onChangeText={setPassword}
          placeholder="Password"
          textContentType="password"
          value={password}
        />

        <RememberRow onForgotPress={() => router.push('/forgot-password')} />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <AuthButton
          disabled={isLoading || isSubmitting}
          label={isSubmitting ? 'Logging in...' : 'Log In'}
          onPress={handleLogin}
        />
        <AuthButton
          label="Continue as Guest"
          onPress={() => router.push('/(tabs)')}
          variant="outline"
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
