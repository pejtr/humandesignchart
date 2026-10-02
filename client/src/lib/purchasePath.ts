/**
 * Routes where a visitor is deciding to buy or completing a payment. Auto-
 * opening modals (welcome tour, push-permission prompt) must not cover the
 * buy button or the payment confirmation here.
 */
const PURCHASE_PATH = /^\/(?:[a-z]{2}\/)?(?:honorace|pricing|cenik|login|payment\/(?:success|cancel))\/?$/;

export function isPurchasePath(pathname: string) {
  return PURCHASE_PATH.test(pathname);
}
