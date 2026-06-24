import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

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
  selectedItemKey,
  userLocation,
}: SupportMapProps) {
  const selectedItem = useMemo(
    () => items.find((item) => item.key === selectedItemKey) ?? items[0],
    [items, selectedItemKey]
  );
  const center = selectedItem ?? userLocation ?? DEFAULT_MAP_CENTER;
  const iframeSource = getOpenStreetMapEmbed(center);

  return (
    <View style={styles.webFallback}>
      {React.createElement('iframe' as any, {
        src: iframeSource,
        style: {
          border: 0,
          height: '100%',
          width: '100%',
        },
        title: 'HelpHub support map',
      })}
    </View>
  );
}

function getOpenStreetMapEmbed(center: Coordinates) {
  const latitude = Number(center.latitude);
  const longitude = Number(center.longitude);
  const delta = 0.03;
  const left = longitude - delta;
  const right = longitude + delta;
  const bottom = latitude - delta;
  const top = latitude + delta;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

const styles = StyleSheet.create({
  webFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#DFEAE3',
  },
});
