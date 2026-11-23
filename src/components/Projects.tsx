import { ArrowUpRight } from 'lucide-react';
import { projects } from '../data/projects';
import { useLanguage } from '../hooks/useLanguage';
import { Reveal, SectionHeading } from './Section';

export default function Projects() {
  const { t } = useLanguage();
  return (
    <section id="projects" aria-labelledby="projects-title" className="section">
      <div className="container">
        <SectionHeading id="projects-title" eyebrow={t.projects.eyebrow} title={t.projects.title} />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => {
            const copy = t.projects.items[project.id];
            return (
              <Reveal key={project.id} delay={index * 0.06}>
                <article className="card group flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lift">
                  <div className="flex items-center gap-1.5 border-b border-line bg-soft px-4 py-2.5">
                    <span aria-hidden className="h-2 w-2 rounded-full bg-[var(--line)]" />
                    <span aria-hidden className="h-2 w-2 rounded-full bg-[var(--line)]" />
                    <span aria-hidden className="h-2 w-2 rounded-full bg-[var(--line)]" />
                    <span className="ml-2 truncate font-mono text-xs text-muted">{project.domain}</span>
                  </div>
                  <div className="aspect-[16/10] overflow-hidden bg-soft">
                    <img
                      src={project.image}
                      alt={`${t.projects.previewAlt} ${copy.name}`}
                      width={960}
                      height={600}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="eyebrow">{copy.sector}</p>
                    <h3 className="mt-2 text-xl">{copy.name}</h3>
                    <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted">{copy.description}</p>
                    {project.technologies.length > 0 && (
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {project.technologies.map((technology) => (
                          <li key={technology} className="tag">
                            {technology}
                          </li>
                        ))}
                      </ul>
                    )}
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${t.projects.visit}: ${copy.name} (${t.common.newTab})`}
                      className="btn-secondary mt-5 w-full"
                    >
                      {t.projects.visit} <ArrowUpRight size={16} aria-hidden />
                    </a>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
