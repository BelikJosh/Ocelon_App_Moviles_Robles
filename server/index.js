// index.js (ESM)
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import openPayments from '@interledger/open-payments';
const { createAuthenticatedClient, isFinalizedGrant } = openPayments;

// ── Paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const r = (p) => (path.isAbsolute(p) ? p : path.resolve(__dirname, p));

// ── App
const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true })); // abierto en dev

// ── ENV
const {
  PORT = 3001,
  RECEIVER_WALLET_ADDRESS_URL,
  RECEIVER_KEY_ID,
  RECEIVER_PRIVATE_KEY_PATH,
  SENDER_WALLET_ADDRESS_URL,
  SENDER_KEY_ID,
  SENDER_PRIVATE_KEY_PATH,
  // EXACTO, sin slash extra. Debe coincidir con el served route:
  FINISH_REDIRECT_URL = 'http://10.49.122.204:3001/op/finish',
} = process.env;

const required = [
  'RECEIVER_WALLET_ADDRESS_URL',
  'RECEIVER_KEY_ID',
  'RECEIVER_PRIVATE_KEY_PATH',
  'SENDER_WALLET_ADDRESS_URL',
  'SENDER_KEY_ID',
  'SENDER_PRIVATE_KEY_PATH',
];
const missing = required.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
if (missing.length) {
  console.error('❌ Faltan variables en .env:', missing);
  process.exit(1);
}

// ── Keys
const recvKeyPath = r(RECEIVER_PRIVATE_KEY_PATH);
const sendKeyPath = r(SENDER_PRIVATE_KEY_PATH);
if (!fs.existsSync(recvKeyPath)) throw new Error(`No existe RECEIVER_PRIVATE_KEY_PATH: ${recvKeyPath}`);
if (!fs.existsSync(sendKeyPath)) throw new Error(`No existe SENDER_PRIVATE_KEY_PATH: ${sendKeyPath}`);

const receiverPrivateKey = fs.readFileSync(recvKeyPath, 'utf8');
const senderPrivateKey = fs.readFileSync(sendKeyPath, 'utf8');

// ── Clients
const receiverClient = await createAuthenticatedClient({
  walletAddressUrl: RECEIVER_WALLET_ADDRESS_URL,
  keyId: RECEIVER_KEY_ID,
  privateKey: receiverPrivateKey,
  validateResponses: false,
});
const senderClient = await createAuthenticatedClient({
  walletAddressUrl: SENDER_WALLET_ADDRESS_URL,
  keyId: SENDER_KEY_ID,
  privateKey: senderPrivateKey,
  validateResponses: false,
});

// ── Helpers
async function getWalletDocs() {
  const [senderWallet, receiverWallet] = await Promise.all([
    senderClient.walletAddress.get({ url: SENDER_WALLET_ADDRESS_URL }),
    receiverClient.walletAddress.get({ url: RECEIVER_WALLET_ADDRESS_URL }),
  ]);
  return { senderWallet, receiverWallet };
}

// ── Health & debug
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/op/wallets', async (_req, res) => {
  try {
    const docs = await getWalletDocs();
    res.json({ ok: true, ...docs });
  } catch (e) {
    console.error('wallets error:', e?.response?.data || e);
    res.status(500).json({ ok: false, error: e?.message || 'wallets failed' });
  }
});

// ── 1) Crear Incoming Payment (receiver)
app.post('/op/incoming', async (req, res) => {
  try {
    const { receiverWallet } = await getWalletDocs();
    const receiveValueMinor = (req.body?.receiveValueMinor ?? '1000').toString();

    const incomingGrant = await receiverClient.grant.request(
      { url: receiverWallet.authServer },
      { access_token: { access: [{ type: 'incoming-payment', actions: ['create','read','list'] }] } }
    );
    if (!isFinalizedGrant(incomingGrant)) throw new Error('Incoming grant no finalizado');

    const incomingPayment = await receiverClient.incomingPayment.create(
      { url: receiverWallet.resourceServer, accessToken: incomingGrant.access_token.value },
      {
        walletAddress: receiverWallet.id,
        incomingAmount: {
          assetCode: receiverWallet.assetCode,
          assetScale: receiverWallet.assetScale,
          value: receiveValueMinor
        }
      }
    );

    res.json({ ok: true, incomingPayment });
  } catch (e) {
    console.error('incoming error:', e?.response?.data || e);
    res.status(500).json({ ok:false, error: e?.message || 'incoming failed' });
  }
});

