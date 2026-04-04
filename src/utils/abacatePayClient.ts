import { AppError, Errors } from '../errors';

const BASE_URL = 'https://api.abacatepay.com/v1';

const getApiKey = () => {
  const apiKey = process.env.ABACATE_PAY_API_KEY;
  if (!apiKey) throw new AppError(Errors.ABACATE_PAY_KEY_MISSING);
  return apiKey;
};

const abacateRequest = async (method: string, path: string, body?: unknown) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const rawText = await res.text();
  let json: { data?: unknown; error?: string | null };

  try {
    json = JSON.parse(rawText);
  } catch {
    throw new AppError(Errors.ABACATE_PAY_BAD_RESPONSE, rawText.slice(0, 200));
  }

  if (!res.ok || !json.data) {
    throw new AppError(Errors.ABACATE_PAY_ERROR, json.error ?? `HTTP ${res.status}`);
  }

  return json.data;
};

export interface CreatePixQrCodeParams {
  amount: number; // in cents (e.g. 3000 = R$30.00)
  expiresIn: number; // in seconds
  description: string; // max 37 chars
  customer?: {
    name: string;
    cellphone: string;
    email: string;
    taxId: string;
  };
}

export interface PixQrCodeResult {
  id: string;
  status: string;
  brCode: string;
  brCodeBase64: string;
  expiresAt: string;
}

export const createPixQrCode = async (params: CreatePixQrCodeParams): Promise<PixQrCodeResult> => {
  const data = await abacateRequest('POST', '/pixQrCode/create', params) as PixQrCodeResult;
  const { id, status, brCode, brCodeBase64, expiresAt } = data;
  return { id, status, brCode, brCodeBase64, expiresAt };
};

export const checkPixStatus = async (id: string): Promise<{ status: string; expiresAt: string }> => {
  const data = await abacateRequest('GET', `/pixQrCode/check?id=${encodeURIComponent(id)}`) as { status: string; expiresAt: string };
  return { status: data.status, expiresAt: data.expiresAt };
};
