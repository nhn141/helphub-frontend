import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAuthErrorMessage, resetPassword } from '@/components/auth/auth-api';
import {
  AuthBrandHeader,
  AuthButton,
  AuthChecklist,
  AuthIntro,
  AuthPage,
  AuthPasswordInput,
  AuthTextLink,
  PasswordStrength,
  authPalette,
  getPasswordStrength,
} from '@/components/auth/auth-ui';
import { Fonts } from '@/constants/theme';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = getStringParam(params.email)?.trim().toLowerCase() ?? '';
  const otp = getStringParam(params.otp) ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const strength = getPasswordStrength(newPassword);

  async function handleResetPassword() {
    if (!email || !otp) {
      setError('Reset information is missing. Please request a new code.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm your new password.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (strength.score < 3) {
      setError('Please choose a stronger password before resetting.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await resetPassword({ email, newPassword, otp });
      router.replace({
        pathname: '/login',
        params: { email, notice: response.message },
      });
    } catch (resetError) {
      setError(getAuthErrorMessage(resetError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthPage>
        <AuthBrandHeader onClosePress={() => router.push('/login' as never)} />
        <AuthIntro
          compact
          title="Create New Password"
          subtitle={email ? `Resetting password for ${email}.` : 'Choose a stronger password for your account.'}
        />

        <AuthPasswordInput
          autoCapitalize="none"
          label="New Password"
          onChangeText={(value) => {
            setNewPassword(value);
            setError('');
          }}
          placeholder="........"
          textContentType="newPassword"
          value={newPassword}
        />

        <PasswordStrength password={newPassword} />

        <AuthPasswordInput
          autoCapitalize="none"
          label="Confirm New Password"
          onChangeText={(value) => {
            setConfirmPassword(value);
            setError('');
          }}
          placeholder="........"
          textContentType="password"
          value={confirmPassword}
        />

        <AuthChecklist
          items={[
            { label: 'At least 8 characters', checked: strength.checks.minLength },
            { label: 'One lowercase letter', checked: strength.checks.lowercase },
            { label: 'One uppercase letter', checked: strength.checks.uppercase },
            { label: 'One number', checked: strength.checks.number },
            { label: 'One symbol', checked: strength.checks.special },
          ]}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.buttonWrap}>
          <AuthButton
            disabled={isSubmitting}
            label={isSubmitting ? 'Resetting...' : 'Reset Password'}
            onPress={handleResetPassword}
          />
        </View>

        <AuthTextLink label="Request a New Code" onPress={() => router.push('/forgot-password' as never)} />
      </AuthPage>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  buttonWrap: { marginTop: 40 },
  errorText: { color: '#B42318', fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 19, marginTop: 16 },
  safeArea: { backgroundColor: authPalette.background, flex: 1 },
});
