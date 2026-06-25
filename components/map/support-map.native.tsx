import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, type LatLng } from 'react-native-maps';

import { DEFAULT_MAP_CENTER, type Coordinates, type SupportMapItem } from '@/components/map/map-utils';

type SupportMapProps = {
  items: SupportMapItem[];
  routeCoordinates: Coordinates[];
  selectedItemKey: string | null;
  userLocation: Coordinates | null;
  onSelectItem: (item: SupportMapItem) => void;
};

export function SupportMap({
  items,
  onSelectItem,
  routeCoordinates,
  selectedItemKey,
  userLocation,
}: SupportMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const initialRegion = useMemo(
    () => ({
      latitude: userLocation?.latitude ?? items[0]?.latitude ?? DEFAULT_MAP_CENTER.latitude,
      latitudeDelta: 0.08,
      longitude: userLocation?.longitude ?? items[0]?.longitude ?? DEFAULT_MAP_CENTER.longitude,
      longitudeDelta: 0.08,
    }),
    [items, userLocation]
  );

  useEffect(() => {
    const targetCoordinates: LatLng[] = routeCoordinates.length > 1
      ? routeCoordinates
      : [
          ...(userLocation ? [userLocation] : []),
          ...items.map((item) => ({ latitude: item.latitude, longitude: item.longitude })),
        ];

    if (targetCoordinates.length === 0) {
      return;
    }

    mapRef.current?.fitToCoordinates(targetCoordinates, {
      animated: true,
      edgePadding: { bottom: 230, left: 40, right: 40, top: 190 },
    });
  }, [items, routeCoordinates, userLocation]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        initialRegion={initialRegion}
        mapPadding={{ bottom: 220, left: 12, right: 12, top: 180 }}
        showsCompass
        showsMyLocationButton={false}
        showsUserLocation={Boolean(userLocation)}
        style={styles.map}>
        {userLocation ? (
          <Marker
            coordinate={userLocation}
            identifier="current-location"
            pinColor="#1D8E5A"
            title="Current location"
          />
        ) : null}

        {items.map((item) => (
          <Marker
            coordinate={{ latitude: item.latitude, longitude: item.longitude }}
            identifier={item.key}
            key={item.key}
            onPress={() => onSelectItem(item)}
            pinColor={getPinColor(item, item.key === selectedItemKey)}
            title={item.title}
            description={item.subtitle}
          />
        ))}

        {routeCoordinates.length > 1 ? (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#1C6D49"
            strokeWidth={5}
          />
        ) : null}
      </MapView>
    </View>
  );
}

function getPinColor(item: SupportMapItem, selected: boolean) {
  if (selected) {
    return '#F07F5A';
  }

  return item.type === 'REQUEST' ? '#B94540' : '#1C6D49';
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
