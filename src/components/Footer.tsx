import { Github, Linkedin, Mail } from 'lucide-react';
import { navItems, profile } from '../data/profile';
import { useLanguage } from '../hooks/useLanguage';
import LanguageToggle from './LanguageToggle';
import { Logo } from './Navbar';
import ThemeToggle from './ThemeToggle';

export default function Footer() {
  const { t } = useLanguage();
  const f = t.footer;
  const heading = 'text-xs font-semibold uppercase tracking-wider text-muted';
  const link = 'text-sm text-ink transition hover:text-accent';
  return (
    <footer className="border-t border-line bg-soft">
      <div className="container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{f.role}</p>
          <a href={`mailto:${profile.email}`} className={`mt-3 inline-block break-all ${link}`}>{profile.email}</a>
          <div className="mt-5 flex gap-2">
            <a href={profile.github} target="_blank" rel="noreferrer" className="btn-icon" aria-label={`GitHub (${t.common.newTab})`}><Github size={17} aria-hidden /></a>
            <a href={profile.linkedin} target="_blank" rel="noreferrer" className="btn-icon" aria-label={`LinkedIn (${t.common.newTab})`}><Linkedin size={17} aria-hidden /></a>
            <a href={`mailto:${profile.email}`} className="btn-icon" aria-label={t.contact.email}><Mail size={17} aria-hidden /></a>
          </div>
        </div>
        <nav aria-label={f.navigation}>
          <h2 className={heading}>{f.navigation}</h2>
          <ul className="mt-4 space-y-2.5">
            {navItems.map((item) => (
              <li key={item}><a href={`#${item}`} className={link}>{t.nav[item]}</a></li>
            ))}
          </ul>
        </nav>
        <nav aria-label={f.legal}>
          <h2 className={heading}>{f.legal}</h2>
          <ul className="mt-4 space-y-2.5">
            <li><a href="#/privacy" className={link}>{f.privacy}</a></li>
            <li><a href="#/terms" className={link}>{f.terms}</a></li>
          </ul>
        </nav>
        <div>
          <h2 className={heading}>{f.preferences}</h2>
          <div className="mt-4 flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="container py-5 text-xs text-muted">© {new Date().getFullYear()} {profile.name}. {f.rights}</p>
      </div>
    </footer>
  );
}
