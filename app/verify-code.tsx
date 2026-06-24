import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  forgotPassword,
  getAuthErrorMessage,
  resendEmailOtp,
  verifyEmail,
} from '@/components/auth/auth-api';
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

type OtpPurpose = 'email-verification' | 'password-reset';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function VerifyCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = getStringParam(params.email)?.trim().toLowerCase() ?? '';
  const purpose: OtpPurpose =
    getStringParam(params.purpose) === 'email-verification'
      ? 'email-verification'
      : 'password-reset';
  const initialNotice = getStringParam(params.notice) ?? '';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(initialNotice);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const isEmailVerification = purpose === 'email-verification';

  function handleCodeChange(value: string) {
    setCode(value.replace(/\D/g, '').slice(0, 6));
    setError('');
  }

  async function handleVerify() {
    if (!email) {
      setError('Email address is missing. Please restart this flow.');
      return;
    }

    if (code.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setError('');
    setNotice('');
    setIsSubmitting(true);

    try {
      if (isEmailVerification) {
        const response = await verifyEmail({ email, otp: code });
        router.replace({
          pathname: '/login',
          params: { email, notice: response.message },
        });
      } else {
        router.push({
          pathname: '/reset-password',
          params: { email, otp: code },
        });
      }
    } catch (verifyError) {
      setError(getAuthErrorMessage(verifyError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendCode() {
    if (!email || isResending) {
      if (!email) {
        setError('Email address is missing. Please restart this flow.');
      }
      return;
    }

    setError('');
    setNotice('');
    setIsResending(true);

    try {
      const response = isEmailVerification
        ? await resendEmailOtp({ email })
        : await forgotPassword({ email });
      setNotice(response.message);
    } catch (resendError) {
      setError(getAuthErrorMessage(resendError));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthPage>
        <AuthBrandHeader showClose={false} />
        <AuthIntro
          centered
          compact
          title={isEmailVerification ? 'Verify Email' : 'Enter Reset Code'}
          subtitle={
            email
              ? `Enter the 6-digit code sent to ${email}. The code expires after 5 minutes.`
              : 'Enter the 6-digit code sent to your email.'
          }
        />

        <AuthCodeRow values={Array.from({ length: 6 }, (_, index) => code[index] ?? '')} />

        <View style={styles.inputWrap}>
          <AuthInput
            keyboardType="number-pad"
            label="Verification Code"
            maxLength={6}
            onChangeText={handleCodeChange}
            placeholder="123456"
            textContentType="oneTimeCode"
            value={code}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}

        <View style={styles.resendWrap}>
          <Text style={styles.resendPrompt}>Didn&apos;t receive the code?</Text>
          <Pressable
            accessibilityRole="button"
            disabled={isResending}
            onPress={handleResendCode}>
            <Text style={[styles.resendLink, isResending && styles.disabledText]}>
              {isResending ? 'Sending...' : 'Resend Code'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.buttonWrap}>
          <AuthButton
            disabled={isSubmitting}
            label={
              isSubmitting
                ? isEmailVerification
                  ? 'Verifying...'
                  : 'Continuing...'
                : isEmailVerification
                  ? 'Verify Email'
                  : 'Continue'
            }
            onPress={handleVerify}
            rightIcon={<Feather name="arrow-right" size={20} color="#FFFFFF" />}
          />
        </View>

        <AuthTextLink
          label={isEmailVerification ? 'Back to Login' : 'Back to Forgot Password'}
          leftIcon={<Feather name="arrow-left" size={18} color={authPalette.muted} />}
          onPress={() =>
            router.push(isEmailVerification ? ('/login' as never) : ('/forgot-password' as never))
          }
        />
      </AuthPage>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  buttonWrap: { marginTop: 48 },
  disabledText: { opacity: 0.58 },
  errorText: { color: '#B42318', fontFamily: Fonts.rounded, fontSize: 13, marginTop: -4, textAlign: 'center' },
  inputWrap: { marginTop: 22 },
  noticeText: { color: authPalette.primaryDark, fontFamily: Fonts.rounded, fontSize: 13, lineHeight: 19, marginTop: -4, textAlign: 'center' },
  resendLink: { color: authPalette.primaryDark, fontFamily: Fonts.rounded, fontSize: 15 },
  resendPrompt: { color: authPalette.muted, fontFamily: Fonts.rounded, fontSize: 15 },
  resendWrap: { alignItems: 'center', gap: 10, marginTop: 28 },
  safeArea: { backgroundColor: authPalette.background, flex: 1 },
});
