"use client";

import { useEffect } from "react";

/**
 * One-time self-heal for the removed PWA. Earlier builds registered a service
 * worker (sw.js) + caches; that SW lingers in browsers that visited the old
 * app and can intercept navigations with a stale/blank response. This
 * unregisters any leftover service worker, clears its caches, and reloads once
 * so the live app takes over. No-op on clean browsers.
 */
export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.getRegistrations().then(async (regs) => {
      if (regs.length === 0) return;
      await Promise.all(regs.map((r) => r.unregister()));
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      // Reload once (guarded) so the page isn't still served by the dead SW.
      if (!sessionStorage.getItem("sw-cleaned")) {
        sessionStorage.setItem("sw-cleaned", "1");
        window.location.reload();
      }
    });
  }, []);

  return null;
}
