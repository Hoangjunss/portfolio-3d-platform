export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const SERVICES: ServiceItem[] = [
  {
    id: 'svc-strategy',
    title: 'Business Strategy',
    description: 'Market entry, growth planning, and operating-model design for mid-market and enterprise clients.',
    icon: 'compass',
  },
  {
    id: 'svc-finance',
    title: 'Financial Advisory',
    description: 'Budgeting, cost optimization, and investment-readiness support for scaling organizations.',
    icon: 'chart-line',
  },
  {
    id: 'svc-hr',
    title: 'HR & Organization Design',
    description: 'Org structure, compensation benchmarking, and change-management programs.',
    icon: 'users',
  },
  {
    id: 'svc-it',
    title: 'IT & Digital Transformation',
    description: 'Systems modernization roadmaps and vendor selection support for legacy enterprises.',
    icon: 'cpu',
  },
  {
    id: 'svc-legal',
    title: 'Regulatory & Compliance',
    description: 'Licensing, corporate governance, and cross-border compliance advisory.',
    icon: 'shield-check',
  },
];

export interface LeaderItem {
  id: string;
  name: string;
  role: string;
  photo?: string;
}

export const LEADERSHIP: LeaderItem[] = [
  { id: 'lead-1', name: 'Nguyễn Minh Anh', role: 'Managing Partner' },
  { id: 'lead-2', name: 'Trần Quốc Bảo', role: 'Head of Financial Advisory' },
  { id: 'lead-3', name: 'Lê Thị Hương', role: 'Head of People & Culture' },
  { id: 'lead-4', name: 'Phạm Đức Long', role: 'Head of Digital Transformation' },
];
