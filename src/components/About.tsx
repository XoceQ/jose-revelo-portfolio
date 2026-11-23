import { Award, GraduationCap, Languages } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { Reveal, SectionHeading } from './Section';

export default function About() {
  const { t } = useLanguage();
  const a = t.about;
  return (
    <section id="about" aria-labelledby="about-title" className="section bg-soft">
      <div className="container">
        <SectionHeading id="about-title" eyebrow={a.eyebrow} title={a.title} />
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            {a.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mb-5 text-lg leading-relaxed text-muted">
                {paragraph}
              </p>
            ))}
            <h3 className="mt-8 text-sm">{a.interestsTitle}</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {a.interests.map((interest) => (
                <li key={interest} className="tag !text-sm">
                  {interest}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.08} className="card divide-y divide-[var(--line)]">
            <div className="flex gap-4 p-6">
              <GraduationCap size={20} className="mt-0.5 shrink-0 text-accent" aria-hidden />
              <div>
                <h3 className="text-base">{a.educationTitle}</h3>
                <ul className="mt-3 space-y-3">
                  {a.education.map((item) => (
                    <li key={item.name}>
                      <p className="text-sm font-medium text-ink">{item.name}</p>
                      <p className="text-sm text-muted">{item.detail}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex gap-4 p-6">
              <Award size={20} className="mt-0.5 shrink-0 text-accent" aria-hidden />
              <div>
                <h3 className="text-base">{a.certificationsTitle}</h3>
                <ul className="mt-3 space-y-1.5 text-sm text-muted">
                  {a.certifications.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex gap-4 p-6">
              <Languages size={20} className="mt-0.5 shrink-0 text-accent" aria-hidden />
              <div>
                <h3 className="text-base">{a.languagesTitle}</h3>
                <p className="mt-2 text-sm text-muted">{a.languages}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
