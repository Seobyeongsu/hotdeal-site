export const GUEST_COOKIE = 'hotdeal_guest';

export function viewPassword(): string | null {
  return process.env.VIEW_PASSWORD?.trim() || process.env.ADMIN_PASSWORD?.trim() || null;
}

export async function guestToken(): Promise<string | null> {
  const password = viewPassword();
  if (!password) return null;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode('hotdeal-guest-v1'),
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function isGuestToken(token: string | undefined | null): Promise<boolean> {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return false;
  const expected = await guestToken();
  return expected !== null && token === expected;
}

export async function isGuestRequest(req: Request): Promise<boolean> {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(/(?:^|;\s*)hotdeal_guest=([a-f0-9]+)/);
  return isGuestToken(match?.[1]);
}
