import { motion } from 'framer-motion';
import { ArrowRight, Download, Github, Linkedin } from 'lucide-react';
import { profile } from '../data/profile';
import { useLanguage } from '../hooks/useLanguage';

const paths = [
  'M 92 180 H 196',
  'M 284 180 C 330 180 322 76 372 76',
  'M 284 180 H 372',
  'M 284 180 C 330 180 322 284 372 284',
];

function SignalDiagram() {
  const { t } = useLanguage();
  const d = t.hero.diagram;
  const nodes = [
    { x: 12, y: 154, w: 80, label: d.client },
    { x: 196, y: 150, w: 88, label: d.api, core: true },
    { x: 372, y: 50, w: 116, label: d.data },
    { x: 372, y: 154, w: 116, label: d.automation },
    { x: 372, y: 258, w: 116, label: d.cloud },
  ];
  return (
    <svg viewBox="0 0 500 360" role="img" aria-label={t.hero.diagramLabel} className="h-auto w-full">
      <defs>
        <pattern id="dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="var(--line)" />
        </pattern>
      </defs>
      <rect width="500" height="360" fill="url(#dot-grid)" />
      {paths.map((path) => (
        <path key={path} d={path} fill="none" stroke="var(--line)" strokeWidth="1.5" />
      ))}
      {paths.map((path, index) => (
        <path
          key={`packet-${path}`}
          d={path}
          fill="none"
          stroke="#0EA5E9"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="16 324"
          className="signal-packet"
          style={{ animationDelay: `${index * -1.2}s` }}
        />
      ))}
      {nodes.map((node) => {
        const h = node.core ? 60 : 52;
        return (
          <g key={node.x + node.label}>
            <rect
              x={node.x}
              y={node.y}
              width={node.w}
              height={h}
              rx="12"
              fill={node.core ? '#0F172A' : 'var(--surface)'}
              stroke={node.core ? '#38BDF8' : 'var(--line)'}
              strokeWidth={node.core ? 1.5 : 1}
            />
            <text
              x={node.x + node.w / 2}
              y={node.y + h / 2 + 4}
              textAnchor="middle"
              fontSize="12.5"
              fontWeight="600"
              fill={node.core ? '#FFFFFF' : 'var(--ink)'}
            >
              {node.label}
            </text>
          </g>
        );
      })}
      <circle cx="274" cy="160" r="3" fill="#38BDF8" className="signal-pulse" />
    </svg>
  );
}

export default function Hero() {
  const { t } = useLanguage();
  return (
    <section id="top" aria-labelledby="hero-title" className="relative overflow-hidden pb-16 pt-28 md:pb-24 md:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-sky-brand/10 to-transparent dark:from-primary/10" />
      <div className="container relative grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink">
            <span aria-hidden className="h-2 w-2 rounded-full bg-emerald-500" />
            {t.hero.availability}
          </p>
          <p className="mt-6 text-sm font-medium leading-relaxed text-accent">{t.hero.role}</p>
          <h1 id="hero-title" className="mt-3 text-4xl leading-[1.06] sm:text-5xl lg:text-[3.6rem]">
            {t.hero.headline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{t.hero.description}</p>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">{t.hero.intro}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a href="#contact" className="btn-primary">
              {t.hero.primary} <ArrowRight size={16} aria-hidden />
            </a>
            <a href="#projects" className="btn-secondary">
              {t.hero.secondary}
            </a>
          </div>
          <div className="mt-5 flex items-center gap-2">
            <a href={profile.cv} download className="btn-secondary !min-h-10 !px-4 !py-2">
              <Download size={15} aria-hidden /> {t.hero.cv}
            </a>
            <a href={profile.github} target="_blank" rel="noreferrer" className="btn-icon" aria-label={`GitHub (${t.common.newTab})`}>
              <Github size={17} aria-hidden />
            </a>
            <a href={profile.linkedin} target="_blank" rel="noreferrer" className="btn-icon" aria-label={`LinkedIn (${t.common.newTab})`}>
              <Linkedin size={17} aria-hidden />
            </a>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="card overflow-hidden bg-[var(--glass)] p-3 backdrop-blur"
        >
          <SignalDiagram />
        </motion.div>
      </div>
      <div className="container relative mt-14">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line pt-6 text-sm font-medium text-muted md:grid-cols-4">
          {t.hero.credentials.map((credential) => (
            <li key={credential}>{credential}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
