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
