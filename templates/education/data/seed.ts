export interface Course {
  id: string;
  title: string;
  description: string;
  curriculum: string[];
}

export const COURSES: Course[] = [
  {
    id: 'data-analytics-foundations',
    title: 'Data Analytics Foundations',
    description:
      '10-week evening course. From spreadsheets to SQL and dashboards — for career switchers with no prior data background.',
    curriculum: [
      'Data Literacy & Spreadsheets',
      'Introduction to SQL',
      'Data Cleaning & Validation',
      'Dashboards with Looker Studio',
      'Capstone: Analyze a Real Dataset',
    ],
  },
  {
    id: 'ux-ui-design-certificate',
    title: 'UX/UI Design Certificate',
    description:
      '16-week part-time program. Research, wireframing, prototyping, and a portfolio-ready capstone project.',
    curriculum: [
      'User Research Methods',
      'Information Architecture',
      'Wireframing & Low-Fidelity Prototypes',
      'Visual Design Systems',
      'High-Fidelity Prototyping in Figma',
      'Usability Testing',
      'Capstone Portfolio Project',
    ],
  },
  {
    id: 'full-stack-web-development',
    title: 'Full-Stack Web Development',
    description:
      '24-week intensive. HTML/CSS through to a deployed full-stack application, project-based throughout.',
    curriculum: [
      'HTML, CSS & Responsive Layout',
      'JavaScript Fundamentals',
      'Frontend Frameworks (React)',
      'Backend & REST APIs (Node.js)',
      'Databases & Persistence',
      'Authentication & Deployment',
      'Final Project: Deployed Full-Stack App',
    ],
  },
  {
    id: 'digital-marketing-essentials',
    title: 'Digital Marketing Essentials',
    description:
      '8-week evening course. SEO, paid social, and content strategy for small-business marketers.',
    curriculum: [
      'Marketing Fundamentals & Funnels',
      'SEO Basics',
      'Paid Social Campaigns',
      'Content Strategy & Copywriting',
      'Analytics & Reporting',
    ],
  },
  {
    id: 'business-english-for-professionals',
    title: 'Business English for Professionals',
    description:
      '12-week course, twice weekly. Email, meetings, and presentation English for the modern workplace.',
    curriculum: [
      'Professional Email Writing',
      'Meeting & Negotiation Language',
      'Presentation Skills',
      'Cross-Cultural Communication',
      'Final Presentation Assessment',
    ],
  },
  {
    id: 'project-management-fundamentals',
    title: 'Project Management Fundamentals',
    description:
      '6-week course. Agile and traditional PM frameworks, aimed at first-time project leads.',
    curriculum: [
      'PM Frameworks: Waterfall vs. Agile',
      'Scoping & Planning',
      'Scrum in Practice',
      'Risk & Stakeholder Management',
      'Capstone: Run a Mock Sprint',
    ],
  },
  {
    id: 'graphic-design-bootcamp',
    title: 'Graphic Design Bootcamp',
    description:
      '10-week intensive. Typography, layout, and brand identity design using industry-standard tools.',
    curriculum: [
      'Design Principles & Typography',
      'Color Theory & Composition',
      'Brand Identity Design',
      'Print & Digital Layout',
      'Portfolio Review',
    ],
  },
  {
    id: 'financial-literacy-personal-investing',
    title: 'Financial Literacy & Personal Investing',
    description:
      '6-week evening course. Budgeting, saving, and investing basics for working professionals.',
    curriculum: [
      'Budgeting & Cash Flow',
      'Saving & Emergency Funds',
      'Investing Basics: Stocks & Funds',
      'Retirement Planning',
      'Building a Personal Financial Plan',
    ],
  },
];
