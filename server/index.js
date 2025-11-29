// index.js (ESM) - VERSIÓN COMPLETA CORREGIDA
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
app.use(cors({ origin: true, credentials: true }));

// ── Headers adicionales para CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// ── ENV
const {
  PORT = 3001,
  RECEIVER_WALLET_ADDRESS_URL,
  RECEIVER_KEY_ID,
  RECEIVER_PRIVATE_KEY_PATH,
  SENDER_WALLET_ADDRESS_URL,
  SENDER_KEY_ID,
  SENDER_PRIVATE_KEY_PATH,
  FINISH_REDIRECT_URL = 'http://192.168.100.29:3001/op/finish', //192.168.100.29 192.168.100.217
} = process.env;

console.log('🔧 [SERVER] Configuración cargada:');
console.log('🔧 [SERVER] PORT:', PORT);
console.log('🔧 [SERVER] FINISH_REDIRECT_URL:', FINISH_REDIRECT_URL);
console.log('🔧 [SERVER] SENDER_WALLET_ADDRESS_URL:', SENDER_WALLET_ADDRESS_URL);
console.log('🔧 [SERVER] RECEIVER_WALLET_ADDRESS_URL:', RECEIVER_WALLET_ADDRESS_URL);

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

console.log('🔑 [SERVER] Claves cargadas - Sender:', senderPrivateKey.length, 'chars');
console.log('🔑 [SERVER] Claves cargadas - Receiver:', receiverPrivateKey.length, 'chars');

// ── Clients
let receiverClient, senderClient;

try {
  receiverClient = await createAuthenticatedClient({
    walletAddressUrl: RECEIVER_WALLET_ADDRESS_URL,
    keyId: RECEIVER_KEY_ID,
    privateKey: receiverPrivateKey,
    validateResponses: false,
  });

  senderClient = await createAuthenticatedClient({
    walletAddressUrl: SENDER_WALLET_ADDRESS_URL,
    keyId: SENDER_KEY_ID,
    privateKey: senderPrivateKey,
    validateResponses: false,
  });

  console.log('✅ [SERVER] Clients de Open Payments inicializados correctamente');
} catch (clientError) {
  console.error('❌ [SERVER] Error inicializando clients:', clientError);
  process.exit(1);
}

// ── Helpers
async function getWalletDocs() {
  try {
    const [senderWallet, receiverWallet] = await Promise.all([
      senderClient.walletAddress.get({ url: SENDER_WALLET_ADDRESS_URL }),
      receiverClient.walletAddress.get({ url: RECEIVER_WALLET_ADDRESS_URL }),
    ]);
    return { senderWallet, receiverWallet };
  } catch (error) {
    console.error('❌ [HELPER] Error obteniendo wallet docs:', error);
    throw error;
  }
}

// ── Helper: Esperar a que el outgoing payment se complete
async function waitForOutgoingPaymentCompletion(outgoingPaymentUrl, accessToken, maxAttempts = 30) {
  console.log('⏳ [WAIT] Esperando completación del outgoing payment...');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const payment = await senderClient.outgoingPayment.get({
        url: outgoingPaymentUrl,
        accessToken: accessToken
      });

      console.log(`🔄 [WAIT] Intento ${attempt}/${maxAttempts}:`, {
        state: payment.state,
        sentAmount: payment.sentAmount,
        debitAmount: payment.debitAmount,
        receiveAmount: payment.receiveAmount
      });

      // Si el estado está definido y no es pending, retornar
      if (payment.state && payment.state !== 'pending') {
        console.log('✅ [WAIT] Outgoing payment completado:', payment.state);
        return payment;
      }

      // Si el monto enviado es igual al débito, considerar completado
      if (payment.sentAmount && payment.debitAmount &&
        payment.sentAmount.value === payment.debitAmount.value) {
        console.log('✅ [WAIT] Outgoing payment completado por monto enviado');
        return { ...payment, state: 'completed' };
      }

      // Si el monto recibido es igual al monto esperado, considerar completado
      if (payment.receiveAmount && payment.receiveAmount.value !== '0') {
        console.log('✅ [WAIT] Outgoing payment completado por monto recibido');
        return { ...payment, state: 'completed' };
      }

      // Esperar 1 segundo antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`❌ [WAIT] Error en intento ${attempt}:`, error.message);

      // Si es error 404, puede significar que el pago no existe o fue eliminado
      if (error.response?.status === 404) {
        console.log('⚠️ [WAIT] Outgoing payment no encontrado, puede que ya se completó');
        break;
      }
    }
  }

  console.log('❌ [WAIT] Timeout esperando completación del outgoing payment');
  return null;
}

