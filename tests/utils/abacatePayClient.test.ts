import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
  process.env['ABACATE_PAY_API_KEY'] = 'test_key';
  process.env['ABACATE_PAY_WEBHOOK_SECRET'] = 'test_secret';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createPixQrCode', () => {
  it('retorna PixQrCodeResult em caso de sucesso', async () => {
    const mockData = {
      id: 'pix_123',
      status: 'PENDING',
      brCode: 'br_code_value',
      brCodeBase64: 'base64_value',
      expiresAt: '2026-12-01T00:00:00Z',
    };

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ data: mockData }),
    } as Response);

    const { createPixQrCode } = await import('../../src/utils/abacatePayClient');
    const result = await createPixQrCode({ amount: 3000, expiresIn: 86400, description: 'Teste' });

    expect(result).toMatchObject({ id: 'pix_123', brCode: 'br_code_value' });
  });

  it('lança ABACATE_PAY_BAD_RESPONSE quando resposta não é JSON', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => 'not json',
    } as Response);

    const { createPixQrCode } = await import('../../src/utils/abacatePayClient');
    await expect(createPixQrCode({ amount: 3000, expiresIn: 86400, description: 'Teste' }))
      .rejects.toMatchObject({ key: 'ABACATE_PAY_BAD_RESPONSE' });
  });

  it('lança ABACATE_PAY_ERROR quando res.ok é false', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: 'Unauthorized' }),
    } as Response);

    const { createPixQrCode } = await import('../../src/utils/abacatePayClient');
    await expect(createPixQrCode({ amount: 3000, expiresIn: 86400, description: 'Teste' }))
      .rejects.toMatchObject({ key: 'ABACATE_PAY_ERROR' });
  });

  it('lança ABACATE_PAY_ERROR quando json não tem data', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ error: 'not found' }),
    } as Response);

    const { createPixQrCode } = await import('../../src/utils/abacatePayClient');
    await expect(createPixQrCode({ amount: 3000, expiresIn: 86400, description: 'Teste' }))
      .rejects.toMatchObject({ key: 'ABACATE_PAY_ERROR' });
  });
});
