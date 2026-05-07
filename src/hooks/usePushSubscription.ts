import { useState, useEffect } from 'react';
import { api } from '../api/client';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function usePushSubscription() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  );
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    // Vérifier si déjà abonné au chargement
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    navigator.serviceWorker.ready.then(reg => {
      reg.pushManager.getSubscription().then(sub => {
        setSubscribed(!!sub);
      });
    });
  }, []);

  async function subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Les notifications push ne sont pas supportées sur ce navigateur.');
      return;
    }

    // Demander la permission
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== 'granted') return;

    // Récupérer la clé VAPID publique
    const { data } = await api.get<{ publicKey: string }>('/push/vapid-public');
    const applicationServerKey = urlBase64ToUint8Array(data.publicKey).buffer as ArrayBuffer;

    // S'abonner via le service worker
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    // Envoyer la subscription au serveur
    const json = sub.toJSON();
    await api.post('/push/subscribe', {
      endpoint: json.endpoint,
      keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
    });

    setSubscribed(true);
  }

  async function unsubscribe() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;

    await api.delete('/push/unsubscribe', { data: { endpoint: sub.endpoint } });
    await sub.unsubscribe();
    setSubscribed(false);
  }

  const supported = typeof Notification !== 'undefined' && 'PushManager' in window;

  return { permission, subscribed, supported, subscribe, unsubscribe };
}
