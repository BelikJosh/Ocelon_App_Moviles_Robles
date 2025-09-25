import { createAuthenticatedClient, isPendingGrant } from '@interledger/open-payments';
import fs from 'fs/promises';

export async function makeClient({ walletAddressUrl, privateKeyPath, keyId }) { 
  const privateKey = await fs.readFile(privateKeyPath, 'utf8');
  return createAuthenticatedClient({ walletAddressUrl, privateKey, keyId });
}

export async function getWalletInfo(client, walletAddressUrl) {
  // walletAddressUrl es el id real del address; no usamos el resolver
  return client.walletAddress.get({ url: walletAddressUrl });
}

export async function incomingGrant(client, authServer) {
  const grant = await client.grant.request(
    { url: authServer },
    { access_token: { access: [{ type: 'incoming-payment', actions: ['create','read'] }] } }
  );
  if (isPendingGrant(grant)) throw new Error('incoming grant no debe ser interactivo');
  return grant.access_token.value;
}

export async function startOutgoingGrant(client, authServer, finishRedirectUrl, nonce) {
  const pending = await client.grant.request(
    { url: authServer },
    {
      interact: { start: ['redirect'], finish: { method: 'redirect', uri: finishRedirectUrl, nonce } },
      access_token: { access: [{ type: 'outgoing-payment', actions: ['create','read'] }] }
    }
  );
  if (!isPendingGrant(pending)) {
    return { interactive: false, accessToken: pending.access_token.value };
  }
  return {
    interactive: true,
    continueUri: pending.continue.uri,
    continueAccessToken: pending.continue.access_token.value,
    interactRedirect: pending.interact.redirect
  };
}

export async function continueOutgoingGrant(client, continueUri, continueAccessToken, interactRef) {
  const grant = await client.grant.continue(
    { url: continueUri, accessToken: continueAccessToken },
    { interact_ref: interactRef }
  );
  return grant.access_token.value;
}

export async function quoteGrant(client, authServer) {
  const grant = await client.grant.request(
    { url: authServer },
    { access_token: { access: [{ type: 'quote', actions: ['create','read'] }] } }
  );
  if (isPendingGrant(grant)) throw new Error('quote grant no debe ser interactivo');
  return grant.access_token.value;
}
