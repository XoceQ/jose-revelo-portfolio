import type { Language } from '../i18n/translations';

/** Public base URL of the payment backend. Secrets never live in the frontend. */
export const PAYMENT_API = (import.meta.env.VITE_PAYMENT_API_URL ?? '').replace(/\/+$/, '');
export const CONTACT_ENDPOINT: string = import.meta.env.VITE_CONTACT_ENDPOINT ?? '';

export interface CatalogItem {
  id: string;
  title: { en: string; es: string };
  unit_price: string;
  currency: string;
}

export interface PaymentLink {
  description: string;
  amount: string;
  currency: string;
}

export type OrderStatus = 'created' | 'approved' | 'pending' | 'rejected' | 'review';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!PAYMENT_API) throw new Error('payment-api-not-configured');
  const response = await fetch(`${PAYMENT_API}${path}`, {
    ...init,
    headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) },
  });
  if (!response.ok) throw new Error(`request-failed-${response.status}`);
  return response.json() as Promise<T>;
}

export const getCatalog = () => request<{ items: CatalogItem[] }>('/api/catalog').then((data) => data.items);
export const getPaymentLink = (token: string) => request<PaymentLink>(`/api/payment-links/${encodeURIComponent(token)}`);
export const getOrder = (reference: string) =>
  request<{ reference: string; status: OrderStatus }>(`/api/orders/${encodeURIComponent(reference)}`);

export async function createCheckout(input: { packageId?: string; paymentToken?: string; language: Language }) {
  const data = await request<{ checkout_url: string; reference: string }>('/api/checkout', {
    method: 'POST',
    body: JSON.stringify({ package_id: input.packageId, payment_token: input.paymentToken, language: input.language }),
  });
  const url = new URL(data.checkout_url);
  const trusted = /(^|\.)mercadopago\.[a-z.]+$|(^|\.)mercadolibre\.[a-z.]+$/.test(url.hostname);
  if (url.protocol !== 'https:' || !trusted) throw new Error('untrusted-checkout-url');
  return url.toString();
}

export const formatMoney = (amount: string, currency: string, language: Language) =>
  new Intl.NumberFormat(language === 'es' ? 'es-CO' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: Number(amount) % 1 === 0 ? 0 : 2,
  }).format(Number(amount));
