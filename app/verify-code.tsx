import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AuthBrandHeader,
  AuthButton,
  AuthCodeRow,
  AuthInput,
  AuthIntro,
  AuthPage,
  AuthTextLink,
  authPalette,
} from '@/components/auth/auth-ui';
import { Fonts } from '@/constants/theme';

const DEMO_RESET_CODE = '424242';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function VerifyCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = getStringParam(params.email);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function handleCodeChange(value: string) {
    setCode(value.replace(/\D/g, '').slice(0, 6));
    setError('');
    setNotice('');
  }

  function handleVerify() {
    if (code.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (code !== DEMO_RESET_CODE) {
      setError('Invalid verification code. For this demo, use 424242.');
      return;
    }

    setError('');
    router.push({
      pathname: '/reset-password',
      params: { email: email ?? '', code },
    });
  }

  function handleResendCode() {
    setError('');
    setNotice('A fresh demo code is ready: 424242.');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthPage>
        <AuthBrandHeader showClose={false} />
        <AuthIntro
          centered
          compact
          title="Verify Code"
          subtitle={
            email
              ? `Enter the 6-digit code for ${email}.`
              : 'Enter the 6-digit code from your password reset request.'
          }
        />

        <AuthCodeRow values={Array.from({ length: 6 }, (_, index) => code[index] ?? '')} />

        <View style={styles.inputWrap}>
          <AuthInput
            keyboardType="number-pad"
            label="Verification Code"
            maxLength={6}
            onChangeText={handleCodeChange}
            placeholder="424242"
            textContentType="oneTimeCode"
            value={code}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}

        <View style={styles.resendWrap}>
          <Text style={styles.resendTimer}>Resend code in 00:45</Text>
          <Pressable accessibilityRole="button" onPress={handleResendCode}>
            <Text style={styles.resendLink}>Resend Code</Text>
          </Pressable>
        </View>

        <View style={styles.buttonWrap}>
          <AuthButton
            label="Verify"
            onPress={handleVerify}
            rightIcon={<Feather name="arrow-right" size={20} color="#FFFFFF" />}
          />
        </View>

        <AuthTextLink
          label="Back"
          leftIcon={<Feather name="arrow-left" size={18} color={authPalette.muted} />}
          onPress={() => router.push('/forgot-password')}
        />
      </AuthPage>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: authPalette.background,
  },
  inputWrap: {
    marginTop: 22,
  },
  errorText: {
    marginTop: -4,
    color: '#B42318',
    fontSize: 13,
    fontFamily: Fonts.rounded,
    textAlign: 'center',
  },
  noticeText: {
    marginTop: -4,
    color: authPalette.primaryDark,
    fontSize: 13,
    fontFamily: Fonts.rounded,
    textAlign: 'center',
  },
  resendWrap: {
    marginTop: 30,
    alignItems: 'center',
    gap: 10,
  },
  resendTimer: {
    fontSize: 15,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  resendLink: {
    fontSize: 15,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
  buttonWrap: {
    marginTop: 54,
  },
});
