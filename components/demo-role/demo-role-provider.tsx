import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/components/auth/auth-provider';
import { AppRole, defaultDemoRole } from '@/constants/role-access';

type DemoRoleContextValue = {
  role: AppRole;
  setRole: (role: AppRole) => void;
};

const DemoRoleContext = createContext<DemoRoleContextValue | null>(null);

export function DemoRoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole>(defaultDemoRole);
  const activeRole = user?.role ?? role;

  const value = useMemo(
    () => ({
      role: activeRole,
      setRole,
    }),
    [activeRole]
  );

  return <DemoRoleContext.Provider value={value}>{children}</DemoRoleContext.Provider>;
}

export function useDemoRole() {
  const context = useContext(DemoRoleContext);

  if (!context) {
    throw new Error('useDemoRole must be used within DemoRoleProvider');
  }

  return context;
}
