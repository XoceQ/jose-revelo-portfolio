import { CheckCircle2, Github, Linkedin, Loader2, Mail, Send } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { profile } from '../data/profile';
import { budgetRanges, projectTypes, type ProjectType } from '../data/services';
import { useLanguage } from '../hooks/useLanguage';
import { CONTACT_ENDPOINT } from '../lib/api';
import { Reveal } from './Section';

const emptyForm = { name: '', email: '', projectType: '', budget: '', message: '' };
type FormState = typeof emptyForm;
type Field = keyof FormState;
type Status = 'idle' | 'sending' | 'success' | 'failure' | 'emailOpened';

function validate(form: FormState) {
  const invalid: Field[] = [];
  if (form.name.trim().length < 2) invalid.push('name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) invalid.push('email');
  if (!form.projectType) invalid.push('projectType');
  if (!form.budget) invalid.push('budget');
  if (form.message.trim().length < 10) invalid.push('message');
  return invalid;
}

export default function Contact({ presetType }: { presetType: ProjectType | '' }) {
  const { t, language } = useLanguage();
  const c = t.contact;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<Field[]>([]);
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    if (presetType) setForm((current) => ({ ...current, projectType: presetType }));
  }, [presetType]);

  const update = (field: Field, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => current.filter((item) => item !== field));
    if (status !== 'sending') setStatus('idle');
  };

  const readable = () => ({
    type: form.projectType ? c.projectTypes[form.projectType as ProjectType] : '',
    budget: form.budget ? c.budgets[form.budget as keyof typeof c.budgets] : '',
  });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const invalid = validate(form);
    setErrors(invalid);
    if (invalid.length) {
      document.getElementById(`contact-${invalid[0]}`)?.focus();
      return;
    }
    if (honeypot) return;

    const { type, budget } = readable();

    if (!CONTACT_ENDPOINT) {
      const subject = `${c.projectType}: ${type}`;
      const body = `${c.name}: ${form.name}\n${c.emailField}: ${form.email}\n${c.projectType}: ${type}\n${c.budget}: ${budget}\n\n${form.message}`;
      window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setStatus('emailOpened');
      return;
    }

    setStatus('sending');
    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          projectType: type,
          budget,
          message: form.message.trim(),
          language,
          _subject: `Portfolio inquiry: ${type}`,
        }),
      });
      if (!response.ok) throw new Error('contact-failed');
      setForm(emptyForm);
      setStatus('success');
    } catch {
      setStatus('failure');
    }
  };

  const fieldProps = (field: Field) => ({
    id: `contact-${field}`,
    name: field,
    value: form[field],
    required: true,
    'aria-invalid': errors.includes(field),
    'aria-describedby': errors.includes(field) ? `contact-${field}-error` : undefined,
    className: 'field',
  });

  const fieldError = (field: Field) =>
    errors.includes(field) ? (
      <p id={`contact-${field}-error`} className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
        {c.errors[field]}
      </p>
    ) : null;

  const directLinks = [
    { href: `mailto:${profile.email}`, icon: Mail, label: c.email, value: profile.email, external: false },
    { href: profile.linkedin, icon: Linkedin, label: 'LinkedIn', value: 'in/josefernandorevelo', external: true },
    { href: profile.github, icon: Github, label: 'GitHub', value: 'github.com/XoceQ', external: true },
  ];

  return (
    <section id="contact" aria-labelledby="contact-title" className="section">
      <div className="container grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <Reveal>
          <p className="eyebrow">{c.eyebrow}</p>
          <h2 id="contact-title" className="mt-3 text-3xl leading-tight md:text-[2.5rem]">{c.title}</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">{c.description}</p>
          <h3 className="mt-10 text-sm">{c.direct}</h3>
          <ul className="mt-4 space-y-3">
            {directLinks.map(({ href, icon: Icon, label, value, external }) => (
              <li key={label}>
                <a
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
                  className="group flex items-center gap-3 rounded-xl border border-line p-3 transition hover:border-primary"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-soft text-accent">
                    <Icon size={18} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-muted">{label}</span>
                    <span className="block truncate text-sm font-medium text-ink group-hover:text-accent">{value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.08}>
          <form onSubmit={submit} noValidate className="card p-6 md:p-8">
            <div aria-hidden className="absolute -left-[9999px]">
              <label>
                Website
                <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
              </label>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="label">{c.name}</label>
                <input {...fieldProps('name')} autoComplete="name" maxLength={120} placeholder={c.namePlaceholder} onChange={(event) => update('name', event.target.value)} />
                {fieldError('name')}
              </div>
              <div>
                <label htmlFor="contact-email" className="label">{c.emailField}</label>
                <input {...fieldProps('email')} type="email" autoComplete="email" maxLength={200} placeholder={c.emailPlaceholder} onChange={(event) => update('email', event.target.value)} />
                {fieldError('email')}
              </div>
              <div>
                <label htmlFor="contact-projectType" className="label">{c.projectType}</label>
                <select {...fieldProps('projectType')} onChange={(event) => update('projectType', event.target.value)}>
                  <option value="">{c.select}</option>
                  {projectTypes.map((type) => (
                    <option key={type} value={type}>{c.projectTypes[type]}</option>
                  ))}
                </select>
                {fieldError('projectType')}
              </div>
              <div>
                <label htmlFor="contact-budget" className="label">{c.budget}</label>
                <select {...fieldProps('budget')} onChange={(event) => update('budget', event.target.value)}>
                  <option value="">{c.select}</option>
                  {budgetRanges.map((budget) => (
                    <option key={budget} value={budget}>{c.budgets[budget]}</option>
                  ))}
                </select>
                {fieldError('budget')}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="contact-message" className="label">{c.message}</label>
                <textarea {...fieldProps('message')} rows={5} maxLength={4000} placeholder={c.messagePlaceholder} onChange={(event) => update('message', event.target.value)} />
                {fieldError('message')}
              </div>
            </div>

            {!CONTACT_ENDPOINT && status === 'idle' && <p className="mt-5 text-xs leading-relaxed text-muted">{c.emailNotice}</p>}

            <div aria-live="polite">
              {status === 'success' && (
                <p className="mt-5 flex gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 size={18} className="shrink-0" aria-hidden /> {c.success}
                </p>
              )}
              {status === 'emailOpened' && <p className="mt-5 rounded-lg bg-sky-brand/10 p-3 text-sm font-medium text-accent">{c.emailOpened}</p>}
              {status === 'failure' && <p role="alert" className="mt-5 rounded-lg bg-red-500/10 p-3 text-sm font-medium text-red-700 dark:text-red-300">{c.failure}</p>}
            </div>

            <button type="submit" className="btn-primary mt-5 w-full" disabled={status === 'sending'}>
              {status === 'sending' ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Send size={16} aria-hidden />}
              {status === 'sending' ? c.sending : CONTACT_ENDPOINT ? c.submit : c.submitEmail}
            </button>
            <p className="mt-3 text-center text-xs text-muted">
              {c.privacy}{' '}
              <a href="#/privacy" className="font-medium text-accent underline underline-offset-2">{c.privacyLink}</a>.
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
