// services/opApi.ts - VERSIÓN CORREGIDA
const BASE = 'http://192.168.100.28:3001'; //CAMBIAR DIRECCION IP

async function jfetch(input: RequestInfo, init?: RequestInit) {
  try {
    const r = await fetch(input, init);
    let j: any = {};
    try {
      j = await r.json();
    } catch (parseError) {
      console.error('❌ [API] Error parseando JSON:', parseError);
    }

    if (!r.ok || j?.ok === false) {
      const msg =
        j?.error?.error_description ||
        j?.error?.message ||
        j?.error?.error ||
        (typeof j?.error === 'string' ? j.error : JSON.stringify(j?.error || j || 'Error desconocido'));

      console.error('❌ [API] Error en fetch:', {
        url: input,
        status: r.status,
        error: msg
      });

      throw new Error(msg || `HTTP error ${r.status}`);
    }
    return j;
  } catch (fetchError: any) {
    console.error('❌ [API] Error de red:', fetchError);
    throw new Error(`Error de conexión: ${fetchError.message}`);
  }
}

export const opApi = {
  wallets: () => {
    console.log('📋 [API] Obteniendo wallets...');
    return jfetch(`${BASE}/op/wallets`);
  },

  createIncoming: (receiveValueMinor: string) => {
    console.log('💰 [API] Creando incoming payment:', { receiveValueMinor });
    return jfetch(`${BASE}/op/incoming`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiveValueMinor }),
    });
  },

  startOutgoing: (incomingPaymentId: string) => {
    console.log('🚀 [API] Iniciando outgoing:', {
      incomingPaymentId: incomingPaymentId ? incomingPaymentId.slice(0, 50) + '...' : 'UNDEFINED'
    });
    return jfetch(`${BASE}/op/outgoing/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incomingPaymentId }),
    });
  },

  finishOutgoing: (payload: {
    incomingPaymentId: string;
    continueUri: string;
    continueAccessToken: string;
    interact_ref: string;
    hash?: string;
  }) => {
    console.log('🏁 [API] Finalizando outgoing:', {
      incomingPaymentId: payload.incomingPaymentId ? payload.incomingPaymentId.slice(0, 30) + '...' : 'UNDEFINED',
      interact_ref: payload.interact_ref ? payload.interact_ref.slice(0, 10) + '...' : 'UNDEFINED',
      hasHash: !!payload.hash
    });
    return jfetch(`${BASE}/op/outgoing/finish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  payOutgoing: (payload: { incomingPaymentId: string; grantAccessToken: string }) => {
    console.log('💸 [API] Creando outgoing payment:', {
      incomingPaymentId: payload.incomingPaymentId ? payload.incomingPaymentId.slice(0, 30) + '...' : 'UNDEFINED',
      hasGrantToken: !!payload.grantAccessToken
    });
    return jfetch(`${BASE}/op/outgoing/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  debugIncoming: (paymentId: string) => {
    console.log('🔍 [API] Debug incoming payment:', paymentId);
    return jfetch(`${BASE}/op/debug/incoming/${paymentId}`);
  }
};