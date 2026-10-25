import { useState } from "react";
import { ClipboardCheck, Plus, Trash2 } from "lucide-react";
import { id, type ChecklistItem, type Project } from "../lib/model";
import { readiness } from "../lib/planning";
import { templates } from "../lib/templates";
export default function ChecklistView({
  project,
  busy,
  onTemplate,
  onSave,
  onRemove,
}: {
  project: Project;
  busy: boolean;
  onTemplate: (template: string) => void;
  onSave: (item: ChecklistItem) => Promise<void>;
  onRemove: (item: ChecklistItem) => void;
}) {
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const ready = readiness(project);
  const list = project.checklist || [];
  return (
    <div className="tab-content">
      <div className="view-heading">
        <div>
          <h3>Ready to start?</h3>
          <p className="muted">
            Track the access, files and content you need from the client before
            work can begin.
          </p>
        </div>
        <label className="compact-label">
          Project type
          <select
            aria-label="Project type"
            value={project.template || ""}
            disabled={busy}
            onChange={(e) => e.target.value && onTemplate(e.target.value)}
          >
            {!project.template && <option value="">Choose…</option>}
            {Object.entries(templates).map(([key, t]) => (
              <option key={key} value={key}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div
        className={`revision-meter ${ready.percent !== undefined && ready.percent < 100 ? "warning" : ""}`}
      >
        <div>
          <strong>
            {ready.percent === undefined
              ? "No checklist yet"
              : `${ready.percent}% ready`}
          </strong>
          <span className="field-hint">
            {ready.total
              ? `${ready.received} of ${ready.total} items received`
              : "Choose a project type to add a starter checklist, or add your own items."}
          </span>
        </div>
        {ready.total > 0 && (
          <progress
            max={ready.total}
            value={ready.received}
            aria-label="Items received"
          />
        )}
      </div>
      {list.map((item) => (
        <div className="checklist-row" key={item.id}>
          <ClipboardCheck size={18} />
          <span className={item.status === "not needed" ? "muted" : ""}>
            {item.label}
          </span>
          <select
            aria-label={`Status: ${item.label}`}
            value={item.status}
            disabled={busy}
            className={`status-${item.status.replace(" ", "-")}`}
            onChange={(e) =>
              onSave({
                ...item,
                status: e.target.value as ChecklistItem["status"],
              }).catch((error) => setError((error as Error).message))
            }
          >
            {["missing", "received", "not needed"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button
            className="icon-button"
            aria-label={`Remove ${item.label}`}
            disabled={busy}
            onClick={() => onRemove(item)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <form
        className="checklist-add"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          try {
            await onSave({ id: id(), label: label.trim(), status: "missing" });
            setLabel("");
          } catch (error) {
            setError((error as Error).message);
          }
        }}
      >
        <input
          aria-label="New checklist item"
          maxLength={200}
          value={label}
          placeholder="Add something you need, e.g. FTP access"
          onChange={(e) => setLabel(e.target.value)}
        />
        <button className="secondary" disabled={busy || !label.trim()}>
          <Plus size={16} /> Add
        </button>
      </form>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
