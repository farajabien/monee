// Notification scheduling with support for multiple types
let scheduledNotifications = {
  dailyExpense: null,
  debts: new Map(), // debtId -> timeout
  paydays: new Map(), // sourceId -> timeout
  savingsWeekly: null,
  savingsTarget: new Map(), // goalId -> timeout
  spendingThreshold: null,
};

self.addEventListener("message", (event) => {
  const { type, data } = event.data || {};

  switch (type) {
    case "SCHEDULE_DAILY_EXPENSE":
      scheduleDailyExpenseReminder(data.time);
      break;
    case "CANCEL_DAILY_EXPENSE":
      cancelNotification("dailyExpense");
      break;
    case "SCHEDULE_DEBT_REMINDER":
      scheduleDebtReminder(data.debtId, data.debtName, data.dueDate, data.amount);
      break;
    case "CANCEL_DEBT_REMINDER":
      cancelDebtReminder(data.debtId);
      break;
    case "SCHEDULE_PAYDAY_REMINDER":
      schedulePaydayReminder(data.sourceId, data.sourceName, data.payday, data.daysBefore);
      break;
    case "CANCEL_PAYDAY_REMINDER":
      cancelPaydayReminder(data.sourceId);
      break;
    case "SCHEDULE_SAVINGS_WEEKLY":
      scheduleSavingsWeeklyNudge();
      break;
    case "CANCEL_SAVINGS_WEEKLY":
      cancelNotification("savingsWeekly");
      break;
    case "SCHEDULE_SAVINGS_TARGET":
      // Fired immediately when target is reached
      showSavingsTargetNotification(data.goalName, data.targetAmount);
      break;
    case "SCHEDULE_SPENDING_THRESHOLD":
      showSpendingThresholdNotification(data.threshold, data.currentSpending, data.isOver);
      break;
    default:
      // Backward compatibility with old SCHEDULE_NOTIFICATION type
      if (type === "SCHEDULE_NOTIFICATION") {
        scheduleDailyExpenseReminder(data.time);
      } else if (type === "CANCEL_NOTIFICATION") {
        cancelNotification("dailyExpense");
      }
  }
});

function cancelNotification(key) {
  if (scheduledNotifications[key]) {
    clearTimeout(scheduledNotifications[key]);
    scheduledNotifications[key] = null;
  }
}

function cancelDebtReminder(debtId) {
  if (scheduledNotifications.debts.has(debtId)) {
    clearTimeout(scheduledNotifications.debts.get(debtId));
    scheduledNotifications.debts.delete(debtId);
  }
}

function cancelPaydayReminder(sourceId) {
  if (scheduledNotifications.paydays.has(sourceId)) {
    clearTimeout(scheduledNotifications.paydays.get(sourceId));
    scheduledNotifications.paydays.delete(sourceId);
  }
}

function scheduleDailyExpenseReminder(timeString) {
  cancelNotification("dailyExpense");

  const [hours, minutes] = timeString.split(":").map(Number);
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);

  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const timeUntilNotification = scheduledTime.getTime() - now.getTime();

  scheduledNotifications.dailyExpense = setTimeout(() => {
    self.registration.showNotification("MONEE Daily Check-In 🇰🇪", {
      body: "Have you tracked today's expenses? Take a moment to log your spending.",
      icon: "/AppImages/money-bag.png",
      badge: "/AppImages/money-bag.png",
      vibrate: [200, 100, 200],
      tag: "daily-expense-reminder",
      requireInteraction: false,
      data: {
        url: "/dashboard",
        type: "daily-expense",
        dateOfArrival: Date.now(),
      },
    });

    // Schedule next day's notification
    scheduleDailyExpenseReminder(timeString);
  }, timeUntilNotification);
}

