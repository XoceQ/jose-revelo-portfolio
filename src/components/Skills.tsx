import { Cloud, Code2, Database, ShieldCheck, Wrench, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { Reveal, SectionHeading } from './Section';

const icons: Record<string, LucideIcon> = {
  backend: Database,
  frontend: Code2,
  cloud: Cloud,
  security: ShieldCheck,
  tools: Wrench,
};

export default function Skills() {
  const { t } = useLanguage();
  return (
    <section id="skills" aria-labelledby="skills-title" className="section">
      <div className="container">
        <SectionHeading id="skills-title" eyebrow={t.skills.eyebrow} title={t.skills.title} />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-6">
          {t.skills.groups.map((group, index) => {
            const Icon = icons[group.id];
            return (
              <Reveal key={group.id} delay={index * 0.04} className={`card p-6 ${index < 2 ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-soft text-accent ring-1 ring-[var(--line)]">
                    <Icon size={18} aria-hidden />
                  </span>
                  <h3 className="text-base">{group.name}</h3>
                </div>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <li key={item} className="tag">
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
