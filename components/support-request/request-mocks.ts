export const requestCategories = [
  { id: '5e96f000-fb31-4f6f-b4de-95b76a072001', name: 'Medical' },
  { id: '5e96f000-fb31-4f6f-b4de-95b76a072002', name: 'Food Support' },
  { id: '5e96f000-fb31-4f6f-b4de-95b76a072003', name: 'Education' },
  { id: '5e96f000-fb31-4f6f-b4de-95b76a072004', name: 'Transport' },
];

export const supportLocations = [
  {
    id: '8bc7109a-b2a7-4b06-a44c-42bfde0c1001',
    name: 'District 7 Coordination Hub',
    address: '122 Nguyen Van Linh, Ho Chi Minh City',
  },
  {
    id: '8bc7109a-b2a7-4b06-a44c-42bfde0c1002',
    name: 'Central Volunteer Station',
    address: '85 Hai Ba Trung, Da Nang',
  },
  {
    id: '8bc7109a-b2a7-4b06-a44c-42bfde0c1003',
    name: 'Thu Duc Community Point',
    address: '14 Vo Van Ngan, Thu Duc City',
  },
];

export const requestSummaries = [
  {
    id: '7c71f3bd-c4dc-4d9b-a1b4-4315dfef0001',
    title: 'School supplies for community class',
    requesterName: 'Lan Pham',
    categoryName: 'Education',
    status: 'APPROVED',
    address: 'Thu Duc City',
    latitude: 10.8494,
    longitude: 106.7718,
    createdAt: '2026-04-21 09:15',
  },
  {
    id: '7c71f3bd-c4dc-4d9b-a1b4-4315dfef0002',
    title: 'Wheelchair transport to clinic',
    requesterName: 'Bao Le',
    categoryName: 'Transport',
    status: 'PENDING',
    address: 'District 3',
    latitude: 10.7844,
    longitude: 106.6841,
    createdAt: '2026-04-21 11:20',
  },
  {
    id: '7c71f3bd-c4dc-4d9b-a1b4-4315dfef0003',
    title: 'Food packs for flood recovery team',
    requesterName: 'Hoa Nguyen',
    categoryName: 'Food Support',
    status: 'IN_PROGRESS',
    address: 'Hoi An',
    latitude: 15.8801,
    longitude: 108.338,
    createdAt: '2026-04-22 07:50',
  },
];

export const myRequestSummaries = [
  {
    id: '7c71f3bd-c4dc-4d9b-a1b4-4315dfef1001',
    title: 'Medicine pickup for elderly resident',
    requesterName: 'Nguyen Hoang',
    categoryName: 'Medical',
    status: 'PENDING',
    address: 'Binh Thanh District',
    latitude: 10.8032,
    longitude: 106.7131,
    createdAt: '2026-04-22 08:10',
  },
  {
    id: '7c71f3bd-c4dc-4d9b-a1b4-4315dfef1002',
    title: 'Meal support for temporary shelter',
    requesterName: 'Nguyen Hoang',
    categoryName: 'Food Support',
    status: 'REJECTED',
    address: 'District 8',
    latitude: 10.7402,
    longitude: 106.6335,
    createdAt: '2026-04-20 14:45',
  },
  {
    id: '7c71f3bd-c4dc-4d9b-a1b4-4315dfef1003',
    title: 'Transport to rehabilitation center',
    requesterName: 'Nguyen Hoang',
    categoryName: 'Transport',
    status: 'APPROVED',
    address: 'Go Vap District',
    latitude: 10.8356,
    longitude: 106.6688,
    createdAt: '2026-04-19 10:05',
  },
];

export const requestDetail = {
  id: '7c71f3bd-c4dc-4d9b-a1b4-4315dfef0003',
  title: 'Food packs for flood recovery team',
  description:
    'The local team needs packaged meals, bottled water, and two volunteers to support evening distribution for families returning to the area.',
  categoryId: '5e96f000-fb31-4f6f-b4de-95b76a072002',
  categoryName: 'Food Support',
  requesterId: '36b6f1a2-3f20-46d4-b149-bdb781001001',
  requesterName: 'Hoa Nguyen',
  assignedSupportLocationId: '8bc7109a-b2a7-4b06-a44c-42bfde0c1002',
  assignedSupportLocationName: 'Central Volunteer Station',
  status: 'IN_PROGRESS',
  latitude: 15.8801,
  longitude: 108.338,
  address: '27 Nguyen Truong To, Hoi An',
  reviewedBy: '12c8108b-a8a1-4fc4-a0d2-1cc072e77001',
  reviewedAt: '2026-04-22 09:40',
  rejectionReason: '',
  createdAt: '2026-04-22 07:50',
  updatedAt: '2026-04-22 10:05',
};