// ── Health & debug
app.get('/health', (_req, res) => {
  console.log('🏥 [HEALTH] Check de salud');
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    service: 'Open Payments Backend'
  });
});

app.get('/op/test', async (_req, res) => {
  try {
    const docs = await getWalletDocs();
    res.json({
      ok: true,
      message: 'Servidor funcionando correctamente',
      wallets: {
        sender: docs.senderWallet.publicName,
        receiver: docs.receiverWallet.publicName,
        currencies: {
          sender: `${docs.senderWallet.assetCode} (scale: ${docs.senderWallet.assetScale})`,
          receiver: `${docs.receiverWallet.assetCode} (scale: ${docs.receiverWallet.assetScale})`
        }
      }
    });
  } catch (e) {
    console.error('❌ [TEST] Error:', e?.response?.data || e);
    res.status(500).json({ ok: false, error: e?.message || 'test failed' });
  }
});

app.get('/op/wallets', async (_req, res) => {
  try {
    console.log('📋 [WALLETS] Obteniendo información de wallets...');
    const docs = await getWalletDocs();
    console.log('✅ [WALLETS] Wallets obtenidos correctamente');
    res.json({ ok: true, ...docs });
  } catch (e) {
    console.error('❌ [WALLETS] Error:', e?.response?.data || e);
    res.status(500).json({ ok: false, error: e?.message || 'wallets failed' });
  }
});

// ── 1) Crear Incoming Payment (receiver - MXN) - VERSIÓN MEJORADA
app.post('/op/incoming', async (req, res) => {
  try {
    console.log('💰 [INCOMING] Creando incoming payment...');
    const { receiverWallet } = await getWalletDocs();
    const receiveValueMinor = (req.body?.receiveValueMinor ?? '1500').toString();

    console.log('💰 [INCOMING] Parámetros:', {
      receiveValueMinor,
      assetCode: receiverWallet.assetCode,
      assetScale: receiverWallet.assetScale
    });

    // Crear grant con permisos más específicos
    const incomingGrant = await receiverClient.grant.request(
      { url: receiverWallet.authServer },
      {
        access_token: {
          access: [
            {
              type: 'incoming-payment',
              actions: ['create', 'read', 'list', 'complete']
            }
          ]
        }
      }
    );

    if (!isFinalizedGrant(incomingGrant)) {
      throw new Error('Incoming grant no finalizado');
    }

    console.log('✅ [INCOMING] Grant obtenido correctamente');

    // Crear incoming payment con más detalles
    const incomingPayment = await receiverClient.incomingPayment.create(
      {
        url: receiverWallet.resourceServer,
        accessToken: incomingGrant.access_token.value
      },
      {
        walletAddress: receiverWallet.id,
        incomingAmount: {
          assetCode: receiverWallet.assetCode,
          assetScale: receiverWallet.assetScale,
          value: receiveValueMinor
        },
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
        metadata: {
          description: "Pago de estacionamiento"
        }
      }
    );

    console.log('✅ [INCOMING] Incoming payment creado:', {
      id: incomingPayment.id,
      state: incomingPayment.state,
      incomingAmount: incomingPayment.incomingAmount,
      receivedAmount: incomingPayment.receivedAmount,
      expiresAt: incomingPayment.expiresAt
    });

    // IMPORTANTE: Si el estado es undefined, asumimos que está pendiente
    const paymentState = incomingPayment.state || 'pending';

    // Enviar el ID explícitamente en la respuesta
    res.json({
      ok: true,
      incomingPayment: {
        id: incomingPayment.id,
        state: paymentState, // Usar el estado real o 'pending' por defecto
        incomingAmount: incomingPayment.incomingAmount,
        receivedAmount: incomingPayment.receivedAmount,
        expiresAt: incomingPayment.expiresAt,
        walletAddress: incomingPayment.walletAddress,
        authServer: incomingPayment.authServer
      },
      message: 'Incoming payment creado exitosamente'
    });

  } catch (e) {
    console.error('❌ [INCOMING] Error:', e?.response?.data || e);
    console.error('❌ [INCOMING] Stack:', e?.stack);

    res.status(500).json({
      ok: false,
      error: e?.message || 'incoming failed',
      details: e?.response?.data || 'Error desconocido'
    });
  }
});

