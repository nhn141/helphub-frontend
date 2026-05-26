import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { useAuth } from '@/components/auth/auth-provider';
import { authPalette } from '@/components/auth/auth-ui';
import {
  ManagementBadge,
  ManagementButton,
  ManagementCard,
  ManagementField,
  ManagementScreen,
  ManagementSection,
} from '@/components/management/management-ui';
import {
  pickImageFromLibrary,
  uploadImageAndCreateMediaRecord,
} from '@/components/media/media-api';
import { UserAvatar } from '@/components/user/user-avatar';
import { Fonts } from '@/constants/theme';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { session, user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [selectedAvatar, setSelectedAvatar] = useState<Awaited<ReturnType<typeof pickImageFromLibrary>>>(null);
  const [error, setError] = useState('');
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setFullName(user.fullName);
    setPhone(user.phone ?? '');
  }, [user]);

  const previewUri = selectedAvatar?.uri ?? user?.avatarUrl ?? null;
  const initials = (fullName || user?.email || 'HH')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function handlePickAvatar() {
    if (isPickingImage) {
      return;
    }

    setIsPickingImage(true);
    setError('');

    try {
      const image = await pickImageFromLibrary({
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (image) {
        setSelectedAvatar(image);
      }
    } catch (pickError: any) {
      const message = pickError?.message ?? 'Could not choose avatar image.';
      setError(message);
      Alert.alert('Avatar image', message);
    } finally {
      setIsPickingImage(false);
    }
  }

  async function handleSaveProfile() {
    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    const normalizedFullName = fullName.trim();
    const normalizedPhone = phone.trim();

    if (!normalizedFullName) {
      setError('Full name is required.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      let nextAvatarUrl = user?.avatarUrl ?? null;

      if (selectedAvatar) {
        const media = await uploadImageAndCreateMediaRecord(session.accessToken, selectedAvatar, {
          altText: `${normalizedFullName} avatar`,
          folder: 'helphub/avatars',
          isPublic: true,
        });
        nextAvatarUrl = media.fileUrl;
      }

      await updateProfile({
        avatarUrl: nextAvatarUrl,
        fullName: normalizedFullName,
        phone: normalizedPhone || null,
      });

      router.replace('/profile-detail');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : getAuthErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ManagementScreen
      title="Edit Profile"
      onBackPress={() => router.push('/profile-detail')}
      rightSlot={user ? <ManagementBadge label={user.role} tone="green" /> : undefined}>
      <ManagementSection title="Avatar">
        <ManagementCard>
          <View style={styles.avatarRow}>
            <UserAvatar
              fallback={initials || 'HH'}
              name={fullName || user?.email || 'Profile'}
              size={68}
              style={styles.avatarPreview}
              textSize={20}
              uri={previewUri}
            />
            <View style={styles.avatarTextBlock}>
              <Text style={styles.avatarTitle}>Profile image</Text>
              <Text style={styles.avatarSubtitle}>
                {selectedAvatar ? 'New image selected' : 'Choose an image from your device.'}
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={isPickingImage || isSaving}
                onPress={handlePickAvatar}
                style={styles.pickButton}>
                <Feather name="image" size={15} color={authPalette.primaryDark} />
                <Text style={styles.pickButtonText}>
                  {isPickingImage ? 'Opening library...' : 'Choose Image'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ManagementCard>
      </ManagementSection>

      <ManagementSection title="Profile Info">
        <ManagementField label="Full Name" onChangeText={setFullName} value={fullName} />
        <ManagementField label="Phone" onChangeText={setPhone} value={phone} />
      </ManagementSection>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.buttonStack}>
        <ManagementButton
          disabled={isSaving}
          label={isSaving ? 'Saving...' : 'Save Profile'}
          onPress={handleSaveProfile}
        />
        <ManagementButton label="Cancel" onPress={() => router.push('/profile-detail')} variant="outline" />
      </View>
    </ManagementScreen>
  );
}

const styles = StyleSheet.create({
  avatarRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  avatarPreview: {
    alignItems: 'center',
    backgroundColor: '#DDF5E8',
    borderRadius: 34,
    height: 68,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 68,
  },
  avatarTextBlock: {
    flex: 1,
    gap: 6,
  },
  avatarTitle: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 16,
  },
  avatarSubtitle: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 18,
  },
  pickButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 7,
    paddingVertical: 5,
  },
  pickButtonText: {
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontSize: 13,
  },
  buttonStack: {
    gap: 12,
  },
  errorText: {
    color: '#B42318',
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 19,
  },
});
