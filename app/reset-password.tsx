import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const email = getStringParam(params.email);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const strength = getPasswordStrength(newPassword);

  function handleResetPassword() {
    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm your new password.');
      setSuccess('');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      setSuccess('');
      return;
    }

    if (strength.score < 3) {
      setError('Please choose a stronger password before resetting.');
      setSuccess('');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Password confirmation does not match.');
      setSuccess('');
      return;
    }

    setError('');
    setSuccess('Your password has been successfully reset.');
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
            setSuccess('');
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
            setSuccess('');
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
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        <View style={styles.buttonWrap}>
          <AuthButton label="Reset Password" onPress={handleResetPassword} />
        </View>

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
    marginTop: 16,
    color: '#B42318',
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.rounded,
  },
  successText: {
    marginTop: 16,
    color: authPalette.primaryDark,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.rounded,
  },
  buttonWrap: {
    marginTop: 40,
  },
});
