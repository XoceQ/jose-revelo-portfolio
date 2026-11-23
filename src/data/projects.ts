import biometron from '../assets/projects/biometron.webp';
import ipasas from '../assets/projects/ipasas.webp';
import meditecno from '../assets/projects/meditecno.webp';

export type ProjectId = 'biometron' | 'meditecno' | 'ipasas';

export interface Project {
  id: ProjectId;
  url: string;
  domain: string;
  image: string;
  /** Only technologies directly evidenced by the live site. */
  technologies: string[];
}

export const projects: Project[] = [
  { id: 'biometron', url: 'https://www.biometron.com.co/', domain: 'biometron.com.co', image: biometron, technologies: ['WordPress'] },
  { id: 'meditecno', url: 'https://www.meditecno.com.co/', domain: 'meditecno.com.co', image: meditecno, technologies: ['WordPress'] },
  { id: 'ipasas', url: 'https://www.ipasas.co/', domain: 'ipasas.co', image: ipasas, technologies: [] },
];
