import { useLanguage } from '../hooks/useLanguage';
import type { Language } from '../i18n/translations';

const options: { code: Language; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
];

export default function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div role="group" aria-label={t.common.language} className="inline-flex h-10 rounded-lg border border-line p-0.5">
      {options.map(({ code, name }) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-label={name}
          aria-pressed={language === code}
          onClick={() => setLanguage(code)}
          className={`w-9 rounded-md text-xs font-semibold uppercase transition ${
            language === code ? 'bg-navy text-white dark:bg-white dark:text-navy' : 'text-muted hover:text-ink'
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
