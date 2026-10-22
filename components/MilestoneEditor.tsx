import { useState } from "react";
import Dialog from "./Dialog";
import { id, type Milestone } from "../lib/model";
export default function MilestoneEditor({
  value,
  milestones,
  onSave,
  onClose,
}: {
  value?: Milestone;
  milestones: Milestone[];
  onSave: (m: Milestone) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(value?.title || "");
  const [due, setDue] = useState(value?.due || "");
  const [status, setStatus] = useState<Milestone["status"]>(
    value?.status || "planned",
  );
  const [acceptance, setAcceptance] = useState(value?.acceptance || "");
  const [dependency, setDependency] = useState(value?.dependency || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog
      title={value ? "Edit milestone" : "Add milestone"}
      description="Plan delivery dates and acceptance criteria. This plan is separate from approved scope."
      onClose={onClose}
      busy={busy}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await onSave({
              id: value?.id || id(),
              title: title.trim(),
              due,
              status,
              acceptance,
              dependency,
            });
            onClose();
          } catch (error) {
            setError((error as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Milestone name
          <input
            required
            autoFocus
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <div className="form-grid">
          <label>
            Due date (optional)
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </label>
          <label>
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Milestone["status"])}
            >
              {["planned", "in progress", "completed"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Prerequisite
          <select
            value={dependency}
            onChange={(e) => setDependency(e.target.value)}
          >
            <option value="">No prerequisite</option>
            {milestones
              .filter((m) => m.id !== value?.id)
              .map((m) => (
                <option value={m.id} key={m.id}>
                  {m.title}
                </option>
              ))}
          </select>
        </label>
        <label>
          Acceptance criteria
          <textarea
            aria-label="Acceptance criteria"
            rows={3}
            maxLength={2000}
            value={acceptance}
            onChange={(e) => setAcceptance(e.target.value)}
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="primary" disabled={busy || !title.trim()}>
            {busy ? "Saving…" : "Save milestone"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