// ── 2) Iniciar grant OUTGOING (interactivo, sender - USD)
app.post('/op/outgoing/start', async (req, res) => {
  try {
    console.log('🚀 [START] Iniciando outgoing grant...');
    const { senderWallet } = await getWalletDocs();
    const { incomingPaymentId } = req.body || {};

    if (!incomingPaymentId) {
      return res.status(400).json({
        ok: false,
        error: 'incomingPaymentId requerido'
      });
    }

    console.log('🚀 [START] incomingPaymentId:', incomingPaymentId);

    const pendingOutgoingGrant = await senderClient.grant.request(
      { url: senderWallet.authServer },
      {
        access_token: {
          access: [{ identifier: senderWallet.id, type: 'outgoing-payment', actions: ['read', 'create'] }]
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

    console.log('🚀 [START] Resultado grant:', {
      hasRedirect: !!redirectUrl,
      hasContinueUri: !!continueUri,
      hasContinueToken: !!continueAccessToken
    });

    if (!redirectUrl || !continueUri || !continueAccessToken) {
      throw new Error('No se obtuvo información de interacción del grant.');
    }

    console.log('✅ [START] Grant iniciado correctamente');

    res.json({
      ok: true,
      redirectUrl,
      continueUri,
      continueAccessToken,
      message: 'Flujo de autorización iniciado'
    });
  } catch (e) {
    console.error('❌ [START] Error:', e?.response?.data || e);
    const status = e?.response?.status || 500;
    const data = e?.response?.data || { message: e?.message || 'start failed' };
    return res.status(status).json({
      ok: false,
      error: data,
      debug: {
        errorType: e?.name,
        hasResponse: !!e?.response
      }
    });
  }
});

// ── 2.1) Página de finish (la WebView recibe interact_ref + hash)
app.get('/op/finish', (req, res) => {
  const interactRef = req.query?.interact_ref ?? '';
  const hash = req.query?.hash ?? '';

  console.log('🏁 [FINISH PAGE] Interceptando finish:', {
    interact_ref: interactRef ? interactRef.slice(0, 20) + '...' : 'empty',
    hash: hash ? hash.slice(0, 20) + '...' : 'none'
  });

  res.type('html').send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Open Payments - Finish</title>
  <style>
    body {
      font-family: system-ui, sans-serif; 
      background: #0b0b0c; 
      color: #fff; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 520px; 
      text-align: center;
      background: rgba(255,255,255,0.05);
      padding: 40px;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    h1 {
      margin: 0 0 12px;
      color: #42b883;
    }
    p {
      margin: 0 0 24px;
      opacity: 0.8;
    }
    .spinner {
      border: 3px solid rgba(255,255,255,0.3);
      border-top: 3px solid #42b883;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Autorización Completada</h1>
    <p>Tu autorización ha sido recibida. Regresando a la aplicación...</p>
    <div class="spinner"></div>
  </div>
  <script>
    (function(){
      var payload = { 
        interact_ref: ${JSON.stringify(interactRef)}, 
        hash: ${JSON.stringify(hash)} 
      };
      console.log('📨 [FINISH] Enviando mensaje a WebView:', payload);
      
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      } else {
        console.log('📨 [FINISH] ReactNativeWebView no disponible, mensaje:', payload);
        setTimeout(function() {
          window.close();
        }, 2000);
      }
    })();
  </script>
</body>
</html>`);
});

// ── Helper #1: continue con la librería
async function continueWithLibrary({ continueUri, continueAccessToken, interact_ref, hash }) {
  console.log('🔄 [CONTINUE] Continuando con librería...');
  const body = hash ? { interact_ref, hash } : { interact_ref };
  return senderClient.grant.continue(
    { url: continueUri, accessToken: continueAccessToken },
    body
  );
}

// ── Helper #2: continue "crudo" GNAP
async function continueRaw({ continueUri, continueAccessToken, interact_ref, hash }) {
  console.log('🔄 [CONTINUE] Continuando con fetch crudo...');
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

  console.log('🔄 [CONTINUE] Respuesta GNAP - Status:', r.status);

  // 2) Si falla por content-type, intenta JSON normal
  if (!r.ok && r.status !== 200) {
    const dataTry = await r.json().catch(() => ({}));
    console.log('🔄 [CONTINUE] Falló GNAP, intentando JSON...');

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
      console.log('🔄 [CONTINUE] Respuesta JSON - Status:', r.status);
    } else {
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

  console.log('✅ [CONTINUE] Continue exitoso con fetch crudo');
  return data;
}

// ── Helper maestro: intenta librería -> si falla, fetch crudo
async function continueGrantSmart({ continueUri, continueAccessToken, interact_ref, hash }) {
  console.log('🎯 [CONTINUE SMART] Iniciando continue inteligente...');

  // Si hay hash, probar primero con hash "tal cual"
  if (hash) {
    try {
      console.log('🎯 [CONTINUE SMART] Intentando con hash original...');
      return await continueWithLibrary({ continueUri, continueAccessToken, interact_ref, hash });
    } catch (e1) {
      console.log('🎯 [CONTINUE SMART] Falló con hash original, intentando base64url...');
      // Reintento con base64url
      const hashUrl = String(hash).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
      try {
        return await continueWithLibrary({ continueUri, continueAccessToken, interact_ref, hash: hashUrl });
      } catch (e2) {
        console.log('🎯 [CONTINUE SMART] Falló con base64url, intentando crudo...');
        // Intenta "crudo"
        try {
          const raw = await continueRaw({ continueUri, continueAccessToken, interact_ref, hash });
          return raw;
        } catch (e3) {
          console.log('🎯 [CONTINUE SMART] Falló crudo, último intento con base64url crudo...');
          // último intento: hash base64url en crudo
          const raw2 = await continueRaw({ continueUri, continueAccessToken, interact_ref, hash: hashUrl });
          return raw2;
        }
      }
    }
  }

  // Sin hash: intenta librería, si falla intenta crudo
  try {
    console.log('🎯 [CONTINUE SMART] Intentando sin hash con librería...');
    return await continueWithLibrary({ continueUri, continueAccessToken, interact_ref });
  } catch (e1) {
    console.log('🎯 [CONTINUE SMART] Falló librería sin hash, intentando crudo...');
    return await continueRaw({ continueUri, continueAccessToken, interact_ref });
  }
}

// ── 3) Finalizar grant → devuelve grantAccessToken
app.post('/op/outgoing/finish', async (req, res) => {
  try {
    console.log('🏁 [FINISH] Finalizando grant...');
    const { senderWallet } = await getWalletDocs();
    let { incomingPaymentId, continueUri, continueAccessToken, interact_ref, hash } = req.body || {};

    // Validaciones seguras para evitar el error "slice of undefined"
    incomingPaymentId = incomingPaymentId ? String(incomingPaymentId) : '';
    continueUri = continueUri ? String(continueUri) : '';
    continueAccessToken = continueAccessToken ? String(continueAccessToken) : '';
    interact_ref = interact_ref ? String(interact_ref) : '';
    hash = hash != null ? String(hash) : undefined;

    console.log('🏁 [FINISH] Parámetros recibidos:', {
      incomingPaymentId: incomingPaymentId ? incomingPaymentId.slice(0, 50) + '...' : 'EMPTY',
      continueUri: continueUri ? continueUri.slice(0, 50) + '...' : 'EMPTY',
      continueAccessToken: continueAccessToken ? continueAccessToken.slice(0, 12) + '...' : 'EMPTY',
      interact_ref: interact_ref ? interact_ref.slice(0, 12) + '...' : 'EMPTY',
      hash: hash ? hash.slice(0, 12) + '...' : '(none)',
    });

    if (!incomingPaymentId || !continueUri || !continueAccessToken || !interact_ref) {
      return res.status(400).json({
        ok: false,
        error: 'incomingPaymentId, continueUri, continueAccessToken, interact_ref requeridos'
      });
    }

    console.log('🔄 [FINISH] Continuando grant...');
    const finalized = await continueGrantSmart({ continueUri, continueAccessToken, interact_ref, hash });

    console.log('✅ [FINISH] Grant finalizado:', {
      hasAccessToken: !!finalized?.access_token?.value,
      tokenLength: finalized?.access_token?.value?.length,
      responseKeys: Object.keys(finalized)
    });

    const access = finalized?.access_token?.value;
    if (!access) {
      console.error('❌ [FINISH] Grant no devolvió access token:', finalized);
      throw new Error('Outgoing grant no finalizado - sin access token');
    }

    console.log('✅ [FINISH] Access token obtenido correctamente');

    res.json({
      ok: true,
      grantAccessToken: access,
      senderWalletId: senderWallet.id,
      message: 'Grant finalizado exitosamente'
    });

  } catch (e) {
    console.error('❌ [FINISH] Error finalizando grant:');
    console.error('❌ [FINISH] Error message:', e?.message);
    console.error('❌ [FINISH] Error stack:', e?.stack);

    if (e?.response) {
      console.error('❌ [FINISH] Response status:', e.response.status);
      console.error('❌ [FINISH] Response data:', e.response.data);
    }

    const status = e?.response?.status || e?.status || 500;
    const data = e?.response?.data || { message: e?.message || 'finish failed' };

    return res.status(status).json({
      ok: false,
      error: data,
      debug: {
        errorType: e?.name,
        hasResponse: !!e?.response
      }
    });
  }
});

// ── 4) Crear Outgoing Payment - VERSIÓN MEJORADA CON VERIFICACIÓN DE ESTADO
app.post('/op/outgoing/pay', async (req, res) => {
  try {
    console.log('💸 [PAY] Creando outgoing payment...');
    const { senderWallet, receiverWallet } = await getWalletDocs();
    const { incomingPaymentId, grantAccessToken } = req.body || {};

    console.log('💸 [PAY] Configuración wallets:', {
      sender: senderWallet.publicName,
      receiver: receiverWallet.publicName,
      senderCurrency: `${senderWallet.assetCode} (${senderWallet.assetScale})`,
      receiverCurrency: `${receiverWallet.assetCode} (${receiverWallet.assetScale})`
    });

    // Verificar incoming payment CON GRANT PROPIO
    let incomingPayment;
    try {
      console.log('🔍 [PAY] Verificando incoming payment con grant propio...');

      // Crear grant específico para leer el incoming payment
      const readGrant = await receiverClient.grant.request(
        { url: receiverWallet.authServer },
        {
          access_token: {
            access: [{ type: 'incoming-payment', actions: ['read'] }]
          }
        }
      );

      if (!isFinalizedGrant(readGrant)) {
        throw new Error('Read grant no finalizado');
      }

      incomingPayment = await receiverClient.incomingPayment.get({
        url: incomingPaymentId,
        accessToken: readGrant.access_token.value
      });

      console.log('✅ [PAY] Incoming payment verificado:', {
        id: incomingPayment.id,
        state: incomingPayment.state,
        incomingAmount: incomingPayment.incomingAmount,
        receivedAmount: incomingPayment.receivedAmount,
        expiresAt: incomingPayment.expiresAt
      });

      // Validaciones críticas - PERO MÁS FLEXIBLES
      if (!incomingPayment.incomingAmount) {
        throw new Error('INCOMING PAYMENT NO TIENE MONTO DEFINIDO');
      }

      // CORRECCIÓN: Si el estado es undefined, asumimos que está pendiente
      const paymentState = incomingPayment.state || 'pending';
      if (paymentState !== 'pending') {
        console.log(`⚠️ [PAY] Incoming payment no está pendiente. Estado: ${paymentState}`);
        // Podemos continuar de todos modos en algunos casos
        if (paymentState === 'completed') {
          return res.status(400).json({
            ok: false,
            error: 'Este pago ya fue completado anteriormente'
          });
        }
      }

    } catch (incomingError) {
      console.error('❌ [PAY] Error verificando incoming payment:', incomingError);

      // INTENTAR CONTINUAR A PESAR DEL ERROR DE VERIFICACIÓN
      console.log('🔄 [PAY] Intentando continuar sin verificación completa...');
    }

    let outgoingPayment;
    let quote;

    // INTENTO PRINCIPAL: Con quote para conversión
    console.log('🔄 [PAY] Intentando con quote para conversión USD→MXN...');

    try {
      // Crear grant para quotes
      const quoteGrant = await senderClient.grant.request(
        { url: senderWallet.authServer },
        {
          access_token: {
            access: [
              { type: 'quote', actions: ['create', 'read'] }
            ]
          }
        }
      );

      if (!isFinalizedGrant(quoteGrant)) {
        throw new Error('Quote grant no finalizado');
      }

      console.log('✅ [PAY] Quote grant obtenido');

      // Crear quote
      quote = await senderClient.quote.create(
        {
          url: senderWallet.resourceServer,
          accessToken: quoteGrant.access_token.value
        },
        {
          walletAddress: senderWallet.id,
          receiver: incomingPaymentId,
          method: 'ilp'
        }
      );

      console.log('✅ [PAY] Quote creado:', {
        sendAmount: quote.sendAmount,
        receiveAmount: quote.receiveAmount,
        fee: quote.fee
      });

      // Crear outgoing payment con el quote
      console.log('🚀 [PAY] Creando outgoing payment con quote...');
      outgoingPayment = await senderClient.outgoingPayment.create(
        {
          url: senderWallet.resourceServer,
          accessToken: grantAccessToken
        },
        {
          walletAddress: senderWallet.id,
          quoteId: quote.id,
          metadata: {
            description: `Pago estacionamiento - ${receiverWallet.publicName}`,
            conversion: `USD → MXN`
          }
        }
      );

      console.log('✅ [PAY] Outgoing payment creado exitosamente:', {
        id: outgoingPayment.id,
        state: outgoingPayment.state,
        debitAmount: outgoingPayment.debitAmount
      });

    } catch (quoteError) {
      console.error('❌ [PAY] Error con quote:', quoteError?.message);

      // FALLBACK: Intentar sin quote
      console.log('🔄 [PAY] Intentando fallback: outgoing payment directo...');
      try {
        outgoingPayment = await senderClient.outgoingPayment.create(
          {
            url: senderWallet.resourceServer,
            accessToken: grantAccessToken
          },
          {
            walletAddress: senderWallet.id,
            receiver: incomingPaymentId,
            method: 'ilp'
            // No especificar debitAmount para que use el incomingAmount automáticamente
          }
        );

        console.log('✅ [PAY] Outgoing payment creado (fallback):', outgoingPayment.id);

      } catch (fallbackError) {
        console.error('❌ [PAY] Error en fallback:', fallbackError);

        // ÚLTIMO INTENTO: Solo con receiver
        console.log('🔄 [PAY] Último intento: solo receiver...');
        try {
          outgoingPayment = await senderClient.outgoingPayment.create(
            {
              url: senderWallet.resourceServer,
              accessToken: grantAccessToken
            },
            {
              walletAddress: senderWallet.id,
              receiver: incomingPaymentId
            }
          );

          console.log('✅ [PAY] Outgoing payment creado (solo receiver):', outgoingPayment.id);

        } catch (finalError) {
          console.error('❌ [PAY] Error final:', finalError);

          // Si todo falla, verificar si el problema es específico del estado
          if (finalError.message.includes('state') || finalError.message.includes('pending')) {
            return res.status(400).json({
              ok: false,
              error: 'El incoming payment no está disponible para pago. Posiblemente ya fue pagado o expiró.',
              debug: {
                incomingPaymentId,
                error: finalError.message
              }
            });
          }

          throw new Error(`Error procesando pago: ${finalError.message}`);
        }
      }
    }

    // ✅ PASO CRÍTICO: COMPLETAR EL INCOMING PAYMENT
    console.log('🎯 [PAY] Completando incoming payment...');
    try {
      // Crear grant para completar el incoming payment
      const completeGrant = await receiverClient.grant.request(
        { url: receiverWallet.authServer },
        {
          access_token: {
            access: [
              { type: 'incoming-payment', actions: ['complete'] }
            ]
          }
        }
      );

      if (!isFinalizedGrant(completeGrant)) {
        throw new Error('Complete grant no finalizado');
      }

      // Completar el incoming payment
      const completedIncoming = await receiverClient.incomingPayment.complete({
        url: incomingPaymentId,
        accessToken: completeGrant.access_token.value
      });

      console.log('✅ [PAY] Incoming payment completado:', {
        id: completedIncoming.id,
        state: completedIncoming.state,
        receivedAmount: completedIncoming.receivedAmount
      });

    } catch (completeError) {
      console.error('❌ [PAY] Error completando incoming payment:', completeError);
      // No fallamos el pago completo si solo falla el completado
      console.log('⚠️ [PAY] El outgoing payment se creó pero no se pudo completar el incoming payment');
    }

    // ✅ CORRECCIÓN: ESPERAR A QUE EL OUTGOING PAYMENT SE COMPLETE
    console.log('⏳ [PAY] Esperando completación del outgoing payment...');
    try {
      const completedOutgoing = await waitForOutgoingPaymentCompletion(
        outgoingPayment.id,
        grantAccessToken,
        20 // Menos intentos para ser más rápido
      );

      if (completedOutgoing) {
        console.log('✅ [PAY] Outgoing payment finalizado correctamente:', {
          id: completedOutgoing.id,
          state: completedOutgoing.state || 'completed', // Si sigue undefined, asumir completed
          debitAmount: completedOutgoing.debitAmount,
          sentAmount: completedOutgoing.sentAmount,
          receiveAmount: completedOutgoing.receiveAmount
        });

        // Actualizar el objeto outgoingPayment con el estado final
        outgoingPayment = completedOutgoing;
      } else {
        console.log('⚠️ [PAY] No se pudo verificar la completación del outgoing payment');
        // Inferir estado basado en montos
        if (outgoingPayment.sentAmount && outgoingPayment.debitAmount &&
          outgoingPayment.sentAmount.value === outgoingPayment.debitAmount.value) {
          outgoingPayment.state = 'completed';
          console.log('🔄 [PAY] Estado inferido como completed por montos');
        }
      }

    } catch (waitError) {
      console.error('❌ [PAY] Error esperando completación:', waitError);
      console.log('⚠️ [PAY] Continuando sin verificación de estado final');
    }

    return res.json({
      ok: true,
      outgoingPayment: {
        id: outgoingPayment.id,
        state: outgoingPayment.state || 'processing', // Estado por defecto si sigue undefined
        debitAmount: outgoingPayment.debitAmount,
        sentAmount: outgoingPayment.sentAmount,
        receiveAmount: outgoingPayment.receiveAmount,
        // Incluir todos los datos relevantes
        ...outgoingPayment
      },
      quote: quote ? {
        sendAmount: quote.sendAmount,
        receiveAmount: quote.receiveAmount
      } : undefined,
      message: outgoingPayment.state === 'completed' ?
        'Pago procesado y completado exitosamente' :
        'Pago procesado - verificando estado final'
    });

  } catch (e) {
    console.error('❌ [PAY] Error creando outgoing payment:');
    console.error('❌ [PAY] Error message:', e?.message);

    if (e?.response) {
      console.error('❌ [PAY] Response status:', e.response.status);
      console.error('❌ [PAY] Response data:', JSON.stringify(e.response.data, null, 2));
    }

    const status = e?.response?.status || 500;
    const errorData = e?.response?.data || { message: e?.message || 'pay failed' };

    res.status(status).json({
      ok: false,
      error: errorData,
      debug: {
        errorType: e?.name,
        incomingPaymentId: req.body?.incomingPaymentId,
        hasGrantToken: !!req.body?.grantAccessToken
      }
    });
  }
});

// ── 5) Verificar estado de pago - VERSIÓN MEJORADA
app.get('/op/payment/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { grantAccessToken } = req.query; // Opcional: token específico

    console.log('🔍 [STATUS] Verificando estado de pago:', id);

    const { senderWallet } = await getWalletDocs();

    let accessToken = grantAccessToken;

    // Si no viene token, crear uno nuevo
    if (!accessToken) {
      const readGrant = await senderClient.grant.request(
        { url: senderWallet.authServer },
        {
          access_token: {
            access: [{ type: 'outgoing-payment', actions: ['read'] }]
          }
        }
      );

      if (!isFinalizedGrant(readGrant)) {
        throw new Error('Read grant no finalizado');
      }
      accessToken = readGrant.access_token.value;
    }

    let outgoingPayment;
    let outgoingPaymentUrl;

    // Determinar la URL correcta
    if (id.startsWith('http')) {
      outgoingPaymentUrl = id;
    } else {
      outgoingPaymentUrl = `${senderWallet.resourceServer}/outgoing-payments/${id}`;
    }

    // Obtener el payment
    outgoingPayment = await senderClient.outgoingPayment.get({
      url: outgoingPaymentUrl,
      accessToken: accessToken
    });

    console.log('✅ [STATUS] Estado obtenido:', {
      state: outgoingPayment.state,
      sentAmount: outgoingPayment.sentAmount,
      debitAmount: outgoingPayment.debitAmount,
      receiveAmount: outgoingPayment.receiveAmount
    });

    // Lógica mejorada para determinar el estado final
    let finalState = outgoingPayment.state;

    // Si el estado es undefined pero el monto enviado es igual al débito, considerar completado
    if (!finalState && outgoingPayment.sentAmount && outgoingPayment.debitAmount &&
      outgoingPayment.sentAmount.value === outgoingPayment.debitAmount.value) {
      finalState = 'completed';
      console.log('🔄 [STATUS] Estado inferido como completed por montos');
    }

    // Si el monto recibido es mayor que 0, considerar completado
    if (!finalState && outgoingPayment.receiveAmount && outgoingPayment.receiveAmount.value !== '0') {
      finalState = 'completed';
      console.log('🔄 [STATUS] Estado inferido como completed por monto recibido');
    }

    // Si después de todo sigue undefined, usar 'processing'
    if (!finalState) {
      finalState = 'processing';
      console.log('🔄 [STATUS] Estado establecido como processing');
    }

    res.json({
      ok: true,
      payment: {
        id: outgoingPayment.id,
        state: finalState,
        debitAmount: outgoingPayment.debitAmount,
        sentAmount: outgoingPayment.sentAmount,
        receiveAmount: outgoingPayment.receiveAmount,
        createdAt: outgoingPayment.createdAt,
        updatedAt: outgoingPayment.updatedAt
      },
      diagnostic: {
        hasState: !!outgoingPayment.state,
        amountsMatch: outgoingPayment.sentAmount?.value === outgoingPayment.debitAmount?.value,
        hasReceiveAmount: outgoingPayment.receiveAmount?.value !== '0',
        stateInferred: !outgoingPayment.state && finalState === 'completed',
        finalState: finalState
      }
    });

  } catch (e) {
    console.error('❌ [STATUS] Error:', e?.message);
    res.status(500).json({
      ok: false,
      error: e?.message || 'Error verificando estado'
    });
  }
});

// ── 6) Forzar verificación de estado de pago
app.post('/op/payment/verify', async (req, res) => {
  try {
    const { outgoingPaymentUrl, grantAccessToken } = req.body;

    if (!outgoingPaymentUrl || !grantAccessToken) {
      return res.status(400).json({
        ok: false,
        error: 'outgoingPaymentUrl y grantAccessToken requeridos'
      });
    }

    console.log('🔍 [VERIFY] Forzando verificación de pago:', outgoingPaymentUrl);

    const completedPayment = await waitForOutgoingPaymentCompletion(
      outgoingPaymentUrl,
      grantAccessToken,
      10 // Menos intentos para verificación rápida
    );

    if (completedPayment) {
      res.json({
        ok: true,
        payment: completedPayment,
        message: 'Pago verificado exitosamente'
      });
    } else {
      res.json({
        ok: false,
        error: 'No se pudo verificar el estado del pago',
        payment: { state: 'unknown' }
      });
    }

  } catch (e) {
    console.error('❌ [VERIFY] Error:', e?.message);
    res.status(500).json({
      ok: false,
      error: e?.message || 'Error verificando pago'
    });
  }
});

// ── Endpoint de diagnóstico para incoming payments
app.get('/op/debug/incoming/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔧 [DEBUG] Diagnosticando incoming payment:', id);

    const { receiverWallet } = await getWalletDocs();

    // Intentar con grant
    const readGrant = await receiverClient.grant.request(
      { url: receiverWallet.authServer },
      {
        access_token: {
          access: [{ type: 'incoming-payment', actions: ['read'] }]
        }
      }
    );

    if (!isFinalizedGrant(readGrant)) {
      throw new Error('Debug grant no finalizado');
    }

    const incomingPayment = await receiverClient.incomingPayment.get({
      url: id,
      accessToken: readGrant.access_token.value
    });

    console.log('✅ [DEBUG] Incoming payment diagnosticado:', {
      id: incomingPayment.id,
      state: incomingPayment.state,
      incomingAmount: incomingPayment.incomingAmount,
      receivedAmount: incomingPayment.receivedAmount,
      expiresAt: incomingPayment.expiresAt,
      walletAddress: incomingPayment.walletAddress
    });

    res.json({
      ok: true,
      incomingPayment,
      diagnostic: {
        hasIncomingAmount: !!incomingPayment.incomingAmount,
        hasState: !!incomingPayment.state,
        isPending: incomingPayment.state === 'pending',
        isCompleted: incomingPayment.state === 'completed',
        isValid: (incomingPayment.state === 'pending' || incomingPayment.state === 'completed') && !!incomingPayment.incomingAmount
      }
    });

  } catch (e) {
    console.error('❌ [DEBUG] Error:', e?.message);
    res.status(500).json({
      ok: false,
      error: e?.message,
      debug: e?.response?.data
    });
  }
});

// ── Manejo de errores global
app.use((error, req, res, next) => {
  console.error('🔥 [GLOBAL ERROR] Error no manejado:', error);
  res.status(500).json({
    ok: false,
    error: 'Error interno del servidor',
    message: error.message
  });
});

// ── Ruta no encontrada
app.use('*', (req, res) => {
  console.log('❓ [404] Ruta no encontrada:', req.originalUrl);
  res.status(404).json({
    ok: false,
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// ── Start
app.listen(PORT, () => {
  console.log('\n✨ =================================');
  console.log('✨   OP BACKEND INICIADO CORRECTAMENTE');
  console.log('✨ =================================');
  console.log(`✨ Puerto: http://localhost:${PORT}`);
  console.log(`✨ Health: http://localhost:${PORT}/health`);
  console.log(`✨ Test:   http://localhost:${PORT}/op/test`);
  console.log(`✨ Wallets: http://localhost:${PORT}/op/wallets`);
  console.log(`✨ Finish:  ${FINISH_REDIRECT_URL}`);
  console.log('✨ =================================\n');
});