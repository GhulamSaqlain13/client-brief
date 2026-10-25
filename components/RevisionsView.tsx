import { AlertTriangle, Plus, RotateCcw } from "lucide-react";
import {
  formatAmount,
  revisionUsage,
  type Project,
  type Revision,
} from "../lib/model";
export default function RevisionsView({
  project,
  onPolicy,
  onAdd,
  onEdit,
  onRemove,
  onChangeOrder,
}: {
  project: Project;
  onPolicy: () => void;
  onAdd: () => void;
  onEdit: (r: Revision) => void;
  onRemove: (r: Revision) => void;
  onChangeOrder: (r: Revision) => void;
}) {
  const usage = revisionUsage(project);
  const policy = project.revisionPolicy;
  const revisions = [...(project.revisions || [])].sort((a, b) =>
    b.requestedAt.localeCompare(a.requestedAt),
  );
  // Counted revisions in request order, so the ones beyond the limit can be flagged.
  const counted = (project.revisions || [])
    .filter((r) => r.counts)
    .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
  const extra = new Set(
    usage.limit === undefined
      ? []
      : counted.slice(usage.limit).map((r) => r.id),
  );
  return (
    <div className="tab-content">
      <div className="view-heading">
        <div>
          <h3>Revisions</h3>
          <p className="muted">
            Track revision requests against the number you agreed, so extra
            rounds are discussed before you do the work.
          </p>
        </div>
        <button className="secondary" onClick={onAdd}>
          <Plus size={16} /> Log revision
        </button>
      </div>
      <div className={`revision-meter ${usage.exhausted ? "warning" : ""}`}>
        <div>
          <strong>
            {usage.limit === undefined
              ? `${usage.used} counted`
              : `${usage.used} of ${usage.limit} used`}
          </strong>
          <span className="field-hint">
            {!policy
              ? "Included revisions: unknown. Record what you agreed with the client."
              : policy.manual
                ? "Limit entered manually"
                : `Limit agreed in the conversation: "${policy.excerpt}"`}
          </span>
        </div>
        {usage.limit !== undefined && usage.limit > 0 && (
          <progress
            max={usage.limit}
            value={Math.min(usage.used, usage.limit)}
            aria-label="Revisions used"
          />
        )}
        <button className="text-button" onClick={onPolicy}>
          {policy ? "Edit limit" : "Set limit"}
        </button>
      </div>
      {usage.exhausted && (
        <div className="inline-info warning-info" role="status">
          <AlertTriangle size={18} />
          <span>
            {usage.over
              ? `${usage.used - usage.limit!} revision${usage.used - usage.limit! === 1 ? " is" : "s are"} beyond the agreed limit.`
              : "All included revisions are used."}{" "}
            Agree on the price for further rounds before starting them. Use
            “Draft extra-revision request” on a request.
          </span>
        </div>
      )}
      {!revisions.length && (
        <div className="inline-empty">
          <RotateCcw size={24} />
          <h3>No revisions logged</h3>
          <p>Log each change request the client makes after delivery.</p>
        </div>
      )}
      {revisions.map((r) => (
        <article className="question-row" key={r.id}>
          <div className="source-heading">
            <div className="badge-row">
              <span
                className={`badge ${r.status === "delivered" ? "approved" : ""}`}
              >
                {r.status}
              </span>
              {!r.counts && <span className="badge">not counted</span>}
              {extra.has(r.id) && (
                <span className="badge error-badge">beyond limit</span>
              )}
            </div>
            <small>{r.requestedAt}</small>
          </div>
          <p>{r.note}</p>
          <p className="field-hint">
            {r.deliverable || "Whole project"} ·{" "}
            {r.manual ? "Manually entered" : "Source linked"}
            {r.changeOrder &&
              ` · Extra request ${r.changeOrder.status}${r.changeOrder.amount !== undefined ? ` (${formatAmount(r.changeOrder.amount, r.changeOrder.currency)})` : ""}`}
          </p>
          {r.excerpt && (
            <details>
              <summary>View evidence</summary>
              <blockquote>{r.excerpt}</blockquote>
            </details>
          )}
          <div className="button-row">
            {(extra.has(r.id) || r.changeOrder) && (
              <button className="secondary" onClick={() => onChangeOrder(r)}>
                {r.changeOrder
                  ? "Edit extra-revision request"
                  : "Draft extra-revision request"}
              </button>
            )}
            <button className="text-button" onClick={() => onEdit(r)}>
              Edit
            </button>
            <button className="text-button danger" onClick={() => onRemove(r)}>
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
