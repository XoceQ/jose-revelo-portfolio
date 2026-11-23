import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

export type LegalKind = 'privacy' | 'terms';

export default function LegalPage({ kind }: { kind: LegalKind }) {
  const { t } = useLanguage();
  const page = t.legal[kind];
  return (
    <article className="container max-w-3xl pb-24 pt-32">
      <a href="#top" className="inline-flex items-center gap-2 text-sm font-medium text-accent">
        <ArrowLeft size={16} aria-hidden /> {t.common.backHome}
      </a>
      <h1 className="mt-6 text-4xl">{page.title}</h1>
      <p className="mt-2 text-sm text-muted">{t.legal.updated}</p>
      {page.sections.map((section) => (
        <section key={section.heading} className="mt-8">
          <h2 className="text-lg">{section.heading}</h2>
          <p className="mt-2 leading-relaxed text-muted">{section.body}</p>
        </section>
      ))}
    </article>
  );
}
