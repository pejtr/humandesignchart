import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const payment = { priceCZK: 290, label: 'Blueprint', refId: 'order-123', email: 'buyer@example.com' };
const originalMerchant = process.env.COMGATE_MERCHANT_ID;
const originalSecret = process.env.COMGATE_SECRET;

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('fetch', vi.fn());
  process.env.COMGATE_MERCHANT_ID = 'test-merchant';
  process.env.COMGATE_SECRET = 'test-secret';
});
afterEach(() => {
  vi.unstubAllGlobals();
  if (originalMerchant === undefined) delete process.env.COMGATE_MERCHANT_ID;
  else process.env.COMGATE_MERCHANT_ID = originalMerchant;
  if (originalSecret === undefined) delete process.env.COMGATE_SECRET;
  else process.env.COMGATE_SECRET = originalSecret;
});

describe('Comgate payment creation fail-closed behavior', () => {
  it('rejects missing credentials without contacting provider', async () => {
    delete process.env.COMGATE_SECRET;
    const { createComgatePayment } = await import('./comgate');
    expect(await createComgatePayment(payment)).toMatchObject({ success: false });
    expect(fetch).not.toHaveBeenCalled();
  });
  it('never invents a redirect on provider rejection', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('code=1308&message=not%20enabled'));
    const { createComgatePayment } = await import('./comgate');
    const result = await createComgatePayment(payment);
    expect(result.success).toBe(false);
    expect(result.redirectUrl).toBeUndefined();
    expect(result.transId).toBeUndefined();
  });
  it('accepts a valid provider response with a real redirect', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('code=0&transId=tx-1&redirect=https%3A%2F%2Fpayments.comgate.cz%2Fpay%2Ftx-1'));
    const { createComgatePayment } = await import('./comgate');
    expect(await createComgatePayment(payment)).toMatchObject({ success: true, transId: 'tx-1', redirectUrl: 'https://payments.comgate.cz/pay/tx-1' });
  });
});
