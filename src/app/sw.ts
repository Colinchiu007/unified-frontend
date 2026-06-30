import { defaultCache } from "@serwist/next/worker";

(self as any).__SW_MANIFEST = defaultCache;

(self as any).addEventListener("install", () => {
  (self as any).skipWaiting();
});
