import { ArrowRight, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { services, type ProjectType } from '../data/services';
import { useLanguage } from '../hooks/useLanguage';
import { formatMoney, getCatalog, PAYMENT_API, type CatalogItem } from '../lib/api';
import { Reveal, SectionHeading } from './Section';

interface ServicesProps {
  onQuote: (type: ProjectType) => void;
  onBuy: (item: CatalogItem) => void;
}

export default function Services({ onQuote, onBuy }: ServicesProps) {
  const { t, language } = useLanguage();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  useEffect(() => {
    if (!PAYMENT_API) return;
    let active = true;
    // If the backend is unreachable, cards correctly fall back to "Request a Quote".
    getCatalog().then((items) => active && setCatalog(items)).catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return (
    <section id="services" aria-labelledby="services-title" className="section bg-soft">
      <div className="container">
        <SectionHeading id="services-title" eyebrow={t.services.eyebrow} title={t.services.title} subtitle={t.services.subtitle} />
        <div className="grid gap-5 md:grid-cols-2">
          {services.map(({ id, icon: Icon }, index) => {
            const copy = t.services.items[id];
            const item = catalog.find((entry) => entry.id === id);
            return (
              <Reveal key={id} delay={index * 0.05}>
                <article className="card flex h-full flex-col p-7 transition duration-200 hover:border-primary/50 hover:shadow-lift">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy text-sky-brand ring-1 ring-white/10">
                    <Icon size={20} aria-hidden />
                  </span>
                  <h3 className="mt-5 text-xl">{copy.name}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{copy.description}</p>
                  <h4 className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted">{t.services.deliverables}</h4>
                  <ul className="mt-3 grid flex-1 content-start gap-2 sm:grid-cols-2">
                    {copy.deliverables.map((deliverable) => (
                      <li key={deliverable} className="flex gap-2 text-sm text-ink">
                        <Check size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                        {deliverable}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-7 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-ink">
                      {item ? (
                        <>
                          <span className="font-normal text-muted">{t.services.priceLabel} </span>
                          {formatMoney(item.unit_price, item.currency, language)}
                        </>
                      ) : (
                        t.services.requestQuote
                      )}
                    </p>
                    {item ? (
                      <button type="button" className="btn-primary" onClick={() => onBuy(item)}>
                        {t.services.buy}
                      </button>
                    ) : (
                      <button type="button" className="btn-primary" onClick={() => onQuote(id)} aria-label={`${t.services.quoteCta}: ${copy.name}`}>
                        {t.services.quoteCta} <ArrowRight size={16} aria-hidden />
                      </button>
                    )}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-6">
          <div className="grid gap-8 overflow-hidden rounded-2xl bg-navy p-8 text-white ring-1 ring-white/10 md:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-sky-brand">{t.services.custom.eyebrow}</p>
              <h3 className="mt-3 text-2xl !text-white md:text-3xl">{t.services.custom.title}</h3>
              <p className="mt-3 leading-relaxed text-slate-300">{t.services.custom.description}</p>
              <button type="button" className="btn-primary mt-6" onClick={() => onQuote('custom')}>
                {t.services.custom.cta} <ArrowRight size={16} aria-hidden />
              </button>
            </div>
            <ol className="space-y-3">
              {t.services.custom.steps.map((step, index) => (
                <li key={step} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sky-brand text-xs font-bold text-navy">{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
