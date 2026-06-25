import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { authPalette } from '@/components/auth/auth-ui';
import { Fonts } from '@/constants/theme';

type SectionTabItem = {
  active?: boolean;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
};

type SectionTabsProps = {
  containerStyle?: StyleProp<ViewStyle>;
  iconPlacement?: 'inline' | 'stacked';
  items: SectionTabItem[];
  numberOfLines?: number;
  tabStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function SectionTabs({
  containerStyle,
  iconPlacement = 'inline',
  items,
  numberOfLines = 1,
  tabStyle,
  textStyle,
}: SectionTabsProps) {
  const isStacked = iconPlacement === 'stacked';

  return (
    <View style={[styles.container, containerStyle]}>
      {items.map((item) => {
        const color = item.active ? '#FFFFFF' : authPalette.muted;

        return (
          <Pressable
            accessibilityRole="button"
            key={item.label}
            onPress={item.onPress}
            style={[
              styles.tab,
              isStacked && styles.tabStacked,
              item.active ? styles.tabActive : styles.tabIdle,
              tabStyle,
            ]}>
            <Feather name={item.icon} size={16} color={color} />
            <Text
              adjustsFontSizeToFit={numberOfLines === 1}
              numberOfLines={numberOfLines}
              style={[
                styles.tabText,
                isStacked && styles.tabTextStacked,
                textStyle,
                item.active && styles.tabTextActive,
              ]}>
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
  tabStacked: {
    flexDirection: 'column',
    gap: 5,
    minHeight: 64,
    paddingHorizontal: 6,
    paddingVertical: 8,
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
  tabTextStacked: {
    lineHeight: 17,
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});
