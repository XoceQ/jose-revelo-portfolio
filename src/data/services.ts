import { Bot, Globe, ServerCog, ShieldCheck, type LucideIcon } from 'lucide-react';

export type ServiceId = 'backend' | 'websites' | 'automation' | 'infrastructure';
export type ProjectType = ServiceId | 'custom';

export const services: { id: ServiceId; icon: LucideIcon }[] = [
  { id: 'backend', icon: ServerCog },
  { id: 'websites', icon: Globe },
  { id: 'automation', icon: Bot },
  { id: 'infrastructure', icon: ShieldCheck },
];

export const projectTypes: ProjectType[] = ['backend', 'websites', 'automation', 'infrastructure', 'custom'];
export const budgetRanges = ['under500', '500to1500', '1500to5000', 'over5000', 'undefined'] as const;
export type BudgetRange = (typeof budgetRanges)[number];
