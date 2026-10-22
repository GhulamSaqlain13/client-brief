import { useCallback, useEffect, useRef, useState } from "react";
import { emptyStore, type Project, type Store } from "../lib/model";
import { extension, readStore, storageKey, writeStore } from "../lib/storage";
import { validateStore } from "../lib/validation";

export function useWorkspace() {
  const [store, setStore] = useState<Store>(emptyStore);
  const latest = useRef(store);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const data = await readStore();
      latest.current = data;
      setStore(data);
      setError("");
      setReady(true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not load workspace.",
      );
    }
  }, []);
  useEffect(() => {
    void load();
    const receive = (value: unknown) => {
      try {
        const data = validateStore(value || structuredClone(emptyStore));
        latest.current = data;
        setStore(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Invalid workspace update.",
        );
      }
    };
    if (extension()) {
      const listener = (
        changes: Record<string, chrome.storage.StorageChange>,
        area: string,
      ) => {
        if (area === "local" && changes[storageKey])
          receive(changes[storageKey].newValue);
      };
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    }
    const listener = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      try {
        receive(event.newValue ? JSON.parse(event.newValue) : emptyStore);
      } catch {
        setError("Another window saved invalid data. Reload before editing.");
      }
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, [load]);
  const commit = useCallback(async (transform: (value: Store) => Store) => {
    const next = transform(structuredClone(latest.current));
    await writeStore(next);
    latest.current = next;
    setStore(next);
  }, []);
  const updateProject = useCallback(
    async (original: Project, transform: (value: Project) => Project) => {
      await commit((store) => {
        const current = store.projects.find((p) => p.id === original.id);
        if (!current)
          throw new Error("This project was deleted in another window.");
        const canonical = (project: Project) =>
          JSON.stringify(
            validateStore({ projects: [project], drafts: {} }).projects[0],
          );
        if (canonical(current) !== canonical(original))
          throw new Error(
            "This project changed while you were editing. Close the dialog and try again; your input has not been saved.",
          );
        return {
          ...store,
          projects: store.projects.map((p) =>
            p.id === original.id ? transform(p) : p,
          ),
        };
      });
    },
    [commit],
  );
  return { store, ready, error, load, commit, updateProject };
}
