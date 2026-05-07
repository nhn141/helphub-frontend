export type AppRole = 'REQUESTER' | 'VOLUNTEER' | 'COLLABORATOR' | 'ADMIN';

export const defaultDemoRole: AppRole = 'VOLUNTEER';

export const demoRoleOptions: { label: string; value: AppRole }[] = [
  { label: 'Requester', value: 'REQUESTER' },
  { label: 'Volunteer', value: 'VOLUNTEER' },
  { label: 'Collaborator', value: 'COLLABORATOR' },
  { label: 'Admin', value: 'ADMIN' },
];

export function canCreateRequests(role: AppRole) {
  return role === 'REQUESTER';
}

export function canReviewRequests(role: AppRole) {
  return role === 'ADMIN' || role === 'COLLABORATOR';
}

export function canManageCategories(role: AppRole) {
  return role === 'ADMIN';
}

export function canManageSupportLocations(role: AppRole) {
  return role === 'COLLABORATOR';
}

export function canManageUsers(role: AppRole) {
  return role === 'ADMIN';
}

export function canViewVolunteerPosts(role: AppRole) {
  return role === 'VOLUNTEER' || role === 'ADMIN' || role === 'COLLABORATOR';
}

export function getRoleTone(role: AppRole): 'green' | 'amber' | 'slate' {
  if (role === 'COLLABORATOR') {
    return 'amber';
  }

  if (role === 'ADMIN') {
    return 'slate';
  }

  return 'green';
}
