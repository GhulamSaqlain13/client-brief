import { extension } from "./storage";

export const reminderAlarm = "clientbrief-reminders";
const permissions = { permissions: ["notifications", "alarms"] };
// Must be called directly from a click: Chrome only shows the permission
// prompt during a user gesture.
export async function enableReminders() {
  if (!extension() || !chrome.permissions)
    throw new Error("Reminders are available in the installed extension.");
  if (!(await chrome.permissions.request(permissions)))
    throw new Error("Permission was not granted. Reminders stay off.");
  await chrome.alarms.create(reminderAlarm, {
    delayInMinutes: 1,
    periodInMinutes: 12 * 60,
  });
}
export async function disableReminders() {
  if (!extension() || !chrome.permissions) return;
  if (chrome.alarms) await chrome.alarms.clear(reminderAlarm);
  await chrome.permissions.remove(permissions);
}
