import { useRef, useState } from "react";
import { Download, FileUp, ShieldCheck, Trash2 } from "lucide-react";
import Dialog from "./Dialog";
import ThemeSelect from "./ThemeSelect";
import { download, readTextFile } from "../lib/files";
import { parseBackup } from "../lib/validation";
import type { Settings, Store } from "../lib/model";
import { templates } from "../lib/templates";
import { disableReminders, enableReminders } from "../lib/reminders";
export default function SettingsDialog({
  store,
  onClose,
  onSettings,
  onRestore,
  onReset,
}: {
  store: Store;
  onClose: () => void;
  onSettings: (settings: Settings) => Promise<void>;
  onRestore: (store: Store) => Promise<void>;
  onReset: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [backup, setBackup] = useState<Store | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const settings = store.settings || {};
  async function save(next: Settings) {
    setBusy(true);
    setError("");
    try {
      await onSettings(next);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
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
        <h3>Defaults</h3>
        <div className="form-grid">
          <label>
            Default project type
            <select
              value={settings.defaultTemplate || "general"}
              disabled={busy}
              onChange={(e) =>
                void save({ ...settings, defaultTemplate: e.target.value })
              }
            >
              {Object.entries(templates).map(([key, t]) => (
                <option key={key} value={key}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Flag unanswered questions after (days)
            <input
              type="number"
              min={1}
              max={90}
              defaultValue={settings.questionAgeDays ?? 3}
              disabled={busy}
              onBlur={(e) => {
                const days = Number(e.target.value);
                if (Number.isSafeInteger(days) && days >= 1 && days <= 90)
                  void save({ ...settings, questionAgeDays: days });
                else setError("Enter a whole number of days from 1 to 90.");
              }}
            />
          </label>
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={!!settings.reminders}
            disabled={busy}
            onChange={(e) => {
              const on = e.target.checked;
              setError("");
              // The permission request must start inside this click.
              const change = on ? enableReminders() : disableReminders();
              void change
                .then(() => save({ ...settings, reminders: on }))
                .catch((error) => setError((error as Error).message));
            }}
          />
          Browser reminders for overdue milestones and payments (asks for
          notification permission; checked twice a day)
        </label>
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
