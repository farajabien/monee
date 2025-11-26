// Daily notification scheduling
let notificationTimeout = null;

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SCHEDULE_NOTIFICATION") {
    scheduleDailyNotification(event.data.time);
  } else if (event.data && event.data.type === "CANCEL_NOTIFICATION") {
    if (notificationTimeout) {
      clearTimeout(notificationTimeout);
      notificationTimeout = null;
    }
  }
});

function scheduleDailyNotification(timeString) {
  // Clear existing timeout
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }

  const [hours, minutes] = timeString.split(":").map(Number);
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);

  // If time has passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const timeUntilNotification = scheduledTime.getTime() - now.getTime();

  notificationTimeout = setTimeout(() => {
    self.registration.showNotification("MONEE Evening Check-In 🇰🇪", {
      body: "Have you tracked today's expenses? Take 2 minutes to paste your M-Pesa messages.",
      icon: "/AppImages/money-bag.png",
      badge: "/AppImages/money-bag.png",
      vibrate: [200, 100, 200],
      tag: "daily-reminder",
      requireInteraction: false,
      data: {
        url: "/dashboard",
        dateOfArrival: Date.now(),
      },
    });

    // Schedule next day's notification
    scheduleDailyNotification(timeString);
  }, timeUntilNotification);
}

self.addEventListener("push", function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || "/AppImages/money-bag.png",
      badge: "/AppImages/money-bag.png",
      vibrate: [100, 50, 100],
      data: {
        url: data.url || "/dashboard",
        dateOfArrival: Date.now(),
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener("notificationclick", function (event) {
  console.log("Notification click received.");
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || "/dashboard";
  
  event.waitUntil(
    clients.matchAll({ type: "window", includeUnowned: true }).then((clientList) => {
      // Check if there's already a window open
      for (let client of clientList) {
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      // Open new window if none found
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync for offline expenses
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-expenses") {
    event.waitUntil(syncExpenses());
  }
});

async function syncExpenses() {
  // This would sync any pending expenses when back online
  console.log("Syncing expenses...");
}

