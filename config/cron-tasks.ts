import { sendPaymentEmails } from "../src/api/payment-intent/services/payment-intent";
import { processNotifications, scheduleReminders } from "../src/utils/notifications";

// An uncaught error in a task (e.g. SMTP login failure) crashes the whole server, so every task
// logs its errors and tries again on the next run.
const safely = (name: string, task: () => Promise<any>) => async () => {
  try {
    await task();
  } catch (error) {
    console.error(`[cron] ${name} failed:`, error instanceof Error ? error.message : error);
  }
};

export default {
  cronJob: {
    task: safely("sendPaymentEmails", sendPaymentEmails),
    options: {
      rule: "*/10 * * * *",
    },
  },
  // Email queue: forum mentions and replies, reviews, announcements, reminders.
  notifications: {
    task: safely("processNotifications", processNotifications),
    options: {
      rule: "*/5 * * * *",
    },
  },
  // Course reminders for learners who stopped (courses with "reminderDays" set).
  reminders: {
    task: safely("scheduleReminders", scheduleReminders),
    options: {
      rule: "0 9 * * *",
      tz: "Europe/Madrid",
    },
  },
};
