import { MotionConfig } from 'framer-motion';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import About from './components/About';
import type { CheckoutRequest } from './components/CheckoutDialog';
import Contact from './components/Contact';
import Experience from './components/Experience';
import Footer from './components/Footer';
import Hero from './components/Hero';
import LegalPage, { type LegalKind } from './components/LegalPage';
import Navbar from './components/Navbar';
import Projects from './components/Projects';
import Services from './components/Services';
import Skills from './components/Skills';
import { profile } from './data/profile';
import type { ProjectType } from './data/services';
import { useLanguage } from './hooks/useLanguage';

const CheckoutDialog = lazy(() => import('./components/CheckoutDialog'));

const legalFromHash = (): LegalKind | null =>
  window.location.hash === '#/privacy' ? 'privacy' : window.location.hash === '#/terms' ? 'terms' : null;

function checkoutFromUrl(): CheckoutRequest | null {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('pay');
  const order = params.get('order');
  if (token) return { kind: 'link', token };
  if (params.get('checkout') === 'return' && order) return { kind: 'return', reference: order };
  return null;
}

function setMeta(selector: string, content: string) {
  document.querySelector(selector)?.setAttribute('content', content);
}

export default function App() {
  const { t, language } = useLanguage();
  const [legal, setLegal] = useState<LegalKind | null>(legalFromHash);
  const [checkout, setCheckout] = useState<CheckoutRequest | null>(checkoutFromUrl);
  const [presetType, setPresetType] = useState<ProjectType | ''>('');

  useEffect(() => {
    const onHashChange = () => setLegal(legalFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Sections render on the client, so anchors are resolved after the view has committed.
  useEffect(() => {
    if (legal) {
      window.scrollTo(0, 0);
      return;
    }
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView();
  }, [legal]);

  useEffect(() => {
    const title = legal ? `${t.legal[legal].title} | ${profile.name}` : t.meta.title;
    document.title = title;
    setMeta('meta[name="description"]', t.meta.description);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', t.meta.description);
    setMeta('meta[property="og:locale"]', language === 'es' ? 'es_CO' : 'en_US');
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', t.meta.description);
  }, [t, language, legal]);

  const requestQuote = useCallback((type: ProjectType) => {
    setPresetType(type);
    document.getElementById('contact')?.scrollIntoView();
    window.setTimeout(() => document.getElementById('contact-name')?.focus({ preventScroll: true }), 450);
  }, []);

  const closeCheckout = useCallback(() => {
    setCheckout(null);
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname + window.location.hash);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <a href="#main" className="btn-primary sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60]">
        {t.common.skip}
      </a>
      <Navbar />
      <main id="main" tabIndex={-1} className="outline-none">
        {legal ? (
          <LegalPage kind={legal} />
        ) : (
          <>
            <Hero />
            <About />
            <Skills />
            <Experience />
            <Projects />
            <Services onQuote={requestQuote} onBuy={(item) => setCheckout({ kind: 'package', item })} />
            <Contact presetType={presetType} />
          </>
        )}
      </main>
      <Footer />
      {checkout && (
        <Suspense fallback={null}>
          <CheckoutDialog request={checkout} onClose={closeCheckout} />
        </Suspense>
      )}
    </MotionConfig>
  );
}
