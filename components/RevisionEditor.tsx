import { useState } from "react";
import Dialog from "./Dialog";
import EvidenceFields from "./EvidenceFields";
import { Actions, useSubmit } from "./FormActions";
import {
  id,
  type Evidence,
  type Project,
  type Revision,
  type RevisionPolicy,
} from "../lib/model";

export function RevisionPolicyEditor({
  project,
  onSave,
  onClose,
}: {
  project: Project;
  onSave: (policy: RevisionPolicy) => Promise<void>;
  onClose: () => void;
}) {
  const policy = project.revisionPolicy;
  const [limit, setLimit] = useState(policy ? String(policy.limit) : "");
  const [evidence, setEvidence] = useState<Evidence>(
    policy || { manual: true },
  );
  const { busy, error, submit } = useSubmit(onClose);
  return (
    <Dialog
      title="Included revisions"
      description="Record the number of revisions you and the client agreed. Link the message where it was agreed, or mark it as entered manually."
      onClose={onClose}
      busy={busy}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(() =>
            onSave({ ...evidence, limit: limit.trim() ? Number(limit) : NaN }),
          );
        }}
      >
        <label>
          Revisions included
          <input
            required
            autoFocus
            inputMode="numeric"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
        </label>
        <EvidenceFields
          project={project}
          value={evidence}
          onChange={setEvidence}
        />
        <Actions
          busy={busy}
          error={error}
          label="Save limit"
          onClose={onClose}
        />
      </form>
    </Dialog>
  );
}
export default function RevisionEditor({
  project,
  value,
  onSave,
  onClose,
}: {
  project: Project;
  value?: Revision;
  onSave: (revision: Revision) => Promise<void>;
  onClose: () => void;
}) {
  const deliverables = project.items.filter(
    (i) => i.section === "deliverables",
  );
  const [note, setNote] = useState(value?.note || "");
  const [deliverable, setDeliverable] = useState(value?.deliverable || "");
  const [requestedAt, setRequestedAt] = useState(
    value?.requestedAt || new Date().toISOString().slice(0, 10),
  );
  const [status, setStatus] = useState<Revision["status"]>(
    value?.status || "requested",
  );
  const [counts, setCounts] = useState(value?.counts ?? true);
  const [evidence, setEvidence] = useState<Evidence>(value || { manual: true });
  const { busy, error, submit } = useSubmit(onClose);
  return (
    <Dialog
      title={value ? "Edit revision" : "Log revision request"}
      description="Each counted request uses one of the included revisions."
      onClose={onClose}
      busy={busy}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(() =>
            onSave({
              ...value,
              sourceId: undefined,
              excerpt: undefined,
              manual: undefined,
              ...evidence,
              id: value?.id || id(),
              note: note.trim(),
              deliverable,
              requestedAt,
              status,
              counts,
            }),
          );
        }}
      >
        <label>
          What did the client ask to change?
          <textarea
            required
            autoFocus
            rows={3}
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <div className="form-grid">
          <label>
            Deliverable
            <select
              value={deliverable}
              onChange={(e) => setDeliverable(e.target.value)}
            >
              <option value="">Whole project</option>
              {[
                ...new Set([
                  ...deliverables.map((d) => d.text.slice(0, 200)),
                  ...(deliverable ? [deliverable] : []),
                ]),
              ].map((text) => (
                <option key={text} value={text}>
                  {text.slice(0, 80)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Requested on
            <input
              type="date"
              required
              value={requestedAt}
              onChange={(e) => setRequestedAt(e.target.value)}
            />
          </label>
          <label>
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Revision["status"])}
            >
              {["requested", "in progress", "delivered"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={counts}
            onChange={(e) => setCounts(e.target.checked)}
          />
          Counts toward the included revisions (uncheck for fixes to your own
          mistakes)
        </label>
        <EvidenceFields
          project={project}
          value={evidence}
          onChange={setEvidence}
        />
        <Actions
          busy={busy}
          error={error}
          label="Save revision"
          onClose={onClose}
        />
      </form>
    </Dialog>
  );
}
