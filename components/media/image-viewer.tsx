import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

type FullScreenImageViewerProps = {
  altText?: string | null;
  onClose: () => void;
  uri: string | null;
  visible: boolean;
};

type OpenableImageProps = {
  accessibilityLabel?: string;
  altText?: string | null;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  style: StyleProp<ViewStyle>;
  uri: string;
};

export function FullScreenImageViewer({
  altText,
  onClose,
  uri,
  visible,
}: FullScreenImageViewerProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
          <Feather name="x" size={24} color="#FFFFFF" />
        </Pressable>
        {uri ? (
          <Image
            accessibilityLabel={altText ?? 'Image preview'}
            contentFit="contain"
            source={{ uri }}
            style={styles.fullImage}
          />
        ) : null}
        {altText ? (
          <View style={styles.captionWrap}>
            <Text numberOfLines={2} style={styles.caption}>
              {altText}
            </Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

export function OpenableImage({
  accessibilityLabel,
  altText,
  contentFit = 'cover',
  style,
  uri,
}: OpenableImageProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="imagebutton"
        onPress={() => setIsViewerOpen(true)}
        style={style}>
        <Image
          accessibilityLabel={accessibilityLabel ?? altText ?? 'Image'}
          contentFit={contentFit}
          source={{ uri }}
          style={StyleSheet.absoluteFill}
        />
      </Pressable>
      <FullScreenImageViewer
        altText={altText ?? accessibilityLabel}
        onClose={() => setIsViewerOpen(false)}
        uri={uri}
        visible={isViewerOpen}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.94)',
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    position: 'absolute',
    right: 18,
    top: 46,
    width: 40,
    zIndex: 2,
  },
  fullImage: {
    height: '86%',
    width: '100%',
  },
  captionWrap: {
    bottom: 24,
    left: 18,
    position: 'absolute',
    right: 18,
  },
  caption: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
