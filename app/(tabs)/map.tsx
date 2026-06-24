import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAuthErrorMessage } from '@/components/auth/auth-api';
import { useAuth } from '@/components/auth/auth-provider';
import { authPalette } from '@/components/auth/auth-ui';
import { FilterChip } from '@/components/dashboard/tab-ui';
import {
  getSupportLocations,
  type SupportLocationSummary,
} from '@/components/management/support-location-api';
import {
  calculateDistanceKm,
  fetchRouteCoordinates,
  formatDistance,
  isValidCoordinate,
  openOpenStreetMapDirections,
  type Coordinates,
  type SupportMapItem,
  type SupportMapItemType,
} from '@/components/map/map-utils';
import { SupportMap } from '@/components/map/support-map';
import {
  getSupportRequests,
  type SupportRequestSummary,
} from '@/components/support-request/request-api';
import { Fonts } from '@/constants/theme';

type MapFilter = 'ALL' | SupportMapItemType;
type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

const radiusOptions: { label: string; value: number | null }[] = [
  { label: 'Any distance', value: null },
  { label: '2 km', value: 2 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 },
];

export default function MapTabScreen() {
  const { session } = useAuth();
  const [requests, setRequests] = useState<SupportRequestSummary[]>([]);
  const [locations, setLocations] = useState<SupportLocationSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<MapFilter>('ALL');
  const [radiusFilterKm, setRadiusFilterKm] = useState<number | null>(null);
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinates[]>([]);
  const [routeError, setRouteError] = useState('');
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadMapData = useCallback(async () => {
    if (!session?.accessToken) {
      router.replace('/login' as never);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const [approvedRequests, inProgressRequests, supportLocations] = await Promise.all([
        getSupportRequests(session.accessToken, 'APPROVED'),
        getSupportRequests(session.accessToken, 'IN_PROGRESS'),
        getSupportLocations(session.accessToken, true),
      ]);

      setRequests([...approvedRequests, ...inProgressRequests]);
      setLocations(supportLocations);
    } catch (mapError) {
      setError(getAuthErrorMessage(mapError));
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken]);

  const requestUserLocation = useCallback(async () => {
    setLocationStatus('requesting');

    if (Platform.OS === 'web') {
      if (!('geolocation' in navigator)) {
        setLocationStatus('unavailable');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationStatus('granted');
        },
        () => setLocationStatus('denied'),
        { enableHighAccuracy: true, maximumAge: 60000, timeout: 9000 }
      );
      return;
    }

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setLocationStatus('denied');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setLocationStatus('granted');
    } catch {
      setLocationStatus('unavailable');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadMapData();
    }, [loadMapData])
  );

  useEffect(() => {
    void requestUserLocation();
  }, [requestUserLocation]);

  const items = useMemo<SupportMapItem[]>(() => {
    const requestItems = requests
      .filter((request) => isValidCoordinate(request.latitude, request.longitude))
      .map((request) => createMapItem({
        id: request.id,
        latitude: Number(request.latitude),
        longitude: Number(request.longitude),
        status: request.status,
        subtitle: request.address ?? request.categoryName,
        title: request.title,
        type: 'REQUEST',
        userLocation,
      }));

    const locationItems = locations
      .filter((location) => isValidCoordinate(location.latitude, location.longitude))
      .map((location) => createMapItem({
        id: location.id,
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
        status: location.isActive ? 'ACTIVE' : 'INACTIVE',
        subtitle: location.address,
        title: location.name,
        type: 'LOCATION',
        userLocation,
      }));

    return [...requestItems, ...locationItems].sort((left, right) => {
      if (left.distanceKm === undefined && right.distanceKm === undefined) {
        return left.title.localeCompare(right.title);
      }

      if (left.distanceKm === undefined) {
        return 1;
      }

      if (right.distanceKm === undefined) {
        return -1;
      }

      return left.distanceKm - right.distanceKm;
    });
  }, [locations, requests, userLocation]);

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      const matchesType = filter === 'ALL' || item.type === filter;
      const matchesQuery =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query);
      const matchesRadius =
        radiusFilterKm === null ||
        (item.distanceKm !== undefined && item.distanceKm <= radiusFilterKm);

      return matchesType && matchesQuery && matchesRadius;
    });
  }, [filter, items, radiusFilterKm, searchQuery]);

  const selectedItem = useMemo(
    () => visibleItems.find((item) => item.key === selectedItemKey) ?? visibleItems[0] ?? null,
    [selectedItemKey, visibleItems]
  );

  useEffect(() => {
    if (selectedItem?.key === selectedItemKey) {
      return;
    }

    setSelectedItemKey(selectedItem?.key ?? null);
  }, [selectedItem, selectedItemKey]);

  function handleSelectItem(item: SupportMapItem) {
    setSelectedItemKey(item.key);
    setRouteCoordinates([]);
    setRouteError('');
  }

  async function handleRoute(item: SupportMapItem) {
    if (!userLocation) {
      setRouteError('Enable location before calculating a route.');
      return;
    }

    setSelectedItemKey(item.key);
    setIsRouteLoading(true);
    setRouteError('');

    try {
      setRouteCoordinates(await fetchRouteCoordinates(userLocation, item));
    } catch (routeFailure) {
      setRouteCoordinates([userLocation, item]);
      setRouteError(routeFailure instanceof Error ? routeFailure.message : 'Route service is unavailable.');
    } finally {
      setIsRouteLoading(false);
    }
  }

  function openItem(item: SupportMapItem) {
    if (item.type === 'REQUEST') {
      router.push({ pathname: '/support-request-detail', params: { id: item.id } } as never);
      return;
    }

    router.push({ pathname: '/support-location-detail', params: { id: item.id } } as never);
  }

  return (
    <View style={styles.screen}>
      <SupportMap
        items={visibleItems}
        onSelectItem={handleSelectItem}
        routeCoordinates={routeCoordinates}
        selectedItemKey={selectedItem?.key ?? null}
        userLocation={userLocation}
      />

      <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
        <View style={styles.topPanel}>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.eyebrow}>Support map</Text>
              <Text style={styles.title}>Nearby help</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={loadMapData} style={styles.iconButton}>
              <Feather name="refresh-cw" size={17} color={authPalette.primaryDark} />
            </Pressable>
          </View>

          <View style={styles.searchShell}>
            <Feather name="search" size={16} color={authPalette.muted} />
            <TextInput
              onChangeText={setSearchQuery}
              placeholder="Search requests or locations"
              placeholderTextColor="#8E9B91"
              style={styles.searchInput}
              value={searchQuery}
            />
            {searchQuery ? (
              <Pressable accessibilityRole="button" onPress={() => setSearchQuery('')}>
                <Feather name="x" size={16} color={authPalette.muted} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.filterRow}>
            {(['ALL', 'REQUEST', 'LOCATION'] as const).map((value) => (
              <FilterChip
                active={filter === value}
                key={value}
                label={value === 'ALL' ? 'All' : value === 'REQUEST' ? 'Requests' : 'Locations'}
                onPress={() => setFilter(value)}
              />
            ))}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.radiusRow}>
            {radiusOptions.map((option) => (
              <Pressable
                accessibilityRole="button"
                disabled={option.value !== null && !userLocation}
                key={option.label}
                onPress={() => setRadiusFilterKm(option.value)}
                style={[
                  styles.radiusChip,
                  radiusFilterKm === option.value && styles.radiusChipActive,
                  option.value !== null && !userLocation && styles.disabledChip,
                ]}>
                <Text style={[styles.radiusText, radiusFilterKm === option.value && styles.radiusTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {locationStatus !== 'granted' ? (
            <View style={styles.noticeRow}>
              <Feather
                name={locationStatus === 'denied' ? 'map-pin' : 'navigation'}
                size={15}
                color={locationStatus === 'denied' ? '#B94540' : authPalette.primaryDark}
              />
              <Text style={styles.noticeText}>
                {locationStatus === 'requesting'
                  ? 'Requesting location permission...'
                  : 'Enable location to sort by distance and draw routes.'}
              </Text>
              <Pressable accessibilityRole="button" onPress={requestUserLocation}>
                <Text style={styles.noticeAction}>Enable</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.legend}>
          <LegendDot color="#B94540" label="Request" />
          <LegendDot color="#1C6D49" label="Location" />
          <LegendDot color="#F07F5A" label="Selected" />
        </View>

        <View style={styles.bottomPanel}>
          {error ? (
            <View style={styles.messageCard}>
              <Text style={styles.messageTitle}>Could not load map data</Text>
              <Text style={styles.messageText}>{error}</Text>
            </View>
          ) : isLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={authPalette.primaryDark} />
              <Text style={styles.messageText}>Loading map data...</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardScroller}>
              {visibleItems.map((item) => (
                <Pressable
                  accessibilityRole="button"
                  key={item.key}
                  onPress={() => handleSelectItem(item)}
                  style={[styles.itemCard, selectedItem?.key === item.key && styles.itemCardActive]}>
                  <View style={styles.itemTop}>
                    <View style={[styles.typeDot, { backgroundColor: item.type === 'REQUEST' ? '#B94540' : '#1C6D49' }]} />
                    <Text style={styles.itemType}>{item.type === 'REQUEST' ? 'Support request' : 'Support location'}</Text>
                    <Text style={styles.distanceText}>{item.distanceLabel}</Text>
                  </View>
                  <Text numberOfLines={1} style={styles.itemTitle}>{item.title}</Text>
                  <Text numberOfLines={2} style={styles.itemSubtitle}>{item.subtitle}</Text>
                  <View style={styles.actionRow}>
                    <Pressable accessibilityRole="button" onPress={() => openItem(item)} style={styles.detailButton}>
                      <Feather name="external-link" size={14} color={authPalette.primaryDark} />
                      <Text style={styles.detailButtonText}>Detail</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" onPress={() => handleRoute(item)} style={styles.routeButton}>
                      <Feather name="navigation" size={14} color="#FFFFFF" />
                      <Text style={styles.routeButtonText}>{isRouteLoading && selectedItem?.key === item.key ? 'Routing...' : 'Route'}</Text>
                    </Pressable>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => openOpenStreetMapDirections(item, userLocation)}
                    style={styles.openMapLink}>
                    <Text style={styles.openMapText}>Open in OpenStreetMap</Text>
                  </Pressable>
                </Pressable>
              ))}
              {visibleItems.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.messageTitle}>No map items found</Text>
                  <Text style={styles.messageText}>Try changing the search, type, or distance filter.</Text>
                </View>
              ) : null}
            </ScrollView>
          )}

          {routeError ? <Text style={styles.routeError}>{routeError}</Text> : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

function createMapItem({
  id,
  latitude,
  longitude,
  status,
  subtitle,
  title,
  type,
  userLocation,
}: {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  subtitle: string;
  title: string;
  type: SupportMapItemType;
  userLocation: Coordinates | null;
}): SupportMapItem {
  const target = { latitude, longitude };
  const distanceKm = userLocation ? calculateDistanceKm(userLocation, target) : undefined;

  return {
    ...target,
    distanceKm,
    distanceLabel: formatDistance(distanceKm),
    id,
    key: `${type}-${id}`,
    status,
    subtitle,
    title,
    type,
  };
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  bottomPanel: {
    bottom: 88,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  cardScroller: {
    gap: 12,
    paddingHorizontal: 16,
  },
  detailButton: {
    alignItems: 'center',
    backgroundColor: '#EEF7F0',
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 36,
  },
  detailButtonText: {
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontSize: 12,
  },
  disabledChip: {
    opacity: 0.45,
  },
  distanceText: {
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontSize: 12,
    marginLeft: 'auto',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE8DF',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 126,
    padding: 16,
    width: 260,
  },
  eyebrow: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#EEF7F0',
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE8DF',
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#0F4B34',
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    width: 270,
  },
  itemCardActive: {
    borderColor: '#F07F5A',
    borderWidth: 1.5,
  },
  itemSubtitle: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    minHeight: 36,
  },
  itemTitle: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 16,
    marginTop: 8,
  },
  itemTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  itemType: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 11,
  },
  legend: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 10,
    left: 16,
    paddingHorizontal: 11,
    paddingVertical: 8,
    position: 'absolute',
    top: 248,
  },
  legendDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  legendText: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 11,
  },
  loadingCard: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    minHeight: 78,
    paddingHorizontal: 18,
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginHorizontal: 16,
    padding: 16,
  },
  messageText: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 13,
    lineHeight: 19,
  },
  messageTitle: {
    color: authPalette.text,
    fontFamily: Fonts.rounded,
    fontSize: 15,
    marginBottom: 4,
  },
  noticeAction: {
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontSize: 12,
  },
  noticeRow: {
    alignItems: 'center',
    backgroundColor: '#F4FAF5',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    minHeight: 38,
    paddingHorizontal: 10,
  },
  noticeText: {
    color: authPalette.muted,
    flex: 1,
    fontFamily: Fonts.rounded,
    fontSize: 12,
    lineHeight: 17,
  },
  openMapLink: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  openMapText: {
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontSize: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  radiusChip: {
    backgroundColor: '#EEF2EF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  radiusChipActive: {
    backgroundColor: authPalette.primaryDark,
  },
  radiusRow: {
    gap: 8,
    paddingRight: 2,
  },
  radiusText: {
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
    fontSize: 12,
  },
  radiusTextActive: {
    color: '#FFFFFF',
  },
  routeButton: {
    alignItems: 'center',
    backgroundColor: authPalette.primaryDark,
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 36,
  },
  routeButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
    fontSize: 12,
  },
  routeError: {
    alignSelf: 'flex-start',
    backgroundColor: '#FDE7E6',
    borderRadius: 8,
    color: '#A33D38',
    fontFamily: Fonts.rounded,
    fontSize: 12,
    lineHeight: 17,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  screen: {
    backgroundColor: '#DDEAE1',
    flex: 1,
  },
  searchInput: {
    color: authPalette.text,
    flex: 1,
    fontFamily: Fonts.rounded,
    fontSize: 14,
    minWidth: 0,
    paddingVertical: 0,
  },
  searchShell: {
    alignItems: 'center',
    backgroundColor: '#F4FAF5',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 9,
    minHeight: 44,
    paddingHorizontal: 11,
  },
  title: {
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
    fontSize: 21,
    marginTop: 2,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topPanel: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 8,
    gap: 10,
    left: 16,
    padding: 12,
    position: 'absolute',
    right: 16,
    top: 12,
    shadowColor: '#0F4B34',
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  typeDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
});
