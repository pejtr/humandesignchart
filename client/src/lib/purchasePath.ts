/**
 * Routes where a visitor is deciding to buy or completing a payment. Auto-
 * opening modals (welcome tour, push-permission prompt) must not cover the
 * buy button or the payment confirmation here.
 */
const PURCHASE_PATH = /^\/(?:[a-z]{2}\/)?(?:honorace|pricing|cenik|login|payment\/(?:success|cancel))\/?$/;

export function isPurchasePath(pathname: string) {
  return PURCHASE_PATH.test(pathname);
}

/**
 * Landing pages of the free-chart funnel (home and the calculator), where paid
 * traffic arrives and the first thing visible must be the call to action.
 */
const ENTRY_PATH = /^\/(?:[a-z]{2})?\/?$|^\/(?:[a-z]{2}\/)?(?:calculate|human-design-kalkulacka)\/?$/;

/** Pages where nothing may auto-open over the content. */
export function isNoInterruptPath(pathname: string) {
  return isPurchasePath(pathname) || ENTRY_PATH.test(pathname);
}
