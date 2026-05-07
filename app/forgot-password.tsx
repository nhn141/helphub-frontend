import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AuthBackHeader,
  AuthButton,
  AuthInput,
  AuthIntro,
  AuthPage,
  AuthTextLink,
  authPalette,
} from '@/components/auth/auth-ui';
import { Fonts } from '@/constants/theme';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSendCode() {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    router.push({
      pathname: '/verify-code',
      params: { email: normalizedEmail },
    });

    setIsSubmitting(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthPage>
        <AuthBackHeader title="Forgot Password" onBackPress={() => router.push('/login' as never)} />
        <AuthIntro
          centered
          compact
          title="Forgot Password?"
          subtitle="Enter your email and we will walk you through a secure reset."
        />

        <AuthInput
          autoCapitalize="none"
          keyboardType="email-address"
          label="Email Address"
          onChangeText={setEmail}
          placeholder="name@example.com"
          textContentType="emailAddress"
          value={email}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <AuthButton
          disabled={isSubmitting}
          label={isSubmitting ? 'Sending...' : 'Send Code'}
          onPress={handleSendCode}
          rightIcon={<Feather name="send" size={18} color="#FFFFFF" />}
        />
        <AuthTextLink label="Back to Login" onPress={() => router.push('/login' as never)} />
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
    marginTop: -4,
    marginBottom: 14,
    color: '#B42318',
    fontSize: 13,
    fontFamily: Fonts.rounded,
  },
  helperText: {
    marginTop: -2,
    marginBottom: 22,
    color: authPalette.muted,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.rounded,
    textAlign: 'center',
  },
});
