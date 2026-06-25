import { Image } from 'expo-image';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { authPalette } from '@/components/auth/auth-ui';
import { OpenableImage } from '@/components/media/image-viewer';
import { Fonts } from '@/constants/theme';

type UserAvatarProps = {
  backgroundColor?: string;
  fallback?: string;
  name?: string | null;
  openable?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
  textColor?: string;
  textSize?: number;
  uri?: string | null;
};

export function getUserInitials(value?: string | null, fallback = 'HH') {
  const initials = (value ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return initials || fallback;
}

export function UserAvatar({
  backgroundColor = '#E6F4EB',
  fallback = 'HH',
  name,
  openable = true,
  size = 44,
  style,
  textColor = authPalette.primaryDark,
  textSize,
  uri,
}: UserAvatarProps) {
  const label = name?.trim() || 'User';
  const initials = getUserInitials(name, fallback);
  const avatarStyle = [
    styles.avatar,
    {
      backgroundColor,
      borderRadius: size / 2,
      height: size,
      width: size,
    },
    style,
  ];

  if (uri && openable) {
    return (
      <View style={avatarStyle}>
        <OpenableImage
          accessibilityLabel={`${label} avatar`}
          altText={`${label} avatar`}
          style={styles.image}
          uri={uri}
        />
      </View>
    );
  }

  if (uri) {
    return (
      <View style={avatarStyle}>
        <Image
          accessibilityLabel={`${label} avatar`}
          contentFit="cover"
          source={{ uri }}
          style={styles.image}
        />
      </View>
    );
  }

  return (
    <View style={avatarStyle}>
      <Text
        numberOfLines={1}
        style={[
          styles.initials,
          {
            color: textColor,
            fontSize: textSize ?? Math.max(12, Math.round(size * 0.38)),
          },
        ]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  initials: {
    fontFamily: Fonts.rounded,
    fontWeight: '700',
  },
});
