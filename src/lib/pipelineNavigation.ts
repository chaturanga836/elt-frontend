import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/** Close pipeline intercept modal and return to the canvas without remounting it. */
export function returnToPipeline(
  router: AppRouterInstance,
  returnUrl?: string | null,
): void {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back();
    return;
  }
  if (returnUrl) {
    router.push(returnUrl);
    return;
  }
  router.back();
}
