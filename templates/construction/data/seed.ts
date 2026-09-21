export interface ConstructionProject {
  id: string;
  title: string;
  category: 'Residential' | 'Commercial' | 'Renovation' | 'Institutional';
  location: string;
  yearCompleted: string;
  description: string;
  photo: { src: string; alt: string };
}

export const PROJECTS: ConstructionProject[] = [
  {
    id: 'proj-riverside-villas',
    title: 'Riverside Villas',
    category: 'Residential',
    location: 'Đông Anh, Hà Nội',
    yearCompleted: '2024',
    description: 'A 12-unit low-rise villa compound with shared landscaped courtyards and passive cross-ventilation.',
    photo: { src: '/projects/riverside-villas.webp', alt: 'Riverside Villas — low-rise residential compound with courtyard landscaping' },
  },
  {
    id: 'proj-tan-phu-logistics',
    title: 'Tân Phú Logistics Hub',
    category: 'Commercial',
    location: 'Bình Dương',
    yearCompleted: '2023',
    description: 'A 14,000m² pre-engineered steel warehouse and distribution center with a dedicated loading yard.',
    photo: { src: '/projects/tan-phu-logistics.webp', alt: 'Tân Phú Logistics Hub — steel-frame warehouse exterior' },
  },
  {
    id: 'proj-lotus-community-center',
    title: 'Lotus Community Center',
    category: 'Institutional',
    location: 'Huế',
    yearCompleted: '2022',
    description: 'A multipurpose community hall with a timber-lattice roof structure referencing traditional pagoda framing.',
    photo: { src: '/projects/lotus-community-center.webp', alt: 'Lotus Community Center — timber-lattice roof over a multipurpose hall' },
  },
  {
    id: 'proj-old-quarter-shophouse',
    title: 'Old Quarter Shophouse Renovation',
    category: 'Renovation',
    location: 'Hoàn Kiếm, Hà Nội',
    yearCompleted: '2024',
    description: 'Structural retrofit and façade restoration of a narrow tube house, preserving its original brick front.',
    photo: { src: '/projects/old-quarter-shophouse.webp', alt: 'Old Quarter Shophouse Renovation — restored brick façade of a tube house' },
  },
  {
    id: 'proj-song-hong-office',
    title: 'Sông Hồng Office Tower',
    category: 'Commercial',
    location: 'Cầu Giấy, Hà Nội',
    yearCompleted: '2023',
    description: 'An 8-story office tower with a perforated aluminum sunshade skin cutting solar gain on the west façade.',
    photo: { src: '/projects/song-hong-office.webp', alt: 'Sông Hồng Office Tower — perforated aluminum sunshade façade' },
  },
  {
    id: 'proj-mekong-clinic',
    title: 'Mekong Delta Rural Clinic',
    category: 'Institutional',
    location: 'Cần Thơ',
    yearCompleted: '2021',
    description: 'A flood-resilient single-story clinic raised on a compacted earth plinth with a wraparound covered walkway.',
    photo: { src: '/projects/mekong-clinic.webp', alt: 'Mekong Delta Rural Clinic — raised single-story clinic with covered walkway' },
  },
  {
    id: 'proj-highland-guesthouse',
    title: 'Highland Guesthouse Extension',
    category: 'Renovation',
    location: 'Đà Lạt',
    yearCompleted: '2022',
    description: 'A 6-room timber-clad extension added to an existing guesthouse, matched to the original pitched-roof profile.',
    photo: { src: '/projects/highland-guesthouse.webp', alt: 'Highland Guesthouse Extension — timber-clad addition with pitched roof' },
  },
  {
    id: 'proj-binh-thanh-townhomes',
    title: 'Bình Thạnh Townhome Row',
    category: 'Residential',
    location: 'Bình Thạnh, TP.HCM',
    yearCompleted: '2024',
    description: 'A 6-unit contemporary townhome row with individual rooftop gardens and shared ground-floor parking.',
    photo: { src: '/projects/binh-thanh-townhomes.webp', alt: 'Bình Thạnh Townhome Row — contemporary townhomes with rooftop gardens' },
  },
];

export interface ProcessStep {
  id: string;
  title: string;
  description: string;
}

export const PROCESS_STEPS: ProcessStep[] = [
  {
    id: 'step-consultation',
    title: 'Consultation & Site Survey',
    description: 'On-site assessment, soil/structural survey, and a scoped brief matching the client\'s budget and timeline.',
  },
  {
    id: 'step-design',
    title: 'Design & Permitting',
    description: 'Architectural drawings, structural engineering review, and submission for local construction permits.',
  },
  {
    id: 'step-procurement',
    title: 'Material Procurement',
    description: 'Sourcing and quality-checking structural materials, finishes, and MEP fixtures ahead of ground-breaking.',
  },
  {
    id: 'step-construction',
    title: 'Construction & Build',
    description: 'Phased on-site construction with a dedicated site supervisor and weekly progress reporting to the client.',
  },
  {
    id: 'step-inspection',
    title: 'Quality Inspection',
    description: 'Independent structural and finish inspection against the approved drawings before handover.',
  },
  {
    id: 'step-handover',
    title: 'Handover & Warranty',
    description: 'Final walkthrough, as-built documentation, and a 24-month structural warranty on completion.',
  },
];

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const SERVICES: ServiceItem[] = [
  {
    id: 'svc-residential',
    title: 'Residential Construction',
    description: 'Ground-up houses, villas, and low-rise residential compounds, from foundation to finish.',
    icon: 'home',
  },
  {
    id: 'svc-commercial',
    title: 'Commercial Construction',
    description: 'Warehouses, office buildings, and retail fit-outs delivered to a fixed schedule and budget.',
    icon: 'building',
  },
  {
    id: 'svc-architecture',
    title: 'Architectural Design',
    description: 'Concept design, structural engineering coordination, and permit-ready drawing sets.',
    icon: 'compass',
  },
  {
    id: 'svc-renovation',
    title: 'Renovation & Retrofit',
    description: 'Structural retrofits, façade restoration, and additions to existing buildings.',
    icon: 'hammer',
  },
  {
    id: 'svc-project-management',
    title: 'Project Management',
    description: 'Single point of contact coordinating contractors, inspections, and procurement through handover.',
    icon: 'clipboard-check',
  },
  {
    id: 'svc-interior',
    title: 'Interior Fit-out',
    description: 'Turnkey interior build-out — partitions, MEP, flooring, and finishes — for new or renovated spaces.',
    icon: 'ruler',
  },
];
