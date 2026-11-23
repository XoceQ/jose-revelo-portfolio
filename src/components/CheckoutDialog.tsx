import { CheckCircle2, Clock3, Loader2, ShieldCheck, X, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { createCheckout, formatMoney, getOrder, getPaymentLink, type CatalogItem, type OrderStatus, type PaymentLink } from '../lib/api';

export type CheckoutRequest =
  | { kind: 'package'; item: CatalogItem }
  | { kind: 'link'; token: string }
  | { kind: 'return'; reference: string };

type StatusKey = 'approved' | 'pending' | 'rejected' | 'review' | 'unknown';

const toStatusKey = (status: OrderStatus): StatusKey => (status === 'created' ? 'pending' : status);
const POLL_ATTEMPTS = 8;
const POLL_DELAY_MS = 4000;

function PaymentResult({ reference, onClose }: { reference: string; onClose: () => void }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<StatusKey | null>(null);

  useEffect(() => {
    let active = true;
    let timer: number;
    const poll = async (attempt: number) => {
      try {
        const order = await getOrder(reference);
        if (!active) return;
        const key = toStatusKey(order.status);
        if (key === 'pending' && attempt < POLL_ATTEMPTS) {
          timer = window.setTimeout(() => poll(attempt + 1), POLL_DELAY_MS);
          return;
        }
        setStatus(key);
      } catch {
        if (active) setStatus('unknown');
      }
    };
    poll(1);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [reference]);

  if (!status) {
    return (
      <p role="status" className="flex items-center gap-3 py-4 text-sm text-muted">
        <Loader2 size={18} className="animate-spin text-accent" aria-hidden /> {t.checkout.checking}
      </p>
    );
  }

  const copy = t.checkout.statuses[status];
  const Icon = status === 'approved' ? CheckCircle2 : status === 'rejected' ? XCircle : Clock3;
  const color = status === 'approved' ? 'text-emerald-500' : status === 'rejected' ? 'text-red-500' : 'text-amber-500';

  return (
    <div role="status">
      <Icon size={32} className={color} aria-hidden />
      <h3 className="mt-3 text-lg">{copy.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">{copy.body}</p>
      <p className="mt-4 break-all rounded-lg bg-soft p-3 font-mono text-xs text-muted">
        {t.checkout.reference}: {reference}
      </p>
      {status !== 'approved' && (
        <a href="#contact" onClick={onClose} className="btn-primary mt-5 w-full">
          {t.checkout.contact}
        </a>
      )}
    </div>
  );
}

function PaymentForm({ request }: { request: Exclude<CheckoutRequest, { kind: 'return' }> }) {
  const { t, language } = useLanguage();
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [linkError, setLinkError] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const token = request.kind === 'link' ? request.token : null;

  useEffect(() => {
    if (!token) return;
    let active = true;
    getPaymentLink(token)
      .then((data) => active && setLink(data))
      .catch(() => active && setLinkError(true));
    return () => {
      active = false;
    };
  }, [token]);

  if (linkError) return <p role="alert" className="text-sm text-muted">{t.checkout.invalidLink}</p>;
  if (request.kind === 'link' && !link) {
    return (
      <p role="status" className="flex items-center gap-3 text-sm text-muted">
        <Loader2 size={18} className="animate-spin text-accent" aria-hidden /> {t.checkout.loading}
      </p>
    );
  }

  const name = request.kind === 'package' ? request.item.title[language] : link!.description;
  const amount = request.kind === 'package' ? request.item.unit_price : link!.amount;
  const currency = request.kind === 'package' ? request.item.currency : link!.currency;

  const pay = async () => {
    setBusy(true);
    setError(false);
    try {
      const url = await createCheckout({
        packageId: request.kind === 'package' ? request.item.id : undefined,
        paymentToken: token ?? undefined,
        language,
      });
      window.location.assign(url);
    } catch {
      setError(true);
      setBusy(false);
    }
  };

  return (
    <>
      <p className="text-sm leading-relaxed text-muted">{t.checkout.intro}</p>
      <div className="mt-5 rounded-xl border border-line bg-soft p-4">
        <p className="text-sm font-medium text-ink">{name}</p>
        <p className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
          <span className="text-sm text-muted">{t.checkout.total}</span>
          <span className="text-xl font-semibold text-ink">{formatMoney(amount, currency, language)}</span>
        </p>
      </div>
      <label className="mt-5 flex items-start gap-3 text-sm text-muted">
        <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-0.5 h-4 w-4 accent-sky-500" />
        <span>
          {t.checkout.accept}{' '}
          <a href="#/terms" target="_blank" rel="noreferrer" className="font-medium text-accent underline underline-offset-2">
            {t.checkout.terms}
          </a>
        </span>
      </label>
      {error && <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">{t.checkout.error}</p>}
      <button type="button" className="btn-primary mt-5 w-full" disabled={!accepted || busy} onClick={pay}>
        {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <ShieldCheck size={16} aria-hidden />}
        {busy ? t.checkout.redirecting : t.checkout.continue}
      </button>
    </>
  );
}

export default function CheckoutDialog({ request, onClose }: { request: CheckoutRequest; onClose: () => void }) {
  const { t } = useLanguage();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const title = request.kind === 'return' ? t.checkout.statusTitle : request.kind === 'link' ? t.checkout.linkTitle : t.checkout.title;

  return (
    <dialog
      ref={ref}
      aria-labelledby="checkout-title"
      onClose={onClose}
      className="m-auto w-[calc(100vw-2rem)] max-w-md rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl"
    >
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="checkout-title" className="text-lg">{title}</h2>
          <button type="button" className="btn-icon !h-9 !w-9" aria-label={t.common.close} onClick={() => ref.current?.close()}>
            <X size={16} aria-hidden />
          </button>
        </div>
        {request.kind === 'return' ? (
          <PaymentResult reference={request.reference} onClose={() => ref.current?.close()} />
        ) : (
          <PaymentForm request={request} />
        )}
      </div>
    </dialog>
  );
}
