chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus
    .removeAll()
    .then(() => {
      chrome.contextMenus.create(
        {
          id: "capture",
          title: "Add selection to ClientBrief AI",
          contexts: ["selection"],
        },
        () => {
          if (chrome.runtime.lastError)
            console.error(chrome.runtime.lastError.message);
        },
      );
    })
    .catch(console.error);
});
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "capture" || !info.selectionText) return;
  // Opening must happen directly inside the user gesture, before awaiting storage.
  if (tab?.id)
    chrome.sidePanel.open({ tabId: tab.id }).catch(() => {
      chrome.storage.local
        .set({
          captureError:
            "Your selection is saved for review. Open the dashboard from the extension popup if the side panel could not open.",
        })
        .catch(console.error);
    });
  chrome.storage.local
    .set({
      pendingCapture: {
        text: info.selectionText,
        url: info.pageUrl || "",
        capturedAt: new Date().toISOString(),
      },
      captureError: "",
    })
    .then(() => {
      chrome.action.setBadgeText({ text: "" }).catch(console.error);
      chrome.action
        .setTitle({ title: "Open ClientBrief" })
        .catch(console.error);
    })
    .catch(() => {
      chrome.action.setBadgeText({ text: "!" }).catch(console.error);
      chrome.action
        .setTitle({
          title:
            "Capture could not be saved. Local storage may be full. Open ClientBrief to export a backup and free space.",
        })
        .catch(console.error);
    });
});

// Opt-in reminders. Alarms and notifications are optional permissions, so the
// listener is attached only once the user has granted them.
let remindersReady = false;
function setUpReminders() {
  if (remindersReady || !chrome.alarms?.onAlarm) return;
  remindersReady = true;
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "clientbrief-reminders") remind().catch(console.error);
  });
  chrome.notifications?.onClicked.addListener(() => {
    chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
  });
}
async function remind() {
  if (!chrome.notifications) return;
  const store = (await chrome.storage.local.get("clientbrief-v1"))[
    "clientbrief-v1"
  ];
  if (!store?.settings?.reminders || !Array.isArray(store.projects)) return;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  let overdue = 0;
  for (const project of store.projects) {
    if (project.archived) continue;
    for (const m of project.milestones || [])
      if (m.status !== "completed" && m.due && m.due < today) overdue++;
    for (const p of project.payments || [])
      if (p.status !== "paid" && p.due && p.due < today) overdue++;
  }
  if (!overdue) return;
  await chrome.notifications.create("clientbrief-overdue", {
    type: "basic",
    iconUrl: "icon-128.png",
    title: "ClientBrief",
    message: `${overdue} overdue milestone${overdue === 1 ? "" : "s"} or payment${overdue === 1 ? "" : "s"}. Open ClientBrief to review.`,
  });
}
setUpReminders();
chrome.permissions?.onAdded.addListener(setUpReminders);
