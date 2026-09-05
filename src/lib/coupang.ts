interface CoupangConfig {
  accessKey: string;
  secretKey: string;
  affiliateId: string;
}

const config: CoupangConfig = {
  accessKey: process.env.COUPANG_ACCESS_KEY || '',
  secretKey: process.env.COUPANG_SECRET_KEY || '',
  affiliateId: process.env.COUPANG_AFFILIATE_ID || '',
};

// Workers/Node 모두에서 동작하는 WebCrypto HMAC-SHA256
async function generateHmac(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(config.secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function coupangGet(pathWithQuery: string): Promise<any[]> {
  const now = Math.floor(Date.now() / 1000);
  const hmac = await generateHmac(`GET${pathWithQuery}${now}`);

  try {
    const res = await fetch(`https://api-gateway.coupang.com${pathWithQuery}`, {
      headers: {
        Authorization: `${config.accessKey}:${hmac}`,
        Timestamp: String(now),
      },
    });
    if (!res.ok) {
      console.error('Coupang API http error:', res.status);
      return [];
    }
    const data = await res.json();
    return data.data?.products || [];
  } catch (error) {
    console.error('Coupang API error:', error);
    return [];
  }
}

export async function searchProducts(keyword: string, limit = 20) {
  const url = `/v2/providers/affiliate_open_api/apis/openapi/v1/products/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`;
  return coupangGet(url);
}

export async function getBestProducts(categoryId: number, limit = 20) {
  const url = `/v2/providers/affiliate_open_api/apis/openapi/v1/products/best?categoryId=${categoryId}&limit=${limit}`;
  return coupangGet(url);
}
