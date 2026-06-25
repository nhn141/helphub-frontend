import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker, type MapPressEvent } from 'react-native-maps';

import { authPalette } from '@/components/auth/auth-ui';
import {
  DEFAULT_MAP_CENTER,
  geocodeAddress,
  normalizeCoordinate,
  reverseGeocodeCoordinates,
  type Coordinates,
} from '@/components/map/map-utils';
import { getDeviceLocation, isLocationPermissionError } from '@/components/map/device-location';
import { Fonts } from '@/constants/theme';

type LocationPickerProps = {
  address: string;
  coordinate: Coordinates | null;
  disabled?: boolean;
  helperText?: string;
  label?: string;
  onAddressChange: (value: string) => void;
  onCoordinateChange: (value: Coordinates | null) => void;
};

export function LocationPicker({
  address,
  coordinate,
  disabled,
  helperText = 'Search for an address, then adjust the pin on the map if needed.',
  label = 'Address',
  onAddressChange,
  onCoordinateChange,
}: LocationPickerProps) {
  const mapRef = useRef<MapView | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [message, setMessage] = useState('');
  const center = coordinate ?? DEFAULT_MAP_CENTER;
  const initialRegion = useMemo(
    () => ({
      latitude: center.latitude,
      latitudeDelta: coordinate ? 0.01 : 0.08,
      longitude: center.longitude,
      longitudeDelta: coordinate ? 0.01 : 0.08,
    }),
    [center.latitude, center.longitude, coordinate]
  );

  useEffect(() => {
    if (!coordinate) {
      return;
    }

    mapRef.current?.animateToRegion(
      {
        latitude: coordinate.latitude,
        latitudeDelta: 0.01,
        longitude: coordinate.longitude,
        longitudeDelta: 0.01,
      },
      350
    );
  }, [coordinate]);

  async function handleSearchAddress() {
    setIsSearching(true);
    setMessage('');

    try {
      const place = await geocodeAddress(address);
      onAddressChange(place.address);
      onCoordinateChange(normalizeCoordinate(place));
      setMessage('Address matched on the map.');
    } catch (searchError) {
      setMessage(searchError instanceof Error ? searchError.message : 'Could not search this address.');
    } finally {
      setIsSearching(false);
    }
  }

  async function applyMapCoordinate(nextCoordinate: Coordinates) {
    const normalized = normalizeCoordinate(nextCoordinate);
    onCoordinateChange(normalized);
    setMessage('Map pin updated.');

    try {
      const matchedAddress = await reverseGeocodeCoordinates(normalized);
      if (matchedAddress) {
        onAddressChange(matchedAddress);
        setMessage('Map pin matched to the nearest address.');
      }
    } catch {
      setMessage('Map pin updated. Address lookup is unavailable.');
    }
  }

  function handleMapPress(event: MapPressEvent) {
    applyMapCoordinate(event.nativeEvent.coordinate);
  }

  async function handleUseCurrentLocation() {
    setIsLocating(true);
    setMessage('');

    try {
      const position = await getDeviceLocation();
      await applyMapCoordinate(position);

      if (position.source === 'last-known') {
        setMessage('Using your last known location. Try again after GPS is ready.');
      }
    } catch (locationError) {
      setMessage(
        isLocationPermissionError(locationError)
          ? 'Location permission was not granted.'
          : locationError instanceof Error
            ? locationError.message
            : 'Could not read your current location.'
      );
    } finally {
      setIsLocating(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.searchRow}>
        <View style={styles.inputShell}>
          <Feather name="map-pin" size={18} color="#6E786F" />
          <TextInput
            editable={!disabled}
            onChangeText={(value) => {
              onAddressChange(value);
              onCoordinateChange(null);
              setMessage('');
            }}
            placeholder="Enter an address"
            placeholderTextColor="#93A095"
            returnKeyType="search"
            style={styles.input}
            value={address}
            onSubmitEditing={handleSearchAddress}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={disabled || isSearching}
          onPress={handleSearchAddress}
          style={[styles.iconButton, (disabled || isSearching) && styles.disabledButton]}>
          <Feather name="search" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.mapFrame}>
        <MapView
          ref={mapRef}
          initialRegion={initialRegion}
          onPress={disabled ? undefined : handleMapPress}
          showsCompass
          showsUserLocation={false}
          style={styles.map}>
          {coordinate ? (
            <Marker
              coordinate={coordinate}
              draggable={!disabled}
              onDragEnd={(event) => applyMapCoordinate(event.nativeEvent.coordinate)}
              pinColor="#1C6D49"
              title="Selected location"
            />
          ) : null}
        </MapView>
      </View>

      <View style={styles.footer}>
        <Text style={styles.helperText}>{message || helperText}</Text>
        <Pressable
          accessibilityRole="button"
          disabled={disabled || isLocating}
          onPress={handleUseCurrentLocation}
          style={[styles.textButton, (disabled || isLocating) && styles.disabledTextButton]}>
          <Feather name="navigation" size={15} color={authPalette.primaryDark} />
          <Text style={styles.textButtonLabel}>{isLocating ? 'Locating...' : 'Use current location'}</Text>
        </Pressable>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  inputShell: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: authPalette.field,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 56,
    color: authPalette.text,
    fontSize: 15,
    fontFamily: Fonts.rounded,
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: authPalette.primaryDark,
  },
  disabledButton: {
    opacity: 0.62,
  },
  mapFrame: {
    height: 260,
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCE7DF',
    backgroundColor: '#DFEAE3',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  footer: {
    gap: 10,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
  textButton: {
    minHeight: 40,
    alignSelf: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BDE7CF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disabledTextButton: {
    opacity: 0.62,
  },
  textButtonLabel: {
    fontSize: 13,
    color: authPalette.primaryDark,
    fontFamily: Fonts.rounded,
  },
});
