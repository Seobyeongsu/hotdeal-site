export const ADMIN_COOKIE = 'hotdeal_admin';

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'hotdeal1234';
}

export async function adminToken(): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(adminPassword()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode('hotdeal-admin-v1'),
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyToken(token: string | undefined | null): Promise<boolean> {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return false;
  return token === (await adminToken());
}

export async function isAdminRequest(req: Request): Promise<boolean> {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(/(?:^|;\s*)hotdeal_admin=([a-f0-9]+)/);
  return verifyToken(match?.[1]);
}
