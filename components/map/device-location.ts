import * as Location from 'expo-location';

import { normalizeCoordinate, type Coordinates } from '@/components/map/map-utils';

const CURRENT_LOCATION_TIMEOUT_MS = 12000;
const LAST_KNOWN_MAX_AGE_MS = 10 * 60 * 1000;
const LAST_KNOWN_REQUIRED_ACCURACY_METERS = 2500;

export type DeviceLocationResult = Coordinates & {
  source: 'current' | 'last-known';
};

export class LocationPermissionError extends Error {
  constructor(message = 'Location permission was not granted.') {
    super(message);
    this.name = 'LocationPermissionError';
  }
}

export class LocationServicesError extends Error {
  constructor(message = 'Location services are turned off.') {
    super(message);
    this.name = 'LocationServicesError';
  }
}

export function isLocationPermissionError(error: unknown) {
  return error instanceof LocationPermissionError;
}

export async function getDeviceLocation(): Promise<DeviceLocationResult> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (!permission.granted) {
    throw new LocationPermissionError();
  }

  const lastKnownPromise = getLastKnownLocation();
  const servicesEnabled = await Location.hasServicesEnabledAsync();

  if (!servicesEnabled) {
    const lastKnown = await lastKnownPromise;

    if (lastKnown) {
      return lastKnown;
    }

    throw new LocationServicesError();
  }

  try {
    const position = await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        mayShowUserSettingsDialog: true,
      }),
      CURRENT_LOCATION_TIMEOUT_MS
    );

    return toDeviceLocationResult(position, 'current');
  } catch (error) {
    const lastKnown = await lastKnownPromise;

    if (lastKnown) {
      return lastKnown;
    }

    throw error instanceof Error ? error : new Error('Could not read your current location.');
  }
}

async function getLastKnownLocation() {
  const position = await Location.getLastKnownPositionAsync({
    maxAge: LAST_KNOWN_MAX_AGE_MS,
    requiredAccuracy: LAST_KNOWN_REQUIRED_ACCURACY_METERS,
  }).catch(() => null);

  return position ? toDeviceLocationResult(position, 'last-known') : null;
}

function toDeviceLocationResult(
  position: Location.LocationObject,
  source: DeviceLocationResult['source']
): DeviceLocationResult {
  return {
    ...normalizeCoordinate({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }),
    source,
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeoutId: ReturnType<typeof setTimeout>;

  return new Promise<T>((resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Location request timed out.'));
    }, timeoutMs);

    promise.then(resolve, reject).finally(() => clearTimeout(timeoutId));
  });
}
