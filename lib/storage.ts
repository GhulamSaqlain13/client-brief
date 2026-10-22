import { emptyStore, type Store } from "./model";
import { validateStore } from "./validation";
export const storageKey = "clientbrief-v1";
const key = storageKey;
export const extension = () =>
  typeof chrome !== "undefined" && !!chrome.storage?.local;
export async function readStore(): Promise<Store> {
  const value = extension()
    ? (await chrome.storage.local.get(key))[key]
    : JSON.parse(localStorage.getItem(key) || "null");
  if (!value) return structuredClone(emptyStore);
  return validateStore(value);
}
export async function writeStore(store: Store) {
  if (!navigator.locks)
    throw new Error(
      "Saving requires a secure browser context. Open the extension, localhost, or an HTTPS address.",
    );
  await navigator.locks.request("clientbrief-write", async () => {
    const current = await readStore();
    if ((current.revision || 0) !== (store.revision || 0))
      throw new Error(
        "The workspace changed in another window. Your input is preserved. Close and reopen this view, then retry.",
      );
    const next = validateStore({
      ...store,
      revision: (current.revision || 0) + 1,
    });
    if (extension()) await chrome.storage.local.set({ [key]: next });
    else localStorage.setItem(key, JSON.stringify(next));
    store.revision = next.revision;
  });
}
export async function rawWorkspace(): Promise<string> {
  return extension()
    ? JSON.stringify(
        (await chrome.storage.local.get(key))[key] ?? null,
        null,
        2,
      )
    : localStorage.getItem(key) || "null";
}
export async function resetInvalidWorkspace(): Promise<void> {
  await navigator.locks.request("clientbrief-write", async () => {
    const raw = await rawWorkspace();
    let invalid = false;
    try {
      validateStore(JSON.parse(raw));
    } catch {
      invalid = true;
    }
    if (!invalid)
      throw new Error(
        "The workspace is readable again. Reload it instead of resetting.",
      );
    const next = { ...structuredClone(emptyStore), revision: 0 };
    if (extension()) await chrome.storage.local.set({ [key]: next });
    else localStorage.setItem(key, JSON.stringify(next));
  });
}
