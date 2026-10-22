import { useRef, useState } from "react";
import { Download, FileUp, ShieldCheck, Trash2 } from "lucide-react";
import Dialog from "./Dialog";
import ThemeSelect from "./ThemeSelect";
import { download, readTextFile } from "../lib/files";
import { parseBackup } from "../lib/validation";
import type { Store } from "../lib/model";
export default function SettingsDialog({
  store,
  onClose,
  onRestore,
  onReset,
}: {
  store: Store;
  onClose: () => void;
  onRestore: (store: Store) => Promise<void>;
  onReset: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [backup, setBackup] = useState<Store | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog
      title="Settings & privacy"
      description="A private workspace stored in this browser profile."
      onClose={onClose}
      busy={busy}
    >
      <div className="settings-row">
        <div>
          <h3>Appearance</h3>
          <p className="muted">Choose a theme or follow your device.</p>
        </div>
        <ThemeSelect />
      </div>
      <div className="settings-section">
        <h3>Local processing</h3>
        <div className="inline-info">
          <ShieldCheck size={18} />
          <span>
            No remote AI provider is configured. Conversations stay on this
            device. Account sync, cloud sharing, and team access are not
            enabled.
          </span>
        </div>
        <p className="field-hint">
          Local storage is not encrypted. Avoid storing passwords or
          confidential credentials. Deleting browser data or uninstalling the
          extension can remove your workspace.
        </p>
      </div>
      <div className="settings-section">
        <h3>Workspace backup</h3>
        <p className="muted">
          Export all projects, sources, versions, and drafts. Keep backup files
          somewhere private.
        </p>
        <div className="button-row">
          <button
            className="secondary"
            onClick={() =>
              download(
                "clientbrief-backup.json",
                JSON.stringify(store, null, 2),
                "application/json",
              )
            }
          >
            <Download size={16} /> Export all workspace data
          </button>
          <button
            className="secondary"
            onClick={() => ref.current?.click()}
            disabled={busy}
          >
            <FileUp size={16} /> Restore backup
          </button>
        </div>
        <input
          ref={ref}
          type="file"
          accept=".json"
          className="visually-hidden"
          aria-label="Restore workspace backup"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setError("");
            try {
              setBackup(parseBackup(await readTextFile(file, true)));
            } catch (error) {
              setError((error as Error).message);
            }
            e.target.value = "";
          }}
        />
        {backup && (
          <div className="restore-preview">
            <h3>Review backup before restoring</h3>
            <p>
              {backup.projects.length} projects ·{" "}
              {backup.projects.reduce((n, p) => n + p.sources.length, 0)}{" "}
              captures
            </p>
            <p className="muted">
              Restoring replaces this entire workspace, including drafts and
              history. Export your current workspace first.
            </p>
            <div className="button-row">
              <button
                className="secondary"
                disabled={busy}
                onClick={() => setBackup(null)}
              >
                Cancel restore
              </button>
              <button
                className="primary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await onRestore(backup);
                    onClose();
                  } catch (error) {
                    setError((error as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Restoring…" : "Replace workspace with backup"}
              </button>
            </div>
          </div>
        )}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
      </div>
      <div className="settings-section">
        <h3>Delete workspace data</h3>
        <p className="muted">
          Permanently remove all projects, captures, drafts and approved
          versions from this browser profile.
        </p>
        <button className="secondary danger" onClick={onReset}>
          <Trash2 size={16} /> Delete all workspace data
        </button>
      </div>
    </Dialog>
  );
}
