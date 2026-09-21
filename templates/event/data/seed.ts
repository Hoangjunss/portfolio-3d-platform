import type { TimelineEntry, Person, PricedItem } from '@portfolio/template-kit';

export const AGENDA: TimelineEntry[] = [
  {
    id: 'agenda-registration',
    title: 'Registration & Coffee',
    description: 'Badge pickup and informal networking in the main atrium before the program opens.',
    date: '08:30–09:00',
  },
  {
    id: 'agenda-opening',
    title: 'Opening Remarks',
    description: 'Welcome from the organizing team and a short framing of this year\'s program themes.',
    date: '09:00–09:15',
  },
  {
    id: 'agenda-keynote',
    title: 'Keynote: Building at the Edge of Frontier Tech',
    description: 'Opening keynote on the shared challenges of shipping AI, robotics, and climate-tech systems from prototype to production.',
    date: '09:15–10:00',
  },
  {
    id: 'agenda-ai-track',
    title: 'Track: AI Systems for Production',
    description: 'Lessons from running large model-serving systems reliably outside the demo environment.',
    date: '10:15–11:00',
  },
  {
    id: 'agenda-robotics-track',
    title: 'Track: Robotics & Physical Computing',
    description: 'Bridging simulation and the physical world — sensor fusion, control loops, and field-testing failures.',
    date: '11:00–11:45',
  },
  {
    id: 'agenda-climate-track',
    title: 'Track: Climate & Materials Engineering',
    description: 'Engineering trade-offs in low-carbon materials and monitoring systems for real deployments.',
    date: '13:00–13:45',
  },
  {
    id: 'agenda-panel',
    title: 'Panel: Building Teams That Ship Frontier Tech',
    description: 'Engineering leads discuss hiring, org design, and pacing for teams working on unproven technology.',
    date: '13:45–14:30',
  },
  {
    id: 'agenda-workshop',
    title: 'Workshop: Rapid Prototyping With Generative Tools',
    description: 'Hands-on session on using generative design/code tools to compress the prototype-to-test loop.',
    date: '14:45–15:30',
  },
  {
    id: 'agenda-creative-track',
    title: 'Track: Creative Coding & Interactive Installations',
    description: 'Case studies from artists and engineers building interactive, sensor-driven installations.',
    date: '15:45–16:30',
  },
  {
    id: 'agenda-closing',
    title: 'Closing Keynote & Networking Reception',
    description: 'Closing keynote followed by an open networking reception in the atrium.',
    date: '17:00–18:00',
  },
];

export const SPEAKERS: Person[] = [
  { id: 'speaker-quan', name: 'Đặng Minh Quân', role: 'Founder & CTO, Lạc Hồng Systems (opening keynote)' },
  { id: 'speaker-tram', name: 'Hoàng Bảo Trâm', role: 'Lead AI Engineer, Tinh Vân Labs' },
  { id: 'speaker-the-anh', name: 'Vũ Thế Anh', role: 'Robotics Researcher, Viện Kỹ thuật Ứng dụng' },
  { id: 'speaker-diem-my', name: 'Ngô Diễm My', role: 'Climate Tech Engineer, Sông Xanh Materials' },
  { id: 'speaker-gia-huy', name: 'Lâm Gia Huy', role: 'Creative Technologist, independent artist-engineer' },
];

export const TICKETS: PricedItem[] = [
  { id: 'ticket-startup', title: 'Startup & Student Pass', price: 590000 },
  { id: 'ticket-standard', title: 'Standard Pass', price: 1500000 },
  { id: 'ticket-premium', title: 'Premium Pass', price: 3200000 },
];
