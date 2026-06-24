import { Linking } from 'react-native';
import * as polyline from '@mapbox/polyline';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type GeocodedPlace = Coordinates & {
  address: string;
};

export type SupportMapItemType = 'REQUEST' | 'LOCATION';

export type SupportMapItem = Coordinates & {
  id: string;
  key: string;
  type: SupportMapItemType;
  title: string;
  subtitle: string;
  status: string;
  distanceKm?: number;
  distanceLabel: string;
};

export const DEFAULT_MAP_CENTER: Coordinates = {
  latitude: 10.8231,
  longitude: 106.6297,
};

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function isValidCoordinate(latitude: number | null | undefined, longitude: number | null | undefined) {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  );
}

export function normalizeCoordinate(coordinate: Coordinates): Coordinates {
  return {
    latitude: Number(coordinate.latitude.toFixed(6)),
    longitude: Number(coordinate.longitude.toFixed(6)),
  };
}

export async function geocodeAddress(address: string): Promise<GeocodedPlace> {
  const query = address.trim();

  if (!query) {
    throw new Error('Enter an address to search.');
  }

  const url =
    'https://nominatim.openstreetmap.org/search' +
    `?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
    },
  });

  if (!response.ok) {
    throw new Error('Could not search this address.');
  }

  const payload = await response.json();
  const result = Array.isArray(payload) ? payload[0] : null;
  const latitude = Number(result?.lat);
  const longitude = Number(result?.lon);

  if (!isValidCoordinate(latitude, longitude)) {
    throw new Error('No matching map location was found.');
  }

  return {
    address: typeof result?.display_name === 'string' ? result.display_name : query,
    latitude,
    longitude,
  };
}

export async function reverseGeocodeCoordinates(coordinate: Coordinates): Promise<string | null> {
  const normalized = normalizeCoordinate(coordinate);
  const url =
    'https://nominatim.openstreetmap.org/reverse' +
    `?format=jsonv2&lat=${normalized.latitude}&lon=${normalized.longitude}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  return typeof payload?.display_name === 'string' ? payload.display_name : null;
}

export function calculateDistanceKm(from: Coordinates, to: Coordinates) {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number | undefined) {
  if (!Number.isFinite(km)) {
    return 'Distance unavailable';
  }

  if ((km ?? 0) < 1) {
    return `${Math.round((km ?? 0) * 1000)} m`;
  }

  return `${(km ?? 0).toFixed((km ?? 0) < 10 ? 1 : 0)} km`;
}

export async function fetchRouteCoordinates(origin: Coordinates, target: Coordinates) {
  const url =
    'https://router.project-osrm.org/route/v1/driving/' +
    `${origin.longitude},${origin.latitude};${target.longitude},${target.latitude}` +
    '?overview=full&geometries=polyline';
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Could not calculate route.');
  }

  const payload = await response.json();
  const geometry = payload?.routes?.[0]?.geometry;

  if (typeof geometry !== 'string') {
    throw new Error('No route found for this destination.');
  }

  const route = polyline.decode(geometry).map(([latitude, longitude]) => ({ latitude, longitude }));

  return route.length > 0 ? route : [origin, target];
}

export async function openOpenStreetMapDirections(target: Coordinates, origin?: Coordinates | null) {
  const url = origin
    ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${origin.latitude}%2C${origin.longitude}%3B${target.latitude}%2C${target.longitude}`
    : `https://www.openstreetmap.org/?mlat=${target.latitude}&mlon=${target.longitude}#map=16/${target.latitude}/${target.longitude}`;

  await Linking.openURL(url);
}
