'use client';

import { useEffect } from 'react';

// ---------------------------------------------------------------------------
// Helper: convert a URL-safe base64 VAPID public key to a Uint8Array
// (matches the canonical implementation from the Next.js PWA docs)
// ---------------------------------------------------------------------------
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ---------------------------------------------------------------------------
// requestPushPermission — exported for use by any UI component that wants
// to trigger the push-subscription flow on demand.
// ---------------------------------------------------------------------------
export async function requestPushPermission(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.error('[SW] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set');
      return false;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as ArrayBuffer,
    });

    const response = await fetch('/api/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });

    return response.ok;
  } catch (err) {
    console.error('[SW] requestPushPermission failed:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// ServiceWorkerRegister — mounts the service worker silently; renders nothing
// ---------------------------------------------------------------------------
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((registration) => {
        console.log('[SW] Registered, scope:', registration.scope);
      })
      .catch((err) => {
        console.error('[SW] Registration failed:', err);
      });
  }, []);

  return null;
}
