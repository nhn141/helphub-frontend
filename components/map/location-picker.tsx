import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { authPalette } from '@/components/auth/auth-ui';
import {
  DEFAULT_MAP_CENTER,
  geocodeAddress,
  normalizeCoordinate,
  type Coordinates,
} from '@/components/map/map-utils';
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
  helperText = 'Search for an address to match it on the map.',
  label = 'Address',
  onAddressChange,
  onCoordinateChange,
}: LocationPickerProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState('');
  const center = coordinate ?? DEFAULT_MAP_CENTER;
  const iframeSource = useMemo(() => getOpenStreetMapEmbed(center), [center]);

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
        {React.createElement('iframe' as any, {
          src: iframeSource,
          style: {
            border: 0,
            height: '100%',
            width: '100%',
          },
          title: 'Selected location map',
        })}
      </View>

      <Text style={styles.helperText}>{message || helperText}</Text>
    </View>
  );
}

function getOpenStreetMapEmbed(center: Coordinates) {
  const latitude = Number(center.latitude);
  const longitude = Number(center.longitude);
  const delta = 0.02;
  const left = longitude - delta;
  const right = longitude + delta;
  const bottom = latitude - delta;
  const top = latitude + delta;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`;
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
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    color: authPalette.muted,
    fontFamily: Fonts.rounded,
  },
});
