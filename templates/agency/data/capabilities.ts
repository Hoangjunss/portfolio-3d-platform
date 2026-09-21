export interface Capability {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const CAPABILITIES: Capability[] = [
  { id: 'brand-strategy', title: 'Brand Strategy', description: 'Positioning, naming, and messaging frameworks grounded in real audience research.', icon: 'compass' },
  { id: 'visual-identity', title: 'Visual Identity', description: 'Logo systems, typography, color, and the guidelines that keep them consistent at scale.', icon: 'palette' },
  { id: 'web-product-design', title: 'Web & Product Design', description: 'Marketing sites, design systems, and end-to-end product UX for web and mobile.', icon: 'layout' },
  { id: 'motion-film', title: 'Motion & Film', description: 'Brand films, product explainers, and motion systems for launch and social.', icon: 'film' },
];
