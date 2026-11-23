import { experienceTags } from '../data/profile';
import { useLanguage } from '../hooks/useLanguage';
import { Reveal, SectionHeading } from './Section';

export default function Experience() {
  const { t } = useLanguage();
  return (
    <section id="experience" aria-labelledby="experience-title" className="section bg-soft">
      <div className="container">
        <SectionHeading id="experience-title" eyebrow={t.experience.eyebrow} title={t.experience.title} />
        <ol className="relative space-y-6 border-l border-line pl-6 md:ml-2 md:pl-10">
          {t.experience.items.map((item) => (
            <li key={item.id} className="relative">
              <span aria-hidden className="absolute -left-[29px] top-7 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-[var(--bg-soft)] md:-left-[45px]" />
              <Reveal className="card p-6 md:p-8">
                <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between md:gap-6">
                  <div>
                    <h3 className="text-lg">{item.role}</h3>
                    <p className="mt-0.5 text-sm font-medium text-accent">{item.company}</p>
                  </div>
                  <div className="text-sm text-muted md:text-right">
                    <p className="font-medium">{item.period}</p>
                    <p>{item.location}</p>
                  </div>
                </div>
                {item.summary && <p className="mt-5 text-[15px] font-medium leading-relaxed text-ink">{item.summary}</p>}
                <ul className="mt-4 list-disc space-y-2 pl-4 text-[15px] leading-relaxed text-muted marker:text-primary">
                  {item.points.map((point) => {
                    const separator = point.indexOf(': ');
                    return (
                      <li key={point}>
                        {separator > 0 ? (
                          <>
                            <span className="font-semibold text-ink">{point.slice(0, separator + 1)}</span>
                            {point.slice(separator + 1)}
                          </>
                        ) : (
                          point
                        )}
                      </li>
                    );
                  })}
                </ul>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {experienceTags[item.id].map((tag) => (
                    <li key={tag} className="tag">
                      {tag}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
