import { useState } from "react";
import { FolderPlus } from "lucide-react";
import Dialog from "./Dialog";
import { createProject, platforms, type Project } from "../lib/model";
import { applyTemplate } from "../lib/planning";
import { templates } from "../lib/templates";

export default function ProjectForm({
  project,
  clients,
  defaultTemplate,
  onClose,
  onSave,
}: {
  project?: Project;
  clients: string[];
  defaultTemplate?: string;
  onClose: () => void;
  onSave: (project: Project) => Promise<void>;
}) {
  const [title, setTitle] = useState(project?.title || "");
  const [client, setClient] = useState(project?.client || "");
  const [platform, setPlatform] = useState(project?.platform || "Independent");
  const [status, setStatus] = useState<Project["status"]>(
    project?.status || "new",
  );
  const [notes, setNotes] = useState(project?.notes || "");
  const [tags, setTags] = useState(project?.tags || "");
  const [template, setTemplate] = useState(
    project?.template || (project ? "" : defaultTemplate || "general"),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Dialog
      title={project ? "Project settings" : "New project"}
      description="Keep one brief for each piece of work. Client names can be reused across projects."
      busy={busy}
      onClose={onClose}
    >
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            const value = createProject(title.trim(), client.trim(), platform);
            const next: Project = {
              ...project,
              ...value,
              ...(project
                ? {
                    id: project.id,
                    createdAt: project.createdAt,
                    sources: project.sources,
                    items: project.items,
                    versions: project.versions,
                    proposals: project.proposals,
                    archived: project.archived,
                  }
                : {}),
              status,
              notes,
              tags,
            };
            await onSave(
              template && template !== project?.template
                ? applyTemplate(next, template)
                : next,
            );
            onClose();
          } catch (error) {
            setError((error as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Project name
          <input
            autoFocus
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Website redesign"
            pattern=".*\S.*"
          />
        </label>
        <label>
          Client name
          <input
            list="client-names"
            required
            maxLength={100}
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="Client or company"
            pattern=".*\S.*"
          />
        </label>
        <datalist id="client-names">
          {clients.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <div className="form-grid">
          <label>
            Platform
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              {platforms.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            Project status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Project["status"])}
            >
              {["new", "clarifications needed", "in progress", "completed"].map(
                (s) => (
                  <option key={s}>{s}</option>
                ),
              )}
            </select>
          </label>
        </div>
        <label>
          Project type
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          >
            {!template && <option value="">Not set</option>}
            {Object.entries(templates).map(([key, t]) => (
              <option key={key} value={key}>
                {t.label}
              </option>
            ))}
          </select>
          <span className="field-hint">
            Adds a starter checklist and suggested questions you can choose
            from.
          </span>
        </label>
        <label>
          Tags
          <input
            maxLength={500}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Website, design, launch"
          />
        </label>
        <label>
          Project notes
          <textarea
            rows={3}
            maxLength={10000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Context for you. Notes are separate from approved scope."
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
          <button className="primary" type="submit" disabled={busy}>
            <FolderPlus size={16} />
            {busy ? "Saving…" : project ? "Save project" : "Create project"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
