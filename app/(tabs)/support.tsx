import { useLocalSearchParams } from 'expo-router';

import RequestsTabScreen from '@/app/(tabs)/requests';
import SupportLocationsTabScreen from '@/app/(tabs)/support-locations';
import { useDemoRole } from '@/components/demo-role/demo-role-provider';
import { canManageSupportLocations } from '@/constants/role-access';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function SupportTabScreen() {
  const params = useLocalSearchParams();
  const { role } = useDemoRole();
  const view = getStringParam(params.view);

  if (view === 'locations' && canManageSupportLocations(role)) {
    return <SupportLocationsTabScreen />;
  }

  return <RequestsTabScreen />;
}
