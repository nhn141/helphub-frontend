import { Link, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAuthErrorMessage, type RegisterPayload } from '@/components/auth/auth-api';
import { useAuth } from '@/components/auth/auth-provider';
import {
  AuthBrandHeader,
  AuthButton,
  AuthInput,
  AuthIntro,
  AuthPage,
  AuthPasswordInput,
  PasswordStrength,
  RoleSelector,
  authPalette,
  getPasswordStrength,
} from '@/components/auth/auth-ui';
import { Fonts } from '@/constants/theme';

const roleOptions = [
  { label: 'Requester', value: 'REQUESTER' },
  { label: 'Volunteer', value: 'VOLUNTEER' },
] satisfies { label: string; value: RegisterPayload['role'] }[];

export default function CreateAccountScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(roleOptions[0].value);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateAccount() {
    const normalizedFullName = fullName.trim();
    const normalizedEmail = email.trim();
    const normalizedPhone = phone.trim();

    if (!normalizedFullName || !normalizedEmail || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (getPasswordStrength(password).score < 3) {
      setError('Please use a stronger password (must include uppercase, numbers, or symbols).');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await register({
        fullName: normalizedFullName,
        email: normalizedEmail,
        password,
        phone: normalizedPhone || undefined,
        role,
      });
      router.replace('/(tabs)');
    } catch (registerError) {
      setError(getAuthErrorMessage(registerError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthPage>
        <AuthBrandHeader />
        <AuthIntro title={'Create your\naccount'} />

        <AuthInput
          autoCapitalize="words"
          label="Full Name"
          onChangeText={setFullName}
          textContentType="name"
          value={fullName}
        />

        <AuthInput
          autoCapitalize="none"
          keyboardType="email-address"
          label="Email Address"
          onChangeText={setEmail}
          textContentType="emailAddress"
          value={email}
        />

        <AuthInput
          keyboardType="phone-pad"
          label="Phone Number"
          onChangeText={setPhone}
          textContentType="telephoneNumber"
          value={phone}
        />

        <AuthPasswordInput
          autoCapitalize="none"
          label="Password"
          onChangeText={setPassword}
          placeholder="........"
          textContentType="newPassword"
          value={password}
        />

        <PasswordStrength password={password} />

        <AuthPasswordInput
          autoCapitalize="none"
          label="Confirm Password"
          onChangeText={setConfirmPassword}
          placeholder="........"
          textContentType="password"
          value={confirmPassword}
        />

        <RoleSelector
          onChange={(nextRole) => setRole(nextRole as RegisterPayload['role'])}
          options={roleOptions}
          value={role}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.buttonWrap}>
          <AuthButton
            disabled={isSubmitting}
            label={isSubmitting ? 'Creating...' : 'Create Account'}
            onPress={handleCreateAccount}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href={'/login' as never} style={styles.footerLink}>
            Log In
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
  buttonWrap: {
    marginTop: 88,
  },
  errorText: {
    marginTop: 6,
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