function scheduleDebtReminder(debtId, debtName, dueDate, amount) {
  cancelDebtReminder(debtId);

  const now = new Date();
  const due = new Date(dueDate);
  const timeUntilNotification = due.getTime() - now.getTime();

  if (timeUntilNotification <= 0) return; // Already passed

  scheduledNotifications.debts.set(
    debtId,
    setTimeout(() => {
      self.registration.showNotification("Debt Payment Due Soon 📅", {
        body: `${debtName} payment of KSh ${amount.toLocaleString()} is due soon. Don't forget to pay!`,
        icon: "/AppImages/money-bag.png",
        badge: "/AppImages/money-bag.png",
        vibrate: [200, 100, 200, 100, 200],
        tag: `debt-reminder-${debtId}`,
        requireInteraction: true,
        data: {
          url: "/debts",
          type: "debt-reminder",
          debtId,
          dateOfArrival: Date.now(),
        },
      });

      scheduledNotifications.debts.delete(debtId);
    }, timeUntilNotification)
  );
}

function schedulePaydayReminder(sourceId, sourceName, payday, daysBefore) {
  cancelPaydayReminder(sourceId);

  const now = new Date();
  const paydayDate = new Date(payday);
  paydayDate.setDate(paydayDate.getDate() - daysBefore);
  paydayDate.setHours(9, 0, 0, 0); // 9 AM reminder

  const timeUntilNotification = paydayDate.getTime() - now.getTime();

  if (timeUntilNotification <= 0) return; // Already passed

  const daysText = daysBefore === 0 ? "today" : daysBefore === 1 ? "tomorrow" : `in ${daysBefore} days`;

  scheduledNotifications.paydays.set(
    sourceId,
    setTimeout(() => {
      self.registration.showNotification("Payday Coming! 💰", {
        body: `Your ${sourceName} payday is ${daysText}. Time to plan your budget!`,
        icon: "/AppImages/money-bag.png",
        badge: "/AppImages/money-bag.png",
        vibrate: [200, 100, 200],
        tag: `payday-reminder-${sourceId}`,
        requireInteraction: false,
        data: {
          url: "/income",
          type: "payday-reminder",
          sourceId,
          dateOfArrival: Date.now(),
        },
      });

      scheduledNotifications.paydays.delete(sourceId);
    }, timeUntilNotification)
  );
}

function scheduleSavingsWeeklyNudge() {
  cancelNotification("savingsWeekly");

  const now = new Date();
  const nextMonday = new Date();
  nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
  nextMonday.setHours(10, 0, 0, 0); // 10 AM Monday

  const timeUntilNotification = nextMonday.getTime() - now.getTime();

  scheduledNotifications.savingsWeekly = setTimeout(() => {
    self.registration.showNotification("Weekly Savings Nudge 🎯", {
      body: "Start your week right! Have you contributed to your savings goals this week?",
      icon: "/AppImages/money-bag.png",
      badge: "/AppImages/money-bag.png",
      vibrate: [200, 100, 200],
      tag: "savings-weekly",
      requireInteraction: false,
      data: {
        url: "/savings",
        type: "savings-weekly",
        dateOfArrival: Date.now(),
      },
    });

    // Schedule next week's nudge
    scheduleSavingsWeeklyNudge();
  }, timeUntilNotification);
}

function showSavingsTargetNotification(goalName, targetAmount) {
  self.registration.showNotification("Savings Goal Reached! 🎉", {
    body: `Congratulations! You've reached your ${goalName} goal of KSh ${targetAmount.toLocaleString()}!`,
    icon: "/AppImages/money-bag.png",
    badge: "/AppImages/money-bag.png",
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    tag: "savings-target-reached",
    requireInteraction: false,
    data: {
      url: "/savings",
      type: "savings-target",
      dateOfArrival: Date.now(),
    },
  });
}

function showSpendingThresholdNotification(threshold, currentSpending, isOver) {
  const title = isOver ? "Daily Spending Alert! ⚠️" : "Great Job! 👍";
  const body = isOver
    ? `You've spent KSh ${currentSpending.toLocaleString()} today, exceeding your limit of KSh ${threshold.toLocaleString()}.`
    : `You're staying under budget! Spent KSh ${currentSpending.toLocaleString()} of your KSh ${threshold.toLocaleString()} daily limit.`;

  self.registration.showNotification(title, {
    body,
    icon: "/AppImages/money-bag.png",
    badge: "/AppImages/money-bag.png",
    vibrate: isOver ? [200, 100, 200, 100, 200] : [200, 100, 200],
    tag: "spending-threshold",
    requireInteraction: false,
    data: {
      url: "/dashboard",
      type: "spending-threshold",
      dateOfArrival: Date.now(),
    },
  });
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