// ── 2) Iniciar grant OUTGOING (interactivo, sender)
app.post('/op/outgoing/start', async (req, res) => {
  try {
    const { senderWallet } = await getWalletDocs();
    const { incomingPaymentId } = req.body || {};
    if (!incomingPaymentId) return res.status(400).json({ ok:false, error:'incomingPaymentId requerido' });

    const pendingOutgoingGrant = await senderClient.grant.request(
      { url: senderWallet.authServer },
      {
        access_token: {
          access: [{ identifier: senderWallet.id, type: 'outgoing-payment', actions: ['read','create'] }]
        },
        interact: {
          start: ['redirect'],
          finish: { method: 'redirect', uri: FINISH_REDIRECT_URL, nonce: Math.random().toString(36).slice(2) }
        }
      }
    );

    const redirectUrl = pendingOutgoingGrant?.interact?.redirect;
    const continueUri = pendingOutgoingGrant?.continue?.uri;
    const continueAccessToken = pendingOutgoingGrant?.continue?.access_token?.value;

    if (!redirectUrl || !continueUri || !continueAccessToken) {
      throw new Error('No se obtuvo información de interacción del grant.');
    }

    res.json({ ok: true, redirectUrl, continueUri, continueAccessToken });
  } catch (e) {
    const status = e?.response?.status || 500;
    const data = e?.response?.data || { message: e?.message || 'start failed' };
    console.error('outgoing/start error status:', status);
    console.error('outgoing/start error data:', data);
    return res.status(status).json({ ok:false, error:data });
  }
});

// ── 2.1) Página de finish (la WebView recibe interact_ref + hash)
app.get('/op/finish', (req, res) => {
  const interactRef = req.query?.interact_ref ?? '';
  const hash = req.query?.hash ?? '';
  res.type('html').send(`<!doctype html><meta charset="utf-8">
<title>Open Payments - Finish</title>
<body style="font-family: system-ui, sans-serif; background:#0b0b0c; color:#fff; display:flex; align-items:center; justify-content:center; height:100vh;">
  <div style="max-width:520px; text-align:center">
    <h1 style="margin:0 0 12px">Consentimiento recibido</h1>
    <p style="margin:0 0 24px">Volviendo a la app…</p>
    <script>
      (function(){
        var payload = { interact_ref: ${JSON.stringify(interactRef)}, hash: ${JSON.stringify(hash)} };
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      })();
    </script>
  </div>
</body>`);
});

// ── Helper #1: continue con la librería
async function continueWithLibrary({ continueUri, continueAccessToken, interact_ref, hash }) {
  const body = hash ? { interact_ref, hash } : { interact_ref };
  return senderClient.grant.continue(
    { url: continueUri, accessToken: continueAccessToken },
    body
  );
}

// ── Helper #2: continue “crudo” GNAP (para ver errores reales del AS)
// ── Helper #2: continue “crudo” GNAP (primero gnap+json; fallback a json)
async function continueRaw({ continueUri, continueAccessToken, interact_ref, hash }) {
  const body = hash ? { interact_ref, hash } : { interact_ref };

  // 1) Intento GNAP
  let r = await fetch(continueUri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/gnap+json',
      'Accept': 'application/gnap+json',
      'Authorization': `GNAP ${continueAccessToken}`,
    },
    body: JSON.stringify(body),
  });

  // 2) Si falla por content-type, intenta JSON normal
  if (!r.ok && r.status !== 200) {
    const dataTry = await r.json().catch(() => ({}));
    // Algunos AS responden 406/415/400 si no les gustó el tipo
    if ([400, 406, 415].includes(r.status)) {
      r = await fetch(continueUri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `GNAP ${continueAccessToken}`,
        },
        body: JSON.stringify(body),
      });
    } else {
      // Propaga este error con el JSON que devolvió el AS
      const err = new Error(dataTry?.error_description || dataTry?.error || r.statusText || 'continue failed');
      err.response = { status: r.status, data: dataTry };
      throw err;
    }
  }

  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data?.error_description || data?.error || r.statusText || 'continue failed');
    err.response = { status: r.status, data };
    throw err;
  }
  return data;
}


