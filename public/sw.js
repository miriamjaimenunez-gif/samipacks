// ==========================================================================
// SERVICE WORKER — Notificaciones push para cuentas de negocio
// ==========================================================================
// No cachea nada de la app (eso no es su trabajo aquí); su única función es
// escuchar los eventos 'push' que llegan desde el servidor (vía web-push) y
// mostrar la notificación del sistema operativo, incluso con la pestaña o la
// app cerrada.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = { title: 'SamiPacks', body: 'Tienes una novedad en tu negocio.' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (err) {
      data = { title: 'SamiPacks', body: event.data.text() };
    }
  }

  const options = {
    body: data.body || '',
    tag: data.tag || 'samipacks-notificacion',
    renotify: true,
    data: { url: data.url || '/' }
  };

  event.waitUntil(self.registration.showNotification(data.title || 'SamiPacks', options));
});

// Al hacer clic en la notificación, lleva al usuario a la app (o la enfoca
// si ya la tiene abierta en otra pestaña) en vez de dejarlo en el sistema.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
