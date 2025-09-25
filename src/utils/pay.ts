// utils/pay.ts
export type OpenPayPayload = {
  scheme: 'openpayment';
  path: '/pay';
  to: string;
  amount: string;  // validado abajo
  nonce: string;
  ts: string;      // ISO
  from?: string;
  raw: string;
};

export function parseAndValidateOpenPayment(data: string): OpenPayPayload | null {
  const normalize = (s: string) =>
    s.startsWith('openpayment://')
      ? s.replace('openpayment://', 'https://openpayment.local/')
      : s;

  try {
    const u = new URL(normalize(data));
    const params = Object.fromEntries(u.searchParams.entries());
    const scheme = data.startsWith('openpayment://') ? 'openpayment' : (u.protocol.replace(':','') as any);

    // Reglas mínimas
    if (scheme !== 'openpayment') return null;
    const path = '/pay';
    const to = (params.to || '').trim();
    const amount = (params.amount || '').trim();
    const nonce = (params.nonce || '').trim();
    const ts = (params.ts || '').trim();

    if (!to || !amount || !nonce || !ts) return null;
    if (!/^\d+(\.\d{1,2})?$/.test(amount)) return null;

    const t = Date.parse(ts);
    if (Number.isNaN(t)) return null;

    // Expira a 5 minutos (anti-replay)
    const skewMs = Math.abs(Date.now() - t);
    if (skewMs > 5 * 60 * 1000) return null;

    return { scheme: 'openpayment', path: '/pay', to, amount, nonce, ts, from: params.from, raw: data };
  } catch {
    return null;
  }
}