// ── Helper maestro: intenta librería -> si falla, fetch crudo; con hash/base64url
async function continueGrantSmart({ continueUri, continueAccessToken, interact_ref, hash }) {
  // Si hay hash, probar primero con hash “tal cual”
  if (hash) {
    try {
      return await continueWithLibrary({ continueUri, continueAccessToken, interact_ref, hash });
    } catch (e1) {
      // Reintento con base64url
      const hashUrl = String(hash).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
      try {
        return await continueWithLibrary({ continueUri, continueAccessToken, interact_ref, hash: hashUrl });
      } catch (e2) {
        // Intenta “crudo” (más verboso en errores)
        try {
          const raw = await continueRaw({ continueUri, continueAccessToken, interact_ref, hash });
          return raw;
        } catch (e3) {
          // último intento: hash base64url en crudo
          const raw2 = await continueRaw({ continueUri, continueAccessToken, interact_ref, hash: hashUrl });
          return raw2;
        }
      }
    }
  }

  // Sin hash: intenta librería, si falla intenta crudo
  try {
    return await continueWithLibrary({ continueUri, continueAccessToken, interact_ref });
  } catch (e1) {
    return await continueRaw({ continueUri, continueAccessToken, interact_ref });
  }
}

// ── 3) Finalizar grant → NO paga; devuelve grantAccessToken
app.post('/op/outgoing/finish', async (req, res) => {
  try {
    const { senderWallet } = await getWalletDocs();
    let { incomingPaymentId, continueUri, continueAccessToken, interact_ref, hash } = req.body || {};
    incomingPaymentId = String(incomingPaymentId || '');
    continueUri = String(continueUri || '');
    continueAccessToken = String(continueAccessToken || '');
    interact_ref = String(interact_ref || '');
    hash = hash != null ? String(hash) : undefined;

    if (!incomingPaymentId || !continueUri || !continueAccessToken || !interact_ref) {
      return res.status(400).json({
        ok:false,
        error:'incomingPaymentId, continueUri, continueAccessToken, interact_ref requeridos'
      });
    }

    console.log('[FINISH] body:', {
      incomingPaymentId,
      continueUri: continueUri.slice(0, 68)+'…',
      continueAccessToken: continueAccessToken.slice(0, 12)+'…',
      interact_ref: interact_ref.slice(0, 12)+'…',
      hash: hash ? hash.slice(0, 12)+'…' : '(none)',
    });

   // ...
const finalized = await continueGrantSmart({ continueUri, continueAccessToken, interact_ref, hash });

// Tanto la librería como el “raw” devuelven access_token.value
const access = finalized?.access_token?.value;
if (!access) {
  console.error('finish unexpected response:', finalized);
  throw new Error('Outgoing grant no finalizado');
}

res.json({ ok: true, grantAccessToken: access, senderWalletId: senderWallet.id });

  } catch (e) {
    const status = e?.response?.status || e?.status || 500;
    const data = e?.response?.data || { message: e?.message || 'finish failed' };
    console.error('outgoing/finish error status:', status);
    console.error('outgoing/finish error data:', data);
    return res.status(status).json({ ok:false, error:data });
  }
});

// ── 4) Crear Outgoing Payment (cuando la app lo pida)
app.post('/op/outgoing/pay', async (req, res) => {
  try {
    const { senderWallet } = await getWalletDocs();
    const { incomingPaymentId, grantAccessToken } = req.body || {};
    if (!incomingPaymentId || !grantAccessToken) {
      return res.status(400).json({ ok:false, error:'incomingPaymentId y grantAccessToken requeridos' });
    }

    const outgoingPayment = await senderClient.outgoingPayment.create(
      { url: senderWallet.resourceServer, accessToken: grantAccessToken },
      { walletAddress: senderWallet.id, incomingPayment: incomingPaymentId }
    );

    res.json({ ok:true, outgoingPayment });
  } catch (e) {
    const status = e?.response?.status || 500;
    const data = e?.response?.data || { message: e?.message || 'pay failed' };
    console.error('outgoing/pay error status:', status);
    console.error('outgoing/pay error data:', data);
    res.status(status).json({ ok:false, error:data });
  }
});

// ── Start
app.listen(PORT, () => {
  console.log(`OP backend listo en http://localhost:${PORT}`);
  console.log(`→ Wallets:  http://localhost:${PORT}/op/wallets`);
  console.log(`→ Finish:   ${FINISH_REDIRECT_URL}`);
});
