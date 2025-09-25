// services/api.ts
const BASE_URL = 'https://tu-api.example.com';

export async function actualizarQRRemoto(userId: string, qr: string) {
  const res = await fetch(`${BASE_URL}/users/${encodeURIComponent(userId)}/qr`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ QR: qr }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json().catch(() => ({}));
}
