import axios from 'axios';
import crypto from 'crypto';

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

function generateHmac(method: string, url: string, secretKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  const message = `${method}${url}${now}`;
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(message);
  return hmac.digest('hex');
}

export async function searchProducts(keyword: string, limit = 20) {
  const url = `/v2/providers/affiliate_open_api/apis/openapi/v1/products/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`;

  const hmac = generateHmac('GET', url, config.secretKey);

  try {
    const response = await axios.get(`https://api-gateway.coupang.com${url}`, {
      headers: {
        'Authorization': `${config.accessKey}:${hmac}`,
        'Timestamp': Math.floor(Date.now() / 1000).toString(),
      },
    });

    return response.data.data?.products || [];
  } catch (error) {
    console.error('Coupang API error:', error);
    return [];
  }
}

export async function getBestProducts(categoryId: number, limit = 20) {
  const url = `/v2/providers/affiliate_open_api/apis/openapi/v1/products/best?categoryId=${categoryId}&limit=${limit}`;

  const hmac = generateHmac('GET', url, config.secretKey);

  try {
    const response = await axios.get(`https://api-gateway.coupang.com${url}`, {
      headers: {
        'Authorization': `${config.accessKey}:${hmac}`,
        'Timestamp': Math.floor(Date.now() / 1000).toString(),
      },
    });

    return response.data.data?.products || [];
  } catch (error) {
    console.error('Coupang API error:', error);
    return [];
  }
}
