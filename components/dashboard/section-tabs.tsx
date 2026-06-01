import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { authPalette } from '@/components/auth/auth-ui';
import { Fonts } from '@/constants/theme';

type SectionTabItem = {
  active?: boolean;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
};

type SectionTabsProps = {
  items: SectionTabItem[];
};

export function SectionTabs({ items }: SectionTabsProps) {
  return (
    <View style={styles.container}>
      {items.map((item) => {
        const color = item.active ? '#FFFFFF' : authPalette.muted;

        return (
          <Pressable
            accessibilityRole="button"
            key={item.label}
            onPress={item.onPress}
            style={[styles.tab, item.active ? styles.tabActive : styles.tabIdle]}>
            <Feather name={item.icon} size={16} color={color} />
            <Text
              adjustsFontSizeToFit
              numberOfLines={1}
              style={[styles.tabText, item.active && styles.tabTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EAF0EB',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    padding: 4,
  },
  tab: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 42,
    minWidth: 0,
    paddingHorizontal: 10,
  },
  tabActive: {
    backgroundColor: authPalette.primaryDark,
  },
  tabIdle: {
    backgroundColor: 'transparent',
  },
  tabText: {
    color: authPalette.muted,
    flexShrink: 1,
    fontFamily: Fonts.rounded,
    fontSize: 14,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});
