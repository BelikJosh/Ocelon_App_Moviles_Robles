// utils/pay.ts - VERSIÓN ACTUALIZADA (QR sin monto)
export type OpenPayPayload = {
  scheme: 'openpayment';
  path: '/pay';
  to: string;
  amount?: string;  // OPCIONAL ahora - se calculará dinámicamente
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
    const scheme = data.startsWith('openpayment://') ? 'openpayment' : (u.protocol.replace(':', '') as any);

    // Reglas mínimas - amount ahora es opcional
    if (scheme !== 'openpayment') return null;
    const path = '/pay';
    const to = (params.to || '').trim();
    const amount = (params.amount || '').trim(); // Opcional ahora
    const nonce = (params.nonce || '').trim();
    const ts = (params.ts || '').trim();

    // Validaciones requeridas (amount es opcional)
    if (!to || !nonce || !ts) return null;

    // Si viene amount, validar formato
    if (amount && !/^\d+(\.\d{1,2})?$/.test(amount)) return null;

    const t = Date.parse(ts);
    if (Number.isNaN(t)) return null;

    // Expira a 5 minutos (anti-replay)
    const skewMs = Math.abs(Date.now() - t);
    if (skewMs > 5 * 60 * 1000) return null;

    return {
      scheme: 'openpayment',
      path: '/pay',
      to,
      amount: amount || undefined, // Puede ser undefined
      nonce,
      ts,
      from: params.from,
      raw: data
    };
  } catch {
    return null;
  }
}

// Función adicional para crear payload con monto dinámico
export function createPaymentPayloadWithAmount(
  basePayload: OpenPayPayload,
  amountUSD: string
): OpenPayPayload {
  return {
    ...basePayload,
    amount: amountUSD,
    raw: updateRawPayloadWithAmount(basePayload.raw, amountUSD)
  };
}

// Función helper para actualizar el raw payload con el monto
function updateRawPayloadWithAmount(rawPayload: string, amount: string): string {
  try {
    const url = new URL(rawPayload.replace('openpayment://', 'https://openpayment.local/'));
    url.searchParams.set('amount', amount);
    return url.toString().replace('https://openpayment.local/', 'openpayment://');
  } catch {
    // Fallback: reemplazar manualmente
    if (rawPayload.includes('amount=')) {
      // Reemplazar amount existente
      return rawPayload.replace(/amount=[^&]*/, `amount=${amount}`);
    } else {
      // Agregar amount
      const separator = rawPayload.includes('?') ? '&' : '?';
      return `${rawPayload}${separator}amount=${amount}`;
    }
  }
}