import { Feather } from '@expo/vector-icons';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { Fonts } from '@/constants/theme';

type ToastType = 'success' | 'error' | 'info';

type ToastOptions = {
  duration?: number;
  message: string;
  title?: string;
  type?: ToastType;
};

type ActiveToast = {
  duration: number;
  id: number;
  message: string;
  title?: string;
  type: ToastType;
};

type ToastContextValue = {
  hideToast: () => void;
  showToast: (toast: ToastOptions | string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toastTone: Record<
  ToastType,
  {
    borderColor: string;
    icon: keyof typeof Feather.glyphMap;
    iconColor: string;
    surface: string;
    title: string;
  }
> = {
  error: {
    borderColor: '#F3B6B2',
    icon: 'alert-circle',
    iconColor: '#AE3F3A',
    surface: '#FDE7E6',
    title: 'Something went wrong',
  },
  info: {
    borderColor: '#B8D7F7',
    icon: 'info',
    iconColor: '#2A5EAA',
    surface: '#E8F3FF',
    title: 'Notice',
  },
  success: {
    borderColor: '#BDE7CF',
    icon: 'check-circle',
    iconColor: '#0B6D49',
    surface: '#E4F7EB',
    title: 'Success',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;
  const toastIdRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearToastTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const hideToast = useCallback(() => {
    clearToastTimeout();

    Animated.parallel([
      Animated.timing(opacity, {
        duration: 150,
        easing: Easing.out(Easing.quad),
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        duration: 150,
        easing: Easing.out(Easing.quad),
        toValue: -12,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setToast(null);
      }
    });
  }, [clearToastTimeout, opacity, translateY]);

  const showToast = useCallback(
    (nextToast: ToastOptions | string) => {
      const options = typeof nextToast === 'string' ? { message: nextToast } : nextToast;
      const next: ActiveToast = {
        duration: options.duration ?? 2800,
        id: toastIdRef.current + 1,
        message: options.message,
        title: options.title,
        type: options.type ?? 'info',
      };

      toastIdRef.current = next.id;
      clearToastTimeout();
      opacity.stopAnimation();
      translateY.stopAnimation();
      opacity.setValue(0);
      translateY.setValue(-12);
      setToast(next);
      AccessibilityInfo.announceForAccessibility(
        `${next.title ?? toastTone[next.type].title}. ${next.message}`
      );

      Animated.parallel([
        Animated.timing(opacity, {
          duration: 180,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          duration: 180,
          easing: Easing.out(Easing.cubic),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();

      timeoutRef.current = setTimeout(hideToast, next.duration);
    },
    [clearToastTimeout, hideToast, opacity, translateY]
  );

  useEffect(() => clearToastTimeout, [clearToastTimeout]);

  const value = useMemo(() => ({ hideToast, showToast }), [hideToast, showToast]);
  const tone = toast ? toastTone[toast.type] : toastTone.info;

  return (
    <ToastContext.Provider value={value}>
      <View pointerEvents="box-none" style={styles.root}>
        {children}
        {toast ? (
          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.stage,
              {
                opacity,
                paddingTop: Math.max(insets.top, 10) + 8,
                transform: [{ translateY }],
              },
            ]}>
            <Pressable
              accessibilityRole="button"
              onPress={hideToast}
              style={[styles.toast, { backgroundColor: tone.surface, borderColor: tone.borderColor }]}>
              <Feather name={tone.icon} size={18} color={tone.iconColor} />
              <View style={styles.copy}>
                <Text style={styles.title}>{toast.title ?? tone.title}</Text>
                <Text style={styles.message}>{toast.message}</Text>
              </View>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider.');
  }

  return context;
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  message: {
    color: '#4D5A52',
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 18,
  },
  root: {
    flex: 1,
  },
  stage: {
    alignItems: 'center',
    left: 0,
    paddingHorizontal: 16,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 999,
  },
  title: {
    color: '#20382A',
    fontFamily: Fonts.rounded,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  toast: {
    alignItems: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    elevation: 6,
    flexDirection: 'row',
    gap: 10,
    maxWidth: 420,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#0F4B34',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    width: '100%',
  },
});
