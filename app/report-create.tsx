import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { useAuth } from '@/components/auth/auth-provider';
import { authPalette } from '@/components/auth/auth-ui';
import {
  ManagementBadge,
  ManagementButton,
  ManagementCard,
  ManagementField,
  ManagementScreen,
} from '@/components/management/management-ui';
import {
  createReport,
  getReportTargetLabel,
  type ReportTargetType,
} from '@/components/report/report-api';
import { Fonts } from '@/constants/theme';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getTargetType(value: string | undefined): ReportTargetType | null {
  if (value === 'POST' || value === 'SUPPORT_REQUEST' || value === 'USER') {
    return value;
  }

  return null;
}

export default function ReportCreateScreen() {
  const params = useLocalSearchParams();
  const { session } = useAuth();
  const targetType = getTargetType(getStringParam(params.targetType));
  const targetId = getStringParam(params.targetId);
  const targetName = getStringParam(params.targetName);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const targetLabel = useMemo(
    () => (targetType ? getReportTargetLabel(targetType) : 'Target'),
    [targetType]
  );

  async function handleSubmit() {
    const normalizedReason = reason.trim();

    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    if (!targetType || !targetId) {
      setError('Missing report target.');
      return;
    }

    if (!normalizedReason) {
      setError('Please explain why this should be reviewed.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await createReport(session.accessToken, {
        reason: normalizedReason,
        targetId,
        targetType,
      });

      Alert.alert('Report submitted', 'An admin can now review this report.', [
        {
          text: 'View my reports',
          onPress: () => router.replace('/reports-my' as never),
        },
      ]);
    } catch (submitError) {
      setError(getAuthErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ManagementScreen
      title="Submit Report"
      onBackPress={() => router.back()}
      rightSlot={
        targetType ? (
          <ManagementBadge label={targetLabel.toUpperCase()} tone="amber" />
        ) : undefined
      }>
      <ManagementCard>
        <View style={styles.targetRow}>
          <View style={styles.targetIcon}>
            <Feather name="flag" size={18} color="#AE3F3A" />
          </View>
          <View style={styles.targetCopy}>
            <Text style={styles.targetLabel}>{targetLabel}</Text>
            <Text numberOfLines={2} style={styles.targetName}>
              {targetName || targetId || 'Unknown target'}
            </Text>
          </View>
        </View>
      </ManagementCard>

      <ManagementCard>
        <ManagementField
          label="Reason"
          maxLength={1000}
          multiline
          numberOfLines={6}
          onChangeText={setReason}
          placeholder="Describe the harmful, misleading, or inappropriate behavior."
          value={reason}
        />
        <Text style={styles.counter}>{reason.length}/1000</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ManagementCard>

      <ManagementButton
        disabled={isSubmitting}
        label={isSubmitting ? 'Submitting...' : 'Submit Report'}
        leftIcon={<Feather name="flag" size={16} color="#FFFFFF" />}
        onPress={handleSubmit}
        variant="danger"
      />
    </ManagementScreen>
  );
}

const styles = StyleSheet.create({
  targetRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  targetIcon: {
    alignItems: 'center',
    backgroundColor: '#FDE7E6',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  targetCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  targetLabel: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 12,
  },
  targetName: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 15,
    lineHeight: 21,
  },
  counter: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
  },
  errorText: {
    color: '#AE3F3A',
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
});
