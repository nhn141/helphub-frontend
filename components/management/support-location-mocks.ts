export const supportLocationCategories = [
  { label: 'Food Support', value: 'FOOD' },
  { label: 'Medical', value: 'MED' },
  { label: 'Transport', value: 'TRN' },
  { label: 'Shelter', value: 'SHEL' },
];

export const supportLocationSummaries = [
  {
    name: 'District 7 Coordination Hub',
    categoryName: 'Food Support',
    address: '122 Nguyen Van Linh, Ho Chi Minh City',
    contactPhone: '+84 901 567 890',
    isActive: true,
    assignedRequests: 4,
    createdAt: '2026-04-18 09:20',
  },
  {
    name: 'Central Volunteer Station',
    categoryName: 'Medical',
    address: '85 Hai Ba Trung, Da Nang',
    contactPhone: '+84 902 345 678',
    isActive: true,
    assignedRequests: 3,
    createdAt: '2026-04-19 10:00',
  },
  {
    name: 'Thu Duc Community Point',
    categoryName: 'Transport',
    address: '14 Vo Van Ngan, Thu Duc City',
    contactPhone: '+84 903 222 111',
    isActive: false,
    assignedRequests: 1,
    createdAt: '2026-04-20 08:45',
  },
];

export const supportLocationDetail = {
  name: 'District 7 Coordination Hub',
  description:
    'Community support point for meal packing, temporary storage, and volunteer coordination in the southern area.',
  categoryName: 'Food Support',
  address: '122 Nguyen Van Linh, Ho Chi Minh City',
  contactPhone: '+84 901 567 890',
  bankName: 'Vietcombank',
  bankAccountNumber: '0123 456 789',
  isActive: true,
  createdAt: '2026-04-18 09:20',
  updatedAt: '2026-04-22 11:10',
  assignedRequests: 4,
};

export const assignableSupportRequests = [
  {
    title: 'Food packs for flood recovery team',
    requesterName: 'Hoa Nguyen',
    address: 'Hoi An',
    status: 'APPROVED',
  },
  {
    title: 'School supplies for community class',
    requesterName: 'Lan Pham',
    address: 'Thu Duc City',
    status: 'APPROVED',
  },
  {
    title: 'Wheelchair transport to clinic',
    requesterName: 'Bao Le',
    address: 'District 3',
    status: 'APPROVED',
  },
];
