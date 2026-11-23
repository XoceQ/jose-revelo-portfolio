import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { navItems } from '../data/profile';
import { useLanguage } from '../hooks/useLanguage';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-navy text-[13px] font-bold tracking-tight text-sky-brand ring-1 ring-white/10">
        JR
      </span>
      <span className="whitespace-nowrap text-sm font-semibold tracking-tight text-ink">José Fernando Revelo</span>
    </span>
  );
}

export default function Navbar() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const elevated = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b transition-colors ${
        elevated ? 'border-line bg-[var(--glass)] backdrop-blur-xl' : 'border-transparent'
      }`}
    >
      <nav className="container flex h-16 items-center justify-between gap-4" aria-label="Main">
        <a href="#top" aria-label={t.common.home} className="rounded-lg" onClick={() => setOpen(false)}>
          <Logo />
        </a>
        <ul className="hidden items-center gap-6 xl:flex">
          {navItems.map((item) => (
            <li key={item}>
              <a href={`#${item}`} className="text-sm font-medium text-muted transition hover:text-ink">
                {t.nav[item]}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <LanguageToggle />
            <ThemeToggle />
          </div>
          <a href="#contact" className="btn-primary hidden !min-h-10 whitespace-nowrap !py-2 xl:inline-flex">
            {t.nav.cta}
          </a>
          <button
            type="button"
            className="btn-icon xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.common.closeMenu : t.common.openMenu}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
          </button>
        </div>
      </nav>
      {open && (
        <div id="mobile-menu" className="container border-t border-line pb-5 pt-3 xl:hidden">
          <ul>
            {navItems.map((item) => (
              <li key={item}>
                <a href={`#${item}`} onClick={() => setOpen(false)} className="block rounded-lg py-3 text-base font-medium text-ink">
                  {t.nav[item]}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-2 sm:hidden">
            <LanguageToggle />
            <ThemeToggle />
          </div>
          <a href="#contact" onClick={() => setOpen(false)} className="btn-primary mt-4 w-full">
            {t.nav.cta}
          </a>
        </div>
      )}
    </header>
  );
}
