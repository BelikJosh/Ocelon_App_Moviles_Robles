const BASE = 'http://10.49.122.204:3001';

async function jfetch(input: RequestInfo, init?: RequestInit) {
  const r = await fetch(input, init);
  let j: any = {};
  try { j = await r.json(); } catch {}
  if (!r.ok || j?.ok === false) {
    const msg =
      j?.error?.error_description ||
      j?.error?.message ||
      j?.error?.error ||
      (typeof j?.error === 'string' ? j.error : JSON.stringify(j || {}));
    throw new Error(msg || 'HTTP error');
  }
  return j;
}

export const opApi = {
  wallets: () => jfetch(`${BASE}/op/wallets`),

  createIncoming: (receiveValueMinor: string) =>
    jfetch(`${BASE}/op/incoming`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiveValueMinor }),
    }),

  startOutgoing: (incomingPaymentId: string) =>
    jfetch(`${BASE}/op/outgoing/start`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incomingPaymentId }),
    }),

  finishOutgoing: (payload: {
    incomingPaymentId: string;
    continueUri: string;
    continueAccessToken: string;
    interact_ref: string;
    hash?: string;
  }) =>
    jfetch(`${BASE}/op/outgoing/finish`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  payOutgoing: (payload: { incomingPaymentId: string; grantAccessToken: string }) =>
    jfetch(`${BASE}/op/outgoing/pay`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
};
